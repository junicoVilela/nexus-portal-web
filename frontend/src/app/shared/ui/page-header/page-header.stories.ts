import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { PageHeaderComponent } from './page-header.component';

const meta: Meta<PageHeaderComponent> = {
  title: 'Shared/UI/PageHeader',
  component: PageHeaderComponent,
  tags: ['autodocs'],
  decorators: [applicationConfig({ providers: [lucideIconsProvider] })],
  args: {
    title: 'Releases',
    subtitle: 'Gestão completa de versões e publicações',
    icon: 'Tag',
  },
  render: args => ({
    props: args,
    template: `<ui-page-header [title]="title" [subtitle]="subtitle" [icon]="icon" />`,
  }),
};
export default meta;

type Story = StoryObj<PageHeaderComponent>;

export const Default: Story = {};
export const NoIcon: Story = { args: { icon: null } };
export const NoSubtitle: Story = { args: { subtitle: null } };
