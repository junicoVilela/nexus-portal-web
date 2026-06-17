import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { BreadcrumbComponent } from './breadcrumb.component';

const meta: Meta<BreadcrumbComponent> = {
  title: 'Shared/UI/Breadcrumb',
  component: BreadcrumbComponent,
  tags: ['autodocs'],
  decorators: [applicationConfig({ providers: [lucideIconsProvider, provideRouter([])] })],
  args: {
    items: [
      { label: 'Home', route: '/' },
      { label: 'Release Orchestrator', route: '/release-orchestrator' },
      { label: 'Releases' },
    ],
  },
  render: args => ({
    props: args,
    template: `<ui-breadcrumb [items]="items" />`,
  }),
};
export default meta;

type Story = StoryObj<BreadcrumbComponent>;

export const Default: Story = {};
export const TwoLevels: Story = { args: { items: [{ label: 'Home', route: '/' }, { label: 'Atual' }] } };
