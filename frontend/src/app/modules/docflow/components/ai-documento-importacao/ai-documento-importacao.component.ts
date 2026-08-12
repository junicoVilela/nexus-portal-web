import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { BadgeComponent, ButtonComponent } from '@shared/ui';
import { mensagemErroHttp } from '@shared/utils/http-error-message';
import {
  AiDocumentoImportacao,
  AiPaginaDocumento,
  AiPaginaDocumentoSelecionada,
} from '../../models/ai-documento-importacao.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';

@Component({
  selector: 'app-ai-documento-importacao',
  standalone: true,
  imports: [LucideAngularModule, ButtonComponent, BadgeComponent],
  templateUrl: './ai-documento-importacao.component.html',
  styleUrl: './ai-documento-importacao.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiDocumentoImportacaoComponent implements OnInit {
  private readonly ai = inject(AiAssistenteService);
  private carregouImportacaoInicial = false;

  readonly importacaoIdInicial = input<string | null>(null);
  readonly projetoId = input<string | null>(null);
  readonly clienteId = input<string | null>(null);
  readonly disabled = input(false);
  readonly paginaSelecionada = output<AiPaginaDocumentoSelecionada>();
  readonly importacaoChange = output<string>();

  protected readonly importacao = signal<AiDocumentoImportacao | null>(null);
  protected readonly importando = signal(false);
  protected readonly arrastando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly paginaAtivaId = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.importacaoIdInicial();
    if (id && !this.carregouImportacaoInicial) {
      this.carregouImportacaoInicial = true;
      this.carregar(id);
    }
  }

  protected selecionarArquivo(event: Event): void {
    const inputArquivo = event.target as HTMLInputElement;
    const arquivo = inputArquivo.files?.[0];
    inputArquivo.value = '';
    if (arquivo) this.importar(arquivo);
  }

  protected soltar(event: DragEvent): void {
    event.preventDefault();
    this.arrastando.set(false);
    const arquivo = event.dataTransfer?.files?.[0];
    if (arquivo) this.importar(arquivo);
  }

  protected permitirSoltar(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled()) this.arrastando.set(true);
  }

  protected sairDropzone(): void {
    this.arrastando.set(false);
  }

  protected usarPagina(pagina: AiPaginaDocumento, moduloNome: string): void {
    const importacao = this.importacao();
    if (!importacao || this.importando()) return;
    this.importando.set(true);
    this.erro.set(null);
    this.ai.selecionarPaginaImportada(importacao.id, pagina.id).subscribe({
      next: atualizada => {
        this.definirImportacao(atualizada);
        this.importando.set(false);
        const selecionada = atualizada.modulos
          .flatMap(modulo => modulo.paginas)
          .find(item => item.id === pagina.id);
        if (selecionada) {
          this.paginaSelecionada.emit({ ...selecionada, importacaoId: atualizada.id, moduloNome });
        }
      },
      error: err => {
        this.erro.set(mensagemErroHttp(err, 'Não foi possível selecionar a página importada.'));
        this.importando.set(false);
      },
    });
  }

  protected totalPaginas(importacao: AiDocumentoImportacao): number {
    return importacao.modulos.reduce((total, modulo) => total + modulo.paginas.length, 0);
  }

  protected tamanhoLegivel(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private importar(arquivo: File): void {
    if (this.disabled() || this.importando()) return;
    const extensao = arquivo.name.split('.').pop()?.toLowerCase();
    if (!extensao || !['doc', 'docx', 'pdf', 'txt'].includes(extensao)) {
      this.erro.set('Use um arquivo DOC, DOCX, PDF pesquisável ou TXT em UTF-8.');
      return;
    }
    if (arquivo.size > 15 * 1024 * 1024) {
      this.erro.set('O arquivo excede o limite de 15 MB.');
      return;
    }
    this.importando.set(true);
    this.erro.set(null);
    this.paginaAtivaId.set(null);
    this.ai
      .importarDocumento(arquivo, { projetoId: this.projetoId(), clienteId: this.clienteId() })
      .subscribe({
        next: importacao => {
          this.definirImportacao(importacao);
          this.importando.set(false);
          this.importacaoChange.emit(importacao.id);
        },
        error: err => {
          this.erro.set(mensagemErroHttp(err, 'Não foi possível interpretar o documento.'));
          this.importando.set(false);
        },
      });
  }

  private carregar(id: string): void {
    this.importando.set(true);
    this.erro.set(null);
    this.ai.buscarImportacao(id).subscribe({
      next: importacao => {
        this.definirImportacao(importacao);
        this.importando.set(false);
      },
      error: err => {
        this.erro.set(mensagemErroHttp(err, 'Não foi possível retomar a importação.'));
        this.importando.set(false);
      },
    });
  }

  private definirImportacao(importacao: AiDocumentoImportacao): void {
    this.importacao.set(importacao);
    const paginaAtiva = importacao.modulos
      .flatMap(modulo => modulo.paginas)
      .find(pagina => pagina.status === 'EM_EDICAO');
    this.paginaAtivaId.set(paginaAtiva?.id ?? null);
  }
}
