import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { AcessoNegadoComponent } from './acesso-negado.component';

describe('AcessoNegadoComponent (smoke)', () => {
  let fixture: ComponentFixture<AcessoNegadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcessoNegadoComponent],
      providers: [provideRouter([]), lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(AcessoNegadoComponent);
    fixture.detectChanges();
  });

  it('renderiza a mensagem de acesso negado', () => {
    expect(fixture.nativeElement.textContent).toContain('Acesso negado');
  });
});
