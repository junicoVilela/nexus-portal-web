import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { SegurancaHomeComponent } from './seguranca-home.component';

describe('SegurancaHomeComponent (smoke)', () => {
  let fixture: ComponentFixture<SegurancaHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegurancaHomeComponent],
      providers: [provideRouter([]), lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(SegurancaHomeComponent);
    fixture.detectChanges();
  });

  it('renderiza o cabeçalho da home', () => {
    expect(fixture.nativeElement.textContent).toContain('Segurança');
  });
});
