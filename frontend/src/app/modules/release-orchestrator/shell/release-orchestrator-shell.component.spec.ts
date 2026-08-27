import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { AuthService } from '@core/auth/services/auth.service';
import { ReleaseOrchestratorShellComponent } from './release-orchestrator-shell.component';

function authMock(permissoes: string[]) {
  return {
    tem: signal((codigo: string) => permissoes.includes(codigo)),
    me: signal(null),
    permissoes: signal(permissoes),
    grupos: signal([]),
    carregarMe: () => Promise.resolve(null),
  };
}

describe('ReleaseOrchestratorShellComponent (filtro de permissão no menu)', () => {
  let fixture: ComponentFixture<ReleaseOrchestratorShellComponent>;

  async function configurar(permissoes: string[]) {
    await TestBed.configureTestingModule({
      imports: [ReleaseOrchestratorShellComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        lucideTestIcons,
        { provide: AuthService, useValue: authMock(permissoes) },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ReleaseOrchestratorShellComponent);
    fixture.detectChanges();
  }

  it('admin vê todos os 11 itens', async () => {
    await configurar([
      'RELEASE:CRIAR',
      'RELEASE:LER',
      'PROXIMA_ENTREGA:LER',
      'ENTREGA:LER',
      'CLIENTE_RO:LER',
      'HOST:LER',
      'INSTALACAO:LER',
      'PRODUTO:LER',
      'TEMPLATE:LER',
    ]);
    const labels = fixture.componentInstance['navItems']().map(i => i.label);
    expect(labels.length).toBe(11);
    expect(labels).toContain('Registrar');
    expect(labels).toContain('Entregas');
    expect(labels).toContain('Próximas entregas');
    expect(labels).toContain('Clientes');
    expect(labels).toContain('Hosts');
    expect(labels).toContain('Instalações');
  });

  it('leitor sem RELEASE:CRIAR não vê Registrar', async () => {
    await configurar(['RELEASE:LER', 'PRODUTO:LER', 'TEMPLATE:LER']);
    const labels = fixture.componentInstance['navItems']().map(i => i.label);
    expect(labels).not.toContain('Registrar');
    expect(labels).toContain('Releases');
  });

  it('usuário sem nenhuma permissão vê só Dashboard e Como usar', async () => {
    await configurar([]);
    const labels = fixture.componentInstance['navItems']().map(i => i.label);
    expect(labels).toEqual(['Dashboard', 'Como usar']);
  });
});
