import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { FilterPresetsComponent } from './filter-presets.component';

const meta: Meta<FilterPresetsComponent> = {
  title: 'Shared/UI/FilterPresets',
  component: FilterPresetsComponent,
  tags: ['autodocs'],
  decorators: [applicationConfig({ providers: [lucideIconsProvider] })],
  argTypes: {
    filtrosAtivos: { control: { type: 'number', min: 0, max: 10 } },
  },
  args: {
    escopo: 'sb:demo',
    filtrosAtuais: { status: 'ATIVO', q: 'release' } as Record<string, unknown>,
    filtrosAtivos: 2,
  },
  render: args => ({
    props: args,
    template: `<ui-filter-presets
                 [escopo]="escopo"
                 [filtrosAtuais]="filtrosAtuais"
                 [filtrosAtivos]="filtrosAtivos" />`,
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Popover de presets salvos. Clique no botão para abrir; quando há filtros ativos, mostra a ação "Salvar atual". Presets persistem em localStorage por escopo.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<FilterPresetsComponent>;

export const SemPresets: Story = {};
export const SemFiltrosAtivos: Story = { args: { filtrosAtivos: 0 } };
export const MuitosFiltros: Story = { args: { filtrosAtivos: 5 } };
