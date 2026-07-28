import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { AjudaComponent } from './ajuda.component';
import { AuthService } from '@core/auth/services/auth.service';

describe('AjudaComponent', () => {
  let fixture: ComponentFixture<AjudaComponent>;

  beforeEach(async () => {
    localStorage.removeItem('docflow:ajuda:etapas-concluidas');
    await TestBed.configureTestingModule({
      imports: [AjudaComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        lucideTestIcons,
        { provide: AuthService, useValue: { tem: signal(() => false) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AjudaComponent);
    fixture.detectChanges();
  });

  it('apresenta o fluxo completo e a primeira jornada', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Central de ajuda');
    expect(text).toContain('Cliente');
    expect(text).toContain('Preparar a estrutura');
    expect(text).toContain('Cadastre o cliente');
  });

  it('mantém o progresso da jornada no armazenamento local', () => {
    fixture.componentInstance['alternarEtapa']('estrutura_cliente', 'ESTRUTURA_CLIENTE');
    fixture.detectChanges();

    expect(fixture.componentInstance['progresso']()).toBe(33);
    expect(localStorage.getItem('docflow:ajuda:etapas-concluidas')).toContain('estrutura_cliente');
  });
});
