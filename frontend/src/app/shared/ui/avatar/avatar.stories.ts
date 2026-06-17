import type { Meta, StoryObj } from '@storybook/angular';
import { AvatarComponent } from './avatar.component';

const meta: Meta<AvatarComponent> = {
  title: 'Shared/UI/Avatar',
  component: AvatarComponent,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    gradient: { control: 'boolean' },
  },
  args: { name: 'Valdemir Junior', size: 'md', gradient: true },
  render: args => ({
    props: args,
    template: `<ui-avatar [name]="name" [src]="src" [size]="size" [gradient]="gradient" />`,
  }),
};
export default meta;

type Story = StoryObj<AvatarComponent>;

export const Default: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const Large: Story = { args: { size: 'lg' } };
export const NoGradient: Story = { args: { gradient: false } };
export const SingleName: Story = { args: { name: 'Maria' } };
export const Anonymous: Story = { args: { name: '' } };
