import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';

export interface PaginaSecaoVisual {
  id: string;
  html: string;
  titulo: string;
  resumo: string;
  tipo: string;
}

@Component({
  selector: 'app-pagina-section-organizer',
  standalone: true,
  imports: [DragDropModule],
  templateUrl: './pagina-section-organizer.component.html',
  styleUrl: './pagina-section-organizer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaSectionOrganizerComponent {
  readonly html = input.required<string>();
  readonly salvamentoStatus = input('idle');
  readonly htmlReordenado = output<string>();
  readonly exclusaoSolicitada = output<PaginaSecaoVisual>();
  readonly secoes = computed(() => extrairSecoesPagina(this.html()));
  readonly historico = signal<string[]>([]);
  readonly podeDesfazer = computed(() => this.historico().length > 0);
  readonly statusLabel = computed(() => {
    switch (this.salvamentoStatus()) {
      case 'saving':
        return 'Salvando alterações…';
      case 'saved':
        return 'Alterações salvas';
      case 'offline':
        return 'Offline · backup local ativo';
      case 'conflict':
        return 'Conflito de edição';
      case 'error':
        return 'Falha ao salvar';
      default:
        return this.podeDesfazer() ? 'Alterações aguardando salvamento' : 'Nenhuma alteração local';
    }
  });

  private htmlObservado: string | undefined;
  private ultimoHtmlEmitido: string | undefined;

  constructor() {
    effect(() => {
      const html = this.html();
      untracked(() => {
        if (this.htmlObservado === undefined) {
          this.htmlObservado = html;
          return;
        }
        if (html === this.ultimoHtmlEmitido) {
          this.htmlObservado = html;
          this.ultimoHtmlEmitido = undefined;
          return;
        }
        if (html !== this.htmlObservado) this.historico.set([]);
        this.htmlObservado = html;
      });
    });
  }

  reordenar(event: CdkDragDrop<PaginaSecaoVisual[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const secoes = [...this.secoes()];
    moveItemInArray(secoes, event.previousIndex, event.currentIndex);
    this.aplicarSecoes(secoes);
  }

  mover(indice: number, direcao: -1 | 1): void {
    const destino = indice + direcao;
    const secoes = [...this.secoes()];
    if (destino < 0 || destino >= secoes.length) return;
    moveItemInArray(secoes, indice, destino);
    this.aplicarSecoes(secoes);
  }

  duplicar(indice: number): void {
    const secoes = [...this.secoes()];
    const secao = secoes[indice];
    if (!secao) return;
    secoes.splice(indice + 1, 0, { ...secao });
    this.aplicarSecoes(secoes);
  }

  solicitarExclusao(secao: PaginaSecaoVisual): void {
    this.exclusaoSolicitada.emit(secao);
  }

  excluir(secaoId: string): boolean {
    const secoes = this.secoes().filter(secao => secao.id !== secaoId);
    if (secoes.length === this.secoes().length) return false;
    this.aplicarSecoes(secoes);
    return true;
  }

  desfazer(): void {
    const historico = this.historico();
    const htmlAnterior = historico.at(-1);
    if (htmlAnterior === undefined) return;
    this.historico.set(historico.slice(0, -1));
    this.emitirHtml(htmlAnterior);
  }

  private aplicarSecoes(secoes: PaginaSecaoVisual[]): void {
    const htmlAtual = this.html();
    const novoHtml = secoes.map(secao => secao.html).join('\n');
    if (novoHtml === htmlAtual) return;
    this.historico.update(historico => [...historico.slice(-19), htmlAtual]);
    this.emitirHtml(novoHtml);
  }

  private emitirHtml(html: string): void {
    this.ultimoHtmlEmitido = html;
    this.htmlReordenado.emit(html);
  }
}

export function extrairSecoesPagina(html: string): PaginaSecaoVisual[] {
  if (!html.trim()) return [];
  const documento = new DOMParser().parseFromString(html, 'text/html');
  const nos = Array.from(documento.body.childNodes).filter(no =>
    no.nodeType === Node.TEXT_NODE ? !!no.textContent?.trim() : no.nodeType === Node.ELEMENT_NODE,
  );
  const grupos: Node[][] = [];
  let grupoTitulo: Node[] = [];

  const concluirGrupoTitulo = () => {
    if (!grupoTitulo.length) return;
    grupos.push(grupoTitulo);
    grupoTitulo = [];
  };

  nos.forEach(no => {
    const elemento = no.nodeType === Node.ELEMENT_NODE ? (no as Element) : undefined;
    const tituloSolto = elemento?.matches('h1, h2, h3, h4, h5, h6') ?? false;
    const secaoCompleta = elemento?.matches('section, article') ?? false;
    if (tituloSolto) {
      concluirGrupoTitulo();
      grupoTitulo = [no];
      return;
    }
    if (secaoCompleta) {
      concluirGrupoTitulo();
      grupos.push([no]);
      return;
    }
    if (grupoTitulo.length) {
      grupoTitulo.push(no);
      return;
    }
    grupos.push([no]);
  });
  concluirGrupoTitulo();

  const ocorrencias = new Map<string, number>();
  return grupos.map((grupo, indice) => {
    const conteudo = serializarNos(grupo);
    const hash = hashTexto(conteudo);
    const ocorrencia = (ocorrencias.get(hash) ?? 0) + 1;
    ocorrencias.set(hash, ocorrencia);
    const fragmento = new DOMParser().parseFromString(conteudo, 'text/html').body;
    const texto = fragmento.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    return {
      id: `secao-${hash}-${ocorrencia}`,
      html: conteudo,
      titulo: obterTitulo(fragmento, indice),
      resumo: texto.length > 120 ? `${texto.slice(0, 117).trim()}…` : texto,
      tipo: obterTipo(fragmento),
    };
  });
}

function serializarNos(nos: Node[]): string {
  const container = document.createElement('div');
  nos.forEach(no => container.appendChild(no.cloneNode(true)));
  return container.innerHTML.trim();
}

function obterTitulo(fragmento: HTMLElement, indice: number): string {
  const titulo = fragmento.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim();
  if (titulo) return titulo;
  const destaque = fragmento.querySelector('strong')?.textContent?.trim();
  if (destaque) return destaque;
  return `Seção ${indice + 1}`;
}

function obterTipo(fragmento: HTMLElement): string {
  const primeiro = fragmento.firstElementChild;
  if (!primeiro) return 'Texto';
  if (primeiro.classList.contains('doc-intro')) return 'Introdução';
  if (primeiro.classList.contains('objective-card')) return 'Objetivo';
  if (primeiro.classList.contains('related-links')) return 'Navegação';
  if (primeiro.matches('table, .table-wrap')) return 'Tabela';
  if (primeiro.matches('ul, ol')) return 'Lista';
  if (primeiro.matches('section, article')) return 'Seção visual';
  if (primeiro.matches('figure')) return 'Imagem';
  return 'Conteúdo';
}

function hashTexto(valor: string): string {
  let hash = 0;
  for (let indice = 0; indice < valor.length; indice += 1) {
    hash = (hash * 31 + valor.charCodeAt(indice)) | 0;
  }
  return Math.abs(hash).toString(36);
}
