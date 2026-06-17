import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { MatrizComponent } from './matriz.component';

describe('MatrizComponent (smoke)', () => {
  let fixture: ComponentFixture<MatrizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatrizComponent],
      providers: [provideRouter([]), lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(MatrizComponent);
    fixture.detectChanges();
  });

  it('cria e exibe título da matriz', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Matriz de segurança');
  });

  it('form de domínio valida pattern de código', () => {
    const f = fixture.componentInstance['formDominio'];
    f.patchValue({ nome: 'X', codigo: 'minusculo' });
    expect(f.controls.codigo.valid).toBe(false);
    f.patchValue({ codigo: 'MEU_DOM' });
    expect(f.controls.codigo.valid).toBe(true);
  });
});
