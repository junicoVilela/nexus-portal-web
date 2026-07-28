import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { RevisoesComponent } from './revisoes.component';

describe('RevisoesComponent', () => {
  let fixture: ComponentFixture<RevisoesComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevisoesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        lucideTestIcons,
        { provide: AuthService, useValue: { currentUser: () => 'revisor' } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta somente páginas em revisão, priorizando as mais antigas', () => {
    fixture = TestBed.createComponent(RevisoesComponent);
    fixture.detectChanges();

    const req = http.expectOne(r => r.url === '/api/doc-flow/paginas');
    expect(req.request.params.get('status')).toBe('EM_REVISAO');
    expect(req.request.params.get('sort')).toBe('updatedAt');
    expect(req.request.params.get('dir')).toBe('ASC');
    req.flush({ items: [], page: 1, size: 12, totalItems: 0, totalPages: 0, first: true, last: true });
  });
});
