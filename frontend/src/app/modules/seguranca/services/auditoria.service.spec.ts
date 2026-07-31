import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { AuditoriaService } from './auditoria.service';

describe('AuditoriaService', () => {
  let service: AuditoriaService;
  let http: HttpTestingController;
  const base = `${environment.rbacApiUrl}/auditoria`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuditoriaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar() envia filtros suportados ao backend', async () => {
    const promise = firstValueFrom(
      service.listar({
        usuario: 'admin',
        acao: 'CRIAR',
        recursoTipo: 'grupo',
        inicio: '2026-01-01',
        fim: '2026-01-31',
        page: 2,
        size: 50,
      }),
    );
    const req = http.expectOne(r => r.url === base);
    expect(req.request.params.get('usuario')).toBe('admin');
    expect(req.request.params.get('acao')).toBe('CRIAR');
    expect(req.request.params.get('entidade')).toBe('grupo');
    expect(req.request.params.get('inicio')).toBe('2026-01-01T00:00:00Z');
    expect(req.request.params.get('fim')).toBe('2026-01-31T23:59:59Z');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('50');
    req.flush({
      items: [
        {
          id: 'a1',
          entidade: 'grupo',
          entidadeId: 'g1',
          acao: 'CRIAR',
          descricao: 'Grupo criado',
          createdAt: '2026-01-15T10:00:00Z',
          createdBy: 'admin',
        },
      ],
      page: 2,
      size: 50,
      totalItems: 1,
      totalPages: 1,
      first: false,
      last: true,
    });
    const res = await promise;
    expect(res.items[0].acao).toBe('CRIAR');
    expect(res.items[0].usuarioLogin).toBe('admin');
  });

  it('registrar() é no-op (não lança)', () => {
    expect(() =>
      service.registrar({ acao: 'TESTE', recursoTipo: 'x', recursoId: '1' }),
    ).not.toThrow();
  });

  it('acoes() inclui lista comum e ações da última consulta', async () => {
    expect(service.acoes()).toContain('CRIAR');

    const promise = firstValueFrom(service.listar());
    http.expectOne(r => r.url === base).flush({
      items: [
        {
          id: 'a1',
          entidade: 'usuario',
          entidadeId: 'u1',
          acao: 'CUSTOM_ACTION',
          descricao: null,
          createdAt: '2026-01-15T10:00:00Z',
          createdBy: 'admin',
        },
      ],
      page: 1,
      size: 20,
      totalItems: 1,
      totalPages: 1,
      first: true,
      last: true,
    });
    await promise;

    expect(service.acoes()).toContain('CUSTOM_ACTION');
  });
});
