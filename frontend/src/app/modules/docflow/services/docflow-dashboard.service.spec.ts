import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DocFlowDashboardService } from './docflow-dashboard.service';

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

  it('carrega o resumo operacional consolidado no backend', () => {
    service.resumo().subscribe(response => expect(response.totalPaginas).toBe(12));

    const req = http.expectOne('/api/doc-flow/dashboard/resumo');
    expect(req.request.method).toBe('GET');
    req.flush({ totalPaginas: 12 });
  });
});
