import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '@core/auth/services/auth.service';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { RevisoesComponent } from './revisoes.component';

describe('RevisoesComponent', () => {
  let fixture: ComponentFixture<RevisoesComponent>;
  let paginaService: jasmine.SpyObj<PaginaService>;

  beforeEach(async () => {
    paginaService = jasmine.createSpyObj<PaginaService>('PaginaService', [
      'listarPaginas',
      'qualidadePagina',
      'listarRevisoesPagina',
      'aprovarPagina',
      'salvarRascunho',
      'comentarRevisaoPagina',
    ]);
    paginaService.listarPaginas.and.returnValue(
      of({ items: [], page: 1, size: 12, totalItems: 0, totalPages: 0, first: true, last: true }),
    );

    await TestBed.configureTestingModule({
      imports: [RevisoesComponent],
      providers: [
        provideRouter([]),
        lucideTestIcons,
        { provide: AuthService, useValue: { currentUser: () => 'revisor' } },
        { provide: PaginaService, useValue: paginaService },
      ],
    }).compileComponents();
  });

  it('consulta somente páginas em revisão, priorizando as mais antigas', () => {
    fixture = TestBed.createComponent(RevisoesComponent);
    fixture.detectChanges();

    expect(paginaService.listarPaginas).toHaveBeenCalledWith(
      jasmine.objectContaining({
        status: 'EM_REVISAO',
        sort: 'updatedAt',
        dir: 'ASC',
      }),
    );
  });

  it('alterna modo de diff para lado a lado', () => {
    fixture = TestBed.createComponent(RevisoesComponent);
    fixture.detectChanges();

    fixture.componentInstance['diffConteudoAnterior'].set('<p>antes</p>');
    fixture.componentInstance['diffConteudoAtual'].set('<p>depois</p>');
    fixture.componentInstance['definirModoDiff']('lado-a-lado');
    fixture.detectChanges();

    expect(fixture.componentInstance['modoDiff']()).toBe('lado-a-lado');
  });
});
