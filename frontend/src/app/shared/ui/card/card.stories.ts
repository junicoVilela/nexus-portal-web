import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CardComponent } from './card.component';

const meta: Meta<CardComponent> = {
  title: 'Shared/UI/Card',
  component: CardComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [CardComponent] })],
  argTypes: {
    padding: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
    interactive: { control: 'boolean' },
  },
  args: { padding: 'md', interactive: false },
  render: args => ({
    props: args,
    template: `<ui-card [padding]="padding" [interactive]="interactive" style="width:320px">
                 <h3 style="margin:0 0 8px;font-weight:600">Título do card</h3>
                 <p style="margin:0;color:var(--text-muted)">Conteúdo do card, pode ser qualquer node Angular projetado.</p>
               </ui-card>`,
  }),
};
export default meta;

type Story = StoryObj<CardComponent>;

export const Default: Story = {};
export const SmallPadding: Story = { args: { padding: 'sm' } };
export const NoPadding: Story = { args: { padding: 'none' } };
export const Interactive: Story = { args: { interactive: true } };
