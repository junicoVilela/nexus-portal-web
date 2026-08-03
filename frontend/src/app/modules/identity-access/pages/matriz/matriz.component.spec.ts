import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { environment } from '@env/environment';
import { MatrizComponent } from './matriz.component';

describe('MatrizComponent', () => {
  let fixture: import('@angular/core/testing').ComponentFixture<MatrizComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatrizComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), lucideTestIcons],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MatrizComponent);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function flushCatalogo(): void {
    http.expectOne(`${environment.rbacApiUrl}/catalogo/dominios`).flush([
      {
        id: 'd1', codigo: 'SEGURANCA', nome: 'Segurança', descricao: null, ativo: true,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
      },
    ]);
    http.expectOne(`${environment.rbacApiUrl}/catalogo/funcionalidades`).flush([
      {
        id: 'f1', dominioId: 'd1', dominioCodigo: 'SEGURANCA',
        codigo: 'USUARIO', nome: 'Usuário', descricao: null, ativo: true,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
      },
    ]);
    http.expectOne(`${environment.rbacApiUrl}/catalogo/permissoes`).flush([
      {
        id: 'p1', funcionalidadeId: 'f1', funcionalidadeCodigo: 'USUARIO',
        dominioCodigo: 'SEGURANCA', acao: 'LER', codigo: 'USUARIO:LER',
        descricao: null, ativo: true,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
      },
    ]);
    fixture.detectChanges();
  }

  it('exibe título e aviso de somente leitura', () => {
    flushCatalogo();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Matriz de segurança');
    expect(text).toContain('Catálogo definido por seed (somente leitura).');
  });

  it('não exibe botões de criação ou edição', () => {
    flushCatalogo();
    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('Novo');
    expect(text).not.toContain('Nova');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('lista domínios do catálogo', () => {
    flushCatalogo();
    expect(fixture.nativeElement.textContent).toContain('Segurança');
    expect(fixture.nativeElement.textContent).toContain('SEGURANCA');
  });
});
