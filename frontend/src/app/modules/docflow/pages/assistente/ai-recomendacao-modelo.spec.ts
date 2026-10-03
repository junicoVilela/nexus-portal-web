import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject, of } from 'rxjs';

import { AiComponenteCandidato, AiTemplateRecomendacao } from '../../models/ai-template-recomendacao.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { AiBriefingValor, AiRecomendacaoModelo } from './ai-recomendacao-modelo';

describe('AiRecomendacaoModelo', () => {
  let ai: jasmine.SpyObj<AiAssistenteService>;
  let modelo: AiRecomendacaoModelo;

  const componente = (id: string, obrigatorio = false) => ({ id, obrigatorio }) as AiComponenteCandidato;
  const recomendacao = (componentes: AiComponenteCandidato[]) =>
    ({
      recomendado: null,
      candidatos: [],
      exigeConfirmacao: false,
      componentes,
    }) as unknown as AiTemplateRecomendacao;

  beforeEach(() => {
    ai = jasmine.createSpyObj<AiAssistenteService>('AiAssistenteService', ['recomendarTemplate']);
    TestBed.configureTestingModule({
      providers: [AiRecomendacaoModelo, { provide: AiAssistenteService, useValue: ai }],
    });
    modelo = TestBed.inject(AiRecomendacaoModelo);
  });

  it('seleciona os componentes sugeridos', () => {
    modelo.aplicar(recomendacao([componente('a'), componente('b'), componente('c')]));
    expect(modelo.componentesSelecionados()).toEqual(['a', 'b', 'c']);
  });

  it('componentes da página importada prevalecem sobre a sugestão', () => {
    modelo.usarComponentesImportados(['x', 'y', 'z']);
    modelo.aplicar(recomendacao([componente('a')]));
    expect(modelo.componentesSelecionados()).toEqual(['x', 'y', 'z']);

    modelo.aplicar(recomendacao([componente('a'), componente('b'), componente('c')]));
    expect(modelo.componentesSelecionados()).toEqual(['a', 'b', 'c']);
  });

  it('composição exige os obrigatórios e pelo menos três componentes', () => {
    modelo.aplicar(recomendacao([componente('intro', true), componente('b'), componente('c')]));
    expect(modelo.composicaoValida()).toBeTrue();
    modelo.selecionar(['b', 'c', 'd']);
    expect(modelo.composicaoValida()).toBeFalse();
    modelo.selecionar(['intro', 'b']);
    expect(modelo.composicaoValida()).toBeFalse();
  });

  it('recomenda após pausa na digitação, com o escopo atual', fakeAsync(() => {
    ai.recomendarTemplate.and.returnValue(of(recomendacao([])));
    const valores = new Subject<AiBriefingValor>();
    const sub = modelo.observar(valores, () => ({ projetoId: 'p1', clienteId: null }));

    valores.next({ briefing: 'curto' });
    tick(500);
    expect(ai.recomendarTemplate).not.toHaveBeenCalled();

    valores.next({ briefing: 'Consulta de pedidos com filtros e exportação', templateId: '' });
    tick(200);
    valores.next({ briefing: 'Consulta de pedidos com filtros e exportação CSV', templateId: '' });
    tick(500);
    expect(ai.recomendarTemplate).toHaveBeenCalledOnceWith({
      briefing: 'Consulta de pedidos com filtros e exportação CSV',
      projetoId: 'p1',
      clienteId: null,
      templateId: null,
    });
    expect(modelo.carregando()).toBeFalse();
    sub.unsubscribe();
  }));
});
