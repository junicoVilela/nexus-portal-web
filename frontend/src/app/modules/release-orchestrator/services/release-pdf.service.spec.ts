import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReleasePdfService } from './release-pdf.service';

const BASE = '/api/v1/release-orchestrator/releases';

describe('ReleasePdfService', () => {
  let service: ReleasePdfService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReleasePdfService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReleasePdfService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('gerar() requests blob with tipo query', () => {
    service.gerar('r1', 'INTERNO').subscribe();
    const req = http.expectOne(`${BASE}/r1/pdf?tipo=INTERNO`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('download() triggers blob URL, anchor click and revoke', () => {
    const createUrlSpy = spyOn(window.URL, 'createObjectURL').and.returnValue('blob:fake');
    const revokeSpy = spyOn(window.URL, 'revokeObjectURL');
    const anchor = document.createElement('a');
    const clickSpy = spyOn(anchor, 'click');
    spyOn(document, 'createElement').and.returnValue(anchor);

    service.download('r1', 'CLIENTE', 'rel.pdf');
    http.expectOne(`${BASE}/r1/pdf?tipo=CLIENTE`).flush(new Blob());

    expect(createUrlSpy).toHaveBeenCalled();
    expect(anchor.href).toContain('blob:fake');
    expect(anchor.download).toBe('rel.pdf');
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith('blob:fake');
  });
});
