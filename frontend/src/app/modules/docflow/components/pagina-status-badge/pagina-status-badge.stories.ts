import type { Meta, StoryObj } from '@storybook/angular';
import { PaginaStatusBadgeComponent } from './pagina-status-badge.component';

const meta: Meta<PaginaStatusBadgeComponent> = {
  title: 'DocFlow/PaginaStatusBadge',
  component: PaginaStatusBadgeComponent,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['RASCUNHO', 'EM_REVISAO', 'APROVADO', 'PUBLICADO', 'ARQUIVADO'],
    },
  },
  render: args => ({
    props: args,
    template: `<app-pagina-status-badge [status]="status" />`,
  }),
};
export default meta;

type Story = StoryObj<PaginaStatusBadgeComponent>;

export const Rascunho: Story = { args: { status: 'RASCUNHO' } };
export const EmRevisao: Story = { args: { status: 'EM_REVISAO' } };
