import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const STORAGE_KEY = 'portal-theme';

  const lightMql = {
    matches: false,
    media: '',
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;

  const darkMql = {
    matches: true,
    media: '',
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
    spyOn(window, 'matchMedia').and.returnValue(lightMql);
    TestBed.configureTestingModule({ providers: [ThemeService] });
  });

  it('initializes with light when no preference and no storage', () => {
    const matchMedia = window.matchMedia as jasmine.Spy;

    const svc = TestBed.inject(ThemeService);
    svc.init();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });

  it('initializes with dark when prefers-color-scheme=dark', () => {
    (window.matchMedia as jasmine.Spy).and.returnValue(darkMql);

    const svc = TestBed.inject(ThemeService);
    svc.init();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('prefers stored value over system preference', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    const svc = TestBed.inject(ThemeService);
    svc.init();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggle switches theme and persists', () => {
    const svc = TestBed.inject(ThemeService);
    svc.init();
    svc.toggle();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
    svc.toggle();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
  });
});
