import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { UsuarioFormComponent } from './usuario-form.component';

describe('UsuarioFormComponent (smoke)', () => {
  let fixture: ComponentFixture<UsuarioFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioFormComponent],
      providers: [provideRouter([]), lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(UsuarioFormComponent);
    fixture.detectChanges();
  });

  it('cria em modo novo (sem :id)', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance['editId']()).toBeUndefined();
  });

  it('form começa inválido (nome/login/email obrigatórios)', () => {
    expect(fixture.componentInstance['form'].valid).toBe(false);
  });

  it('form fica válido após preencher campos obrigatórios', () => {
    fixture.componentInstance['form'].patchValue({
      nome: 'Fulano',
      login: 'fulano',
      email: 'fulano@x.com',
    });
    expect(fixture.componentInstance['form'].valid).toBe(true);
  });
});
