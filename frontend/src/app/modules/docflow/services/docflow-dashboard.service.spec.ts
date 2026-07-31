import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DocFlowDashboardService } from './docflow-dashboard.service';

const GENERATED_BASE = '/api/v1/docflow';

describe('DocFlowDashboardService', () => {
  let service: DocFlowDashboardService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocFlowDashboardService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DocFlowDashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carrega o resumo operacional consolidado no backend', fakeAsync(() => {
    service.resumo().subscribe(response => expect(response.totalPaginas).toBe(12));
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/dashboard/resumo`);
    expect(req.request.method).toBe('GET');
    req.flush({ totalPaginas: 12 });
    tick();
  }));
});
