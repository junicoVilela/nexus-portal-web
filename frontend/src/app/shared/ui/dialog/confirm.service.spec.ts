import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  let service: ConfirmService;
  let dialogSpy: jasmine.SpyObj<Dialog>;

  beforeEach(() => {
    dialogSpy = jasmine.createSpyObj<Dialog>('Dialog', ['open']);
    TestBed.configureTestingModule({
      providers: [ConfirmService, { provide: Dialog, useValue: dialogSpy }],
    });
    service = TestBed.inject(ConfirmService);
  });

  it('abre o dialog com os dados informados', async () => {
    dialogSpy.open.and.returnValue({ closed: of(true) } as never);
    await service.confirm({ title: 'Excluir?', message: 'Tem certeza?' });
    const call = dialogSpy.open.calls.mostRecent();
    expect(call.args[1]?.data).toEqual({ title: 'Excluir?', message: 'Tem certeza?' });
  });

  it('resolve com true quando o dialog fecha com true', async () => {
    dialogSpy.open.and.returnValue({ closed: of(true) } as never);
    expect(await service.confirm({ title: 't', message: 'm' })).toBe(true);
  });

  it('resolve com false para qualquer outro valor (cancel/undefined)', async () => {
    dialogSpy.open.and.returnValue({ closed: of(false) } as never);
    expect(await service.confirm({ title: 't', message: 'm' })).toBe(false);
    dialogSpy.open.and.returnValue({ closed: of(undefined) } as never);
    expect(await service.confirm({ title: 't', message: 'm' })).toBe(false);
  });
});
