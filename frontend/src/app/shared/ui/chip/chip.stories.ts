import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { ChipComponent } from './chip.component';

const meta: Meta<ChipComponent> = {
  title: 'Shared/UI/Chip',
  component: ChipComponent,
  tags: ['autodocs'],
  decorators: [applicationConfig({ providers: [lucideIconsProvider] })],
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'accent', 'success', 'warn', 'danger'] },
    removable: { control: 'boolean' },
  },
  args: { tone: 'neutral', removable: false },
  render: args => ({
    props: args,
    template: `<ui-chip [tone]="tone" [removable]="removable">Filtro ativo</ui-chip>`,
  }),
};
export default meta;

type Story = StoryObj<ChipComponent>;

export const Neutral: Story = { args: { tone: 'neutral' } };
export const Accent: Story = { args: { tone: 'accent' } };
export const Success: Story = { args: { tone: 'success' } };
export const Warn: Story = { args: { tone: 'warn' } };
export const Danger: Story = { args: { tone: 'danger' } };
export const Removable: Story = { args: { tone: 'accent', removable: true } };
