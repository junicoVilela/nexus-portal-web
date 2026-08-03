import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { GruposListComponent } from './grupos-list.component';

describe('GruposListComponent (smoke)', () => {
  let fixture: ComponentFixture<GruposListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GruposListComponent],
      providers: [provideRouter([]), lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(GruposListComponent);
    fixture.detectChanges();
  });

  it('cria e renderiza o título', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Grupos');
  });
});
