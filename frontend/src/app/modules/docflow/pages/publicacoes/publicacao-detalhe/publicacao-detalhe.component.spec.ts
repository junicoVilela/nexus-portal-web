import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Publicacao } from '@modules/docflow/models/publicacao.model';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { PublicacaoDetalheComponent } from './publicacao-detalhe.component';

describe('PublicacaoDetalheComponent', () => {
  let fixture: ComponentFixture<PublicacaoDetalheComponent>;
  let http: HttpTestingController;

  const publicacao: Publicacao = {
    id: 'pub1',
    versao: '1.0.0',
    clienteId: 'c1',
    clienteNome: 'Cliente',
    status: 'SUCESSO',
    quantidadePaginas: 2,
    quantidadeModulos: 1,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'autor',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicacaoDetalheComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        lucideTestIcons,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'pub1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('monta árvore de páginas a partir do snapshot da publicação', fakeAsync(() => {
    fixture = TestBed.createComponent(PublicacaoDetalheComponent);
    fixture.detectChanges();
    tick();

    http.expectOne('/api/v1/docflow/publicacoes/pub1').flush(publicacao);
    http.expectOne('/api/v1/docflow/publicacoes/pub1/changelog').flush([
      { id: 'c1', paginaId: 'filho', paginaTitulo: 'Lista', tipoMudanca: 'ATUALIZADO', createdAt: '2026-01-01' },
    ]);
    http.expectOne('/api/doc-flow/publicacoes/pub1/paginas').flush([
      { id: 'pai', titulo: 'Operações', ordem: 1, nivel: 0 },
      { id: 'filho', parentId: 'pai', titulo: 'Lista', ordem: 2, nivel: 1 },
    ]);
    tick();
    fixture.detectChanges();

    const arvore = fixture.componentInstance['paginasArvore']();
    expect(arvore.map(item => item.titulo)).toEqual(['Operações', 'Lista']);
    expect(arvore[1]?.nivel).toBe(1);
    expect(arvore[1]?.tipoMudanca).toBe('ATUALIZADO');
  }));
});
