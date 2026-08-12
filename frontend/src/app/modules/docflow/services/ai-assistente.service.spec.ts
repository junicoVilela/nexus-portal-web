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
