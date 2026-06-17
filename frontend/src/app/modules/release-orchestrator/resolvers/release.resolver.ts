import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ReleaseService } from '../services/release.service';
import { Release } from '../models/release.model';

export const releaseResolver: ResolveFn<Release | null> = route => {
  const id = route.paramMap.get('id');
  if (!id) return of(null);
  return inject(ReleaseService)
    .buscarPorId(id)
    .pipe(catchError(() => of(null)));
};
