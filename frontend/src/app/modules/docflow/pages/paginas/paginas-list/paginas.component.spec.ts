import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { Pagina } from '@modules/docflow/models/pagina.model';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { PaginasComponent } from './paginas.component';

describe('PaginasComponent', () => {
  let fixture: ComponentFixture<PaginasComponent>;
  let http: HttpTestingController;
  let router: Router;

  const paginaBase = (overrides: Partial<Pagina> = {}): Pagina => ({
    id: 'p1',
    version: 1,
    titulo: 'Lista',
    slug: 'lista',
    codigoTela: 'LISTA-001',
    status: 'RASCUNHO',
    ordem: 1,
    ativo: true,
    moduloId: 'm1',
    moduloNome: 'Módulo',
    projetoId: 'proj1',
    projetoNome: 'Projeto',
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginasComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        lucideTestIcons,
        { provide: AuthService, useValue: { tem: () => () => true } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => http.verify());

  function flushBootstrap(): void {
    const projetos = http.expectOne(r => r.url === '/api/doc-flow/projetos');
    projetos.flush({ items: [], page: 1, size: 1000, totalItems: 0, totalPages: 0, first: true, last: true });
    const modulos = http.expectOne(r => r.url === '/api/doc-flow/modulos');
    modulos.flush({ items: [], page: 1, size: 1000, totalItems: 0, totalPages: 0, first: true, last: true });
    const resumo = http.expectOne(r => r.url === '/api/doc-flow/paginas/resumo-por-status');
    resumo.flush({});
  }

  it('ordena paginasHierarquia com ancestral presente na lista', () => {
    fixture = TestBed.createComponent(PaginasComponent);
    fixture.detectChanges();
    flushBootstrap();

    const paginas = http.expectOne(r => r.url === '/api/doc-flow/paginas');
    paginas.flush({
      items: [
        paginaBase({ id: 'filho', titulo: 'Incluir', parentId: 'pai', ordem: 2 }),
        paginaBase({ id: 'pai', titulo: 'Operações', codigoTela: 'OPS-001', ordem: 1 }),
      ],
      page: 1,
      size: 10,
      totalItems: 2,
      totalPages: 1,
      first: true,
      last: true,
    });
    fixture.detectChanges();

    const hierarquia = fixture.componentInstance.paginasHierarquia();
    expect(hierarquia.map(p => p.id)).toEqual(['pai', 'filho']);
    expect(fixture.componentInstance.nivel(hierarquia[1]!)).toBe(1);
  });

  it('novaPorTipo passa parentId da página índice quando módulo filtrado', () => {
    const navigate = spyOn(router, 'navigate');
    fixture = TestBed.createComponent(PaginasComponent);
    fixture.detectChanges();
    flushBootstrap();
    const paginasReq = http.expectOne(r => r.url === '/api/doc-flow/paginas');
    paginasReq.flush({
      items: [],
      page: 1,
      size: 10,
      totalItems: 0,
      totalPages: 0,
      first: true,
      last: true,
    });

    fixture.componentInstance.filtros.controls.moduloId.setValue('m1');
    fixture.componentInstance.paginas.set([
      paginaBase({
        id: 'indice',
        titulo: 'Operações',
        codigoTela: 'OPS-001',
        conteudoHtml: '<h2>Guias disponíveis</h2>',
      }),
    ]);

    fixture.componentInstance.novaPorTipo('lista');

    expect(navigate).toHaveBeenCalled();
    const args = navigate.calls.mostRecent().args;
    expect(args[1]?.queryParams?.['parentId']).toBe('indice');
    expect(args[1]?.queryParams?.['tipoPagina']).toBe('lista');
  });
});
