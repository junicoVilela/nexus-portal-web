import type { Meta, StoryObj } from '@storybook/angular';
import { BadgeComponent } from './badge.component';

const meta: Meta<BadgeComponent> = {
  title: 'Shared/UI/Badge',
  component: BadgeComponent,
  tags: ['autodocs'],
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'success', 'warn', 'danger', 'info', 'accent'] },
    dot: { control: 'boolean' },
  },
  args: { tone: 'neutral', dot: false },
  render: args => ({
    props: args,
    template: `<ui-badge [tone]="tone" [dot]="dot">Status</ui-badge>`,
  }),
};
export default meta;

type Story = StoryObj<BadgeComponent>;

export const Neutral: Story = { args: { tone: 'neutral' } };
export const Success: Story = { args: { tone: 'success' } };
export const Warn: Story = { args: { tone: 'warn' } };
export const Danger: Story = { args: { tone: 'danger' } };
export const Info: Story = { args: { tone: 'info' } };
export const Accent: Story = { args: { tone: 'accent' } };
export const WithDot: Story = { args: { tone: 'success', dot: true } };
