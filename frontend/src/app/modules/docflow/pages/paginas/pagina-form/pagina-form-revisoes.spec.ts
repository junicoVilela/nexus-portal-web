import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PaginaRevisao } from '@modules/docflow/models/pagina.model';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { PageResult } from '@shared/models/page-result.model';
import { ToastService } from '@shared/ui';
import { PaginaFormRevisoes } from './pagina-form-revisoes';

describe('PaginaFormRevisoes', () => {
  let historico: PaginaFormRevisoes;
  let pagina: jasmine.SpyObj<PaginaService>;
  let estadoMudou: jasmine.Spy;
  let paginaId: string | undefined;

  beforeEach(() => {
    pagina = jasmine.createSpyObj<PaginaService>('PaginaService', ['listarRevisoesPagina']);
    pagina.listarRevisoesPagina.and.returnValue(
      of({
        items: [
          { numero: 2, conteudoHtml: '<p>Filtre por período.</p>' } as PaginaRevisao,
          { numero: 1, conteudoHtml: '<p>Filtre.</p>' } as PaginaRevisao,
        ],
        totalItems: 2,
        page: 1,
        size: 10,
      } as PageResult<PaginaRevisao>),
    );
    TestBed.configureTestingModule({
      providers: [
        PaginaFormRevisoes,
        { provide: PaginaService, useValue: pagina },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['error']) },
      ],
    });
    historico = TestBed.inject(PaginaFormRevisoes);
    estadoMudou = jasmine.createSpy('estadoMudou');
    paginaId = 'pag-1';
    historico.configurar({ paginaId: () => paginaId, estadoMudou });
  });

  it('página nova não consulta histórico', () => {
    paginaId = undefined;
    historico.carregar();
    expect(pagina.listarRevisoesPagina).not.toHaveBeenCalled();
  });

  it('ordenar inverte a direção no mesmo campo, volta à página 1 e atualiza a URL', () => {
    historico.alterarPagina(3);
    historico.ordenar('numero');
    expect(historico.revisoesDir()).toBe('ASC');
    expect(pagina.listarRevisoesPagina).toHaveBeenCalledWith('pag-1', 1, 10, 'numero', 'ASC');
    expect(estadoMudou).toHaveBeenCalled();
  });

  it('diff compara as duas revisões mais recentes', async () => {
    historico.carregar();
    await historico.alternarDiff();
    expect(historico.showDiff()).toBeTrue();
    expect(historico.diffConteudoAnterior()).toBe('<p>Filtre.</p>');
    expect(historico.diffConteudoAtual()).toBe('<p>Filtre por período.</p>');
    await historico.alternarDiff();
    expect(historico.diffConteudoAtual()).toBe('');
  });
});
