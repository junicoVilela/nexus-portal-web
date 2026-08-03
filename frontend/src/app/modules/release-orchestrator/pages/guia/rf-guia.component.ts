import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GuiaPasso, StatusGuia } from '../../models/guia-passo.model';
import { RELEASE_STATUS_LABELS, ReleaseStatus } from '../../models/release.model';

import { LucideAngularModule } from 'lucide-angular';
import { PageHeaderComponent, ButtonComponent } from '@shared/ui';

@Component({
  selector: 'app-rf-guia',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, PageHeaderComponent, ButtonComponent],
  templateUrl: './rf-guia.component.html',
  styleUrl: './rf-guia.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfGuiaComponent {
  protected readonly passoAtual = signal(0);
  protected readonly visitados = signal<Set<number>>(new Set([0]));
  protected readonly statusSelecionado = signal<ReleaseStatus | null>('RASCUNHO');

  protected readonly passos: GuiaPasso[] = [
    {
      id: 0,
      titulo: 'Bem-vindo ao Release Orchestrator',
      resumo: 'Centralize versões, mudanças e publicações dos produtos da Nexus em um único fluxo.',
      icon: 'pi-sparkles',
      dicas: [
        'Use este guia como referência na primeira vez ou quando precisar treinar alguém.',
        'Cada passo tem um atalho para a tela correspondente no sistema.',
        'O fluxo recomendado é: produtos → release → itens → revisão → publicação.',
      ],
      rota: ['/release-orchestrator'],
      acaoLabel: 'Ir ao dashboard',
    },
    {
      id: 1,
      titulo: 'Dashboard',
      resumo: 'Acompanhe indicadores, releases recentes e últimas atividades em um só lugar.',
      icon: 'pi-home',
      dicas: [
        'Os cards no topo mostram totais por status (rascunho, em revisão, publicadas).',
        'A tabela de releases recentes permite abrir o detalhe com um clique.',
        'Use "Registrar release" para iniciar o assistente de registro em tempo real.',
      ],
      rota: ['/release-orchestrator'],
      acaoLabel: 'Abrir dashboard',
    },
    {
      id: 2,
      titulo: 'Cadastrar produtos',
      resumo: 'Antes de qualquer release, cadastre os sistemas ou plataformas que recebem versões.',
      icon: 'pi-box',
      dicas: [
        'Cada produto tem nome, sigla única e cor para identificação visual nas listagens.',
        'Produtos inativos não impedem releases antigas, mas evite usá-los em novos registros.',
        'A sigla aparece nos badges das tabelas (ex.: BASA, Nexus).',
      ],
      rota: ['/release-orchestrator', 'produtos'],
      acaoLabel: 'Gerenciar produtos',
    },
    {
      id: 3,
      titulo: 'Templates (opcional)',
      resumo: 'Modelos de texto aceleram releases recorrentes com a mesma estrutura de changelog.',
      icon: 'pi-file-edit',
      dicas: [
        'Associe um template a um tipo de release (Major, Patch, Hotfix…).',
        'Templates inativos ficam ocultos na seleção, mas o histórico é preservado.',
        'Você pode criar releases sem template — este passo é opcional.',
      ],
      rota: ['/release-orchestrator', 'templates'],
      acaoLabel: 'Ver templates',
    },
    {
      id: 4,
      titulo: 'Registrar uma release',
      resumo: 'Crie a versão com produto, número semântico, tipo e título; depois adicione itens ao vivo.',
      icon: 'pi-play-circle',
      dicas: [
        'O Builder em duas etapas: primeiro identifica a release, depois registra mudanças por categoria.',
        'Versão no formato semântico (ex.: 2.1.0) — não pode repetir para o mesmo produto.',
        'Alternativa: formulário em Releases → Nova release, se preferir cadastro tradicional.',
      ],
      rota: ['/release-orchestrator', 'builder'],
      acaoLabel: 'Abrir registrar release',
    },
    {
      id: 5,
      titulo: 'Itens da release',
      resumo: 'Documente correções, features e melhorias com título, descrição, ticket e visibilidade.',
      icon: 'pi-list',
      dicas: [
        'Categorias: Correção, Feature, Melhoria, Breaking change, Documentação, etc.',
        'Visibilidade controla quem vê o item no material publicado (todos, interno, clientes).',
        'Reordene itens por drag ou botões; a ordem reflete no PDF e na comunicação.',
      ],
      rota: ['/release-orchestrator', 'releases'],
      acaoLabel: 'Ver lista de releases',
    },
    {
      id: 6,
      titulo: 'Ciclo de status',
      resumo: 'A release avança por etapas controladas até publicação ou cancelamento.',
      icon: 'pi-sync',
      dicas: [
        'Clique em cada status no diagrama abaixo para ver o que significa.',
        'Só é possível publicar quando o status for Aprovada.',
        'Rascunho e Em desenvolvimento permitem editar itens livremente.',
      ],
    },
    {
      id: 7,
      titulo: 'Revisão e validação',
      resumo: 'Antes de aprovar, use a tela de revisão para checar pendências e regras de negócio.',
      icon: 'pi-check-circle',
      dicas: [
        'A validação exige ao menos um item cadastrado na release.',
        'Em revisão, o revisor pode devolver para rascunho ou aprovar.',
        'O histórico registra cada mudança de status com usuário e data.',
      ],
      rota: ['/release-orchestrator', 'releases'],
      acaoLabel: 'Escolher release para revisar',
    },
    {
      id: 8,
      titulo: 'Publicar e comunicar',
      resumo: 'Após aprovação, publique a release e gere o PDF para distribuição interna ou a clientes.',
      icon: 'pi-send',
      dicas: [
        'Na publicação, a data e o responsável ficam registrados automaticamente.',
        'Use exportar PDF na lista ou no detalhe da release.',
        'Releases publicadas não podem mais ser editadas — apenas consultadas.',
      ],
      rota: ['/release-orchestrator', 'releases'],
      acaoLabel: 'Ver releases publicadas',
    },
  ];

  protected readonly fluxoStatus: StatusGuia[] = [
    {
      status: 'RASCUNHO',
      label: RELEASE_STATUS_LABELS.RASCUNHO,
      descricao:
        'Release criada; itens podem ser adicionados e editados. Próximo passo típico: iniciar desenvolvimento.',
      cor: '#64748b',
    },
    {
      status: 'EM_DESENVOLVIMENTO',
      label: RELEASE_STATUS_LABELS.EM_DESENVOLVIMENTO,
      descricao: 'Equipe documentando mudanças. Pode enviar para revisão quando o pacote estiver completo.',
      cor: '#2563eb',
    },
    {
      status: 'EM_REVISAO',
      label: RELEASE_STATUS_LABELS.EM_REVISAO,
      descricao: 'Aguardando validação. Revisor pode aprovar, devolver ao rascunho ou cancelar.',
      cor: '#d97706',
    },
    {
      status: 'APROVADA',
      label: RELEASE_STATUS_LABELS.APROVADA,
      descricao: 'Conteúdo validado. Pronta para publicação oficial.',
      cor: '#059669',
    },
    {
      status: 'PUBLICADA',
      label: RELEASE_STATUS_LABELS.PUBLICADA,
      descricao: 'Release oficializada. Geração de PDF e comunicação; edição bloqueada.',
      cor: '#7c3aed',
    },
    {
      status: 'CANCELADA',
      label: RELEASE_STATUS_LABELS.CANCELADA,
      descricao: 'Release descartada. Mantida apenas para auditoria.',
      cor: '#dc2626',
    },
  ];

  protected readonly passo = computed(() => this.passos[this.passoAtual()]);
  protected readonly progressoPct = computed(() =>
    Math.round(((this.passoAtual() + 1) / this.passos.length) * 100),
  );
  protected readonly ehPrimeiro = computed(() => this.passoAtual() === 0);
  protected readonly ehUltimo = computed(() => this.passoAtual() === this.passos.length - 1);
  protected readonly fluxoPrincipal = this.fluxoStatus.filter(s => s.status !== 'CANCELADA');

  protected readonly statusAtivo = computed(() => {
    const id = this.statusSelecionado();
    return this.fluxoStatus.find(s => s.status === id) ?? this.fluxoStatus[0];
  });

  protected selecionarPasso(index: number): void {
    if (index < 0 || index >= this.passos.length) return;
    this.passoAtual.set(index);
    this.visitados.update(v => new Set([...v, index]));
  }

  protected anterior(): void {
    this.selecionarPasso(this.passoAtual() - 1);
  }

  protected proximo(): void {
    this.selecionarPasso(this.passoAtual() + 1);
  }

  protected selecionarStatus(status: ReleaseStatus): void {
    this.statusSelecionado.set(status);
  }

  protected passoVisitado(index: number): boolean {
    return this.visitados().has(index);
  }

  protected passoEhFluxo(): boolean {
    return this.passoAtual() === 6;
  }
}
