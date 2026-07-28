import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PublicacaoService } from './publicacao.service';
import { Publicacao } from '../models/publicacao.model';

const BASE = '/api/doc-flow';

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

  it('listarPublicacoes() sends clienteId, status + paging', () => {
    service.listarPublicacoes({ clienteId: 'c1', status: 'ERRO', page: 2, size: 5 }).subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/publicacoes`);
    expect(req.request.params.get('clienteId')).toBe('c1');
    expect(req.request.params.get('status')).toBe('ERRO');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ items: [], totalItems: 0 });
  });

  it('publicacaoPorId() hits /publicacoes/:id', () => {
    service.publicacaoPorId('p1').subscribe();
    http.expectOne(`${BASE}/publicacoes/p1`).flush({} as Publicacao);
  });

  it('previewPublicacao() sets clienteId param', () => {
    service.previewPublicacao('c1').subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/publicacoes/preview`);
    expect(req.request.params.get('clienteId')).toBe('c1');
    req.flush([]);
  });

  it('previewPublicacaoHtml() sends versao when provided and uses responseType text', () => {
    service.previewPublicacaoHtml('c1', '1.2').subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/publicacoes/preview-html`);
    expect(req.request.params.get('versao')).toBe('1.2');
    expect(req.request.responseType).toBe('text');
    req.flush('<html />');
  });

  it('previewPublicacaoHtml() omits versao when undefined', () => {
    service.previewPublicacaoHtml('c1').subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/publicacoes/preview-html`);
    expect(req.request.params.has('versao')).toBe(false);
    req.flush('<html />');
  });

  it('diagnosticoPublicacao() sets clienteId param', () => {
    service.diagnosticoPublicacao('c1').subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/publicacoes/diagnostico`);
    expect(req.request.params.get('clienteId')).toBe('c1');
    req.flush([]);
  });

  it('gerarPublicacao() POSTs payload to /publicacoes', () => {
    service.gerarPublicacao({ clienteId: 'c1', versao: '1.0', observacao: 'ok' }).subscribe();
    const req = http.expectOne(`${BASE}/publicacoes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ clienteId: 'c1', versao: '1.0', observacao: 'ok' });
    req.flush({} as Publicacao);
  });

  it('reprocessarPublicacao() POSTs empty body to /reprocessar', () => {
    service.reprocessarPublicacao('p1').subscribe();
    const req = http.expectOne(`${BASE}/publicacoes/p1/reprocessar`);
    expect(req.request.body).toEqual({});
    req.flush({} as Publicacao);
  });

  it('reprocessarPublicacoes() POSTs ids to the bulk endpoint', () => {
    service.reprocessarPublicacoes(['p1', 'p2']).subscribe();
    const req = http.expectOne(`${BASE}/publicacoes/reprocessar-lote`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ ids: ['p1', 'p2'] });
    req.flush({ solicitadas: 2, reprocessadas: 2, ignoradas: 0 });
  });

  it('excluirPublicacao() DELETEs /publicacoes/:id', () => {
    service.excluirPublicacao('p1').subscribe();
    const req = http.expectOne(`${BASE}/publicacoes/p1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('baixarPublicacao() uses responseType blob', () => {
    service.baixarPublicacao('p1').subscribe();
    const req = http.expectOne(`${BASE}/publicacoes/p1/download`);
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('downloadUrl() returns canonical URL', () => {
    expect(service.downloadUrl('p1')).toBe(`${BASE}/publicacoes/p1/download`);
  });

  it('tokenDownloadPacote() hits /download-token', () => {
    service.tokenDownloadPacote('p1').subscribe();
    http.expectOne(`${BASE}/publicacoes/p1/download-token`).flush({
      token: 'abc',
      validadeSegundos: 60,
      urlPath: '/dl',
    });
  });

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

  it('changelogPublicacao() hits /changelog', () => {
    service.changelogPublicacao('p1').subscribe();
    http.expectOne(`${BASE}/publicacoes/p1/changelog`).flush([]);
  });
});
