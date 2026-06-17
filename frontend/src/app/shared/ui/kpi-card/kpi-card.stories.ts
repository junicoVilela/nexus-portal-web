import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { KpiCardComponent } from './kpi-card.component';

const meta: Meta<KpiCardComponent> = {
  title: 'Shared/UI/KpiCard',
  component: KpiCardComponent,
  tags: ['autodocs'],
  decorators: [applicationConfig({ providers: [lucideIconsProvider] })],
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'green', 'blue', 'amber', 'purple', 'red'] },
  },
  args: { label: 'Releases publicadas', valor: 42, icon: 'CheckCircle', tone: 'green' },
  render: args => ({
    props: args,
    template: `<ui-kpi-card [label]="label" [valor]="valor" [icon]="icon" [tone]="tone" />`,
  }),
};
export default meta;

type Story = StoryObj<KpiCardComponent>;

export const Neutral: Story = { args: { tone: 'neutral', icon: 'List' } };
export const Green: Story = {};
export const Blue: Story = { args: { tone: 'blue', icon: 'Code', label: 'Em desenvolvimento' } };
export const Amber: Story = { args: { tone: 'amber', icon: 'Clock', label: 'Em revisão' } };
export const Purple: Story = { args: { tone: 'purple', icon: 'List', label: 'Itens registrados' } };
export const Red: Story = { args: { tone: 'red', icon: 'AlertTriangle', label: 'Falhas hoje' } };
export const SemIcone: Story = { args: { icon: null, label: 'Total', valor: '128' } };
