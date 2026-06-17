import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReleaseItemService } from './release-item.service';
import { ReleaseItem } from '../models/release-item.model';

const BASE = '/api/v1/release-orchestrator/releases';

describe('ReleaseItemService', () => {
  let service: ReleaseItemService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReleaseItemService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReleaseItemService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar() sorts items by ordem ascending', done => {
    service.listar('r1').subscribe(items => {
      expect(items.map(i => i.id)).toEqual(['b', 'a', 'c']);
      done();
    });
    const req = http.expectOne(`${BASE}/r1/itens`);
    req.flush([
      { id: 'a', ordem: 5 },
      { id: 'b', ordem: 1 },
      { id: 'c', ordem: 10 },
    ] as ReleaseItem[]);
  });

  it('listar() handles null response as []', done => {
    service.listar('r1').subscribe(items => {
      expect(items).toEqual([]);
      done();
    });
    http.expectOne(`${BASE}/r1/itens`).flush(null);
  });

  it('criar() POSTs to /itens', () => {
    service.criar('r1', {} as never).subscribe();
    const req = http.expectOne(`${BASE}/r1/itens`);
    expect(req.request.method).toBe('POST');
    req.flush({} as ReleaseItem);
  });

  it('atualizar() PUTs to /itens/:id', () => {
    service.atualizar('r1', 'i1', {} as never).subscribe();
    const req = http.expectOne(`${BASE}/r1/itens/i1`);
    expect(req.request.method).toBe('PUT');
    req.flush({} as ReleaseItem);
  });

  it('remover() DELETEs /itens/:id', () => {
    service.remover('r1', 'i1').subscribe();
    const req = http.expectOne(`${BASE}/r1/itens/i1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('reordenar() PUTs ordens array', () => {
    const ordens = [
      { id: 'a', ordem: 0 },
      { id: 'b', ordem: 1 },
    ];
    service.reordenar('r1', ordens).subscribe();
    const req = http.expectOne(`${BASE}/r1/itens/reordenar`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ ordens });
    req.flush(null);
  });

  it('duplicar() POSTs to /itens/:id/duplicar', () => {
    service.duplicar('r1', 'i1').subscribe();
    const req = http.expectOne(`${BASE}/r1/itens/i1/duplicar`);
    expect(req.request.method).toBe('POST');
    req.flush({} as ReleaseItem);
  });
});
