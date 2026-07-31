import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AjudaService } from './ajuda.service';
import { AjudaConteudo } from '../models/ajuda.model';

const GENERATED_BASE = '/api/v1/docflow';

describe('AjudaService', () => {
  let service: AjudaService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AjudaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('mantém fallback imediato e substitui pelo conteúdo administrado', fakeAsync(() => {
    expect(service.jornadas().length).toBe(4);
    service.carregar();
    tick();
    const remoto: AjudaConteudo[] = [
      {
        codigo: 'JORNADA_TESTE',
        tipo: 'JORNADA',
        titulo: 'Jornada remota',
        mediaTipo: 'NENHUMA',
        mediaUrls: [],
        ordem: 1,
        ativo: true,
      },
    ];
    http.expectOne(`${GENERATED_BASE}/ajuda/conteudos`).flush(remoto);
    tick();
    expect(service.jornadas()[0]?.titulo).toBe('Jornada remota');
  }));

  it('integra artigos de ajuda à pesquisa textual', () => {
    const encontrados = service.pesquisar('publicacao');
    expect(encontrados.some(item => item.codigo === 'JORNADA_PUBLICAR')).toBeTrue();
  });

  it('registra métricas com uma sessão anônima', fakeAsync(() => {
    service.registrarEvento({ tipo: 'BUSCA', termo: 'página', resultadoQuantidade: 2 });
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/ajuda/eventos`);
    expect(req.request.body.sessaoId).toBeTruthy();
    expect(req.request.body.tipo).toBe('BUSCA');
    req.flush(null);
    tick();
  }));
});
