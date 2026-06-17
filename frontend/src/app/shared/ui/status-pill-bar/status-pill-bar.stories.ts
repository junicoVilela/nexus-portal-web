import type { Meta, StoryObj } from '@storybook/angular';
import { StatusPillBarComponent, StatusPillItem } from './status-pill-bar.component';

type Status = 'RASCUNHO' | 'EM_REVISAO' | 'PUBLICADO' | 'ARQUIVADO';

const items: StatusPillItem<Status>[] = [
  { value: 'RASCUNHO', label: 'Rascunho', count: 12 },
  { value: 'EM_REVISAO', label: 'Em revisão', count: 4 },
  { value: 'PUBLICADO', label: 'Publicado', count: 36 },
  { value: 'ARQUIVADO', label: 'Arquivado', count: 8 },
];

const meta: Meta<StatusPillBarComponent<Status>> = {
  title: 'Shared/UI/StatusPillBar',
  component: StatusPillBarComponent,
  tags: ['autodocs'],
  args: { items, value: '', todosLabel: 'Todos', todosCount: 60 },
  render: args => ({
    props: args,
    template: `<ui-status-pill-bar
                 [items]="items"
                 [value]="value"
                 [todosLabel]="todosLabel"
                 [todosCount]="todosCount" />`,
  }),
};
export default meta;

type Story = StoryObj<StatusPillBarComponent<Status>>;

export const Todos: Story = {};
export const Publicado: Story = { args: { value: 'PUBLICADO' } };
export const SemCount: Story = {
  args: {
    items: items.map(i => ({ value: i.value, label: i.label })),
    todosCount: null,
  },
};
