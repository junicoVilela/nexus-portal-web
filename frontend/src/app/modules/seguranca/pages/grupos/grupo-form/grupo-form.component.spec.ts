import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { GrupoFormComponent } from './grupo-form.component';

describe('GrupoFormComponent (smoke)', () => {
  let fixture: ComponentFixture<GrupoFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrupoFormComponent],
      providers: [provideRouter([]), lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(GrupoFormComponent);
    fixture.detectChanges();
  });

  it('cria em modo novo', () => {
    expect(fixture.componentInstance['editId']()).toBeUndefined();
    expect(fixture.componentInstance['form'].valid).toBe(false);
  });

  it('código exige maiúsculas/underscore', () => {
    const form = fixture.componentInstance['form'];
    form.patchValue({ nome: 'Grupo X', codigo: 'minuscula' });
    expect(form.controls.codigo.valid).toBe(false);
    form.patchValue({ codigo: 'GRUPO_X' });
    expect(form.controls.codigo.valid).toBe(true);
  });
});
