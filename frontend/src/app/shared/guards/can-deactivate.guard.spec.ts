import { TestBed } from '@angular/core/testing';
import { ConfirmService } from '@shared/ui';
import { canDeactivateGuard, CanDeactivateComponent } from './can-deactivate.guard';

class ConfirmStub {
  result = true;
  lastOpts: { title?: string; message?: string } | null = null;
  confirm(opts: { title?: string; message?: string }): Promise<boolean> {
    this.lastOpts = opts;
    return Promise.resolve(this.result);
  }
}

describe('canDeactivateGuard', () => {
  let confirm: ConfirmStub;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ConfirmService, useClass: ConfirmStub }],
    });
    confirm = TestBed.inject(ConfirmService) as unknown as ConfirmStub;
  });

  it('returns true synchronously when there are no unsaved changes', async () => {
    const comp: CanDeactivateComponent = { hasUnsavedChanges: () => false };
    const r = await TestBed.runInInjectionContext(() =>
      Promise.resolve(canDeactivateGuard(comp, null as never, null as never, null as never)),
    );
    expect(r).toBe(true);
  });

  it('asks for confirmation and resolves true when user accepts', async () => {
    confirm.result = true;
    const comp: CanDeactivateComponent = { hasUnsavedChanges: () => true };
    const r = await TestBed.runInInjectionContext(() =>
      Promise.resolve(canDeactivateGuard(comp, null as never, null as never, null as never)),
    );
    expect(r).toBe(true);
    expect(confirm.lastOpts?.title).toBe('Sair sem salvar?');
  });

  it('returns false when user keeps editing', async () => {
    confirm.result = false;
    const comp: CanDeactivateComponent = { hasUnsavedChanges: () => true };
    const r = await TestBed.runInInjectionContext(() =>
      Promise.resolve(canDeactivateGuard(comp, null as never, null as never, null as never)),
    );
    expect(r).toBe(false);
  });

  it('includes unsavedChangesDescription in the message when provided', async () => {
    confirm.result = true;
    const comp: CanDeactivateComponent = {
      hasUnsavedChanges: () => true,
      unsavedChangesDescription: () => 'Conteúdo da página, anexos',
    };
    await TestBed.runInInjectionContext(() =>
      Promise.resolve(canDeactivateGuard(comp, null as never, null as never, null as never)),
    );
    expect(confirm.lastOpts?.message).toContain('Conteúdo da página, anexos');
  });
});
