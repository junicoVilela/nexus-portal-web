import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { BadgeComponent, BadgeTone, ButtonComponent } from '@shared/ui';
import { mensagemErroHttp } from '@shared/utils/http-error-message';
import {
  AiDocumentoImportacao,
  AiDocumentoSugestao,
  AiDocumentoSugestaoTipo,
} from '../../models/ai-documento-importacao.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';

@Component({
  selector: 'app-ai-documento-sugestoes',
  standalone: true,
  imports: [LucideAngularModule, BadgeComponent, ButtonComponent],
  templateUrl: './ai-documento-sugestoes.component.html',
  styleUrl: './ai-documento-sugestoes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiDocumentoSugestoesComponent {
  private readonly ai = inject(AiAssistenteService);

  readonly importacao = input.required<AiDocumentoImportacao>();
  readonly disabled = input(false);
  readonly importacaoAtualizada = output<AiDocumentoImportacao>();
  readonly processandoChange = output<boolean>();

  protected readonly processandoId = signal<string | null>(null);
  protected readonly aplicandoSeguras = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected pendentes(): AiDocumentoSugestao[] {
    return this.importacao().sugestoes.filter(item => item.status === 'PENDENTE');
  }

  protected totalSeguras(): number {
    return this.pendentes().filter(item => item.aplicacaoSegura).length;
  }

  protected aceitar(sugestao: AiDocumentoSugestao): void {
    if (this.bloqueado()) return;
    this.processandoId.set(sugestao.id);
    this.processandoChange.emit(true);
    this.erro.set(null);
    this.ai.aceitarSugestaoImportacao(this.importacao().id, sugestao.id).subscribe({
      next: atualizada => this.concluir(atualizada),
      error: err => this.falhar(err, 'Não foi possível aplicar a sugestão.'),
    });
  }

  protected ignorar(sugestao: AiDocumentoSugestao): void {
    if (this.bloqueado()) return;
    this.processandoId.set(sugestao.id);
    this.processandoChange.emit(true);
    this.erro.set(null);
    this.ai.ignorarSugestaoImportacao(this.importacao().id, sugestao.id).subscribe({
      next: atualizada => this.concluir(atualizada),
      error: err => this.falhar(err, 'Não foi possível ignorar a sugestão.'),
    });
  }

  protected aplicarSeguras(): void {
    if (this.bloqueado() || !this.totalSeguras()) return;
    this.aplicandoSeguras.set(true);
    this.processandoChange.emit(true);
    this.erro.set(null);
    this.ai.aplicarSugestoesSegurasImportacao(this.importacao().id).subscribe({
      next: atualizada => this.concluir(atualizada),
      error: err => this.falhar(err, 'Não foi possível aplicar os ajustes seguros.'),
    });
  }

  protected bloqueado(): boolean {
    return this.disabled() || this.processandoId() !== null || this.aplicandoSeguras();
  }

  protected rotuloTipo(tipo: AiDocumentoSugestaoTipo): string {
    const rotulos: Record<AiDocumentoSugestaoTipo, string> = {
      ADICIONAR_PAGINA: 'Página ausente',
      RENOMEAR_PAGINA: 'Renomear página',
      MOVER_PAGINA: 'Reorganizar página',
      MESCLAR_PAGINAS: 'Possível duplicidade',
      RENOMEAR_MODULO: 'Renomear módulo',
    };
    return rotulos[tipo];
  }

  protected iconeTipo(tipo: AiDocumentoSugestaoTipo): string {
    const icones: Record<AiDocumentoSugestaoTipo, string> = {
      ADICIONAR_PAGINA: 'FilePlus2',
      RENOMEAR_PAGINA: 'Pencil',
      MOVER_PAGINA: 'ArrowRight',
      MESCLAR_PAGINAS: 'Files',
      RENOMEAR_MODULO: 'FilePen',
    };
    return icones[tipo];
  }

  protected toneStatus(sugestao: AiDocumentoSugestao): BadgeTone {
    if (sugestao.status === 'APLICADA') return 'success';
    if (sugestao.status === 'IGNORADA') return 'neutral';
    return sugestao.aplicacaoSegura ? 'info' : 'warn';
  }

  protected rotuloStatus(sugestao: AiDocumentoSugestao): string {
    if (sugestao.status === 'APLICADA') return 'Aplicada';
    if (sugestao.status === 'IGNORADA') return 'Ignorada';
    return sugestao.aplicacaoSegura ? 'Ajuste seguro' : 'Requer decisão';
  }

  protected impacto(sugestao: AiDocumentoSugestao): string | null {
    const doc = this.importacao();
    const paginaOrigem = doc.modulos
      .flatMap(modulo => modulo.paginas)
      .find(pagina => pagina.id === sugestao.paginaOrigemId)?.titulo;
    const paginaDestino = doc.modulos
      .flatMap(modulo => modulo.paginas)
      .find(pagina => pagina.id === sugestao.paginaDestinoId)?.titulo;
    const moduloOrigem = doc.modulos.find(modulo => modulo.id === sugestao.moduloOrigemId)?.nome;
    const moduloDestino = doc.modulos.find(modulo => modulo.id === sugestao.moduloDestinoId)?.nome;

    switch (sugestao.tipo) {
      case 'ADICIONAR_PAGINA':
        return sugestao.valorSugerido && moduloDestino
          ? `Adicionar “${sugestao.valorSugerido}” em ${moduloDestino}`
          : null;
      case 'RENOMEAR_PAGINA':
        return paginaOrigem && sugestao.valorSugerido
          ? `“${paginaOrigem}” → “${sugestao.valorSugerido}”`
          : null;
      case 'MOVER_PAGINA':
        return paginaOrigem && moduloDestino ? `Mover “${paginaOrigem}” para ${moduloDestino}` : null;
      case 'MESCLAR_PAGINAS':
        return paginaOrigem && paginaDestino ? `Consolidar “${paginaOrigem}” em “${paginaDestino}”` : null;
      case 'RENOMEAR_MODULO':
        return moduloOrigem && sugestao.valorSugerido
          ? `“${moduloOrigem}” → “${sugestao.valorSugerido}”`
          : null;
    }
  }

  protected confianca(sugestao: AiDocumentoSugestao): number {
    return Math.round(sugestao.confianca * 100);
  }

  private concluir(importacao: AiDocumentoImportacao): void {
    this.processandoId.set(null);
    this.aplicandoSeguras.set(false);
    this.processandoChange.emit(false);
    this.importacaoAtualizada.emit(importacao);
  }

  private falhar(erro: unknown, mensagem: string): void {
    this.erro.set(mensagemErroHttp(erro, mensagem));
    this.processandoId.set(null);
    this.aplicandoSeguras.set(false);
    this.processandoChange.emit(false);
  }
}
