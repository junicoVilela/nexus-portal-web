import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { EscoposComponent } from './escopos.component';

describe('EscoposComponent (smoke)', () => {
  let fixture: ComponentFixture<EscoposComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EscoposComponent],
      providers: [provideRouter([]), lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(EscoposComponent);
    fixture.detectChanges();
  });

  it('cria com modo usuário por padrão', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance['modo']()).toBe('usuario');
  });

  it('alternarModo("grupo") muda a aba', () => {
    fixture.componentInstance['alternarModo']('grupo');
    expect(fixture.componentInstance['modo']()).toBe('grupo');
  });
});
