import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingBarService } from '@shared/ui';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('X-Silent-Loading')) return next(req);
  const bar = inject(LoadingBarService);
  bar.start();
  return next(req).pipe(finalize(() => bar.end()));
};
