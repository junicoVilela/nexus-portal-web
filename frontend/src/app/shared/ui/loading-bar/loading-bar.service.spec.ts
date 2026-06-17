import { LoadingBarService } from './loading-bar.service';

describe('LoadingBarService', () => {
  let service: LoadingBarService;

  beforeEach(() => {
    service = new LoadingBarService();
  });

  it('começa inativo', () => {
    expect(service.active()).toBe(false);
  });

  it('ativa após start()', () => {
    service.start();
    expect(service.active()).toBe(true);
  });

  it('mantém ativo enquanto houver requests pendentes', () => {
    service.start();
    service.start();
    service.end();
    expect(service.active()).toBe(true);
    service.end();
    expect(service.active()).toBe(false);
  });

  it('end() sem start é no-op (não vai abaixo de 0)', () => {
    service.end();
    expect(service.active()).toBe(false);
  });
});
