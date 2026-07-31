import { Injectable, Injector } from '@angular/core';
import { defer, map, Observable } from 'rxjs';
import { resumo2 as resumoDashboardSdk } from '../../../api/generated/sdk.gen';
import { DocFlowDashboardResumo } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DocFlowDashboardService {
  constructor(private readonly injector: Injector) {}

  resumo(): Observable<DocFlowDashboardResumo> {
    return defer(() => resumoDashboardSdk({ injector: this.injector })).pipe(
      map(resposta => resposta.data as DocFlowDashboardResumo),
    );
  }
}
