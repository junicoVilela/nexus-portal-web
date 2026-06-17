import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { EmptyStateComponent } from './empty-state.component';

const meta: Meta<EmptyStateComponent> = {
  title: 'Shared/UI/EmptyState',
  component: EmptyStateComponent,
  tags: ['autodocs'],
  decorators: [applicationConfig({ providers: [lucideIconsProvider] })],
  argTypes: {
    illustration: { control: 'select', options: ['none', 'inbox', 'search', 'list', 'success', 'document'] },
    icon: { control: 'text' },
  },
  args: {
    title: 'Nenhum item encontrado',
    description: 'Ajuste os filtros ou cadastre o primeiro registro.',
    illustration: 'list',
    icon: 'Inbox',
  },
  render: args => ({
    props: args,
    template: `<ui-empty-state [title]="title" [description]="description"
                               [illustration]="illustration" [icon]="icon" />`,
  }),
};
export default meta;

type Story = StoryObj<EmptyStateComponent>;

export const Inbox: Story = { args: { illustration: 'inbox' } };
export const Search: Story = { args: { illustration: 'search', title: 'Nenhum resultado para a busca' } };
export const List: Story = { args: { illustration: 'list' } };
export const Document: Story = { args: { illustration: 'document' } };
export const Success: Story = { args: { illustration: 'success', title: 'Tudo certo!' } };
export const IconOnly: Story = { args: { illustration: 'none', icon: 'Tag' } };
