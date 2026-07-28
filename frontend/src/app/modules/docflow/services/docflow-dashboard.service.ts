import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { DocFlowDashboardResumo } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DocFlowDashboardService {
  private readonly base = `${environment.apiUrl}/dashboard`;

  constructor(private readonly http: HttpClient) {}

  resumo(): Observable<DocFlowDashboardResumo> {
    return this.http.get<DocFlowDashboardResumo>(`${this.base}/resumo`);
  }
}
