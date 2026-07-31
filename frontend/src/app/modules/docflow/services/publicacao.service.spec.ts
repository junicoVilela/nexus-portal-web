import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PublicacaoService } from './publicacao.service';
import { Publicacao } from '../models/publicacao.model';

const BASE = '/api/doc-flow';
const GENERATED_BASE = '/api/v1/docflow';

describe('PublicacaoService', () => {
  let service: PublicacaoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PublicacaoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PublicacaoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarPublicacoes() sends clienteId, status + paging', fakeAsync(() => {
    service.listarPublicacoes({ clienteId: 'c1', status: 'ERRO', page: 2, size: 5 }).subscribe();
    tick();
    const req = http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/publicacoes`));
    expect(req.request.url).toContain('clienteId=c1');
    expect(req.request.url).toContain('status=ERRO');
    expect(req.request.url).toContain('page=2');
    req.flush({ items: [], totalItems: 0, page: 2, size: 5, totalPages: 0, first: false, last: true });
    tick();
  }));

  it('publicacaoPorId() hits /publicacoes/:id', fakeAsync(() => {
    service.publicacaoPorId('p1').subscribe();
    tick();
    http.expectOne(`${GENERATED_BASE}/publicacoes/p1`).flush({ id: 'p1' } as Publicacao);
    tick();
  }));

  it('previewPublicacao() sets clienteId param', fakeAsync(() => {
    service.previewPublicacao('c1').subscribe();
    tick();
    const req = http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/publicacoes/preview`));
    expect(req.request.url).toContain('clienteId=c1');
    req.flush([]);
    tick();
  }));

  it('previewPublicacaoHtml() sends versao when provided', fakeAsync(() => {
    service.previewPublicacaoHtml('c1', '1.2').subscribe();
    tick();
    const req = http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/publicacoes/preview-html`));
    expect(req.request.url).toContain('versao=1.2');
    req.flush('<html />');
    tick();
  }));

  it('previewPublicacaoHtml() omits versao when undefined', fakeAsync(() => {
    service.previewPublicacaoHtml('c1').subscribe();
    tick();
    const req = http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/publicacoes/preview-html`));
    expect(req.request.url).not.toContain('versao=');
    req.flush('<html />');
    tick();
  }));

  it('diagnosticoPublicacao() sets clienteId param', fakeAsync(() => {
    service.diagnosticoPublicacao('c1').subscribe();
    tick();
    const req = http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/publicacoes/diagnostico`));
    expect(req.request.url).toContain('clienteId=c1');
    req.flush([]);
    tick();
  }));

  it('gerarPublicacao() POSTs payload to /publicacoes', fakeAsync(() => {
    service.gerarPublicacao({ clienteId: 'c1', versao: '1.0', observacao: 'ok' }).subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/publicacoes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ clienteId: 'c1', versao: '1.0', observacao: 'ok' });
    req.flush({} as Publicacao);
    tick();
  }));

  it('reprocessarPublicacao() POSTs to /reprocessar', fakeAsync(() => {
    service.reprocessarPublicacao('p1').subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/publicacoes/p1/reprocessar`);
    expect(req.request.method).toBe('POST');
    req.flush({} as Publicacao);
    tick();
  }));

  it('reprocessarPublicacoes() POSTs ids to the bulk endpoint', () => {
    service.reprocessarPublicacoes(['p1', 'p2']).subscribe();
    const req = http.expectOne(`${BASE}/publicacoes/reprocessar-lote`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ ids: ['p1', 'p2'] });
    req.flush({ solicitadas: 2, reprocessadas: 2, ignoradas: 0, publicacoes: [] });
  });

  it('excluirPublicacao() DELETEs /publicacoes/:id', fakeAsync(() => {
    service.excluirPublicacao('p1').subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/publicacoes/p1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    tick();
  }));

  it('baixarPublicacao() uses responseType blob', () => {
    service.baixarPublicacao('p1').subscribe();
    const req = http.expectOne(`${BASE}/publicacoes/p1/download`);
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('downloadUrl() returns canonical URL', () => {
    expect(service.downloadUrl('p1')).toBe(`${BASE}/publicacoes/p1/download`);
  });

  it('tokenDownloadPacote() hits /download-token', fakeAsync(() => {
    service.tokenDownloadPacote('p1').subscribe();
    tick();
    http.expectOne(`${GENERATED_BASE}/publicacoes/p1/download-token`).flush({
      token: 'abc',
      validadeSegundos: 60,
      urlPath: '/dl',
    });
    tick();
  }));

  it('montarUrlDownloadPacotePublico() URL-encodes token', () => {
    expect(service.montarUrlDownloadPacotePublico('a/b c')).toBe(
      `${window.location.origin}${BASE}/public/publicacoes/download?token=a%2Fb%20c`,
    );
  });

  it('baixarPdf() uses responseType blob', () => {
    service.baixarPdf('p1').subscribe();
    const req = http.expectOne(`${BASE}/publicacoes/p1/download-pdf`);
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('changelogPublicacao() hits /changelog', fakeAsync(() => {
    service.changelogPublicacao('p1').subscribe();
    tick();
    http.expectOne(`${GENERATED_BASE}/publicacoes/p1/changelog`).flush([]);
    tick();
  }));

  it('arvorePaginasPublicacao() hits /publicacoes/:id/paginas', () => {
    let resultado: unknown;
    service.arvorePaginasPublicacao('p1').subscribe(items => (resultado = items));
    http.expectOne(`${BASE}/publicacoes/p1/paginas`).flush([
      { id: 'pai', titulo: 'Operações', ordem: 1, nivel: 0 },
      { id: 'filho', parentId: 'pai', titulo: 'Lista', ordem: 2, nivel: 1 },
    ]);
    expect(resultado).toEqual([
      { id: 'pai', titulo: 'Operações', ordem: 1, nivel: 0 },
      { id: 'filho', parentId: 'pai', titulo: 'Lista', ordem: 2, nivel: 1 },
    ]);
  });
});
