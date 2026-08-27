import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import {
  LucideAngularModule,
  House,
  FileText,
  Tag,
  Shield,
  Construction,
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
  Layers,
  Users,
  Network,
  Lock,
  Upload,
  Trash2,
  ImageOff,
  Sparkles,
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
            Construction,
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
            Layers,
            Users,
            Network,
            Lock,
            Upload,
            Trash2,
            ImageOff,
            Sparkles,
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
    expect(ids).toContain('nav-rel');
    expect(ids).toContain('nav-seg');
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

  it('ativa o menu no topo no DocFlow e no Orchestrator, e marca Segurança no workspace', async () => {
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/doc-flow/clientes');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.shell').classList).toContain('shell--module-nav-top');
    expect(fixture.nativeElement.querySelector('.shell__workspace strong').textContent.trim()).toBe(
      'DocFlow',
    );
    expect(fixture.nativeElement.querySelector('.shell__crumb').textContent.trim()).toBe('Clientes');

    await router.navigateByUrl('/release-orchestrator/releases');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.shell').classList).toContain('shell--module-nav-top');
    expect(fixture.nativeElement.querySelector('.shell__workspace strong').textContent.trim()).toBe(
      'Release Orchestrator',
    );

    await router.navigateByUrl('/seguranca/usuarios');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.shell').classList).not.toContain('shell--module-nav-top');
    expect(fixture.nativeElement.querySelector('.shell__workspace strong').textContent.trim()).toBe(
      'Segurança',
    );
  });
});
