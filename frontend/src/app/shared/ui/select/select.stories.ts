import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { SelectComponent } from './select.component';

const meta: Meta<SelectComponent> = {
  title: 'Shared/UI/Select',
  component: SelectComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({ providers: [lucideIconsProvider] }),
    moduleMetadata({ imports: [FormsModule] }),
  ],
  args: {
    label: 'Status',
    placeholder: 'Selecione…',
    options: [
      { value: 'rascunho', label: 'Rascunho' },
      { value: 'em_revisao', label: 'Em revisão' },
      { value: 'publicada', label: 'Publicada' },
    ],
  },
  render: args => ({
    props: { ...args, value: '' },
    template: `<ui-select style="min-width:280px;display:block"
                          [label]="label" [hint]="hint" [error]="error"
                          [placeholder]="placeholder" [options]="options"
                          [(ngModel)]="value" />`,
  }),
};
export default meta;

type Story = StoryObj<SelectComponent>;

export const Default: Story = {};
export const WithHint: Story = { args: { hint: 'Atalho: digite para filtrar' } };
export const WithError: Story = { args: { error: 'Selecione um status' } };
