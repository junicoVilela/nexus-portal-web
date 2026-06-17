import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { ReleaseFormComponent } from './release-form.component';

describe('ReleaseFormComponent (smoke)', () => {
  let fixture: ComponentFixture<ReleaseFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReleaseFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(ReleaseFormComponent);
    fixture.detectChanges();
  });

  it('renderiza form vazio em modo novo', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('form começa inválido (produto + versão + título obrigatórios)', () => {
    expect(fixture.componentInstance['form'].valid).toBe(false);
  });

  it('versão válida + demais campos preenchidos torna form válido', () => {
    fixture.componentInstance['form'].patchValue({
      produtoId: 'p1',
      versao: '1.2.3',
      titulo: 'Release X',
      tipo: 'MAJOR',
    });
    expect(fixture.componentInstance['form'].valid).toBe(true);
  });
});
