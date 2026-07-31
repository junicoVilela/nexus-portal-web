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

  it('listarPaginas() sends filters as query params', fakeAsync(() => {
    service.listarPaginas({ busca: 'q', moduloId: 'm1', status: 'PUBLICADO', page: 1, size: 10 }).subscribe();
    tick();
    const req = http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/paginas`));
    expect(req.request.url).toContain('busca=q');
    expect(req.request.url).toContain('moduloId=m1');
    expect(req.request.url).toContain('status=PUBLICADO');
    req.flush({ items: [], totalItems: 0 });
    tick();
  }));

  it('pagina(id) hits /paginas/:id', fakeAsync(() => {
    service.pagina('pg1').subscribe();
    tick();
    http.expectOne(`${GENERATED_BASE}/paginas/pg1`).flush({} as Pagina);
    tick();
  }));

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

  it('autosavePagina() atualiza o rascunho no endpoint dedicado', fakeAsync(() => {
    service.autosavePagina('pg1', { titulo: 'Página', version: 2 }).subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/paginas/pg1/autosave`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.version).toBe(2);
    req.flush({});
    tick();
  }));

  it('qualidadePagina() consulta o checklist editorial', fakeAsync(() => {
    service.qualidadePagina('pg1').subscribe();
    tick();
    expect(http.expectOne(`${GENERATED_BASE}/paginas/pg1/qualidade`).request.method).toBe('GET');
    tick();
  }));

  it('previewPaginaHtml() solicita a prévia fiel como texto', fakeAsync(() => {
    service.previewPaginaHtml('pg1').subscribe();
    tick();
    http.expectOne(`${GENERATED_BASE}/paginas/pg1/preview`).flush('<html />');
    tick();
  }));

  it('salvarPagina() POSTs without id and PUTs with id', fakeAsync(() => {
    service.salvarPagina({ titulo: 'a' }).subscribe();
    tick();
    expect(http.expectOne(`${GENERATED_BASE}/paginas`).request.method).toBe('POST');
    tick();
    service.salvarPagina({ titulo: 'a' }, 'pg1').subscribe();
    tick();
    expect(http.expectOne(`${GENERATED_BASE}/paginas/pg1`).request.method).toBe('PUT');
    tick();
  }));

  it('excluirPagina() DELETEs /paginas/:id', fakeAsync(() => {
    service.excluirPagina('pg1').subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/paginas/pg1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    tick();
  }));

  it('action endpoints POST to /paginas/:id/<acao>', fakeAsync(() => {
    service.salvarRascunho('pg1').subscribe();
    tick();
    expect(http.expectOne(`${GENERATED_BASE}/paginas/pg1/salvar-rascunho`).request.method).toBe('POST');
    tick();
    service.publicarPagina('pg1').subscribe();
    tick();
    expect(http.expectOne(`${GENERATED_BASE}/paginas/pg1/publicar`).request.method).toBe('POST');
    tick();
    service.enviarRevisaoPagina('pg1').subscribe();
    tick();
    expect(http.expectOne(`${GENERATED_BASE}/paginas/pg1/enviar-revisao`).request.method).toBe('POST');
    tick();
    service.aprovarPagina('pg1').subscribe();
    tick();
    expect(http.expectOne(`${GENERATED_BASE}/paginas/pg1/aprovar`).request.method).toBe('POST');
    tick();
    service.arquivarPagina('pg1').subscribe();
    tick();
    expect(http.expectOne(`${GENERATED_BASE}/paginas/pg1/arquivar`).request.method).toBe('POST');
    tick();
    service.duplicarPagina('pg1').subscribe();
    tick();
    expect(http.expectOne(`${GENERATED_BASE}/paginas/pg1/duplicar`).request.method).toBe('POST');
    tick();
  }));

  it('listarRevisoesPagina() sends paging + sort params', fakeAsync(() => {
    service.listarRevisoesPagina('pg1', 2, 5, 'numero', 'DESC').subscribe();
    tick();
    const req = http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/paginas/pg1/revisoes`));
    expect(req.request.url).toContain('page=2');
    expect(req.request.url).toContain('sort=numero');
    expect(req.request.url).toContain('dir=DESC');
    req.flush({ items: [], totalItems: 0 });
    tick();
  }));

  it('anexosPagina() returns array from /anexos', fakeAsync(() => {
    let list: PaginaAnexo[] = [];
    service.anexosPagina('pg1').subscribe(items => (list = items));
    tick();
    http.expectOne(`${GENERATED_BASE}/paginas/pg1/anexos`).flush([{}, {}] as PaginaAnexo[]);
    tick();
    expect(list.length).toBe(2);
  }));

  it('bibliotecaAnexos() consulta a mídia global com busca e paginação', fakeAsync(() => {
    service.bibliotecaAnexos('logo', 2, 12).subscribe();
    tick();
    const req = http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/paginas/anexos`));
    expect(req.request.url).toContain('busca=logo');
    expect(req.request.url).toContain('page=2');
    expect(req.request.url).toContain('size=12');
    req.flush({ items: [], totalItems: 0 });
    tick();
  }));

  it('comentarRevisaoPagina() registra comentário editorial', fakeAsync(() => {
    service.comentarRevisaoPagina('pg1', 'Revisar o passo 2').subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/paginas/pg1/revisoes/comentarios`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ comentario: 'Revisar o passo 2' });
    req.flush({});
    tick();
  }));

  it('anexarPagina() POSTs multipart with file', fakeAsync(() => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    service.anexarPagina('pg1', file).subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/paginas/pg1/anexos`);
    expect(req.request.method).toBe('POST');
    req.flush({} as PaginaAnexo);
    tick();
  }));

  it('excluirAnexoPagina() DELETEs /paginas/:id/anexos/:anexoId', fakeAsync(() => {
    service.excluirAnexoPagina('pg1', 'a1').subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/paginas/pg1/anexos/a1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    tick();
  }));

  it('downloadAnexoUrl() prepends BASE to anexo.downloadUrl', () => {
    expect(service.downloadAnexoUrl({ downloadUrl: '/x.png' } as PaginaAnexo)).toBe(`${BASE}/x.png`);
  });

  it('resumoPaginasPorStatusGlobal() hits /paginas/resumo-por-status', fakeAsync(() => {
    service.resumoPaginasPorStatusGlobal().subscribe();
    tick();
    http.expectOne(`${GENERATED_BASE}/paginas/resumo-por-status`).flush({});
    tick();
  }));

  it('eventosPagina() abre stream SSE em /paginas/eventos', () => {
    const fetchSpy = spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        ok: true,
        body: {
          getReader: () => ({
            read: () => Promise.resolve({ done: true, value: undefined }),
          }),
        },
      } as Response),
    );
    const sub = service.eventosPagina().subscribe();
    expect(fetchSpy).toHaveBeenCalledWith(
      `${BASE}/paginas/eventos`,
      jasmine.objectContaining({ signal: jasmine.any(AbortSignal) }),
    );
    sub.unsubscribe();
  });

  it('reordenarPaginas() POSTs ids array', fakeAsync(() => {
    service.reordenarPaginas(['a', 'b']).subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/paginas/reordenar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ paginaIds: ['a', 'b'] });
    req.flush(null);
    tick();
  }));
});
