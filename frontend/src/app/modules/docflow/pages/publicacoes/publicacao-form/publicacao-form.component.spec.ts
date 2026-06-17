import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { PublicacaoFormComponent } from './publicacao-form.component';

describe('PublicacaoFormComponent (smoke)', () => {
  let fixture: ComponentFixture<PublicacaoFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicacaoFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(PublicacaoFormComponent);
    fixture.detectChanges();
  });

  it('renderiza sem erros', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('form começa inválido (clienteId + versao obrigatórios)', () => {
    expect(fixture.componentInstance.form.valid).toBe(false);
  });
});
