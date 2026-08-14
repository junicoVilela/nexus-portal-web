import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Dialog } from '@angular/cdk/dialog';
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

import { ConfirmService } from '@shared/ui';
import { mensagemErroHttp } from '@shared/utils/http-error-message';
import {
  AiDocumentoImportacao,
  AiModuloDocumento,
  AiPaginaDocumento,
} from '../../models/ai-documento-importacao.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import {
  extrairConteudoPagina,
  montarBriefingPagina,
  paginaPodeSerEditada,
  rotuloOrigemPagina,
} from './ai-documento-estrutura.utils';
import {
  AiDocumentoInspectorResultado,
  AiDocumentoPreviewDialogComponent,
  AiDocumentoPreviewDialogData,
} from './ai-documento-preview-dialog.component';

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
  private readonly dialog = inject(Dialog);
  private readonly confirm = inject(ConfirmService);
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
  protected readonly novoModuloNome = signal('');
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
    const indice = origem.paginas.findIndex(pagina => pagina.id === paginaId);
    const [pagina] = origem.paginas.splice(indice, 1);
    destino.paginas.push(pagina);
    this.aplicar(normalizarOrdens(proximo), anterior);
  }

  protected visualizarConteudo(pagina: AiPaginaDocumento, modulo: AiModuloDocumento): void {
    this.abrirInspetor(pagina, modulo, false);
  }

  protected adicionarPagina(modulo: AiModuloDocumento): void {
    if (this.bloqueado()) return;
    if (this.totalPaginas() >= 80) {
      this.erro.set('O documento pode ter no máximo 80 páginas.');
      return;
    }
    const pagina: AiPaginaDocumento = {
      id: crypto.randomUUID(),
      titulo: '',
      ordem: modulo.paginas.length + 1,
      briefing: '',
      templateId: null,
      templateCodigo: null,
      templateNome: null,
      confiancaTemplate: 0,
      motivoTemplate: 'O modelo será escolhido durante a geração.',
      status: 'PENDENTE',
      paginaId: null,
      sessaoId: null,
      erroMensagem: null,
      origem: 'MANUAL',
      ajustadaManualmente: true,
    };
    this.abrirInspetor(pagina, modulo, true);
  }

  private abrirInspetor(pagina: AiPaginaDocumento, modulo: AiModuloDocumento, criacao: boolean): void {
    const ref = this.dialog.open<AiDocumentoInspectorResultado, AiDocumentoPreviewDialogData>(
      AiDocumentoPreviewDialogComponent,
      {
        data: {
          pagina,
          modulo,
          projetoNome: this.importacao().projetoNome,
          paginasMesclagem: modulo.paginas.filter(
            item => item.id !== pagina.id && paginaPodeSerEditada(item),
          ),
          criacao,
        },
        ariaLabel: criacao ? `Nova página no módulo ${modulo.nome}` : `Conteúdo da página ${pagina.titulo}`,
        backdropClass: 'ui-dialog-backdrop',
        panelClass: 'ui-dialog-panel',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      },
    );
    ref.closed.subscribe(resultado => {
      if (resultado) void this.aplicarResultadoInspetor(resultado, pagina.id, modulo.id);
    });
  }

  private async aplicarResultadoInspetor(
    resultado: AiDocumentoInspectorResultado,
    paginaId: string,
    moduloId: string,
  ): Promise<void> {
    if (this.bloqueado()) return;
    if (resultado.tipo === 'EXCLUIR') {
      await this.removerPagina(paginaId);
      return;
    }
    const anterior = clonarModulos(this.modulos());
    const proximo = clonarModulos(anterior);
    const modulo = proximo.find(item => item.id === moduloId);
    if (!modulo) return;

    if (resultado.tipo === 'CRIAR') {
      modulo.paginas.push(
        paginaRascunho(
          paginaId,
          resultado.titulo,
          resultado.conteudo,
          this.importacao().projetoNome,
          modulo.nome,
          'MANUAL',
        ),
      );
    } else {
      const indice = modulo.paginas.findIndex(item => item.id === paginaId);
      const pagina = modulo.paginas[indice];
      if (!pagina || !paginaPodeSerEditada(pagina)) return;
      if (resultado.tipo === 'SALVAR') {
        modulo.paginas[indice] = paginaAtualizada(
          pagina,
          resultado.titulo,
          resultado.conteudo,
          this.importacao().projetoNome,
          modulo.nome,
          pagina.origem,
        );
      } else if (resultado.tipo === 'DIVIDIR') {
        modulo.paginas[indice] = paginaAtualizada(
          pagina,
          resultado.atual.titulo,
          resultado.atual.conteudo,
          this.importacao().projetoNome,
          modulo.nome,
          pagina.origem,
        );
        modulo.paginas.splice(
          indice + 1,
          0,
          paginaRascunho(
            crypto.randomUUID(),
            resultado.nova.titulo,
            resultado.nova.conteudo,
            this.importacao().projetoNome,
            modulo.nome,
            'DIVISAO',
          ),
        );
      } else {
        modulo.paginas[indice] = paginaAtualizada(
          pagina,
          resultado.titulo,
          resultado.conteudo,
          this.importacao().projetoNome,
          modulo.nome,
          'MESCLAGEM',
        );
        modulo.paginas = modulo.paginas.filter(item => item.id !== resultado.paginaRemovidaId);
      }
    }
    this.aplicar(normalizarOrdens(proximo), anterior);
  }

  private async removerPagina(paginaId: string): Promise<void> {
    const anterior = clonarModulos(this.modulos());
    const pagina = anterior.flatMap(modulo => modulo.paginas).find(item => item.id === paginaId);
    if (!pagina || !paginaPodeSerEditada(pagina)) return;
    if (this.totalPaginas() === 1) {
      this.erro.set('O documento precisa manter pelo menos uma página.');
      return;
    }
    const confirmado = await this.confirm.confirm({
      title: `Remover “${pagina.titulo}”?`,
      message: 'A página sairá do plano do manual. Você ainda poderá usar Desfazer após a remoção.',
      acceptLabel: 'Remover página',
      rejectLabel: 'Manter página',
      variant: 'danger',
      icon: 'Trash2',
    });
    if (!confirmado || this.bloqueado()) return;
    const proximo = anterior.map(modulo => ({
      ...modulo,
      paginas: modulo.paginas.filter(item => item.id !== paginaId),
    }));
    this.aplicar(normalizarOrdens(proximo), anterior);
  }

  protected atualizarNovoModuloNome(event: Event): void {
    this.novoModuloNome.set((event.target as HTMLInputElement).value);
  }

  protected adicionarModulo(event: Event): void {
    event.preventDefault();
    const nome = this.novoModuloNome().trim();
    if (this.bloqueado()) return;
    if (!nome) {
      this.erro.set('Informe o nome do novo módulo.');
      return;
    }
    if (this.modulos().length >= 30) {
      this.erro.set('O documento pode ter no máximo 30 módulos.');
      return;
    }
    if (this.modulos().some(modulo => normalizarNome(modulo.nome) === normalizarNome(nome))) {
      this.erro.set('Use um nome diferente para o novo módulo.');
      return;
    }
    const anterior = clonarModulos(this.modulos());
    const proximo = [
      ...clonarModulos(anterior),
      {
        id: crypto.randomUUID(),
        moduloId: null,
        nome,
        ordem: anterior.length + 1,
        paginas: [],
      },
    ];
    this.novoModuloNome.set('');
    this.aplicar(proximo, anterior);
  }

  protected removerModulo(moduloId: string): void {
    if (this.bloqueado()) return;
    const anterior = clonarModulos(this.modulos());
    const modulo = anterior.find(item => item.id === moduloId);
    if (!modulo) return;
    if (anterior.length === 1) {
      this.erro.set('O documento precisa manter pelo menos um módulo.');
      return;
    }
    if (modulo.paginas.length) {
      this.erro.set('Mova as páginas deste módulo antes de removê-lo.');
      return;
    }
    const proximo = anterior.filter(item => item.id !== moduloId);
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

  protected origemPaginaLabel(pagina: AiPaginaDocumento): string {
    return `${rotuloOrigemPagina(pagina.origem)}${pagina.ajustadaManualmente ? ' · ajustada' : ''}`;
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
          nome: modulo.nome,
          paginas: modulo.paginas.map(pagina => ({
            planoId: pagina.id,
            titulo: pagina.titulo,
            conteudo: extrairConteudoPagina(pagina.briefing),
            origem: pagina.origem,
            ajustadaManualmente: pagina.ajustadaManualmente,
          })),
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

function normalizarNome(nome: string): string {
  return nome.trim().toLocaleLowerCase('pt-BR');
}

function paginaRascunho(
  id: string,
  titulo: string,
  conteudo: string,
  projetoNome: string,
  moduloNome: string,
  origem: AiPaginaDocumento['origem'],
): AiPaginaDocumento {
  return {
    id,
    titulo,
    ordem: 0,
    briefing: montarBriefingPagina(projetoNome, moduloNome, titulo, conteudo),
    templateId: null,
    templateCodigo: null,
    templateNome: null,
    confiancaTemplate: 0,
    motivoTemplate: 'Conteúdo ajustado durante a revisão; o modelo será reavaliado na geração.',
    status: 'PENDENTE',
    paginaId: null,
    sessaoId: null,
    erroMensagem: null,
    origem,
    ajustadaManualmente: true,
  };
}

function paginaAtualizada(
  pagina: AiPaginaDocumento,
  titulo: string,
  conteudo: string,
  projetoNome: string,
  moduloNome: string,
  origem: AiPaginaDocumento['origem'],
): AiPaginaDocumento {
  return {
    ...paginaRascunho(pagina.id, titulo, conteudo, projetoNome, moduloNome, origem),
    ordem: pagina.ordem,
  };
}
