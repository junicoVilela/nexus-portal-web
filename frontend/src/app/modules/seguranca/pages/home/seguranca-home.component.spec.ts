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

  it('organiza as ferramentas por área de segurança', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Identidades e acessos');
    expect(text).toContain('Governança e políticas');
    expect(text).toContain('Monitoramento e auditoria');
    expect(fixture.nativeElement.querySelectorAll('.seg-home__category').length).toBe(3);
  });
});
