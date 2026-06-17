import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';
export type AccentPreset = 'blue' | 'purple' | 'green' | 'rose' | 'amber';

const STORAGE_KEY = 'portal-theme';
const ACCENT_KEY = 'portal-accent';
const ATTR = 'data-theme';
const ACCENT_ATTR = 'data-accent';

export const ACCENT_PRESETS: Record<AccentPreset, { label: string; light: string; dark: string }> = {
  blue: { label: 'Azul', light: '#2563eb', dark: '#3b82f6' },
  purple: { label: 'Roxo', light: '#7c3aed', dark: '#8b5cf6' },
  green: { label: 'Verde', light: '#16a34a', dark: '#22c55e' },
  rose: { label: 'Rosa', light: '#e11d48', dark: '#f43f5e' },
  amber: { label: 'Âmbar', light: '#d97706', dark: '#f59e0b' },
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>('light');
  private readonly _accent = signal<AccentPreset>('blue');
  readonly theme = this._theme.asReadonly();
  readonly accent = this._accent.asReadonly();

  /** Call once at app bootstrap. */
  init(): void {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial: Theme =
      stored ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.apply(initial);
    const storedAccent = (localStorage.getItem(ACCENT_KEY) as AccentPreset | null) ?? 'blue';
    this.applyAccent(storedAccent in ACCENT_PRESETS ? storedAccent : 'blue');
  }

  toggle(): void {
    this.apply(this._theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this.apply(theme);
  }

  setAccent(accent: AccentPreset): void {
    this.applyAccent(accent);
  }

  private apply(theme: Theme): void {
    this._theme.set(theme);
    document.documentElement.setAttribute(ATTR, theme);
    localStorage.setItem(STORAGE_KEY, theme);
    this.applyAccent(this._accent());
  }

  private applyAccent(accent: AccentPreset): void {
    this._accent.set(accent);
    const preset = ACCENT_PRESETS[accent];
    const value = this._theme() === 'dark' ? preset.dark : preset.light;
    document.documentElement.style.setProperty('--accent', value);
    document.documentElement.setAttribute(ACCENT_ATTR, accent);
    localStorage.setItem(ACCENT_KEY, accent);
  }
}
