import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { AuthService } from '@core/auth/services/auth.service';
import { DocflowShellComponent } from './docflow-shell.component';

function authMock(permissoes: string[]) {
  return {
    tem: signal((codigo: string) => permissoes.includes(codigo)),
    me: signal(null),
    permissoes: signal(permissoes),
    grupos: signal([]),
  };
}

describe('DocflowShellComponent (filtro de permissão no menu)', () => {
  let fixture: ComponentFixture<DocflowShellComponent>;

  async function configurar(permissoes: string[]) {
    await TestBed.configureTestingModule({
      imports: [DocflowShellComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        lucideTestIcons,
        { provide: AuthService, useValue: authMock(permissoes) },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DocflowShellComponent);
    fixture.detectChanges();
  }

  it('admin (todas permissões) vê todos os 8 itens', async () => {
    await configurar([
      'CLIENTE:LER',
      'PROJETO:LER',
      'MODULO:LER',
      'PAGINA:LER',
      'PUBLICACAO:LER',
      'CONFIGURACAO:EDITAR',
    ]);
    const labels = fixture.componentInstance['navItems']().map(i => i.label);
    expect(labels.length).toBe(8);
    expect(labels).toContain('Configurações');
  });

  it('leitor sem CONFIGURACAO:EDITAR não vê Configurações', async () => {
    await configurar(['CLIENTE:LER', 'PROJETO:LER', 'MODULO:LER', 'PAGINA:LER', 'PUBLICACAO:LER']);
    const labels = fixture.componentInstance['navItems']().map(i => i.label);
    expect(labels).not.toContain('Configurações');
    expect(labels).toContain('Clientes');
  });

  it('usuário sem nenhuma permissão vê só Dashboard e Busca global', async () => {
    await configurar([]);
    const labels = fixture.componentInstance['navItems']().map(i => i.label);
    expect(labels).toEqual(['Dashboard', 'Busca global']);
  });
});
