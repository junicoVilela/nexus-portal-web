import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Cliente } from '@modules/docflow/models/cliente.model';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { ClientesComponent } from './clientes.component';

describe('ClientesComponent', () => {
  let fixture: ComponentFixture<ClientesComponent>;
  let http: HttpTestingController;

  const cliente: Cliente = {
    id: 'c1',
    nome: 'Cliente Teste',
    slug: 'cliente-teste',
    ativo: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), lucideTestIcons],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushListaVazia(): void {
    http.expectOne(r => r.url === '/api/doc-flow/clientes').flush({
      items: [cliente],
      totalItems: 1,
      page: 1,
      size: 10,
      totalPages: 1,
      first: true,
      last: true,
    });
    http.expectOne(r => r.url.startsWith('/api/doc-flow/projetos')).flush({ items: [], totalItems: 0 });
    http.expectOne(r => r.url.startsWith('/api/doc-flow/modulos')).flush({ items: [], totalItems: 0 });
  }

  it('carrega tokens de prévia ao abrir vínculos', () => {
    fixture = TestBed.createComponent(ClientesComponent);
    fixture.detectChanges();
    flushListaVazia();

    fixture.componentInstance.abrirVinculos(cliente);
    http.expectOne('/api/doc-flow/clientes/c1/vinculos').flush({
      projetoIds: [],
      moduloIds: [],
      paginaIds: [],
    });
    http.expectOne(r => r.url.startsWith('/api/doc-flow/paginas')).flush({ items: [], totalItems: 0 });
    http.expectOne(r => r.url === '/api/doc-flow/preview-tokens').flush([
      {
        id: 't1',
        clienteId: 'c1',
        token: 'abc',
        expiresAt: '2099-01-01T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z',
        createdBy: 'admin',
      },
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance['previewTokens']().length).toBe(1);
    expect(fixture.componentInstance.previewTokenAtivo(fixture.componentInstance['previewTokens']()[0]!)).toBe(true);
  });
});
