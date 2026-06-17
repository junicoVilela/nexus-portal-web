import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { InputComponent } from './input.component';

const meta: Meta<InputComponent> = {
  title: 'Shared/UI/Input',
  component: InputComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({ providers: [lucideIconsProvider] }),
    moduleMetadata({ imports: [FormsModule] }),
  ],
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'search'] },
    leadingIcon: { control: 'text' },
    trailingIcon: { control: 'text' },
  },
  args: {
    label: 'Nome',
    hint: 'Como deve ser exibido no portal',
    placeholder: 'Digite seu nome',
    type: 'text',
  },
  render: args => ({
    props: { ...args, value: '' },
    template: `<ui-input style="min-width:320px;display:block"
                         [label]="label" [hint]="hint" [error]="error"
                         [placeholder]="placeholder" [type]="type"
                         [leadingIcon]="leadingIcon" [trailingIcon]="trailingIcon"
                         [(ngModel)]="value" />`,
  }),
};
export default meta;

type Story = StoryObj<InputComponent>;

export const Default: Story = {};
export const WithLeadingIcon: Story = {
  args: { leadingIcon: 'Search', placeholder: 'Buscar…', type: 'search' },
};
export const WithError: Story = { args: { error: 'Campo obrigatório' } };
export const Password: Story = { args: { label: 'Senha', type: 'password', placeholder: '••••••' } };
