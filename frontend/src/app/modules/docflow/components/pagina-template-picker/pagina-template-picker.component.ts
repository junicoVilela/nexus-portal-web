import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { PaginaTemplate } from '../../models/pagina.model';

type TemplateVisual =
  | 'screen'
  | 'flow'
  | 'dictionary'
  | 'faq'
  | 'troubleshooting'
  | 'home'
  | 'category'
  | 'onboarding'
  | 'report';
type TemplateFiltro = 'TODOS' | 'SISTEMA' | 'PROJETO' | 'CLIENTE' | 'ARQUIVADOS';

@Component({
  selector: 'app-pagina-template-picker',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './pagina-template-picker.component.html',
  styleUrl: './pagina-template-picker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaTemplatePickerComponent {
  readonly templates = input.required<PaginaTemplate[]>();
  readonly selecionadoId = input<string | null>(null);
  readonly somenteContexto = input(true);
  readonly incluirArquivados = input(false);
  readonly previewingId = input<string | null>(null);
  readonly podeDuplicar = input(true);
  readonly podeEditar = input(true);
  readonly podeExcluir = input(true);
  readonly selecionado = output<PaginaTemplate | null>();
  readonly previewSolicitada = output<PaginaTemplate>();
  readonly exclusaoSolicitada = output<PaginaTemplate>();
  readonly edicaoSolicitada = output<PaginaTemplate>();
  readonly duplicacaoSolicitada = output<PaginaTemplate>();
  readonly arquivamentoSolicitado = output<PaginaTemplate>();
  readonly reativacaoSolicitada = output<PaginaTemplate>();
  readonly historicoSolicitado = output<PaginaTemplate>();
  readonly contextoAlterado = output<boolean>();
  readonly arquivadosAlterado = output<boolean>();
  readonly fechado = output<void>();
  readonly filtro = signal<TemplateFiltro>('TODOS');
  readonly totalAplicacoes = computed(() =>
    this.templates().reduce((total, template) => total + (template.paginasOriginadas ?? 0), 0),
  );
  readonly templateMaisUsado = computed(
    () => [...this.templates()].sort((a, b) => (b.paginasOriginadas ?? 0) - (a.paginasOriginadas ?? 0))[0],
  );
  readonly templatesVisiveis = computed(() => {
    const filtro = this.filtro();
    if (filtro === 'SISTEMA') return this.templates().filter(template => !template.personalizado);
    if (filtro === 'PROJETO') return this.templates().filter(template => !!template.projetoId);
    if (filtro === 'CLIENTE') return this.templates().filter(template => !!template.clienteId);
    if (filtro === 'ARQUIVADOS') return this.templates().filter(template => template.ativo === false);
    return this.templates().filter(template => template.ativo !== false);
  });

  totalFiltro(filtro: TemplateFiltro): number {
    if (filtro === 'SISTEMA') return this.templates().filter(template => !template.personalizado).length;
    if (filtro === 'PROJETO') return this.templates().filter(template => !!template.projetoId).length;
    if (filtro === 'CLIENTE') return this.templates().filter(template => !!template.clienteId).length;
    if (filtro === 'ARQUIVADOS') return this.templates().filter(template => template.ativo === false).length;
    return this.templates().filter(template => template.ativo !== false).length;
  }

  visualDoTemplate(codigo: string): TemplateVisual {
    if (codigo === 'CENTRAL_AJUDA') return 'home';
    if (codigo === 'CATEGORIA_ARTIGOS') return 'category';
    if (codigo === 'PRIMEIROS_PASSOS') return 'onboarding';
    if (codigo === 'RELATORIO') return 'report';
    if (codigo === 'PASSO_A_PASSO' || codigo === 'PROCESSO') return 'flow';
    if (codigo === 'DICIONARIO_CAMPOS') return 'dictionary';
    if (codigo === 'FAQ') return 'faq';
    if (codigo === 'SOLUCAO_PROBLEMAS') return 'troubleshooting';
    return 'screen';
  }

  escopoLabel(template: PaginaTemplate): string {
    if (template.projetoNome) return `Projeto · ${template.projetoNome}`;
    if (template.clienteNome) return `Cliente · ${template.clienteNome}`;
    return 'Modelo do sistema';
  }
}
