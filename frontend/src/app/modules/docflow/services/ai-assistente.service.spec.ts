import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '@env/environment';
import { AiAssistenteService } from './ai-assistente.service';

describe('AiAssistenteService', () => {
  let service: AiAssistenteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AiAssistenteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta status em aiApiUrl', () => {
    service.status().subscribe(s => {
      expect(s.provider).toBe('fake');
      expect(s.enabled).toBeFalse();
    });

    const req = http.expectOne(`${environment.aiApiUrl}/status`);
    expect(req.request.method).toBe('GET');
    req.flush({
      enabled: false,
      prontoParaGerar: false,
      provider: 'fake',
      model: 'gpt-4.1-mini',
      mensagem: 'off',
    });
  });

  it('cria sessão em POST /sessoes', () => {
    service
      .criarSessao({
        objetivo: 'CRIAR_PAGINA',
        briefing: 'x'.repeat(50),
      })
      .subscribe(s => expect(s.status).toBe('AGUARDANDO_USUARIO'));

    const req = http.expectOne(`${environment.aiApiUrl}/sessoes`);
    expect(req.request.method).toBe('POST');
    req.flush({
      id: '11111111-1111-1111-1111-111111111111',
      objetivo: 'CRIAR_PAGINA',
      status: 'AGUARDANDO_USUARIO',
      projetoId: null,
      moduloId: null,
      clienteId: null,
      paginaId: null,
      templateId: null,
      briefing: 'x'.repeat(50),
      mensagens: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('solicita recomendação de modelo pelo briefing', () => {
    service.recomendarTemplate({ briefing: 'consulta de pedidos com filtros' }).subscribe(r => {
      expect(r.recomendado?.codigo).toBe('CONSULTA');
    });

    const req = http.expectOne(`${environment.aiApiUrl}/templates/recomendacao`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.briefing).toContain('consulta');
    req.flush({
      recomendado: {
        templateId: 't1',
        codigo: 'CONSULTA',
        nome: 'Consulta',
        descricao: null,
        confianca: 0.91,
        motivo: 'Termos compatíveis.',
      },
      candidatos: [],
      exigeConfirmacao: false,
    });
  });

  it('importa documento como multipart e envia o contexto', () => {
    const arquivo = new File(['# Manual\nConteúdo suficiente para organizar as páginas.'], 'manual.txt', {
      type: 'text/plain',
    });
    service.importarDocumento(arquivo, { projetoId: 'projeto-1' }).subscribe(doc => {
      expect(doc.nomeArquivo).toBe('manual.txt');
    });

    const req = http.expectOne(
      r => r.url === `${environment.aiApiUrl}/importacoes` && r.params.get('projetoId') === 'projeto-1',
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    expect(((req.request.body as FormData).get('arquivo') as File).name).toBe('manual.txt');
    req.flush({ nomeArquivo: 'manual.txt' });
  });

  it('retoma importação persistida e marca página selecionada', () => {
    service.buscarImportacao('importacao-1').subscribe();
    const busca = http.expectOne(`${environment.aiApiUrl}/importacoes/importacao-1`);
    expect(busca.request.method).toBe('GET');
    busca.flush({ id: 'importacao-1' });

    service.selecionarPaginaImportada('importacao-1', 'pagina-1').subscribe();
    const selecao = http.expectOne(
      `${environment.aiApiUrl}/importacoes/importacao-1/paginas/pagina-1/selecionar`,
    );
    expect(selecao.request.method).toBe('POST');
    selecao.flush({ id: 'importacao-1' });
  });

  it('aceita proposta importada e cria o rascunho pelo endpoint atômico', () => {
    service.aceitarPaginaImportada('importacao-1', 'pagina-1').subscribe(doc => {
      expect(doc.id).toBe('importacao-1');
    });

    const req = http.expectOne(`${environment.aiApiUrl}/importacoes/importacao-1/paginas/pagina-1/aceitar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ id: 'importacao-1' });
  });

  it('revisa sugestões estruturais da importação', () => {
    service.aceitarSugestaoImportacao('importacao-1', 'sugestao-1').subscribe();
    const aceitar = http.expectOne(
      `${environment.aiApiUrl}/importacoes/importacao-1/sugestoes/sugestao-1/aceitar`,
    );
    expect(aceitar.request.method).toBe('POST');
    aceitar.flush({ id: 'importacao-1' });

    service.ignorarSugestaoImportacao('importacao-1', 'sugestao-2').subscribe();
    const ignorar = http.expectOne(
      `${environment.aiApiUrl}/importacoes/importacao-1/sugestoes/sugestao-2/ignorar`,
    );
    expect(ignorar.request.method).toBe('POST');
    ignorar.flush({ id: 'importacao-1' });

    service.aplicarSugestoesSegurasImportacao('importacao-1').subscribe();
    const seguras = http.expectOne(
      `${environment.aiApiUrl}/importacoes/importacao-1/sugestoes/aplicar-seguras`,
    );
    expect(seguras.request.method).toBe('POST');
    seguras.flush({ id: 'importacao-1' });
  });

  it('persiste a ordem do rascunho importado com controle de versão', () => {
    service
      .reordenarEstruturaImportada('importacao-1', {
        version: 3,
        modulos: [{ planoId: 'modulo-1', paginas: ['pagina-2', 'pagina-1'] }],
      })
      .subscribe(doc => expect(doc.version).toBe(4));

    const req = http.expectOne(`${environment.aiApiUrl}/importacoes/importacao-1/estrutura/rascunho`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      version: 3,
      modulos: [{ planoId: 'modulo-1', paginas: ['pagina-2', 'pagina-1'] }],
    });
    req.flush({ id: 'importacao-1', version: 4 });
  });

  it('confirma a estrutura sugerida antes de selecionar páginas', () => {
    service
      .confirmarEstruturaImportada('importacao-1', {
        modoProjeto: 'NOVO_PROJETO',
        modoCliente: 'SEM_CLIENTE',
        projetoId: null,
        clienteId: null,
        clienteNome: null,
        projetoNome: 'Portal de pedidos',
        projetoDescricao: 'Manual do portal.',
        modulos: [{ planoId: 'plano-modulo-1', nome: 'Pedidos' }],
      })
      .subscribe(doc => expect(doc.estruturaConfirmada).toBeTrue());

    const req = http.expectOne(`${environment.aiApiUrl}/importacoes/importacao-1/estrutura/confirmar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.projetoNome).toBe('Portal de pedidos');
    req.flush({ id: 'importacao-1', estruturaConfirmada: true });
  });

  it('gera rascunho em POST /sessoes/{id}/gerar', () => {
    service.gerar('11111111-1111-1111-1111-111111111111').subscribe(j => {
      expect(j.status).toBe('PENDENTE');
    });

    const req = http.expectOne(`${environment.aiApiUrl}/sessoes/11111111-1111-1111-1111-111111111111/gerar`);
    expect(req.request.method).toBe('POST');
    req.flush({
      id: '22222222-2222-2222-2222-222222222222',
      sessaoId: '11111111-1111-1111-1111-111111111111',
      tipo: 'GERAR_RASCUNHO',
      status: 'PENDENTE',
      erroMensagem: null,
      modelo: null,
      startedAt: null,
      finishedAt: null,
    });
  });

  it('eventosAi() abre stream SSE em /eventos', () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(
      new Response(
        'event: ai-job\ndata: {"jobId":"j1","sessaoId":"s1","status":"SUCESSO","progresso":100}\n\n',
        {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        },
      ),
    );

    const eventos: unknown[] = [];
    const sub = service.eventosAi().subscribe(e => eventos.push(e));

    expect(fetchSpy).toHaveBeenCalled();
    const url = fetchSpy.calls.mostRecent().args[0] as string;
    expect(url).toContain(`${environment.aiApiUrl}/eventos`);
    sub.unsubscribe();
  });
});
