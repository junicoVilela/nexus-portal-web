import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { CheckboxComponent } from './checkbox.component';

const meta: Meta<CheckboxComponent> = {
  title: 'Shared/UI/Checkbox',
  component: CheckboxComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({ providers: [lucideIconsProvider] }),
    moduleMetadata({ imports: [FormsModule] }),
  ],
  args: { label: 'Aceito os termos' },
  render: args => ({
    props: { ...args, value: false },
    template: `<ui-checkbox [label]="label" [(ngModel)]="value" />`,
  }),
};
export default meta;

type Story = StoryObj<CheckboxComponent>;

export const Default: Story = {};
export const NoLabel: Story = { args: { label: null } };
