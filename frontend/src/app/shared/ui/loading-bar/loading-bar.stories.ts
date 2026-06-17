import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { signal } from '@angular/core';
import { LoadingBarComponent } from './loading-bar.component';
import { LoadingBarService } from './loading-bar.service';

class StubLoadingBarService {
  readonly active = signal(true);
  start(): void {
    this.active.set(true);
  }
  end(): void {
    this.active.set(false);
  }
}

const meta: Meta<LoadingBarComponent> = {
  title: 'Shared/UI/LoadingBar',
  component: LoadingBarComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({ providers: [{ provide: LoadingBarService, useClass: StubLoadingBarService }] }),
  ],
  render: () => ({
    template: `<div style="width:320px;border:1px solid var(--border);border-radius:8px;overflow:hidden">
                 <ui-loading-bar />
               </div>`,
  }),
};
export default meta;

type Story = StoryObj<LoadingBarComponent>;

export const Active: Story = {};
