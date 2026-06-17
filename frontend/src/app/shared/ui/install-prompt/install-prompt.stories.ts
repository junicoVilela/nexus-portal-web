import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { signal } from '@angular/core';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { InstallPromptComponent } from './install-prompt.component';
import { InstallPromptService } from './install-prompt.service';

class StubInstallPromptService {
  readonly available = signal(true);
  readonly installing = signal(false);
  async install(): Promise<void> {
    this.installing.set(true);
    setTimeout(() => {
      this.installing.set(false);
      this.available.set(false);
    }, 600);
  }
  dismiss(): void {
    this.available.set(false);
  }
}

const meta: Meta<InstallPromptComponent> = {
  title: 'Shared/UI/InstallPrompt',
  component: InstallPromptComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [lucideIconsProvider, { provide: InstallPromptService, useClass: StubInstallPromptService }],
    }),
  ],
  render: () => ({
    template: `<ui-install-prompt />`,
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Banner sutil que aparece quando o navegador dispara `beforeinstallprompt`. Em produção, fica oculto até o evento ser emitido. Aqui é mostrado via stub.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<InstallPromptComponent>;

export const Disponivel: Story = {};
