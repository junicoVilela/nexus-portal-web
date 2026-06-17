import { HttpErrorResponse } from '@angular/common/http';
import { classificarErro } from './error-classifier';

describe('classificarErro', () => {
  it('returns "generic" for non-HttpErrorResponse values', () => {
    expect(classificarErro(null)).toBe('generic');
    expect(classificarErro(undefined)).toBe('generic');
    expect(classificarErro(new Error('boom'))).toBe('generic');
    expect(classificarErro('string error')).toBe('generic');
  });

  it('returns "network" for status 0', () => {
    const err = new HttpErrorResponse({ status: 0 });
    expect(classificarErro(err)).toBe('network');
  });

  it('returns "permission" for 401 and 403', () => {
    expect(classificarErro(new HttpErrorResponse({ status: 401 }))).toBe('permission');
    expect(classificarErro(new HttpErrorResponse({ status: 403 }))).toBe('permission');
  });

  it('returns "notfound" for 404', () => {
    expect(classificarErro(new HttpErrorResponse({ status: 404 }))).toBe('notfound');
  });

  it('returns "server" for 5xx', () => {
    expect(classificarErro(new HttpErrorResponse({ status: 500 }))).toBe('server');
    expect(classificarErro(new HttpErrorResponse({ status: 502 }))).toBe('server');
    expect(classificarErro(new HttpErrorResponse({ status: 503 }))).toBe('server');
  });

  it('returns "generic" for other 4xx not handled', () => {
    expect(classificarErro(new HttpErrorResponse({ status: 400 }))).toBe('generic');
    expect(classificarErro(new HttpErrorResponse({ status: 409 }))).toBe('generic');
    expect(classificarErro(new HttpErrorResponse({ status: 422 }))).toBe('generic');
  });
});
