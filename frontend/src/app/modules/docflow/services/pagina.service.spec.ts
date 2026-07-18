import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PaginaService } from './pagina.service';
import { Pagina, PaginaAnexo } from '../models/pagina.model';

const BASE = '/api/doc-flow';
const GENERATED_BASE = '/api/v1/docflow';
const TEMPLATE = { id: 't1', codigo: 'FAQ', nome: 'FAQ', conteudoHtml: '<h2>FAQ</h2>', ordem: 1 };

describe('PaginaService', () => {
  let service: PaginaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaginaService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PaginaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarPaginas() sends filters as query params', () => {
    service.listarPaginas({ busca: 'q', moduloId: 'm1', status: 'PUBLICADO', page: 1, size: 10 }).subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/paginas`);
    expect(req.request.params.get('busca')).toBe('q');
    expect(req.request.params.get('moduloId')).toBe('m1');
    expect(req.request.params.get('status')).toBe('PUBLICADO');
    req.flush({ items: [], totalItems: 0 });
  });

  it('pagina(id) hits /paginas/:id', () => {
    service.pagina('pg1').subscribe();
    http.expectOne(`${BASE}/paginas/pg1`).flush({} as Pagina);
  });

  it('templatesPagina() lista os modelos ativos', fakeAsync(() => {
    service.templatesPagina().subscribe(templates => expect(templates.length).toBe(1));
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/paginas/templates`);
    expect(req.request.method).toBe('GET');
    req.flush([TEMPLATE]);
    tick();
  }));

  it('templatesPagina() envia contexto e opção de arquivados', fakeAsync(() => {
    service
      .templatesPagina({ projetoId: 'projeto-1', somenteContexto: true, incluirArquivados: true })
      .subscribe();
    tick();
    const req = http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/paginas/templates?`));
    expect(req.request.url).toContain('projetoId=projeto-1');
    expect(req.request.url).toContain('somenteContexto=true');
    expect(req.request.url).toContain('incluirArquivados=true');
    req.flush([]);
    tick();
  }));

  it('reutiliza o catálogo em cache e invalida após mutação', fakeAsync(() => {
    service.templatesPagina({ projetoId: 'projeto-1' }).subscribe();
    tick();
    http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/paginas/templates?`)).flush([]);
    tick();

    service.templatesPagina({ projetoId: 'projeto-1' }).subscribe();
    tick();
    http.expectNone(r => r.url.startsWith(`${GENERATED_BASE}/paginas/templates?`));

    service
      .criarTemplatePagina({ nome: 'Novo', conteudoHtml: '<p>Novo</p>', projetoId: 'projeto-1' })
      .subscribe();
    tick();
    http.expectOne(`${GENERATED_BASE}/paginas/templates`).flush(TEMPLATE);
    tick();

    service.templatesPagina({ projetoId: 'projeto-1' }).subscribe();
    tick();
    http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/paginas/templates?`)).flush([]);
    tick();
  }));

  it('cria e exclui modelos personalizados', fakeAsync(() => {
    service
      .criarTemplatePagina({
        nome: 'Cadastro padrão',
        conteudoHtml: '<h2>Cadastro</h2>',
        projetoId: 'projeto-1',
      })
      .subscribe();
    tick();
    const criar = http.expectOne(`${GENERATED_BASE}/paginas/templates`);
    expect(criar.request.method).toBe('POST');
    expect(criar.request.body.projetoId).toBe('projeto-1');
    criar.flush(TEMPLATE);
    tick();

    service.excluirTemplatePagina('template-1').subscribe();
    tick();
    const excluir = http.expectOne(`${GENERATED_BASE}/paginas/templates/template-1`);
    expect(excluir.request.method).toBe('DELETE');
    excluir.flush(null);
    tick();
  }));

  it('gerencia aplicação, edição, duplicação, ciclo de vida e versões dos modelos', fakeAsync(() => {
    service.aplicarTemplatePagina('template-1', { projetoId: 'projeto-1', titulo: 'Cadastro' }).subscribe();
    tick();
    const aplicar = http.expectOne(`${GENERATED_BASE}/paginas/templates/template-1/aplicar`);
    expect(aplicar.request.method).toBe('POST');
    expect(aplicar.request.body.titulo).toBe('Cadastro');
    aplicar.flush({ templateId: 'template-1', versao: 1, conteudoHtml: '<p>Cadastro</p>' });
    tick();

    service
      .atualizarTemplatePagina('template-1', {
        nome: 'Cadastro v2',
        conteudoHtml: '<h2>Cadastro</h2>',
        projetoId: 'projeto-1',
      })
      .subscribe();
    tick();
    const atualizar = http.expectOne(`${GENERATED_BASE}/paginas/templates/template-1`);
    expect(atualizar.request.method).toBe('PUT');
    atualizar.flush(TEMPLATE);
    tick();

    service.duplicarTemplatePagina('template-1', { nome: 'Cópia', projetoId: 'projeto-1' }).subscribe();
    tick();
    const duplicar = http.expectOne(`${GENERATED_BASE}/paginas/templates/template-1/duplicar`);
    expect(duplicar.request.method).toBe('POST');
    duplicar.flush(TEMPLATE);
    tick();

    service.arquivarTemplatePagina('template-1').subscribe();
    tick();
    const arquivar = http.expectOne(`${GENERATED_BASE}/paginas/templates/template-1/arquivar`);
    expect(arquivar.request.method).toBe('POST');
    arquivar.flush(TEMPLATE);
    tick();
    service.reativarTemplatePagina('template-1').subscribe();
    tick();
    const reativar = http.expectOne(`${GENERATED_BASE}/paginas/templates/template-1/reativar`);
    expect(reativar.request.method).toBe('POST');
    reativar.flush(TEMPLATE);
    tick();
    service.versoesTemplatePagina('template-1').subscribe();
    tick();
    const versoes = http.expectOne(`${GENERATED_BASE}/paginas/templates/template-1/versoes`);
    expect(versoes.request.method).toBe('GET');
    versoes.flush([]);
    tick();
    service.restaurarVersaoTemplatePagina('template-1', 2).subscribe();
    tick();
    const restaurar = http.expectOne(`${GENERATED_BASE}/paginas/templates/template-1/versoes/2/restaurar`);
    expect(restaurar.request.method).toBe('POST');
    restaurar.flush(TEMPLATE);
    tick();
  }));

  it('autosavePagina() atualiza o rascunho no endpoint dedicado', () => {
    service.autosavePagina('pg1', { titulo: 'Página', version: 2 }).subscribe();
    const req = http.expectOne(`${BASE}/paginas/pg1/autosave`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.version).toBe(2);
    req.flush({});
  });

  it('qualidadePagina() consulta o checklist editorial', () => {
    service.qualidadePagina('pg1').subscribe();
    expect(http.expectOne(`${BASE}/paginas/pg1/qualidade`).request.method).toBe('GET');
  });

  it('previewPaginaHtml() solicita a prévia fiel como texto', () => {
    service.previewPaginaHtml('pg1').subscribe();
    const req = http.expectOne(`${BASE}/paginas/pg1/preview`);
    expect(req.request.responseType).toBe('text');
  });

  it('salvarPagina() POSTs without id and PUTs with id', () => {
    service.salvarPagina({ titulo: 'a' }).subscribe();
    expect(http.expectOne(`${BASE}/paginas`).request.method).toBe('POST');
    service.salvarPagina({ titulo: 'a' }, 'pg1').subscribe();
    expect(http.expectOne(`${BASE}/paginas/pg1`).request.method).toBe('PUT');
  });

  it('excluirPagina() DELETEs /paginas/:id', () => {
    service.excluirPagina('pg1').subscribe();
    const req = http.expectOne(`${BASE}/paginas/pg1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('action endpoints POST to /paginas/:id/<acao>', () => {
    service.salvarRascunho('pg1').subscribe();
    expect(http.expectOne(`${BASE}/paginas/pg1/salvar-rascunho`).request.method).toBe('POST');
    service.publicarPagina('pg1').subscribe();
    expect(http.expectOne(`${BASE}/paginas/pg1/publicar`).request.method).toBe('POST');
    service.enviarRevisaoPagina('pg1').subscribe();
    expect(http.expectOne(`${BASE}/paginas/pg1/enviar-revisao`).request.method).toBe('POST');
    service.aprovarPagina('pg1').subscribe();
    expect(http.expectOne(`${BASE}/paginas/pg1/aprovar`).request.method).toBe('POST');
    service.arquivarPagina('pg1').subscribe();
    expect(http.expectOne(`${BASE}/paginas/pg1/arquivar`).request.method).toBe('POST');
    service.duplicarPagina('pg1').subscribe();
    expect(http.expectOne(`${BASE}/paginas/pg1/duplicar`).request.method).toBe('POST');
  });

  it('listarRevisoesPagina() sends paging + sort params', () => {
    service.listarRevisoesPagina('pg1', 2, 5, 'numero', 'DESC').subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/paginas/pg1/revisoes`);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('sort')).toBe('numero');
    expect(req.request.params.get('dir')).toBe('DESC');
    req.flush({ items: [], totalItems: 0 });
  });

  it('anexosPagina() returns array from /anexos', done => {
    service.anexosPagina('pg1').subscribe(list => {
      expect(list.length).toBe(2);
      done();
    });
    http.expectOne(`${BASE}/paginas/pg1/anexos`).flush([{}, {}] as PaginaAnexo[]);
  });

  it('anexarPagina() POSTs FormData with key "file"', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    service.anexarPagina('pg1', file).subscribe();
    const req = http.expectOne(`${BASE}/paginas/pg1/anexos`);
    const body = req.request.body as FormData;
    expect(body.has('file')).toBe(true);
    req.flush({} as PaginaAnexo);
  });

  it('excluirAnexoPagina() DELETEs /paginas/:id/anexos/:anexoId', () => {
    service.excluirAnexoPagina('pg1', 'a1').subscribe();
    const req = http.expectOne(`${BASE}/paginas/pg1/anexos/a1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('downloadAnexoUrl() prepends BASE to anexo.downloadUrl', () => {
    expect(service.downloadAnexoUrl({ downloadUrl: '/x.png' } as PaginaAnexo)).toBe(`${BASE}/x.png`);
  });

  it('resumoPaginasPorStatusGlobal() hits /paginas/resumo-por-status', () => {
    service.resumoPaginasPorStatusGlobal().subscribe();
    http.expectOne(`${BASE}/paginas/resumo-por-status`).flush({});
  });

  it('reordenarPaginas() POSTs ids array', () => {
    service.reordenarPaginas(['a', 'b']).subscribe();
    const req = http.expectOne(`${BASE}/paginas/reordenar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ paginaIds: ['a', 'b'] });
    req.flush(null);
  });
});
