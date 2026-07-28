import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { MidiasComponent } from './midias.component';

describe('MidiasComponent', () => {
  let fixture: ComponentFixture<MidiasComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MidiasComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), lucideTestIcons],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carrega a biblioteca global paginada', () => {
    fixture = TestBed.createComponent(MidiasComponent);
    fixture.detectChanges();

    const req = http.expectOne(r => r.url === '/api/doc-flow/paginas/anexos');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('24');
    req.flush({ items: [], page: 1, size: 24, totalItems: 0, totalPages: 0, first: true, last: true });
  });
});
