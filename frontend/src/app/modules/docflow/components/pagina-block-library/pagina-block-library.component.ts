import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { BLOCOS_PAGINA, BlocoPagina, CategoriaBlocoPagina } from './pagina-block-library.blocks';

@Component({
  selector: 'app-pagina-block-library',
  standalone: true,
  templateUrl: './pagina-block-library.component.html',
  styleUrl: './pagina-block-library.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaBlockLibraryComponent {
  @ViewChild('buscaInput') buscaInput?: ElementRef<HTMLInputElement>;

  readonly blocoSelecionado = output<BlocoPagina>();
  readonly aberta = signal(false);
  readonly categoria = signal<CategoriaBlocoPagina | 'Todos'>('Todos');
  readonly busca = signal('');
  readonly categorias: readonly (CategoriaBlocoPagina | 'Todos')[] = [
    'Todos',
    'Estrutura',
    'Orientação',
    'Referência',
    'Navegação',
  ];
  readonly blocos = computed(() => {
    const categoria = this.categoria();
    const porCategoria =
      categoria === 'Todos' ? BLOCOS_PAGINA : BLOCOS_PAGINA.filter(bloco => bloco.categoria === categoria);
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
  }

  abrirComBusca(): void {
    this.aberta.set(true);
    this.categoria.set('Todos');
    this.busca.set('');
    this.focarBusca();
  }

  fechar(): void {
    this.aberta.set(false);
    this.busca.set('');
  }

  selecionar(bloco: BlocoPagina): void {
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
}
