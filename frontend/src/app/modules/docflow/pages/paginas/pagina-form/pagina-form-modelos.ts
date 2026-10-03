import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { PaginaTemplateSalvarDados } from '@modules/docflow/components/pagina-template-save';
import {
  PaginaTemplate,
  PaginaTemplateAplicacao,
  PaginaTemplateAplicada,
  PaginaTemplateCriacao,
  PaginaTemplateVersao,
} from '@modules/docflow/models/pagina.model';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { ConfirmService, ToastService } from '@shared/ui';

/** O que os modelos precisam saber do formulário da página. */
export interface PaginaFormModelosContexto {
  /** Projeto selecionado no formulário (escopo da lista e das cópias). */
  projetoId(): string | undefined;
  /** Contexto para resolver variáveis ao aplicar ou pré-visualizar um modelo. */
  aplicacao(template: PaginaTemplate): PaginaTemplateAplicacao;
  /** HTML atual do editor, para salvar como modelo personalizado. */
  conteudoHtml(): string;
}

/**
 * Modelos de página no editor: catálogo, prévia, aplicação e administração (personalizados,
 * duplicar, arquivar, histórico de versões). Escopo do `pagina-form` (`providers`).
 *
 * Aplicar um modelo no conteúdo fica no componente, que confirma a substituição e conduz as
 * etapas do formulário; aqui só a chamada à API e o estado.
 */
@Injectable()
export class PaginaFormModelos {
  private readonly paginaService = inject(PaginaService);
  private readonly confirmService = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private contexto?: PaginaFormModelosContexto;

  readonly templates = signal<PaginaTemplate[]>([]);
  readonly templateSelecionadoId = signal<string | null>(null);
  readonly templateOrigemId = signal<string | undefined>(undefined);
  readonly templateOrigemVersao = signal<number | undefined>(undefined);
  readonly mostrarTemplates = signal(false);
  readonly templateEmEdicao = signal<PaginaTemplate | null>(null);
  readonly templateHistorico = signal<PaginaTemplate | null>(null);
  readonly templateVersoes = signal<PaginaTemplateVersao[]>([]);
  readonly versaoComparacaoA = signal<number | null>(null);
  readonly versaoComparacaoB = signal<number | null>(null);
  readonly versoesEmComparacao = computed(() => ({
    a: this.templateVersoes().find(item => item.numero === this.versaoComparacaoA()),
    b: this.templateVersoes().find(item => item.numero === this.versaoComparacaoB()),
  }));
  readonly templatePreview = signal<{
    template: PaginaTemplate;
    aplicado: PaginaTemplateAplicada;
  } | null>(null);
  readonly previsualizandoTemplateId = signal<string | null>(null);
  readonly carregandoVersoesTemplate = signal(false);
  readonly aplicandoTemplate = signal(false);
  readonly somenteTemplatesContexto = signal(true);
  readonly incluirTemplatesArquivados = signal(false);
  readonly mostrarSalvarTemplate = signal(false);
  readonly salvandoTemplate = signal(false);

  configurar(contexto: PaginaFormModelosContexto): void {
    this.contexto = contexto;
  }

  carregar(): void {
    this.paginaService
      .templatesPagina({
        projetoId: this.ctx().projetoId(),
        somenteContexto: this.somenteTemplatesContexto(),
        incluirArquivados: this.incluirTemplatesArquivados(),
      })
      .subscribe({
        next: templates => this.templates.set(templates),
        error: error => this.toast.error(mensagemErro(error, 'Erro ao carregar modelos de página.')),
      });
  }

  /** Resolve o modelo no contexto atual do formulário (variáveis preenchidas). */
  aplicar(template: PaginaTemplate): Promise<PaginaTemplateAplicada> {
    return firstValueFrom(
      this.paginaService.aplicarTemplatePagina(template.id, this.ctx().aplicacao(template)),
    );
  }

  async previsualizarTemplate(template: PaginaTemplate): Promise<void> {
    if (this.previsualizandoTemplateId()) return;
    this.previsualizandoTemplateId.set(template.id);
    try {
      this.templatePreview.set({ template, aplicado: await this.aplicar(template) });
    } catch (error) {
      this.toast.error(mensagemErro(error, 'Não foi possível gerar a prévia deste modelo.'));
    } finally {
      this.previsualizandoTemplateId.set(null);
    }
  }

  salvarTemplatePersonalizado(dados: PaginaTemplateSalvarDados): void {
    const conteudoHtml = this.ctx().conteudoHtml().trim();
    if (!conteudoHtml || this.salvandoTemplate()) return;
    const edicao = this.templateEmEdicao();
    const payload: PaginaTemplateCriacao = {
      nome: dados.nome,
      descricao: dados.descricao,
      projetoId: dados.projetoId,
      clienteId: dados.clienteId,
      conteudoHtml: edicao && !dados.substituirConteudo ? edicao.conteudoHtml : conteudoHtml,
    };
    this.salvandoTemplate.set(true);
    const request = edicao
      ? this.paginaService.atualizarTemplatePagina(edicao.id, payload)
      : this.paginaService.criarTemplatePagina(payload);
    request.subscribe({
      next: template => {
        this.templates.update(templates =>
          edicao
            ? templates.map(item => (item.id === template.id ? template : item))
            : [...templates, template],
        );
        this.mostrarSalvarTemplate.set(false);
        this.templateEmEdicao.set(null);
        this.mostrarTemplates.set(true);
        this.salvandoTemplate.set(false);
        this.toast.success(
          edicao
            ? `Modelo "${template.nome}" atualizado para a versão ${template.versaoAtual}.`
            : `Modelo "${template.nome}" criado para ${escopoTemplate(template)}.`,
        );
      },
      error: error => {
        this.salvandoTemplate.set(false);
        this.toast.error(mensagemErro(error, 'Erro ao criar modelo personalizado.'));
      },
    });
  }

  editarTemplatePersonalizado(template: PaginaTemplate): void {
    if (!template.personalizado) return;
    this.templateEmEdicao.set(template);
    this.mostrarSalvarTemplate.set(true);
  }

  async duplicarTemplate(template: PaginaTemplate): Promise<void> {
    const clienteId = template.clienteId;
    const projetoId = clienteId ? undefined : (template.projetoId ?? this.ctx().projetoId());
    if (!projetoId && !clienteId) {
      this.toast.error('Selecione um projeto antes de duplicar um modelo do sistema.');
      return;
    }
    try {
      const copia = await firstValueFrom(
        this.paginaService.duplicarTemplatePagina(template.id, {
          nome: `Cópia de ${template.nome}`.slice(0, 120),
          projetoId,
          clienteId,
        }),
      );
      this.templates.update(items => [...items, copia]);
      this.toast.success(`Modelo duplicado como "${copia.nome}".`);
    } catch (error) {
      this.toast.error(mensagemErro(error, 'Erro ao duplicar modelo.'));
    }
  }

  async arquivarTemplate(template: PaginaTemplate): Promise<void> {
    const confirmado = await this.confirmService.confirm({
      title: 'Arquivar modelo?',
      message: `O modelo "${template.nome}" deixará de aparecer para criação de páginas, mas seu histórico será mantido.`,
      acceptLabel: 'Arquivar modelo',
      variant: 'danger',
      icon: 'Archive',
    });
    if (!confirmado) return;
    try {
      const atualizado = await firstValueFrom(this.paginaService.arquivarTemplatePagina(template.id));
      this.atualizarTemplateNaLista(atualizado);
      this.toast.success('Modelo arquivado.');
    } catch (error) {
      this.toast.error(mensagemErro(error, 'Erro ao arquivar modelo.'));
    }
  }

  async reativarTemplate(template: PaginaTemplate): Promise<void> {
    try {
      const atualizado = await firstValueFrom(this.paginaService.reativarTemplatePagina(template.id));
      this.atualizarTemplateNaLista(atualizado);
      this.toast.success('Modelo reativado.');
    } catch (error) {
      this.toast.error(mensagemErro(error, 'Erro ao reativar modelo.'));
    }
  }

  abrirHistoricoTemplate(template: PaginaTemplate): void {
    this.templateHistorico.set(template);
    this.carregandoVersoesTemplate.set(true);
    this.paginaService.versoesTemplatePagina(template.id).subscribe({
      next: versoes => {
        this.templateVersoes.set(versoes);
        this.versaoComparacaoA.set(versoes[0]?.numero ?? null);
        this.versaoComparacaoB.set(versoes[1]?.numero ?? null);
        this.carregandoVersoesTemplate.set(false);
      },
      error: error => {
        this.carregandoVersoesTemplate.set(false);
        this.toast.error(mensagemErro(error, 'Erro ao carregar versões do modelo.'));
      },
    });
  }

  /** Alterna a versão entre as duas posições de comparação (A/B). */
  selecionarVersaoComparacao(versao: PaginaTemplateVersao): void {
    if (this.versaoComparacaoA() === versao.numero) {
      this.versaoComparacaoA.set(null);
      return;
    }
    if (this.versaoComparacaoB() === versao.numero) {
      this.versaoComparacaoB.set(null);
      return;
    }
    if (this.versaoComparacaoA() === null) {
      this.versaoComparacaoA.set(versao.numero);
    } else if (this.versaoComparacaoB() === null) {
      this.versaoComparacaoB.set(versao.numero);
    } else {
      this.versaoComparacaoA.set(this.versaoComparacaoB());
      this.versaoComparacaoB.set(versao.numero);
    }
  }

  async restaurarVersaoTemplate(versao: PaginaTemplateVersao): Promise<void> {
    const template = this.templateHistorico();
    if (!template || !template.personalizado || versao.numero === template.versaoAtual) return;
    const confirmado = await this.confirmService.confirm({
      title: `Restaurar versão ${versao.numero}?`,
      message: 'O estado selecionado será salvo como uma nova versão, sem apagar o histórico atual.',
      acceptLabel: 'Restaurar versão',
      icon: 'History',
    });
    if (!confirmado) return;
    try {
      const atualizado = await firstValueFrom(
        this.paginaService.restaurarVersaoTemplatePagina(template.id, versao.numero),
      );
      this.atualizarTemplateNaLista(atualizado);
      this.templateHistorico.set(atualizado);
      this.abrirHistoricoTemplate(atualizado);
      this.toast.success(`Versão ${versao.numero} restaurada como versão ${atualizado.versaoAtual}.`);
    } catch (error) {
      this.toast.error(mensagemErro(error, 'Erro ao restaurar versão do modelo.'));
    }
  }

  alterarContextoTemplates(somenteContexto: boolean): void {
    this.somenteTemplatesContexto.set(somenteContexto);
    this.carregar();
  }

  alterarArquivadosTemplates(incluirArquivados: boolean): void {
    this.incluirTemplatesArquivados.set(incluirArquivados);
    this.carregar();
  }

  async excluirTemplatePersonalizado(template: PaginaTemplate): Promise<void> {
    if (!template.personalizado) return;
    const confirmado = await this.confirmService.confirm({
      title: 'Excluir modelo personalizado?',
      message: `O modelo "${template.nome}" será removido. Páginas que já usaram esta estrutura não serão alteradas.`,
      acceptLabel: 'Excluir modelo',
      variant: 'danger',
      icon: 'Trash2',
    });
    if (!confirmado) return;
    try {
      await firstValueFrom(this.paginaService.excluirTemplatePagina(template.id));
      this.templates.update(templates => templates.filter(item => item.id !== template.id));
      if (this.templateSelecionadoId() === template.id) this.templateSelecionadoId.set(null);
      if (this.templateHistorico()?.id === template.id) {
        this.templateHistorico.set(null);
        this.templateVersoes.set([]);
      }
      this.toast.success('Modelo personalizado excluído.');
    } catch (error) {
      this.toast.error(mensagemErro(error, 'Erro ao excluir modelo personalizado.'));
    }
  }

  private atualizarTemplateNaLista(template: PaginaTemplate): void {
    this.templates.update(items => items.map(item => (item.id === template.id ? template : item)));
    if (this.templateSelecionadoId() === template.id && template.ativo === false) {
      this.templateSelecionadoId.set(null);
    }
  }

  private ctx(): PaginaFormModelosContexto {
    if (!this.contexto) throw new Error('PaginaFormModelos usado antes de configurar().');
    return this.contexto;
  }
}

function escopoTemplate(template: PaginaTemplate): string {
  if (template.projetoNome) return `o projeto ${template.projetoNome}`;
  if (template.clienteNome) return `o cliente ${template.clienteNome}`;
  return 'o escopo selecionado';
}

function mensagemErro(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (typeof error.error?.message === 'string') return error.error.message;
  return fallback;
}
