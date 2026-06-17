import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { ButtonComponent } from './button.component';

const meta: Meta<ButtonComponent> = {
  title: 'Shared/UI/Button',
  component: ButtonComponent,
  tags: ['autodocs'],
  decorators: [applicationConfig({ providers: [lucideIconsProvider] })],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    icon: { control: 'text' },
    iconPosition: { control: 'select', options: ['leading', 'trailing'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
  args: {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    fullWidth: false,
  },
  render: args => ({
    props: args,
    template: `<ui-button [variant]="variant" [size]="size" [icon]="icon" [iconPosition]="iconPosition"
                          [loading]="loading" [disabled]="disabled" [fullWidth]="fullWidth">
                 Acionar
               </ui-button>`,
  }),
};
export default meta;

type Story = StoryObj<ButtonComponent>;

export const Primary: Story = { args: { variant: 'primary', icon: 'Plus' } };
export const Secondary: Story = { args: { variant: 'secondary', icon: 'Pencil' } };
export const Ghost: Story = { args: { variant: 'ghost', icon: 'X' } };
export const Danger: Story = { args: { variant: 'danger', icon: 'Trash2' } };
export const Loading: Story = { args: { variant: 'primary', loading: true } };
export const Disabled: Story = { args: { variant: 'primary', disabled: true } };
export const Small: Story = { args: { size: 'sm', icon: 'Check' } };
export const Large: Story = { args: { size: 'lg', icon: 'ArrowRight', iconPosition: 'trailing' } };
