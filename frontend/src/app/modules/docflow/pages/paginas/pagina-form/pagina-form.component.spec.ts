import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { PaginaFormComponent } from './pagina-form.component';

describe('PaginaFormComponent (smoke)', () => {
  let fixture: ComponentFixture<PaginaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(PaginaFormComponent);
    fixture.detectChanges();
  });

  it('renderiza sem erros em modo novo', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('form começa inválido (campos obrigatórios)', () => {
    expect(fixture.componentInstance['form'].valid).toBe(false);
  });

  it('hasUnsavedChanges retorna false antes de modificar', () => {
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);
  });
});
