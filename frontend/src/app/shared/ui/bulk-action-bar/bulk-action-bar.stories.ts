import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { BulkActionBarComponent } from './bulk-action-bar.component';
import { ButtonComponent } from '../button/button.component';

const meta: Meta<BulkActionBarComponent> = {
  title: 'Shared/UI/BulkActionBar',
  component: BulkActionBarComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({ providers: [lucideIconsProvider] }),
    moduleMetadata({ imports: [ButtonComponent] }),
  ],
  argTypes: {
    count: { control: { type: 'number', min: 0, max: 50 } },
  },
  args: {
    count: 3,
    labelSingular: 'selecionada',
    labelPlural: 'selecionadas',
    limparLabel: 'Limpar seleção',
  },
  render: args => ({
    props: args,
    template: `<ui-bulk-action-bar
                 [count]="count"
                 [labelSingular]="labelSingular"
                 [labelPlural]="labelPlural"
                 [limparLabel]="limparLabel">
                 <ui-button variant="danger" size="sm" icon="Trash2">Excluir</ui-button>
                 <ui-button variant="ghost" size="sm" icon="Archive">Arquivar</ui-button>
               </ui-bulk-action-bar>`,
  }),
};
export default meta;

type Story = StoryObj<BulkActionBarComponent>;

export const Tres: Story = {};
export const Uma: Story = { args: { count: 1 } };
export const Zero: Story = { args: { count: 0 } };
export const Muitas: Story = { args: { count: 24 } };
