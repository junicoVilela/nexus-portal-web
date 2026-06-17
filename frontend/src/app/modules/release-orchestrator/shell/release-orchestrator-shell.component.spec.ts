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

  it('admin vê todos os 6 itens', async () => {
    await configurar(['RELEASE:CRIAR', 'RELEASE:LER', 'PRODUTO:LER', 'TEMPLATE:LER']);
    const labels = fixture.componentInstance['navItems']().map(i => i.label);
    expect(labels.length).toBe(6);
    expect(labels).toContain('Registrar');
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
