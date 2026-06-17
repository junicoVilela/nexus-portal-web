import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { EntradaTimeline, RfBuilderTimelineComponent } from './rf-builder-timeline.component';

const entradasBase: EntradaTimeline[] = [
  {
    id: '1',
    categoria: 'NOVIDADE',
    titulo: 'Suporte a SSO via Google Workspace',
    descricao: 'Permite login com contas corporativas.',
    ticket: 'PROJ-123',
    commit: 'a1b2c3d4',
    savedAt: new Date(),
    saved: true,
  },
  {
    id: '2',
    categoria: 'CORRECAO',
    titulo: 'Corrigido cálculo de imposto retroativo',
    descricao: '',
    ticket: 'PROJ-456',
    commit: '',
    savedAt: new Date(),
    saved: true,
  },
  {
    id: '3',
    categoria: 'MELHORIA',
    titulo: 'Lista de clientes mais rápida',
    descricao: 'Index no campo nome reduziu p95 em 70%.',
    ticket: '',
    commit: 'e5f6g7h8',
    savedAt: new Date(),
    saved: true,
  },
];

const meta: Meta<RfBuilderTimelineComponent> = {
  title: 'Modules/Release Orchestrator/RfBuilderTimeline',
  component: RfBuilderTimelineComponent,
  tags: ['autodocs'],
  decorators: [applicationConfig({ providers: [lucideIconsProvider] })],
  args: { entradas: entradasBase, encerrando: false },
  render: args => ({
    props: args,
    template: `<app-rf-builder-timeline
                 [entradas]="entradas"
                 [encerrando]="encerrando" />`,
  }),
};
export default meta;

type Story = StoryObj<RfBuilderTimelineComponent>;

export const Padrao: Story = {};
export const Vazia: Story = { args: { entradas: [] } };
export const Salvando: Story = {
  args: {
    entradas: [...entradasBase.slice(0, 2), { ...entradasBase[2], saving: true, saved: false }],
  },
};
export const Encerrando: Story = { args: { encerrando: true } };
