import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { ButtonComponent } from '@shared/ui';
import {
  BLOCOS_PAGINA,
  BlocoPagina,
  CategoriaBlocoPagina,
  ParametrizacaoBlocoPagina,
} from './pagina-block-library.blocks';
import {
  clonarLinhasPadrao,
  CONFIG_PARAMETRIZACAO,
  linhaVazia,
  montarHtmlParametrizado,
} from './pagina-block-library.parametrizacao';

type FiltroBloco = CategoriaBlocoPagina | 'Todos' | 'Recentes';

@Component({
  selector: 'app-pagina-block-library',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './pagina-block-library.component.html',
  styleUrl: './pagina-block-library.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaBlockLibraryComponent {
  @ViewChild('buscaInput') buscaInput?: ElementRef<HTMLInputElement>;

  readonly blocoSelecionado = output<BlocoPagina>();
  readonly aberta = signal(false);
  readonly categoria = signal<FiltroBloco>('Todos');
  readonly busca = signal('');
  readonly recentes = signal<string[]>(this.carregarRecentes());
  readonly parametrizacaoAtiva = signal<ParametrizacaoBlocoPagina | null>(null);
  readonly blocoParametrizado = signal<BlocoPagina | null>(null);
  readonly linhasParametrizacao = signal<Record<string, string>[]>([]);
  readonly configParametrizacao = computed(() => {
    const tipo = this.parametrizacaoAtiva();
    return tipo ? CONFIG_PARAMETRIZACAO[tipo] : null;
  });
  readonly categorias: readonly FiltroBloco[] = [
    'Todos',
    'Recentes',
    'Kits',
    'Estrutura',
    'Orientação',
    'Referência',
    'Navegação',
  ];
  readonly blocos = computed(() => {
    const categoria = this.categoria();
    const porCategoria =
      categoria === 'Todos'
        ? BLOCOS_PAGINA
        : categoria === 'Recentes'
          ? this.recentes()
              .map(id => BLOCOS_PAGINA.find(bloco => bloco.id === id))
              .filter((bloco): bloco is BlocoPagina => !!bloco)
          : BLOCOS_PAGINA.filter(bloco => bloco.categoria === categoria);
    const termo = this.normalizar(this.busca());
    return termo
      ? porCategoria.filter(bloco =>
          this.normalizar(`${bloco.nome} ${bloco.descricao} ${bloco.categoria}`).includes(termo),
        )
      : porCategoria;
  });

  alternar(): void {
    this.aberta.update(aberta => !aberta);
    if (this.aberta()) this.focarBusca();
    else this.cancelarParametrizacao();
  }

  abrirComBusca(): void {
    this.aberta.set(true);
    this.categoria.set('Todos');
    this.busca.set('');
    this.cancelarParametrizacao();
    this.focarBusca();
  }

  fechar(): void {
    this.aberta.set(false);
    this.busca.set('');
    this.cancelarParametrizacao();
  }

  selecionar(bloco: BlocoPagina): void {
    if (bloco.parametrizacao) {
      this.blocoParametrizado.set(bloco);
      this.parametrizacaoAtiva.set(bloco.parametrizacao);
      this.linhasParametrizacao.set(clonarLinhasPadrao(bloco.parametrizacao));
      return;
    }
    this.emitirBloco(bloco);
  }

  confirmarParametrizacao(): void {
    const bloco = this.blocoParametrizado();
    const tipo = this.parametrizacaoAtiva();
    if (!bloco || !tipo) return;
    const html = montarHtmlParametrizado(tipo, this.linhasParametrizacao());
    this.emitirBloco({ ...bloco, html });
  }

  cancelarParametrizacao(): void {
    this.parametrizacaoAtiva.set(null);
    this.blocoParametrizado.set(null);
    this.linhasParametrizacao.set([]);
  }

  adicionarLinhaParametrizacao(): void {
    const tipo = this.parametrizacaoAtiva();
    if (!tipo) return;
    this.linhasParametrizacao.update(linhas => [...linhas, linhaVazia(tipo)]);
  }

  atualizarLinhaParametrizacao(indice: number, chave: string, valor: string): void {
    this.linhasParametrizacao.update(linhas =>
      linhas.map((linha, i) => (i === indice ? { ...linha, [chave]: valor } : linha)),
    );
  }

  removerLinhaParametrizacao(indice: number): void {
    this.linhasParametrizacao.update(linhas => linhas.filter((_, i) => i !== indice));
  }

  private emitirBloco(bloco: BlocoPagina): void {
    const recentes = [bloco.id, ...this.recentes().filter(id => id !== bloco.id)].slice(0, 6);
    this.recentes.set(recentes);
    try {
      localStorage.setItem('docflow:blocos-recentes', JSON.stringify(recentes));
    } catch {
      // A inserção continua funcionando sem persistir a preferência.
    }
    this.blocoSelecionado.emit(bloco);
    this.fechar();
  }

  private focarBusca(): void {
    queueMicrotask(() => this.buscaInput?.nativeElement.focus());
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private carregarRecentes(): string[] {
    try {
      const ids = JSON.parse(localStorage.getItem('docflow:blocos-recentes') ?? '[]') as unknown;
      return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string').slice(0, 6) : [];
    } catch {
      return [];
    }
  }
}
