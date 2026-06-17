import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { OfflineBannerComponent } from './offline-banner.component';

const meta: Meta<OfflineBannerComponent> = {
  title: 'Shared/UI/OfflineBanner',
  component: OfflineBannerComponent,
  tags: ['autodocs'],
  decorators: [applicationConfig({ providers: [lucideIconsProvider] })],
  render: () => ({
    template: `<ui-offline-banner />`,
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Mostra um banner quando o navegador detecta perda de conexão. Para visualizá-lo no Storybook, desligue a rede ou use DevTools (Network > Offline).',
      },
    },
  },
};
export default meta;

type Story = StoryObj<OfflineBannerComponent>;

export const Default: Story = {};
