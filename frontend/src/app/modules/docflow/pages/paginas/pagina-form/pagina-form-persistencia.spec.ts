import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';

import { Pagina } from '@modules/docflow/models/pagina.model';
import { PaginaDraftService } from '@modules/docflow/services/pagina-draft.service';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { ConfirmService, ToastService } from '@shared/ui';
import { PaginaFormPersistencia, PaginaFormPersistenciaContexto } from './pagina-form-persistencia';

describe('PaginaFormPersistencia', () => {
  let persistencia: PaginaFormPersistencia;
  let paginaService: jasmine.SpyObj<PaginaService>;
  let confirm: jasmine.SpyObj<ConfirmService>;
  let ctx: jasmine.SpyObj<
    Pick<PaginaFormPersistenciaContexto, 'persistida' | 'ativada' | 'recarregada' | 'salva'>
  >;
  let atual: Pagina | undefined;
  const form = new FormGroup({ titulo: new FormControl('Pedidos', Validators.required) });

  beforeEach(() => {
    paginaService = jasmine.createSpyObj<PaginaService>('PaginaService', [
      'autosavePagina',
      'salvarPagina',
      'pagina',
    ]);
    confirm = jasmine.createSpyObj<ConfirmService>('ConfirmService', ['confirm']);
    TestBed.configureTestingModule({
      providers: [
        PaginaFormPersistencia,
        { provide: PaginaService, useValue: paginaService },
        { provide: ConfirmService, useValue: confirm },
        {
          provide: PaginaDraftService,
          useValue: jasmine.createSpyObj('PaginaDraftService', ['salvar', 'carregar', 'remover']),
        },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
      ],
    });
    persistencia = TestBed.inject(PaginaFormPersistencia);
    ctx = jasmine.createSpyObj('ctx', ['persistida', 'ativada', 'recarregada', 'salva']);
    atual = { id: 'p1', status: 'RASCUNHO', version: 3 } as Pagina;
    persistencia.configurar({
      ...ctx,
      form,
      paginaId: () => atual?.id,
      paginaAtual: () => atual,
      payload: () => ({ titulo: form.value.titulo ?? '', version: atual?.version }),
    });
  });

  it('autosave que chega durante um envio fica pendente e roda depois', async () => {
    const primeiro = new Subject<Pagina>();
    paginaService.autosavePagina.and.returnValues(primeiro, of({ ...atual!, version: 5 }));

    persistencia.autosalvarServidor();
    persistencia.autosalvarServidor();
    expect(paginaService.autosavePagina).toHaveBeenCalledTimes(1);

    primeiro.next({ ...atual!, version: 4 });
    await Promise.resolve();

    expect(paginaService.autosavePagina).toHaveBeenCalledTimes(2);
    expect(persistencia.autosaveStatus()).toBe('saved');
  });

  it('não faz autosave de página fora de rascunho', () => {
    atual = { ...atual!, status: 'APROVADO' };
    persistencia.autosalvarServidor();
    expect(paginaService.autosavePagina).not.toHaveBeenCalled();
  });

  it('sem rede o autosave fica offline; 409 vira conflito e bloqueia novos autosaves', () => {
    paginaService.autosavePagina.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    persistencia.autosalvarServidor();
    expect(persistencia.autosaveStatus()).toBe('offline');
    expect(persistencia.autosaveLabel()).toContain('backup local');

    paginaService.autosavePagina.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    persistencia.autosalvarServidor();
    expect(persistencia.autosaveStatus()).toBe('conflict');

    persistencia.autosalvarServidor();
    expect(paginaService.autosavePagina).toHaveBeenCalledTimes(2);
  });

  it('sobrescrever usa a versão atual do servidor e limpa o conflito', async () => {
    persistencia.conflitoMensagem.set('Alterada por outro usuário.');
    confirm.confirm.and.resolveTo(true);
    paginaService.pagina.and.returnValue(of({ ...atual!, version: 7 }));
    const salva = { ...atual!, version: 8 };
    paginaService.salvarPagina.and.returnValue(of(salva));

    await persistencia.sobrescreverConflito();

    expect(paginaService.salvarPagina).toHaveBeenCalledWith(jasmine.objectContaining({ version: 7 }), 'p1');
    expect(ctx.ativada).toHaveBeenCalledWith(salva);
    expect(persistencia.autosaveStatus()).toBe('saved');
    expect(persistencia.saving()).toBeFalse();
  });

  it('carregar a versão do servidor substitui o formulário e sai do conflito', async () => {
    persistencia.autosaveStatus.set('conflict');
    confirm.confirm.and.resolveTo(true);
    const servidor = { ...atual!, version: 9 };
    paginaService.pagina.and.returnValue(of(servidor));

    await persistencia.usarVersaoServidor();

    expect(ctx.recarregada).toHaveBeenCalledWith(servidor);
    expect(persistencia.autosaveStatus()).toBe('idle');
  });

  it('prévia com tudo salvo não grava de novo', async () => {
    expect(await persistencia.sincronizarParaPreview()).toBe(atual);
    expect(paginaService.autosavePagina).not.toHaveBeenCalled();
  });

  it('salvar explícito entrega a página e o destino ao editor', () => {
    const salva = { ...atual!, version: 4 };
    paginaService.salvarPagina.and.returnValue(of(salva));
    persistencia.marcarAlterado();

    persistencia.salvar('continuar');

    expect(ctx.salva).toHaveBeenCalledWith(salva, 'continuar');
    expect(persistencia.hasUnsavedChanges()).toBeFalse();
  });
});
