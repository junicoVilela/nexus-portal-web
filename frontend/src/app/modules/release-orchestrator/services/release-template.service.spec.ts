import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReleaseTemplateService } from './release-template.service';
import { ReleaseTemplate } from '../models/release-template.model';

const BASE = '/api/v1/release-orchestrator/templates';

describe('ReleaseTemplateService', () => {
  let service: ReleaseTemplateService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReleaseTemplateService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReleaseTemplateService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar() sends query params and defaults items to []', done => {
    service.listar(2, 10, 'foo', true).subscribe(res => {
      expect(res.items).toEqual([]);
      done();
    });
    const req = http.expectOne(r => r.url === BASE);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('nome')).toBe('foo');
    expect(req.request.params.get('ativo')).toBe('true');
    req.flush({ totalItems: 0 });
  });

  it('buscarPorId() hits /templates/:id', () => {
    service.buscarPorId('t1').subscribe();
    http.expectOne(`${BASE}/t1`).flush({} as ReleaseTemplate);
  });

  it('criar() POSTs form to /templates', () => {
    service.criar({} as never).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush({} as ReleaseTemplate);
  });

  it('atualizar() PUTs to /templates/:id', () => {
    service.atualizar('t1', {} as never).subscribe();
    const req = http.expectOne(`${BASE}/t1`);
    expect(req.request.method).toBe('PUT');
    req.flush({} as ReleaseTemplate);
  });

  it('alterarStatus() PATCHes ativo', () => {
    service.alterarStatus('t1', false).subscribe();
    const req = http.expectOne(`${BASE}/t1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ ativo: false });
    req.flush({} as ReleaseTemplate);
  });

  it('excluir() DELETEs /templates/:id', () => {
    service.excluir('t1').subscribe();
    const req = http.expectOne(`${BASE}/t1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
