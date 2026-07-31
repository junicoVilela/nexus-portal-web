import { ChangeDetectionStrategy, Component, computed, HostListener, input, output, signal } from '@angular/core';
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
  | 'report'
  | 'filters'
  | 'metrics'
  | 'dossier'
  | 'rulespec'
  | 'catalog';
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
  readonly busca = signal('');
  readonly somenteFavoritos = signal(false);
  readonly favoritos = signal<Set<string>>(this.carregarFavoritos());
  readonly totalAplicacoes = computed(() =>
    this.templates().reduce((total, template) => total + (template.paginasOriginadas ?? 0), 0),
  );
  readonly templateMaisUsado = computed(
    () => [...this.templates()].sort((a, b) => (b.paginasOriginadas ?? 0) - (a.paginasOriginadas ?? 0))[0],
  );
  readonly templatesVisiveis = computed(() => {
    const filtro = this.filtro();
    const termo = this.normalizar(this.busca());
    let templates = this.templates();
    if (filtro === 'SISTEMA') templates = templates.filter(template => !template.personalizado);
    else if (filtro === 'PROJETO') templates = templates.filter(template => !!template.projetoId);
    else if (filtro === 'CLIENTE') templates = templates.filter(template => !!template.clienteId);
    else if (filtro === 'ARQUIVADOS') templates = templates.filter(template => template.ativo === false);
    else templates = templates.filter(template => template.ativo !== false);

    if (this.somenteFavoritos()) templates = templates.filter(template => this.favoritos().has(template.id));
    if (termo) {
      templates = templates.filter(template =>
        this.normalizar(`${template.nome} ${template.descricao ?? ''} ${template.codigo}`).includes(termo),
      );
    }
    return [...templates].sort((a, b) => {
      const favoritoA = this.favoritos().has(a.id) ? 1 : 0;
      const favoritoB = this.favoritos().has(b.id) ? 1 : 0;
      return (
        favoritoB - favoritoA || (b.paginasOriginadas ?? 0) - (a.paginasOriginadas ?? 0) || a.ordem - b.ordem
      );
    });
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
    if (codigo === 'LAB_FILTROS' || codigo === 'DTEC_ALERTAS') return 'filters';
    if (codigo === 'PAINEL_METRICAS' || codigo === 'DTEC_SIMULACAO') return 'metrics';
    if (codigo === 'DOSSIE_DECISAO' || codigo === 'DTEC_ANALISE_CLIENTE') return 'dossier';
    if (codigo === 'ESPECIFICACAO_REGRA' || codigo === 'DTEC_REGRAS') return 'rulespec';
    if (codigo === 'CATALOGO_PARAMETROS' || codigo === 'DTEC_PARAMETROS') return 'catalog';
    return 'screen';
  }

  escopoLabel(template: PaginaTemplate): string {
    if (template.projetoNome) return `Projeto · ${template.projetoNome}`;
    if (template.clienteNome) return `Cliente · ${template.clienteNome}`;
    return 'Modelo do sistema';
  }

  alternarFavorito(template: PaginaTemplate, event: Event): void {
    event.stopPropagation();
    const favoritos = new Set(this.favoritos());
    if (favoritos.has(template.id)) favoritos.delete(template.id);
    else favoritos.add(template.id);
    this.favoritos.set(favoritos);
    try {
      localStorage.setItem('docflow:templates-favoritos', JSON.stringify([...favoritos]));
    } catch {
      // Preferência não persistida quando o storage estiver indisponível.
    }
  }

  private carregarFavoritos(): Set<string> {
    try {
      const ids = JSON.parse(localStorage.getItem('docflow:templates-favoritos') ?? '[]') as unknown;
      return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []);
    } catch {
      return new Set();
    }
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  @HostListener('document:keydown', ['$event'])
  protected fecharPorEscape(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    const target = event.target;
    if (target instanceof Element && target.closest('.block-library__param-panel[role="dialog"]')) return;
    event.stopPropagation();
    this.fechado.emit();
  }
}
