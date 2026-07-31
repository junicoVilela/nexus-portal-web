import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Pagina } from '@modules/docflow/models/pagina.model';
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

  const pagina = (overrides: Partial<Pagina> = {}): Pagina => ({
    id: 'p1',
    version: 1,
    titulo: 'Operações',
    slug: 'operacoes',
    codigoTela: 'OPS-001',
    status: 'PUBLICADO',
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

  it('monta árvore de páginas a partir do preview', () => {
    fixture = TestBed.createComponent(PublicacaoDetalheComponent);
    fixture.detectChanges();

    const pubReq = http.expectOne('/api/doc-flow/publicacoes/pub1');
    pubReq.flush(publicacao);
    const changelogReq = http.expectOne('/api/doc-flow/publicacoes/pub1/changelog');
    changelogReq.flush([
      { id: 'c1', paginaId: 'filho', paginaTitulo: 'Lista', tipoMudanca: 'ATUALIZADO', createdAt: '2026-01-01' },
    ]);
    const previewReq = http.expectOne(r => r.url === '/api/doc-flow/publicacoes/preview');
    expect(previewReq.request.params.get('clienteId')).toBe('c1');
    previewReq.flush([
      pagina({ id: 'pai', titulo: 'Operações' }),
      pagina({ id: 'filho', titulo: 'Lista', parentId: 'pai', ordem: 2 }),
    ]);
    fixture.detectChanges();

    const arvore = fixture.componentInstance['paginasArvore']();
    expect(arvore.map(item => item.titulo)).toEqual(['Operações', 'Lista']);
    expect(arvore[1]?.nivel).toBe(1);
    expect(arvore[1]?.tipoMudanca).toBe('ATUALIZADO');
  });
});
