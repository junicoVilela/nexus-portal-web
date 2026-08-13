import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { mensagemErroHttp } from '@shared/utils/http-error-message';
import {
  AiDocumentoImportacao,
  AiModuloDocumento,
  AiPaginaDocumento,
} from '../../models/ai-documento-importacao.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';

type SalvamentoStatus = 'idle' | 'saving' | 'saved' | 'conflict' | 'error';
type TipoPersistencia = 'normal' | 'undo';

@Component({
  selector: 'app-ai-documento-organizador',
  standalone: true,
  imports: [DragDropModule, LucideAngularModule],
  templateUrl: './ai-documento-organizador.component.html',
  styleUrl: './ai-documento-organizador.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiDocumentoOrganizadorComponent implements OnDestroy {
  private readonly ai = inject(AiAssistenteService);
  private importacaoObservada?: string;
  private statusTimer?: number;

  readonly importacao = input.required<AiDocumentoImportacao>();
  readonly disabled = input(false);
  readonly importacaoAtualizada = output<AiDocumentoImportacao>();
  readonly processandoChange = output<boolean>();

  protected readonly modulos = signal<AiModuloDocumento[]>([]);
  protected readonly historico = signal<AiModuloDocumento[][]>([]);
  protected readonly versao = signal(0);
  protected readonly status = signal<SalvamentoStatus>('idle');
  protected readonly erro = signal<string | null>(null);
  protected readonly salvando = computed(() => this.status() === 'saving');
  protected readonly bloqueado = computed(() => this.disabled() || this.salvando());
  protected readonly podeDesfazer = computed(() => this.historico().length > 0 && !this.bloqueado());
  protected readonly listasPaginas = computed(() =>
    this.modulos().map(modulo => this.listaPaginasId(modulo.id)),
  );
  protected readonly totalPaginas = computed(() =>
    this.modulos().reduce((total, modulo) => total + modulo.paginas.length, 0),
  );
  protected readonly statusLabel = computed(() => {
    switch (this.status()) {
      case 'saving':
        return 'Salvando organização…';
      case 'saved':
        return 'Organização salva';
      case 'conflict':
        return 'Plano atualizado por outra tela';
      case 'error':
        return 'Falha ao salvar';
      default:
        return this.historico().length ? 'Você pode desfazer a última alteração' : 'Organização sincronizada';
    }
  });

  constructor() {
    effect(() => {
      const importacao = this.importacao();
      const chave = `${importacao.id}:${importacao.version}`;
      untracked(() => {
        if (chave === this.importacaoObservada) return;
        this.importacaoObservada = chave;
        this.modulos.set(clonarModulos(importacao.modulos));
        this.versao.set(importacao.version);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.statusTimer !== undefined) window.clearTimeout(this.statusTimer);
  }

  protected soltarModulo(event: CdkDragDrop<AiModuloDocumento[]>): void {
    if (this.bloqueado() || event.previousIndex === event.currentIndex) return;
    const anterior = clonarModulos(this.modulos());
    const proximo = clonarModulos(anterior);
    moveItemInArray(proximo, event.previousIndex, event.currentIndex);
    this.aplicar(normalizarOrdens(proximo), anterior);
  }

  protected soltarPagina(
    event: CdkDragDrop<AiPaginaDocumento[], AiPaginaDocumento[]>,
    moduloDestinoId: string,
  ): void {
    if (this.bloqueado()) return;
    const moduloOrigemId = this.moduloIdDaLista(event.previousContainer.id);
    if (!moduloOrigemId) return;
    if (moduloOrigemId === moduloDestinoId && event.previousIndex === event.currentIndex) return;

    const anterior = clonarModulos(this.modulos());
    const proximo = clonarModulos(anterior);
    const origem = proximo.find(modulo => modulo.id === moduloOrigemId);
    const destino = proximo.find(modulo => modulo.id === moduloDestinoId);
    if (!origem || !destino) return;
    if (origem.id !== destino.id && origem.paginas.length === 1) {
      this.erro.set('Cada módulo precisa manter pelo menos uma página.');
      return;
    }

    if (origem.id === destino.id) {
      moveItemInArray(origem.paginas, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(origem.paginas, destino.paginas, event.previousIndex, event.currentIndex);
    }
    this.aplicar(normalizarOrdens(proximo), anterior);
  }

  protected moverModulo(indice: number, direcao: -1 | 1): void {
    const destino = indice + direcao;
    if (this.bloqueado() || destino < 0 || destino >= this.modulos().length) return;
    const anterior = clonarModulos(this.modulos());
    const proximo = clonarModulos(anterior);
    moveItemInArray(proximo, indice, destino);
    this.aplicar(normalizarOrdens(proximo), anterior);
  }

  protected moverPagina(moduloId: string, indice: number, direcao: -1 | 1): void {
    const modulo = this.modulos().find(item => item.id === moduloId);
    const destino = indice + direcao;
    if (this.bloqueado() || !modulo || destino < 0 || destino >= modulo.paginas.length) return;
    const anterior = clonarModulos(this.modulos());
    const proximo = clonarModulos(anterior);
    const moduloAtualizado = proximo.find(item => item.id === moduloId);
    if (!moduloAtualizado) return;
    moveItemInArray(moduloAtualizado.paginas, indice, destino);
    this.aplicar(normalizarOrdens(proximo), anterior);
  }

  protected moverPaginaParaModulo(paginaId: string, event: Event): void {
    if (this.bloqueado()) return;
    const moduloDestinoId = (event.target as HTMLSelectElement).value;
    const anterior = clonarModulos(this.modulos());
    const proximo = clonarModulos(anterior);
    const origem = proximo.find(modulo => modulo.paginas.some(pagina => pagina.id === paginaId));
    const destino = proximo.find(modulo => modulo.id === moduloDestinoId);
    if (!origem || !destino || origem.id === destino.id) return;
    if (origem.paginas.length === 1) {
      this.erro.set('Cada módulo precisa manter pelo menos uma página.');
      return;
    }
    const indice = origem.paginas.findIndex(pagina => pagina.id === paginaId);
    const [pagina] = origem.paginas.splice(indice, 1);
    destino.paginas.push(pagina);
    this.aplicar(normalizarOrdens(proximo), anterior);
  }

  protected desfazer(): void {
    const historico = this.historico();
    const anterior = historico.at(-1);
    if (!anterior || this.bloqueado()) return;
    const atual = clonarModulos(this.modulos());
    this.historico.set(historico.slice(0, -1));
    this.persistir(clonarModulos(anterior), atual, 'undo');
  }

  protected listaPaginasId(moduloId: string): string {
    return `doc-pages-${moduloId}`;
  }

  private moduloIdDaLista(listaId: string): string | null {
    const prefixo = 'doc-pages-';
    return listaId.startsWith(prefixo) ? listaId.slice(prefixo.length) : null;
  }

  private aplicar(proximo: AiModuloDocumento[], anterior: AiModuloDocumento[]): void {
    this.historico.update(itens => [...itens.slice(-9), clonarModulos(anterior)]);
    this.persistir(proximo, anterior, 'normal');
  }

  private persistir(
    proximo: AiModuloDocumento[],
    rollback: AiModuloDocumento[],
    tipo: TipoPersistencia,
  ): void {
    if (this.statusTimer !== undefined) window.clearTimeout(this.statusTimer);
    this.modulos.set(clonarModulos(proximo));
    this.status.set('saving');
    this.processandoChange.emit(true);
    this.erro.set(null);
    this.ai
      .reordenarEstruturaImportada(this.importacao().id, {
        version: this.versao(),
        modulos: proximo.map(modulo => ({
          planoId: modulo.id,
          paginas: modulo.paginas.map(pagina => pagina.id),
        })),
      })
      .subscribe({
        next: atualizada => {
          this.importacaoObservada = `${atualizada.id}:${atualizada.version}`;
          this.versao.set(atualizada.version);
          this.modulos.set(clonarModulos(atualizada.modulos));
          this.status.set('saved');
          this.processandoChange.emit(false);
          this.importacaoAtualizada.emit(atualizada);
          this.agendarStatusInicial();
        },
        error: err => this.tratarFalha(err, rollback, proximo, tipo),
      });
  }

  private tratarFalha(
    err: unknown,
    rollback: AiModuloDocumento[],
    tentativa: AiModuloDocumento[],
    tipo: TipoPersistencia,
  ): void {
    if (err instanceof HttpErrorResponse && err.status === 409) {
      this.status.set('conflict');
      this.erro.set('O plano mudou em outra tela. A versão mais recente foi carregada.');
      this.historico.set([]);
      this.ai.buscarImportacao(this.importacao().id).subscribe({
        next: atualizada => {
          this.importacaoObservada = `${atualizada.id}:${atualizada.version}`;
          this.versao.set(atualizada.version);
          this.modulos.set(clonarModulos(atualizada.modulos));
          this.processandoChange.emit(false);
          this.importacaoAtualizada.emit(atualizada);
        },
        error: () => {
          this.modulos.set(clonarModulos(rollback));
          this.processandoChange.emit(false);
        },
      });
      return;
    }
    this.processandoChange.emit(false);
    this.modulos.set(clonarModulos(rollback));
    if (tipo === 'normal') {
      this.historico.update(itens => itens.slice(0, -1));
    } else {
      this.historico.update(itens => [...itens, clonarModulos(tentativa)]);
    }
    this.status.set('error');
    this.erro.set(mensagemErroHttp(err, 'Não foi possível salvar a organização do documento.'));
  }

  private agendarStatusInicial(): void {
    if (this.statusTimer !== undefined) window.clearTimeout(this.statusTimer);
    this.statusTimer = window.setTimeout(() => this.status.set('idle'), 2_500);
  }
}

function clonarModulos(modulos: AiModuloDocumento[]): AiModuloDocumento[] {
  return modulos.map(modulo => ({
    ...modulo,
    paginas: modulo.paginas.map(pagina => ({ ...pagina })),
  }));
}

function normalizarOrdens(modulos: AiModuloDocumento[]): AiModuloDocumento[] {
  return modulos.map((modulo, indiceModulo) => ({
    ...modulo,
    ordem: indiceModulo + 1,
    paginas: modulo.paginas.map((pagina, indicePagina) => ({
      ...pagina,
      ordem: indicePagina + 1,
    })),
  }));
}
