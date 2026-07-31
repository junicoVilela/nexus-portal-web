import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '@core/auth/services/auth.service';
import { Pagina } from '@modules/docflow/models/pagina.model';
import { ModuloService } from '@modules/docflow/services/modulo.service';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { ProjetoService } from '@modules/docflow/services/projeto.service';
import { ToastService } from '@shared/ui';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { PaginasComponent } from './paginas.component';

describe('PaginasComponent', () => {
  let fixture: ComponentFixture<PaginasComponent>;
  let router: Router;
  let paginaService: jasmine.SpyObj<PaginaService>;

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
    paginaService = jasmine.createSpyObj<PaginaService>('PaginaService', [
      'listarPaginas',
      'reordenarPaginas',
      'resumoPaginasPorStatusGlobal',
    ]);
    paginaService.listarPaginas.and.returnValue(
      of({ items: [], page: 1, size: 10, totalItems: 0, totalPages: 0, first: true, last: true }),
    );
    paginaService.resumoPaginasPorStatusGlobal.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [PaginasComponent],
      providers: [
        provideRouter([]),
        lucideTestIcons,
        { provide: AuthService, useValue: { tem: () => () => true } },
        { provide: ToastService, useValue: { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') } },
        { provide: ProjetoService, useValue: { projetos: () => of([]) } },
        { provide: ModuloService, useValue: { modulos: () => of([]) } },
        { provide: PaginaService, useValue: paginaService },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  it('ordena paginasHierarquia com ancestral presente na lista', () => {
    paginaService.listarPaginas.and.returnValue(
      of({
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
      }),
    );
    fixture = TestBed.createComponent(PaginasComponent);
    fixture.detectChanges();

    const hierarquia = fixture.componentInstance.paginasHierarquia();
    expect(hierarquia.map(p => p.id)).toEqual(['pai', 'filho']);
    expect(fixture.componentInstance.nivel(hierarquia[1]!)).toBe(1);
  });

  it('novaPorTipo passa parentId da página índice quando módulo filtrado', () => {
    const navigate = spyOn(router, 'navigate');
    fixture = TestBed.createComponent(PaginasComponent);
    fixture.detectChanges();

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

  it('moverParaBaixo chama reordenarPaginas com ids trocados', () => {
    fixture = TestBed.createComponent(PaginasComponent);
    fixture.detectChanges();

    paginaService.reordenarPaginas.and.returnValue(of(void 0));
    const carregar = spyOn(fixture.componentInstance, 'carregar');

    const primeira = paginaBase({ id: 'p1', ordem: 1 });
    const segunda = paginaBase({ id: 'p2', titulo: 'Detalhe', codigoTela: 'DET-001', ordem: 2 });
    fixture.componentInstance.paginas.set([primeira, segunda]);

    fixture.componentInstance.moverParaBaixo(primeira);

    expect(paginaService.reordenarPaginas).toHaveBeenCalledWith(['p2', 'p1']);
    expect(carregar).toHaveBeenCalled();
  });
});
