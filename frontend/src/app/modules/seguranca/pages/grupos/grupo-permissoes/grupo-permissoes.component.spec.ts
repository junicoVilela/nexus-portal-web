import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { GrupoPermissoesComponent } from './grupo-permissoes.component';

describe('GrupoPermissoesComponent (smoke)', () => {
  let fixture: ComponentFixture<GrupoPermissoesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrupoPermissoesComponent],
      providers: [
        provideRouter([]),
        lucideTestIcons,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'grupo-admin' }) } },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(GrupoPermissoesComponent);
    fixture.detectChanges();
  });

  it('cria com grupo válido', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
