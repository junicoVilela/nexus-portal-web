import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { SwitchComponent } from './switch.component';

const meta: Meta<SwitchComponent> = {
  title: 'Shared/UI/Switch',
  component: SwitchComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [FormsModule] })],
  args: { label: 'Modo escuro' },
  render: args => ({
    props: { ...args, value: false },
    template: `<ui-switch [label]="label" [(ngModel)]="value" />`,
  }),
};
export default meta;

type Story = StoryObj<SwitchComponent>;

export const Default: Story = {};
export const NoLabel: Story = { args: { label: null } };
