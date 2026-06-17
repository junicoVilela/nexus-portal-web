import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import {
  LucideAngularModule,
  House,
  FileText,
  Tag,
  Shield,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  LogOut,
  Check,
  ArrowRight,
  User,
  Settings,
  Plus,
  X,
  ChevronDown,
  Inbox,
  LayoutDashboard,
  Users,
  Network,
  Lock,
  Upload,
  Trash2,
  ImageOff,
} from 'lucide-angular';

import { AppShellComponent } from './app-shell.component';
import { CommandPaletteService } from '@shared/ui';
import { ThemeService } from '@core/theme/theme.service';

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  let palette: CommandPaletteService;
  let theme: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        importProvidersFrom(
          LucideAngularModule.pick({
            House,
            FileText,
            Tag,
            Shield,
            Search,
            Bell,
            Sun,
            Moon,
            ChevronRight,
            LogOut,
            Check,
            ArrowRight,
            User,
            Settings,
            Plus,
            X,
            ChevronDown,
            Inbox,
            LayoutDashboard,
            Users,
            Network,
            Lock,
            Upload,
            Trash2,
            ImageOff,
          }),
        ),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AppShellComponent);
    palette = TestBed.inject(CommandPaletteService);
    theme = TestBed.inject(ThemeService);
    fixture.detectChanges();
  });

  it('registers shell navigation commands under "shell" namespace', () => {
    const ids = palette.results().map(c => c.id);
    expect(ids).toContain('nav-home');
    expect(ids).toContain('nav-doc');
    expect(ids).toContain('theme');
  });

  it('theme command toggles theme service', () => {
    const before = theme.theme();
    const themeCmd = palette.results().find(c => c.id === 'theme')!;
    themeCmd.action?.();
    expect(theme.theme()).not.toBe(before);
    themeCmd.action?.();
    expect(theme.theme()).toBe(before);
  });
});
