import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { AiProposta } from '@modules/docflow/models/ai-proposta.model';
import { AiAssistenteService } from '@modules/docflow/services/ai-assistente.service';
import { AiImagensStagingService } from '@modules/docflow/services/ai-imagens-staging.service';
import { PaginaFormIa } from './pagina-form-ia';

describe('PaginaFormIa', () => {
  let ia: PaginaFormIa;
  let ai: jasmine.SpyObj<AiAssistenteService>;
  let router: jasmine.SpyObj<Router>;
  let origem: string | null;
  const estadoOriginal = history.state;

  beforeEach(() => {
    ai = jasmine.createSpyObj<AiAssistenteService>('AiAssistenteService', ['vincularPagina']);
    ai.vincularPagina.and.returnValue(of({} as AiProposta));
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'getCurrentNavigation']);
    router.getCurrentNavigation.and.returnValue(null);
    origem = null;
    TestBed.configureTestingModule({
      providers: [
        PaginaFormIa,
        AiImagensStagingService,
        { provide: AiAssistenteService, useValue: ai },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get queryParamMap() {
                return convertToParamMap(origem ? { origem } : {});
              },
            },
          },
        },
      ],
    });
    ia = TestBed.inject(PaginaFormIa);
  });

  afterEach(() => history.replaceState(estadoOriginal, ''));

  it('consome a proposta do histórico uma única vez', () => {
    history.replaceState({ origem: 'ai', proposta: { sessaoId: 's1', titulo: 'Consulta' } }, '');
    expect(ia.consumirProposta()?.titulo).toBe('Consulta');
    expect(history.state?.['proposta']).toBeUndefined();
    expect(ia.consumirProposta()).toBeNull();
  });

  it('vincula a página à sessão da proposta só na primeira vez', () => {
    history.replaceState({ origem: 'ai', proposta: { sessaoId: 's1' } }, '');
    ia.consumirProposta();
    ia.vincularPagina('pag-1');
    ia.vincularPagina('pag-1');
    expect(ai.vincularPagina).toHaveBeenCalledOnceWith('s1', 'pag-1');
  });

  it('sem proposta não vincula nada', () => {
    ia.vincularPagina('pag-1');
    expect(ai.vincularPagina).not.toHaveBeenCalled();
  });

  it('?origem=ia sem proposta leva ao assistente', () => {
    origem = 'ia';
    expect(ia.redirecionarSeOrigemIa()).toBeTrue();
    expect(router.navigate).toHaveBeenCalled();
  });
});
