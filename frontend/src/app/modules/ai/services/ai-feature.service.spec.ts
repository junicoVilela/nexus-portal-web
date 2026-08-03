import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AiAssistenteService } from './ai-assistente.service';
import { AiFeatureService } from './ai-feature.service';

describe('AiFeatureService', () => {
  let feature: AiFeatureService;
  let ai: jasmine.SpyObj<AiAssistenteService>;

  beforeEach(() => {
    ai = jasmine.createSpyObj<AiAssistenteService>('AiAssistenteService', ['status']);
    TestBed.configureTestingModule({
      providers: [AiFeatureService, { provide: AiAssistenteService, useValue: ai }],
    });
    feature = TestBed.inject(AiFeatureService);
  });

  it('disponivel=true quando backend enabled', () => {
    ai.status.and.returnValue(
      of({
        enabled: true,
        prontoParaGerar: false,
        provider: 'fake',
        model: 'x',
        mensagem: 'ok',
      }),
    );

    feature.ensureLoaded();

    expect(feature.disponivel()).toBeTrue();
    expect(feature.prontoParaGerar()).toBeFalse();
  });

  it('disponivel=false quando status falha', () => {
    ai.status.and.returnValue(throwError(() => ({ status: 503 })));

    feature.refresh().subscribe();

    expect(feature.disponivel()).toBeFalse();
    expect(feature.status()).toBeNull();
  });

  it('hydrate define disponivel sem HTTP', () => {
    feature.hydrate({
      enabled: true,
      prontoParaGerar: true,
      provider: 'openrouter',
      model: 'openai/gpt-4o-mini',
      mensagem: 'ok',
    });
    expect(feature.disponivel()).toBeTrue();
    expect(feature.ready()).toBeTrue();
  });
});
