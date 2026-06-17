import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmService } from '@shared/ui';

export interface CanDeactivateComponent {
  hasUnsavedChanges(): boolean;
  /** Opcional: descrição contextual do que será perdido (ex: "Conteúdo da página, anexos"). */
  unsavedChangesDescription?(): string | null;
}

export const canDeactivateGuard: CanDeactivateFn<CanDeactivateComponent> = async component => {
  if (!component?.hasUnsavedChanges?.()) return true;
  const confirmService = inject(ConfirmService);
  const detalhe = component.unsavedChangesDescription?.();
  return confirmService.confirm({
    title: 'Sair sem salvar?',
    message: detalhe
      ? `Você tem alterações não salvas em: ${detalhe}. Se sair agora, elas serão perdidas.`
      : 'Você tem alterações não salvas. Se sair agora, elas serão perdidas.',
    acceptLabel: 'Sair sem salvar',
    rejectLabel: 'Continuar editando',
    variant: 'danger',
    icon: 'AlertTriangle',
  });
};
