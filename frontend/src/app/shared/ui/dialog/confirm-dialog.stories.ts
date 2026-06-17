import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { lucideIconsProvider } from '@sb/lucide-icons';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

function stubDialog(data: ConfirmDialogData) {
  return {
    providers: [
      lucideIconsProvider,
      { provide: DIALOG_DATA, useValue: data },
      { provide: DialogRef, useValue: { close: () => undefined } },
    ],
  };
}

const meta: Meta<ConfirmDialogComponent> = {
  title: 'Shared/UI/ConfirmDialog',
  component: ConfirmDialogComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Modal de confirmação aberto via `ConfirmService.confirm()`. Aqui é renderizado isolado para demonstração.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<ConfirmDialogComponent>;

export const Padrao: Story = {
  decorators: [
    applicationConfig(
      stubDialog({ title: 'Confirmar ação?', message: 'Tem certeza que deseja prosseguir?' }),
    ),
  ],
};

export const Destrutivo: Story = {
  decorators: [
    applicationConfig(
      stubDialog({
        title: 'Excluir release?',
        message: 'Esta ação não pode ser desfeita.',
        acceptLabel: 'Excluir',
        variant: 'danger',
        icon: 'Trash2',
      }),
    ),
  ],
};
