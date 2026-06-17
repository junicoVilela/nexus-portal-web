import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { TooltipDirective } from './tooltip.directive';

const meta: Meta = {
  title: 'Shared/UI/TooltipDirective',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [TooltipDirective] })],
  render: () => ({
    template: `<button [uiTooltip]="'Salva a release atual sem publicar'"
                       style="height:36px;padding:0 14px;border-radius:6px;
                              background:var(--accent);color:#fff;border:none;cursor:pointer">
                 Passe o mouse aqui
               </button>`,
  }),
  parameters: {
    docs: {
      description: {
        component: 'Diretiva que define `title` e `aria-label` no elemento host.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {};
