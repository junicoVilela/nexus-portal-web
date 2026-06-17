import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { ClienteFormComponent } from './cliente-form.component';

describe('ClienteFormComponent (smoke)', () => {
  let fixture: ComponentFixture<ClienteFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(ClienteFormComponent);
    fixture.detectChanges();
  });

  it('renderiza form vazio em modo novo', () => {
    expect(fixture.nativeElement).toBeTruthy();
    expect(fixture.componentInstance['form'].value.nome).toBe('');
  });

  it('form começa inválido (nome obrigatório)', () => {
    expect(fixture.componentInstance['form'].valid).toBe(false);
  });

  it('form fica válido após preencher nome', () => {
    fixture.componentInstance['form'].patchValue({ nome: 'Cliente X' });
    expect(fixture.componentInstance['form'].valid).toBe(true);
  });
});
