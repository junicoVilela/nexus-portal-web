import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { UsuariosListComponent } from './usuarios-list.component';

describe('UsuariosListComponent (smoke)', () => {
  let fixture: ComponentFixture<UsuariosListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuariosListComponent],
      providers: [provideRouter([]), lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(UsuariosListComponent);
    fixture.detectChanges();
  });

  it('cria e renderiza o título', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Usuários');
  });
});
