import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { BlocoPagina } from '../pagina-block-library';
import { AiComponenteCandidato, AiTemplateRecomendacao } from '../../models/ai-template-recomendacao.model';

type ComponenteComposto = AiComponenteCandidato & { html?: string };

@Component({
  selector: 'app-ai-component-composer',
  standalone: true,
  imports: [DragDropModule, LucideAngularModule],
  templateUrl: './ai-component-composer.component.html',
  styleUrl: './ai-component-composer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiComponentComposerComponent {
  readonly plano = input.required<AiTemplateRecomendacao>();
  readonly selecionados = input.required<readonly string[]>();
  readonly catalogo = input<readonly BlocoPagina[]>([]);
  readonly disabled = input(false);
  readonly selecionadosChange = output<string[]>();

  protected readonly exploradorAberto = signal(false);
  protected readonly busca = signal('');
  protected readonly categoria = signal('Todos');
  protected readonly componenteEmPreview = signal<ComponenteComposto | null>(null);
  protected readonly totalSelecionados = computed(() => this.selecionados().length);
  protected readonly componentesSelecionados = computed(() =>
    this.selecionados()
      .map(id => this.componente(id))
      .filter((item): item is ComponenteComposto => !!item),
  );
  protected readonly categorias = computed(() => [
    'Todos',
    ...new Set(this.catalogo().map(item => item.categoria)),
  ]);
  protected readonly componentesDisponiveis = computed(() => {
    const selecionados = new Set(this.selecionados());
    const fonte = this.catalogo().length
      ? this.catalogo().map(item => this.componenteDoCatalogo(item))
      : this.plano().componentes;
    const termo = normalizar(this.busca());
    return fonte.filter(item => {
      if (selecionados.has(item.id)) return false;
      if (this.categoria() !== 'Todos' && item.categoria !== this.categoria()) return false;
      return !termo || normalizar(`${item.nome} ${item.descricao} ${item.categoria}`).includes(termo);
    });
  });

  protected podeRemover(componente: ComponenteComposto): boolean {
    return !componente.obrigatorio && this.totalSelecionados() > 3;
  }

  protected remover(componente: ComponenteComposto): void {
    if (this.disabled() || !this.podeRemover(componente)) return;
    this.selecionadosChange.emit(this.selecionados().filter(id => id !== componente.id));
  }

  protected adicionar(componente: ComponenteComposto): void {
    if (this.disabled() || this.totalSelecionados() >= 12 || this.selecionados().includes(componente.id))
      return;
    this.selecionadosChange.emit([...this.selecionados(), componente.id]);
  }

  protected reordenar(event: CdkDragDrop<ComponenteComposto[]>): void {
    if (this.disabled() || event.previousIndex === event.currentIndex) return;
    const ids = [...this.selecionados()];
    moveItemInArray(ids, event.previousIndex, event.currentIndex);
    this.selecionadosChange.emit(ids);
  }

  protected restaurar(): void {
    if (this.disabled()) return;
    this.selecionadosChange.emit(this.plano().componentes.map(componente => componente.id));
  }

  protected alternarExplorador(): void {
    this.exploradorAberto.update(aberto => !aberto);
    if (!this.exploradorAberto()) this.componenteEmPreview.set(null);
  }

  protected atualizarBusca(event: Event): void {
    this.busca.set((event.target as HTMLInputElement).value);
  }

  protected atualizarCategoria(event: Event): void {
    this.categoria.set((event.target as HTMLSelectElement).value);
  }

  protected visualizar(componente: ComponenteComposto): void {
    this.componenteEmPreview.set(componente);
  }

  protected necessidadeLabel(componente: ComponenteComposto): string {
    const labels: Record<AiComponenteCandidato['necessidade'], string> = {
      OBRIGATORIA: 'Essencial',
      RECOMENDADA: 'Recomendado',
      OPCIONAL: 'Contextual',
      CONTEXTUAL: 'Detectado no texto',
    };
    return labels[componente.necessidade];
  }

  private componente(id: string): ComponenteComposto | null {
    const candidato = this.plano().componentes.find(item => item.id === id);
    const bloco = this.catalogo().find(item => item.id === id);
    if (candidato) return { ...candidato, html: bloco?.html };
    return bloco ? this.componenteDoCatalogo(bloco) : null;
  }

  private componenteDoCatalogo(bloco: BlocoPagina): ComponenteComposto {
    const candidato = this.plano().componentes.find(item => item.id === bloco.id);
    return {
      id: bloco.id,
      nome: bloco.nome,
      descricao: bloco.descricao,
      categoria: bloco.categoria,
      visual: bloco.visual,
      necessidade: candidato?.necessidade ?? 'CONTEXTUAL',
      obrigatorio: candidato?.obrigatorio ?? false,
      motivo: candidato?.motivo ?? 'Adicionado manualmente a partir da biblioteca.',
      html: bloco.html,
    };
  }
}

function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}
