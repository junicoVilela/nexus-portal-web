import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
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

  it('carrega a biblioteca global paginada', fakeAsync(() => {
    fixture = TestBed.createComponent(MidiasComponent);
    fixture.detectChanges();
    tick();

    const req = http.expectOne(r => r.url.startsWith('/api/v1/docflow/paginas/anexos'));
    expect(req.request.url).toContain('page=1');
    expect(req.request.url).toContain('size=24');
    req.flush({ items: [], page: 1, size: 24, totalItems: 0, totalPages: 0, first: true, last: true });
    tick();
  }));
});
