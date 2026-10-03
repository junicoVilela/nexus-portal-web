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

  it('admin (todas permissões) vê todos os itens do menu', async () => {
    await configurar([
      'CLIENTE:LER',
      'PROJETO:LER',
      'MODULO:LER',
      'PAGINA:LER',
      'PUBLICACAO:LER',
      'CONFIGURACAO:EDITAR',
      'AJUDA:LER',
      'AUDITORIA:VISUALIZAR',
    ]);
    const labels = fixture.componentInstance['navItems']().map(i => i.label);
    expect(labels.length).toBe(12);
    expect(labels).toContain('Qualidade da IA');
    expect(labels).toContain('Revisões');
    expect(labels).toContain('Trechos');
    expect(labels).toContain('Mídia');
    expect(labels).toContain('Configurações');
    expect(labels).toContain('Ajuda');
  });

  it('leitor sem CONFIGURACAO:EDITAR não vê Configurações', async () => {
    await configurar([
      'CLIENTE:LER',
      'PROJETO:LER',
      'MODULO:LER',
      'PAGINA:LER',
      'PUBLICACAO:LER',
      'AJUDA:LER',
    ]);
    const labels = fixture.componentInstance['navItems']().map(i => i.label);
    expect(labels).not.toContain('Configurações');
    expect(labels).not.toContain('Qualidade da IA');
    expect(labels).toContain('Clientes');
  });

  it('usuário sem nenhuma permissão vê somente Dashboard', async () => {
    await configurar([]);
    const labels = fixture.componentInstance['navItems']().map(i => i.label);
    expect(labels).toEqual(['Dashboard']);
  });
});
