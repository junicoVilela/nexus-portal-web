import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
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

  /** O SDK dispara as requisições num microtask; cada bloco precisa de tick antes. */
  function flushListaVazia(): void {
    http.expectOne(r => r.url.startsWith('/api/v1/docflow/clientes?')).flush({
      items: [cliente],
      totalItems: 1,
      page: 1,
      size: 10,
      totalPages: 1,
      first: true,
      last: true,
    });
    tick();
    http.expectOne(r => r.url.startsWith('/api/v1/docflow/projetos')).flush({ items: [], totalItems: 0 });
    tick();
    http.expectOne(r => r.url.startsWith('/api/v1/docflow/modulos')).flush({ items: [], totalItems: 0 });
    tick();
  }

  it('carrega tokens de prévia ao abrir vínculos', fakeAsync(() => {
    fixture = TestBed.createComponent(ClientesComponent);
    fixture.detectChanges();
    tick();
    flushListaVazia();

    fixture.componentInstance.abrirVinculos(cliente);
    tick();
    http.expectOne(r => r.url.startsWith('/api/v1/docflow/clientes/c1/vinculos')).flush({
      projetoIds: [],
      moduloIds: [],
      paginaIds: [],
    });
    tick();
    http.expectOne(r => r.url.startsWith('/api/v1/docflow/paginas')).flush({ items: [], totalItems: 0 });
    tick();
    http.expectOne(r => r.url.startsWith('/api/v1/preview-tokens')).flush([
      {
        id: 't1',
        clienteId: 'c1',
        token: 'abc',
        expiresAt: '2099-01-01T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z',
        createdBy: 'admin',
      },
    ]);
    tick();
    fixture.detectChanges();

    expect(fixture.componentInstance['previewTokens']().length).toBe(1);
    expect(fixture.componentInstance.previewTokenAtivo(fixture.componentInstance['previewTokens']()[0]!)).toBe(true);

    // A tela recarrega a listagem depois de abrir os vínculos; drena o que sobrou
    // para o verify() do afterEach não acusar requisição pendente.
    http.match(() => true).forEach(pendente => pendente.flush({ items: [], totalItems: 0 }));
    tick();
  }));
});
