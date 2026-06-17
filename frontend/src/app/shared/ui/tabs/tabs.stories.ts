import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { TabsComponent } from './tabs.component';

const meta: Meta<TabsComponent> = {
  title: 'Shared/UI/Tabs',
  component: TabsComponent,
  tags: ['autodocs'],
  decorators: [applicationConfig({ providers: [lucideIconsProvider] })],
  args: {
    items: [
      { id: 'visao', label: 'Visão geral', icon: 'List' },
      { id: 'itens', label: 'Itens', count: 12 },
      { id: 'revisoes', label: 'Revisões' },
      { id: 'historico', label: 'Histórico' },
    ],
    active: 'visao',
  },
  render: args => ({
    props: args,
    template: `<ui-tabs [items]="items" [active]="active"></ui-tabs>`,
  }),
};
export default meta;

type Story = StoryObj<TabsComponent>;

export const Default: Story = {};
export const ItensActive: Story = { args: { active: 'itens' } };
