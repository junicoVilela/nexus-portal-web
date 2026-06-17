import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { HistoricoTimelineComponent } from './historico-timeline.component';
import { ReleaseHistorico } from '../../models/release-historico.model';

const historicoBase: ReleaseHistorico[] = [
  {
    id: '1',
    releaseId: 'r1',
    acao: 'CRIADA',
    descricao: 'Release v2.1.0 criada com 12 itens.',
    usuario: 'maria',
    createdAt: '2026-05-01T10:00:00Z',
  },
  {
    id: '2',
    releaseId: 'r1',
    acao: 'ITEM_ADICIONADO',
    descricao: 'Adicionado: "Suporte a SSO"',
    usuario: 'joao',
    createdAt: '2026-05-02T14:30:00Z',
  },
  {
    id: '3',
    releaseId: 'r1',
    acao: 'ENVIADA_REVISAO',
    descricao: 'Encaminhada para revisão técnica.',
    statusAnterior: 'EM_DESENVOLVIMENTO',
    statusNovo: 'EM_REVISAO',
    usuario: 'maria',
    createdAt: '2026-05-03T09:15:00Z',
  },
  {
    id: '4',
    releaseId: 'r1',
    acao: 'APROVADA',
    descricao: 'Aprovada por tech lead.',
    statusAnterior: 'EM_REVISAO',
    statusNovo: 'APROVADA',
    usuario: 'lucas',
    createdAt: '2026-05-04T16:00:00Z',
  },
  {
    id: '5',
    releaseId: 'r1',
    acao: 'PUBLICADA',
    descricao: 'Publicada em produção.',
    statusAnterior: 'APROVADA',
    statusNovo: 'PUBLICADA',
    usuario: 'lucas',
    createdAt: '2026-05-05T18:30:00Z',
  },
];

const meta: Meta<HistoricoTimelineComponent> = {
  title: 'Modules/Release Orchestrator/HistoricoTimeline',
  component: HistoricoTimelineComponent,
  tags: ['autodocs'],
  decorators: [applicationConfig({ providers: [lucideIconsProvider] })],
  args: { historico: historicoBase },
  render: args => ({
    props: args,
    template: `<app-historico-timeline [historico]="historico" />`,
  }),
};
export default meta;

type Story = StoryObj<HistoricoTimelineComponent>;

export const Padrao: Story = {};
export const Curto: Story = { args: { historico: historicoBase.slice(0, 2) } };
export const SemMudancaStatus: Story = {
  args: { historico: historicoBase.filter(h => !h.statusAnterior) },
};
export const Cancelada: Story = {
  args: {
    historico: [
      ...historicoBase.slice(0, 3),
      {
        id: '6',
        releaseId: 'r1',
        acao: 'CANCELADA',
        descricao: 'Cancelada por mudança de escopo.',
        statusAnterior: 'EM_REVISAO',
        statusNovo: 'CANCELADA',
        usuario: 'lucas',
        createdAt: '2026-05-06T11:00:00Z',
      },
    ],
  },
};
