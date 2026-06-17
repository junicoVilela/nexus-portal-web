import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';

class AuthStub {
  valid = true;
  clearSpy = jasmine.createSpy('clearSession');
  isTokenValid(): boolean {
    return this.valid;
  }
  clearSession(): void {
    this.clearSpy();
  }
}

describe('authGuard', () => {
  let auth: AuthStub;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useClass: AuthStub }],
    });
    auth = TestBed.inject(AuthService) as unknown as AuthStub;
  });

  it('returns true when token is valid', () => {
    auth.valid = true;
    const result = TestBed.runInInjectionContext(() => authGuard(null as never, null as never));
    expect(result).toBe(true);
  });

  it('clears session and returns /login UrlTree when token is invalid', () => {
    auth.valid = false;
    const result = TestBed.runInInjectionContext(() => authGuard(null as never, null as never)) as UrlTree;
    expect(auth.clearSpy).toHaveBeenCalled();
    expect(result instanceof UrlTree).toBe(true);
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result)).toBe('/login');
  });
});

describe('guestGuard', () => {
  let auth: AuthStub;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useClass: AuthStub }],
    });
    auth = TestBed.inject(AuthService) as unknown as AuthStub;
  });

  it('returns true when no valid token', () => {
    auth.valid = false;
    const result = TestBed.runInInjectionContext(() => guestGuard(null as never, null as never));
    expect(result).toBe(true);
  });

  it('redirects to / when already authenticated', () => {
    auth.valid = true;
    const result = TestBed.runInInjectionContext(() => guestGuard(null as never, null as never)) as UrlTree;
    expect(result instanceof UrlTree).toBe(true);
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result)).toBe('/');
  });
});
