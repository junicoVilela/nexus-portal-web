import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { ErrorStateComponent } from './error-state.component';

const meta: Meta<ErrorStateComponent> = {
  title: 'Shared/UI/ErrorState',
  component: ErrorStateComponent,
  tags: ['autodocs'],
  decorators: [applicationConfig({ providers: [lucideIconsProvider] })],
  argTypes: {
    variant: { control: 'select', options: ['network', 'permission', 'notfound', 'server', 'generic'] },
    showRetry: { control: 'boolean' },
  },
  args: { variant: 'generic', showRetry: true, retryLabel: 'Tentar novamente' },
  render: args => ({
    props: args,
    template: `<ui-error-state [variant]="variant" [title]="title" [description]="description"
                               [showRetry]="showRetry" [retryLabel]="retryLabel" />`,
  }),
};
export default meta;

type Story = StoryObj<ErrorStateComponent>;

export const Generic: Story = { args: { variant: 'generic' } };
export const Network: Story = { args: { variant: 'network' } };
export const Permission: Story = { args: { variant: 'permission' } };
export const NotFound: Story = { args: { variant: 'notfound' } };
export const Server: Story = { args: { variant: 'server' } };
export const CustomMessage: Story = {
  args: {
    variant: 'server',
    title: 'Indisponível',
    description: 'O serviço de releases está em manutenção até as 14h.',
  },
};
export const NoRetry: Story = { args: { variant: 'permission', showRetry: false } };
