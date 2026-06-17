# Softon Portal Web — Phase 2a Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish Phase 1, build the remaining UI primitives needed for module pages, ship the `<ui-list-page>` and `<ui-form-page>` templates, and prove them by migrating the entire **Administração** module to the new design system. After this plan, Administração looks premium end-to-end and the patterns are reusable for DocFlow / Release Orchestrator in Phase 2b / 2c.

**Architecture:** Same as Phase 1 — Tailwind v4 + lucide-angular + selected PrimeNG + design system in `shared/ui/`. Templates are container components that consume the existing primitives. Module pages migrate by swapping presentation while preserving their existing service/state logic.

**Tech Stack:** Angular 21.2, TypeScript 5.9, Tailwind v4, PrimeNG 21, lucide-angular 1.0, Karma + Jasmine.

**Reference spec:** `docs/superpowers/specs/2026-06-07-portal-redesign-premium-design.md`
**Phase 1 plan:** `docs/superpowers/plans/2026-06-07-portal-redesign-foundation.md`

**Checkpoints:**
- ✅ Checkpoint A: Phase 1 polish merged (CommandPalette merge API, transition smoothness, registry cleanup). After Task 3.
- ✅ Checkpoint B: New primitives ready (Select, Switch, Checkbox, Chip, PageHeader, EmptyState, Breadcrumb). After Task 7.
- ✅ Checkpoint C: List + Form templates ready. After Task 9.
- ✅ Checkpoint D: Administração sub-shell + home redesigned. After Task 10.
- ✅ Checkpoint E: Administração fully migrated. After Task 14.
- ✅ Checkpoint F: Spec coverage gaps closed + smoke pass. After Task 16.

**Skip git commits:** User opted to skip all `git add` / `git commit` steps throughout. Subagents must NOT run git commands.

---

## File Structure

**New files:**
```
frontend/src/app/shared/ui/
├── select/
│   ├── select.component.ts
│   ├── select.component.html
│   ├── select.component.css
│   ├── select.component.spec.ts
│   └── index.ts
├── switch/                  (same 5 files)
├── checkbox/                (same 5 files)
├── chip/                    (same 5 files)
├── page-header/             (same 5 files)
├── empty-state/             (same 5 files)
└── breadcrumb/              (same 5 files)

frontend/src/app/shared/layouts/
├── list-page/
│   ├── list-page.component.ts
│   ├── list-page.component.html
│   ├── list-page.component.css
│   ├── list-page.component.spec.ts
│   └── index.ts
├── form-page/               (same 5 files)
└── index.ts
```

**Modified files:**
```
frontend/src/app/
├── shared/ui/
│   ├── command-palette/
│   │   ├── command-palette.service.ts          (add registerMany + unregister)
│   │   └── command-palette.service.spec.ts     (extend with merge specs)
│   ├── card/card.component.css                 (overlay transition fix)
│   └── index.ts                                 (export new primitives + layouts)
├── core/
│   ├── config/portal-modules.registry.ts       (drop unused `color` field)
│   ├── layout/shell/app-shell.component.css    (overlay transition fix for sidebar active)
│   └── layout/shell/app-shell.component.spec.ts (NEW — gap fill from Phase 1 review)
├── modules/
│   ├── dashboard/pages/home/
│   │   └── home.component.spec.ts              (NEW — gap fill)
│   └── administracao/
│       ├── shell/
│       │   ├── administracao-shell.component.ts   (rewrite)
│       │   ├── administracao-shell.component.html (rewrite)
│       │   └── administracao-shell.component.css  (rewrite)
│       ├── home/
│       │   ├── administracao-home.component.ts   (rewrite)
│       │   ├── administracao-home.component.html (rewrite)
│       │   └── administracao-home.component.css  (rewrite)
│       ├── usuarios/usuarios.component.ts         (rewrite, separate template/css)
│       ├── usuarios/usuarios.component.html       (NEW)
│       ├── usuarios/usuarios.component.css        (NEW)
│       ├── grupos/grupos.component.ts             (rewrite)
│       ├── grupos/grupos.component.html           (rewrite)
│       ├── grupos/grupos.component.css            (rewrite)
│       ├── permissoes/permissoes.component.ts     (rewrite)
│       ├── permissoes/permissoes.component.html   (rewrite)
│       ├── permissoes/permissoes.component.css    (rewrite)
│       ├── configuracoes/configuracoes.component.ts   (rewrite)
│       ├── configuracoes/configuracoes.component.html (rewrite)
│       └── configuracoes/configuracoes.component.css  (rewrite)
└── shared/ui/skeleton/
    └── skeleton.component.spec.ts                (NEW — gap fill)
```

---

## Task 1: CommandPalette merge API

**Goal:** `CommandPaletteService` must support multiple registrars (shell + modules) without overwriting each other. After this, modules can `registerMany(id, cmds)` to add their commands; navigating away should `unregister(id)` to remove them.

**Files:**
- Modify: `frontend/src/app/shared/ui/command-palette/command-palette.service.ts`
- Modify: `frontend/src/app/shared/ui/command-palette/command-palette.service.spec.ts`

- [ ] **Step 1: Write the failing tests — append to `command-palette.service.spec.ts`**

Add inside the existing `describe('CommandPaletteService', ...)` block, after the last existing `it`:

```typescript
  it('registerMany merges commands by namespace id', () => {
    svc.registerMany('shell', [
      { id: 'shell:home', label: 'Início', group: 'Navegação' },
    ]);
    svc.registerMany('docflow', [
      { id: 'docflow:new', label: 'Novo manual', group: 'DocFlow' },
    ]);
    expect(svc.results().length).toBe(2);
    expect(svc.results().map(c => c.id).sort()).toEqual(['docflow:new', 'shell:home']);
  });

  it('registerMany with the same namespace replaces only that namespace', () => {
    svc.registerMany('shell', [
      { id: 'shell:home', label: 'Início', group: 'Navegação' },
    ]);
    svc.registerMany('docflow', [
      { id: 'docflow:new', label: 'Novo manual', group: 'DocFlow' },
    ]);
    svc.registerMany('shell', [
      { id: 'shell:home2', label: 'Início v2', group: 'Navegação' },
    ]);
    expect(svc.results().length).toBe(2);
    expect(svc.results().map(c => c.id).sort()).toEqual(['docflow:new', 'shell:home2']);
  });

  it('unregister removes only that namespace', () => {
    svc.registerMany('shell', [{ id: 'shell:home', label: 'X', group: 'Y' }]);
    svc.registerMany('docflow', [{ id: 'docflow:new', label: 'X', group: 'Y' }]);
    svc.unregister('shell');
    expect(svc.results().map(c => c.id)).toEqual(['docflow:new']);
  });

  it('legacy register() is preserved as namespace "_legacy"', () => {
    svc.register([{ id: 'home', label: 'X', group: 'Y' }]);
    svc.registerMany('docflow', [{ id: 'd', label: 'X', group: 'Y' }]);
    expect(svc.results().map(c => c.id).sort()).toEqual(['d', 'home']);
  });
```

- [ ] **Step 2: Run, confirm fail**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/command-palette.service.spec.ts'
```
Expected: 4 new specs FAIL (`registerMany is not a function`, etc.). The 3 existing specs still PASS.

- [ ] **Step 3: Replace `command-palette.service.ts` content**

Replace entire file with:

```typescript
import { Injectable, computed, signal } from '@angular/core';

export interface PaletteCommand {
  id: string;
  label: string;
  group: string;
  route?: string;
  action?: () => void;
}

const LEGACY_NS = '_legacy';

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private readonly _open = signal(false);
  private readonly _ns = signal<Record<string, PaletteCommand[]>>({});
  readonly query = signal<string>('');

  readonly isOpen = this._open.asReadonly();
  readonly results = computed<PaletteCommand[]>(() => {
    const q = this.query().toLowerCase().trim();
    const all = Object.values(this._ns()).flat();
    if (!q) return all;
    return all.filter(c => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
  });

  /** Replaces commands for the given namespace. Other namespaces are untouched. */
  registerMany(namespace: string, cmds: PaletteCommand[]): void {
    this._ns.update(prev => ({ ...prev, [namespace]: cmds }));
  }

  /** Removes all commands registered under the given namespace. */
  unregister(namespace: string): void {
    this._ns.update(prev => {
      const next = { ...prev };
      delete next[namespace];
      return next;
    });
  }

  /** Legacy API — equivalent to `registerMany('_legacy', cmds)`. Kept for back-compat. */
  register(cmds: PaletteCommand[]): void {
    this.registerMany(LEGACY_NS, cmds);
  }

  open(): void { this._open.set(true); }
  close(): void { this.query.set(''); this._open.set(false); }
  toggle(): void { this._open() ? this.close() : this.open(); }
}
```

- [ ] **Step 4: Run all tests, confirm pass**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/command-palette.service.spec.ts'
```
Expected: 7/7 PASS.

Also run the full suite:

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
```
Expected: 30/30 PASS (26 existing + 4 new). No regression in `AppShellComponent` which calls `palette.register(...)` — the legacy method still works.

- [ ] **Step 5: Update AppShell to use the namespaced API** — modify `frontend/src/app/core/layout/shell/app-shell.component.ts` `ngOnInit`:

Change the line `this.palette.register([...])` to `this.palette.registerMany('shell', [...])`. The array contents stay the same.

- [ ] **Step 6: Re-run full suite**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
```
Expected: 30/30 PASS.

---

## Task 2: Smooth transitions on theme toggle (Card + Sidebar active)

**Goal:** The Phase 1 review flagged that `<ui-card>` in dark mode uses a `linear-gradient(...)` background that snaps on theme toggle, and the sidebar active item has the same issue. CSS cannot transition gradient values directly. Fix using an overlay pseudo-element whose `opacity` transitions smoothly.

**Files:**
- Modify: `frontend/src/app/shared/ui/card/card.component.css`
- Modify: `frontend/src/app/core/layout/shell/app-shell.component.css`

- [ ] **Step 1: Update Card CSS**

Open `frontend/src/app/shared/ui/card/card.component.css` and replace the existing `[data-theme="dark"] .ui-card { ... }` rule with the overlay technique:

```css
.ui-card { position: relative; isolation: isolate; }
.ui-card::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.01));
  opacity: 0;
  transition: opacity var(--motion-slow) var(--ease-out);
  pointer-events: none;
  z-index: -1;
}
[data-theme="dark"] .ui-card::before { opacity: 1; }
[data-theme="dark"] .ui-card { backdrop-filter: blur(8px); box-shadow: var(--shadow-xs), inset 0 1px 0 rgba(255,255,255,.04); }
```

Keep the rest of the file (padding variants, interactive variants, light defaults) intact.

- [ ] **Step 2: Update Sidebar active CSS**

Open `frontend/src/app/core/layout/shell/app-shell.component.css`. The current rule `.shell__nav-link--active { background: var(--sidebar-active-bg); ... }` snaps because `--sidebar-active-bg` becomes a gradient in dark mode.

Replace the `.shell__nav-link` and `.shell__nav-link--active` rules with the overlay technique:

```css
.shell__nav-link {
  position: relative;
  display: flex; align-items: center; gap: 11px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  font: 600 13px/1 var(--font-body);
  color: var(--sidebar-text);
  text-decoration: none;
  transition: color var(--motion-default) var(--ease-out);
  isolation: isolate;
}
.shell__nav-link::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  background: var(--sidebar-active-bg);
  opacity: 0;
  transition: opacity var(--motion-default) var(--ease-out);
  pointer-events: none;
  z-index: -1;
}
.shell__nav-link:hover { color: var(--text); }
.shell__nav-link:hover::before { background: var(--surface-2); opacity: 1; }
.shell__nav-link--active { color: var(--sidebar-active-text); }
.shell__nav-link--active::before { opacity: 1; }
.shell__nav-link--active::after {
  content: '';
  position: absolute; left: -10px; top: 22%; bottom: 22%;
  width: 3px;
  background: var(--sidebar-active-bar);
  border-radius: 0 3px 3px 0;
}
```

Replace the existing two pseudo-element rules (`.shell__nav-link--active::before` and `.shell__nav-link:hover`) — the new block above subsumes both.

- [ ] **Step 3: Build to verify CSS parses**

```bash
cd frontend && npm run build -- --configuration=development
```
Expected: clean build.

- [ ] **Step 4: Run full tests, confirm no regression**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
```
Expected: 30/30 PASS.

- [ ] **Step 5: Manual smoke (optional)** — toggle theme in browser; cards should fade instead of snapping.

---

## Task 3: Cleanup `PORTAL_MODULES.color` field

**Goal:** The `color` field on `PortalModule` is unused after the Phase 1 home redesign and is a latent leak (someone may bind `[style.color]="m.color"` and bypass the design system). Drop it. The interface becomes leaner.

**Files:**
- Modify: `frontend/src/app/core/config/portal-modules.registry.ts`

- [ ] **Step 1: Confirm `color` is unused**

```bash
grep -rE "\.color\b|m\.color|module\.color" frontend/src/app --include="*.ts" --include="*.html"
```
Expected: no usage references (only the field declaration itself).

- [ ] **Step 2: Drop the field**

Edit `frontend/src/app/core/config/portal-modules.registry.ts`. Remove the `readonly color: string;` line from the `PortalModule` interface AND remove the `color: '#xxxxxx',` line from each entry of `PORTAL_MODULES`.

The resulting `PortalModule` interface should have exactly: `id`, `label`, `icon`, `route`, `description`, `available`.

- [ ] **Step 3: Build to verify**

```bash
cd frontend && npm run build -- --configuration=development
```
Expected: clean build.

- [ ] **Step 4: Tests**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
```
Expected: 30/30 PASS.

---

### ✅ Checkpoint A — Phase 1 polish complete

CommandPalette has merge API. Transitions are smooth. Registry is clean. Pause for review.

---

## Task 4: shared/ui/select + shared/ui/switch

**Goal:** Two more form primitives. Select is a custom-styled native `<select>` driven by `ControlValueAccessor`. Switch is a toggle for boolean form fields.

**Files:**
- Create: `frontend/src/app/shared/ui/select/{select.component.ts, .html, .css, .spec.ts, index.ts}`
- Create: `frontend/src/app/shared/ui/switch/{switch.component.ts, .html, .css, .spec.ts, index.ts}`

### Select

- [ ] **Step 1: Failing test — `select.component.spec.ts`**

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SelectComponent, SelectOption } from './select.component';

@Component({
  standalone: true,
  imports: [SelectComponent, ReactiveFormsModule],
  template: `<ui-select label="Função" [options]="opts" [formControl]="ctrl" />`,
})
class HostComponent {
  ctrl = new FormControl('EDITOR');
  opts: SelectOption[] = [
    { value: 'EDITOR', label: 'Editor' },
    { value: 'ADMIN',  label: 'Administrador' },
  ];
}

describe('SelectComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders label and option list', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Função');
    expect(text).toContain('Editor');
    expect(text).toContain('Administrador');
  });

  it('two-way binds with FormControl', () => {
    const sel: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    sel.value = 'ADMIN';
    sel.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.ctrl.value).toBe('ADMIN');
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/select.component.spec.ts'
```

- [ ] **Step 3: `select.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

export interface SelectOption<T = string> { value: T; label: string; }

@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './select.component.html',
  styleUrl: './select.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true },
  ],
})
export class SelectComponent implements ControlValueAccessor {
  readonly label = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly options = input.required<SelectOption[]>();
  readonly placeholder = input<string | null>(null);

  protected readonly value = signal<string>('');
  protected readonly disabledSig = signal(false);

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: string): void { this.value.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabledSig.set(isDisabled); }

  protected onSelect(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.value.set(v);
    this.onChange(v);
  }
}
```

- [ ] **Step 4: `select.component.html`**

```html
<label class="ui-select">
  @if (label()) { <span class="ui-select__label">{{ label() }}</span> }
  <span class="ui-select__field" [class.ui-select__field--error]="!!error()">
    <select
      [value]="value()"
      [disabled]="disabledSig()"
      (change)="onSelect($event)"
      (blur)="value.set(value())"
    >
      @if (placeholder()) { <option value="" disabled hidden>{{ placeholder() }}</option> }
      @for (opt of options(); track opt.value) {
        <option [value]="opt.value">{{ opt.label }}</option>
      }
    </select>
    <lucide-icon name="ChevronDown" class="ui-select__chev" />
  </span>
  @if (error()) {
    <span class="ui-select__error">{{ error() }}</span>
  } @else if (hint()) {
    <span class="ui-select__hint">{{ hint() }}</span>
  }
</label>
```

- [ ] **Step 5: `select.component.css`**

```css
.ui-select { display: flex; flex-direction: column; gap: 6px; font-family: var(--font-body); }
.ui-select__label { font-size: 12px; font-weight: 600; color: var(--text); }
.ui-select__field {
  position: relative;
  display: flex; align-items: center;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1.5px solid var(--border);
  transition: border-color var(--motion-default) var(--ease-out),
              box-shadow   var(--motion-default) var(--ease-out);
}
.ui-select__field:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-ring);
}
.ui-select__field--error { border-color: var(--danger); }
.ui-select__field select {
  appearance: none; -webkit-appearance: none; -moz-appearance: none;
  flex: 1;
  background: transparent;
  border: 0; outline: 0;
  padding: 9px 36px 9px 12px;
  font: 500 13.5px/1.4 var(--font-body);
  color: var(--text);
  cursor: pointer;
}
.ui-select__chev {
  position: absolute; right: 10px;
  width: 14px; height: 14px;
  color: var(--text-muted);
  pointer-events: none;
}
.ui-select__hint  { font-size: 11.5px; color: var(--text-muted); }
.ui-select__error { font-size: 11.5px; color: var(--danger); }
```

- [ ] **Step 6: `select/index.ts`**

```typescript
export * from './select.component';
```

- [ ] **Step 7: Run, expect 2/2 PASS**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/select.component.spec.ts'
```

### Switch

- [ ] **Step 8: `switch.component.spec.ts`**

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SwitchComponent } from './switch.component';

@Component({
  standalone: true,
  imports: [SwitchComponent, ReactiveFormsModule],
  template: `<ui-switch label="Ativo" [formControl]="ctrl" />`,
})
class HostComponent {
  ctrl = new FormControl(false);
}

describe('SwitchComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders label', () => {
    expect(fixture.nativeElement.textContent).toContain('Ativo');
  });

  it('toggles FormControl value on click', () => {
    const cb: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    cb.click();
    expect(fixture.componentInstance.ctrl.value).toBe(true);
    cb.click();
    expect(fixture.componentInstance.ctrl.value).toBe(false);
  });
});
```

- [ ] **Step 9: `switch.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ui-switch',
  standalone: true,
  templateUrl: './switch.component.html',
  styleUrl: './switch.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SwitchComponent), multi: true },
  ],
})
export class SwitchComponent implements ControlValueAccessor {
  readonly label = input<string | null>(null);

  protected readonly checked = signal(false);
  protected readonly disabledSig = signal(false);

  private onChange: (v: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: boolean): void { this.checked.set(!!v); }
  registerOnChange(fn: (v: boolean) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabledSig.set(isDisabled); }

  protected onToggle(event: Event): void {
    const v = (event.target as HTMLInputElement).checked;
    this.checked.set(v);
    this.onChange(v);
    this.onTouched();
  }
}
```

- [ ] **Step 10: `switch.component.html`**

```html
<label class="ui-switch">
  <input
    type="checkbox"
    [checked]="checked()"
    [disabled]="disabledSig()"
    (change)="onToggle($event)"
  />
  <span class="ui-switch__track"><span class="ui-switch__thumb"></span></span>
  @if (label()) { <span class="ui-switch__label">{{ label() }}</span> }
</label>
```

- [ ] **Step 11: `switch.component.css`**

```css
.ui-switch {
  display: inline-flex; align-items: center; gap: 10px;
  cursor: pointer;
  font-family: var(--font-body);
  user-select: none;
}
.ui-switch input { position: absolute; opacity: 0; pointer-events: none; }
.ui-switch__track {
  width: 36px; height: 20px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  position: relative;
  transition: background-color var(--motion-default) var(--ease-out),
              border-color var(--motion-default) var(--ease-out);
}
.ui-switch__thumb {
  position: absolute; top: 1px; left: 1px;
  width: 16px; height: 16px;
  background: var(--surface);
  border-radius: 50%;
  box-shadow: var(--shadow-xs);
  transition: transform var(--motion-default) var(--ease-out);
}
.ui-switch input:checked + .ui-switch__track { background: var(--accent); border-color: var(--accent); }
.ui-switch input:checked + .ui-switch__track .ui-switch__thumb { transform: translateX(16px); background: #fff; }
.ui-switch input:focus-visible + .ui-switch__track { box-shadow: 0 0 0 3px var(--accent-ring); }
.ui-switch__label { font: 600 13px/1 var(--font-body); color: var(--text); }
.ui-switch input:disabled + .ui-switch__track { opacity: .5; cursor: not-allowed; }
```

- [ ] **Step 12: `switch/index.ts`**

```typescript
export * from './switch.component';
```

- [ ] **Step 13: Update umbrella barrel `frontend/src/app/shared/ui/index.ts`**

Add two lines (alphabetical order with existing exports):

```typescript
export * from './select';
export * from './switch';
```

- [ ] **Step 14: Run all tests, expect 34/34 PASS**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
```

---

## Task 5: shared/ui/checkbox + shared/ui/chip

**Goal:** Checkbox (form-bound boolean) and Chip (decorative tag with optional remove).

**Files:**
- Create: `frontend/src/app/shared/ui/checkbox/{checkbox.component.ts, .html, .css, .spec.ts, index.ts}`
- Create: `frontend/src/app/shared/ui/chip/{chip.component.ts, .html, .css, .spec.ts, index.ts}`

### Checkbox

- [ ] **Step 1: `checkbox.component.spec.ts`**

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CheckboxComponent } from './checkbox.component';

@Component({
  standalone: true,
  imports: [CheckboxComponent, ReactiveFormsModule],
  template: `<ui-checkbox label="Aceitar" [formControl]="ctrl" />`,
})
class HostComponent { ctrl = new FormControl(false); }

describe('CheckboxComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });
  it('renders label', () => {
    expect(fixture.nativeElement.textContent).toContain('Aceitar');
  });
  it('toggles FormControl on click', () => {
    const cb: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    cb.click();
    expect(fixture.componentInstance.ctrl.value).toBe(true);
  });
});
```

- [ ] **Step 2: `checkbox.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'ui-checkbox',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CheckboxComponent), multi: true },
  ],
})
export class CheckboxComponent implements ControlValueAccessor {
  readonly label = input<string | null>(null);

  protected readonly checked = signal(false);
  protected readonly disabledSig = signal(false);

  private onChange: (v: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: boolean): void { this.checked.set(!!v); }
  registerOnChange(fn: (v: boolean) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabledSig.set(isDisabled); }

  protected onToggle(event: Event): void {
    const v = (event.target as HTMLInputElement).checked;
    this.checked.set(v);
    this.onChange(v);
    this.onTouched();
  }
}
```

- [ ] **Step 3: `checkbox.component.html`**

```html
<label class="ui-checkbox">
  <input
    type="checkbox"
    [checked]="checked()"
    [disabled]="disabledSig()"
    (change)="onToggle($event)"
  />
  <span class="ui-checkbox__box">
    @if (checked()) { <lucide-icon name="Check" /> }
  </span>
  @if (label()) { <span class="ui-checkbox__label">{{ label() }}</span> }
</label>
```

- [ ] **Step 4: `checkbox.component.css`**

```css
.ui-checkbox {
  display: inline-flex; align-items: center; gap: 8px;
  cursor: pointer;
  user-select: none;
  font-family: var(--font-body);
}
.ui-checkbox input { position: absolute; opacity: 0; pointer-events: none; }
.ui-checkbox__box {
  width: 18px; height: 18px;
  border: 1.5px solid var(--border-strong);
  border-radius: var(--radius-xs);
  background: var(--surface);
  display: flex; align-items: center; justify-content: center;
  transition: background-color var(--motion-default) var(--ease-out),
              border-color var(--motion-default) var(--ease-out);
}
.ui-checkbox__box lucide-icon { width: 12px; height: 12px; color: #fff; }
.ui-checkbox input:checked + .ui-checkbox__box { background: var(--accent); border-color: var(--accent); }
.ui-checkbox input:focus-visible + .ui-checkbox__box { box-shadow: 0 0 0 3px var(--accent-ring); }
.ui-checkbox input:disabled + .ui-checkbox__box { opacity: .5; cursor: not-allowed; }
.ui-checkbox__label { font: 500 13px/1.3 var(--font-body); color: var(--text); }
```

- [ ] **Step 5: `checkbox/index.ts`**

```typescript
export * from './checkbox.component';
```

### Chip

- [ ] **Step 6: `chip.component.spec.ts`**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChipComponent } from './chip.component';

describe('ChipComponent', () => {
  let fixture: ComponentFixture<ChipComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChipComponent] }).compileComponents();
    fixture = TestBed.createComponent(ChipComponent);
  });
  it('renders with neutral tone by default', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ui-chip').classList.contains('ui-chip--neutral')).toBeTrue();
  });
  it('emits removed on click of remove button', () => {
    fixture.componentRef.setInput('removable', true);
    let removed = false;
    fixture.componentInstance.removed.subscribe(() => removed = true);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.ui-chip__remove').click();
    expect(removed).toBeTrue();
  });
});
```

- [ ] **Step 7: `chip.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export type ChipTone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger';

@Component({
  selector: 'ui-chip',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipComponent {
  readonly tone = input<ChipTone>('neutral');
  readonly removable = input(false);

  @Output() readonly removed = new EventEmitter<void>();
}
```

- [ ] **Step 8: `chip.component.html`**

```html
<span [class]="'ui-chip ui-chip--' + tone()">
  <span class="ui-chip__label"><ng-content /></span>
  @if (removable()) {
    <button type="button" class="ui-chip__remove" aria-label="Remover" (click)="removed.emit()">
      <lucide-icon name="X" />
    </button>
  }
</span>
```

- [ ] **Step 9: `chip.component.css`**

```css
.ui-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font: 500 12px/1 var(--font-body);
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
}
.ui-chip--accent  { background: var(--accent-soft);  color: var(--accent);  border-color: color-mix(in srgb, var(--accent) 30%, transparent); }
.ui-chip--success { background: var(--success-soft); color: var(--success); border-color: color-mix(in srgb, var(--success) 30%, transparent); }
.ui-chip--warn    { background: var(--warn-soft);    color: var(--warn);    border-color: color-mix(in srgb, var(--warn) 30%, transparent); }
.ui-chip--danger  { background: var(--danger-soft);  color: var(--danger);  border-color: color-mix(in srgb, var(--danger) 30%, transparent); }
.ui-chip__remove {
  width: 16px; height: 16px;
  border: 0; background: transparent;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: inherit;
  opacity: .65;
  border-radius: 50%;
  transition: opacity var(--motion-default) var(--ease-out), background-color var(--motion-default) var(--ease-out);
}
.ui-chip__remove:hover { opacity: 1; background: rgba(0,0,0,.06); }
.ui-chip__remove lucide-icon { width: 10px; height: 10px; }
```

- [ ] **Step 10: `chip/index.ts`**

```typescript
export * from './chip.component';
```

- [ ] **Step 11: Update umbrella `frontend/src/app/shared/ui/index.ts`**

Add (alphabetical):

```typescript
export * from './checkbox';
export * from './chip';
```

- [ ] **Step 12: Run all tests, expect 38/38 PASS**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
```

---

## Task 6: shared/ui/page-header + shared/ui/empty-state

**Goal:** Composite components used by templates. PageHeader bundles breadcrumb + title + subtitle + actions slot. EmptyState is centered icon + title + description + optional action slot.

**Files:**
- Create: `frontend/src/app/shared/ui/page-header/{page-header.component.ts, .html, .css, .spec.ts, index.ts}`
- Create: `frontend/src/app/shared/ui/empty-state/{empty-state.component.ts, .html, .css, .spec.ts, index.ts}`

### PageHeader

- [ ] **Step 1: `page-header.component.spec.ts`**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PageHeaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(PageHeaderComponent);
  });
  it('renders title and subtitle', () => {
    fixture.componentRef.setInput('title', 'Usuários');
    fixture.componentRef.setInput('subtitle', '128 contas ativas');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Usuários');
    expect(fixture.nativeElement.textContent).toContain('128 contas ativas');
  });
});
```

- [ ] **Step 2: `page-header.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-page-header',
  standalone: true,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
}
```

- [ ] **Step 3: `page-header.component.html`**

```html
<header class="ui-page-header">
  <div class="ui-page-header__crumb"><ng-content select="[breadcrumb]" /></div>
  <div class="ui-page-header__body">
    <div class="ui-page-header__text">
      <h1 class="ui-page-header__title">{{ title() }}</h1>
      @if (subtitle()) { <p class="ui-page-header__sub">{{ subtitle() }}</p> }
    </div>
    <div class="ui-page-header__actions"><ng-content select="[actions]" /></div>
  </div>
</header>
```

- [ ] **Step 4: `page-header.component.css`**

```css
.ui-page-header { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.ui-page-header__crumb:empty { display: none; }
.ui-page-header__body {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 16px;
  flex-wrap: wrap;
}
.ui-page-header__text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.ui-page-header__title {
  font: 700 24px/1.15 var(--font-display);
  letter-spacing: -0.025em;
  color: var(--text);
}
.ui-page-header__sub { font: 500 13.5px/1.5 var(--font-body); color: var(--text-muted); max-width: 720px; }
.ui-page-header__actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex-shrink: 0; }
.ui-page-header__actions:empty { display: none; }
```

- [ ] **Step 5: `page-header/index.ts`**

```typescript
export * from './page-header.component';
```

### EmptyState

- [ ] **Step 6: `empty-state.component.spec.ts`**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EmptyStateComponent] }).compileComponents();
    fixture = TestBed.createComponent(EmptyStateComponent);
  });
  it('renders title and description', () => {
    fixture.componentRef.setInput('title', 'Sem registros');
    fixture.componentRef.setInput('description', 'Crie o primeiro agora');
    fixture.detectChanges();
    const t = fixture.nativeElement.textContent;
    expect(t).toContain('Sem registros');
    expect(t).toContain('Crie o primeiro agora');
  });
});
```

- [ ] **Step 7: `empty-state.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input<string>('Inbox');
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
}
```

- [ ] **Step 8: `empty-state.component.html`**

```html
<div class="ui-empty">
  <span class="ui-empty__ico"><lucide-icon [name]="icon()" /></span>
  <h3 class="ui-empty__title">{{ title() }}</h3>
  @if (description()) { <p class="ui-empty__desc">{{ description() }}</p> }
  <div class="ui-empty__actions"><ng-content /></div>
</div>
```

- [ ] **Step 9: `empty-state.component.css`**

```css
.ui-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px;
  padding: 48px 24px;
  border: 1.5px dashed var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--surface-2);
  text-align: center;
  color: var(--text-muted);
  font-family: var(--font-body);
}
.ui-empty__ico {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-md);
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-subtle);
  margin-bottom: 4px;
}
.ui-empty__ico lucide-icon { width: 20px; height: 20px; }
.ui-empty__title { font: 700 15px/1.2 var(--font-body); color: var(--text); margin-top: 4px; }
.ui-empty__desc  { font: 500 13px/1.5 var(--font-body); color: var(--text-muted); max-width: 360px; }
.ui-empty__actions { display: flex; gap: 8px; margin-top: 12px; }
.ui-empty__actions:empty { display: none; }
```

- [ ] **Step 10: `empty-state/index.ts`**

```typescript
export * from './empty-state.component';
```

- [ ] **Step 11: Update umbrella `frontend/src/app/shared/ui/index.ts`**

Add (alphabetical):

```typescript
export * from './empty-state';
export * from './page-header';
```

- [ ] **Step 12: Register icon `Inbox` in `frontend/src/app/app.config.ts`**

In the `LucideAngularModule.pick({...})` block, add `Inbox` (alphabetical or wherever fits the existing list).

```typescript
import { ..., Inbox, ... } from 'lucide-angular';
```

And add `Inbox` to the `pick({...})` object.

- [ ] **Step 13: Run all tests, expect 40/40 PASS**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
```

---

## Task 7: shared/ui/breadcrumb

**Goal:** Reusable breadcrumb component for module sub-pages.

**Files:**
- Create: `frontend/src/app/shared/ui/breadcrumb/{breadcrumb.component.ts, .html, .css, .spec.ts, index.ts}`

- [ ] **Step 1: `breadcrumb.component.spec.ts`**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from './breadcrumb.component';

describe('BreadcrumbComponent', () => {
  let fixture: ComponentFixture<BreadcrumbComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(BreadcrumbComponent);
  });
  it('renders each item label', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Administração', route: '/administracao' },
      { label: 'Usuários' },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Administração');
    expect(text).toContain('Usuários');
  });
});
```

- [ ] **Step 2: `breadcrumb.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'ui-breadcrumb',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbComponent {
  readonly items = input.required<BreadcrumbItem[]>();
}
```

- [ ] **Step 3: `breadcrumb.component.html`**

```html
<nav class="ui-crumb" aria-label="Trilha de navegação">
  @for (item of items(); track item.label; let last = $last) {
    @if (item.route && !last) {
      <a class="ui-crumb__link" [routerLink]="item.route">{{ item.label }}</a>
    } @else {
      <span class="ui-crumb__current" [attr.aria-current]="last ? 'page' : null">{{ item.label }}</span>
    }
    @if (!last) {
      <lucide-icon name="ChevronRight" class="ui-crumb__sep" />
    }
  }
</nav>
```

- [ ] **Step 4: `breadcrumb.component.css`**

```css
.ui-crumb {
  display: inline-flex; align-items: center; gap: 6px;
  font: 500 12.5px/1 var(--font-body);
  color: var(--text-muted);
}
.ui-crumb__link {
  color: var(--text-muted);
  text-decoration: none;
  transition: color var(--motion-default) var(--ease-out);
}
.ui-crumb__link:hover { color: var(--accent); }
.ui-crumb__current { color: var(--text); font-weight: 600; }
.ui-crumb__sep { width: 12px; height: 12px; opacity: 0.6; }
```

- [ ] **Step 5: `breadcrumb/index.ts`**

```typescript
export * from './breadcrumb.component';
```

- [ ] **Step 6: Update umbrella `frontend/src/app/shared/ui/index.ts`**

Add (alphabetical):

```typescript
export * from './breadcrumb';
```

- [ ] **Step 7: Run tests, expect 41/41 PASS**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
```

---

### ✅ Checkpoint B — All primitives ready

Select, Switch, Checkbox, Chip, PageHeader, EmptyState, Breadcrumb in `shared/ui/`. Pause for review.

---

## Task 8: ListPage template

**Goal:** A container component that bundles the standard list-page shape: page header (title + actions slot) → optional filter bar slot → content slot (table) → embedded loading / empty / error states. Used by Administração list pages and later by all module list pages.

**Files:**
- Create: `frontend/src/app/shared/layouts/list-page/{list-page.component.ts, .html, .css, .spec.ts, index.ts}`

- [ ] **Step 1: `list-page.component.spec.ts`**

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListPageComponent } from './list-page.component';

@Component({
  standalone: true,
  imports: [ListPageComponent],
  template: `
    <ui-list-page title="Usuários" [loading]="loading" [isEmpty]="isEmpty" [error]="error">
      <span actions>Ação</span>
      <span filters>Filtros</span>
      <span>Conteúdo</span>
    </ui-list-page>
  `,
})
class HostComponent {
  loading = false;
  isEmpty = false;
  error: string | null = null;
}

describe('ListPageComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders title and content slot in default state', () => {
    const t = fixture.nativeElement.textContent;
    expect(t).toContain('Usuários');
    expect(t).toContain('Conteúdo');
    expect(t).toContain('Filtros');
    expect(t).toContain('Ação');
  });

  it('hides content and shows loading skeleton when loading', () => {
    fixture.componentInstance.loading = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ui-list__loading')).toBeTruthy();
  });

  it('shows empty state when isEmpty', () => {
    fixture.componentInstance.isEmpty = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ui-empty-state')).toBeTruthy();
  });

  it('shows error message when error is set', () => {
    fixture.componentInstance.error = 'Falha ao carregar.';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Falha ao carregar.');
  });
});
```

- [ ] **Step 2: `list-page.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EmptyStateComponent, PageHeaderComponent } from '@shared/ui';

@Component({
  selector: 'ui-list-page',
  standalone: true,
  imports: [PageHeaderComponent, EmptyStateComponent],
  templateUrl: './list-page.component.html',
  styleUrl: './list-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPageComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly loading = input(false);
  readonly isEmpty = input(false);
  readonly error = input<string | null>(null);
  readonly emptyTitle = input<string>('Sem registros');
  readonly emptyDescription = input<string | null>(null);
}
```

- [ ] **Step 3: `list-page.component.html`**

```html
<div class="ui-list">
  <ui-page-header [title]="title()" [subtitle]="subtitle()">
    <ng-content select="[breadcrumb]" ngProjectAs="[breadcrumb]" />
    <ng-content select="[actions]" ngProjectAs="[actions]" />
  </ui-page-header>

  <div class="ui-list__filters"><ng-content select="[filters]" /></div>

  @if (error()) {
    <div class="ui-list__error" role="alert">{{ error() }}</div>
  } @else if (loading()) {
    <div class="ui-list__loading" aria-busy="true">
      @for (i of [0,1,2,3,4]; track i) { <div class="ui-list__skeleton-row"></div> }
    </div>
  } @else if (isEmpty()) {
    <ui-empty-state [title]="emptyTitle()" [description]="emptyDescription()" />
  } @else {
    <div class="ui-list__content"><ng-content /></div>
  }
</div>
```

- [ ] **Step 4: `list-page.component.css`**

```css
.ui-list { display: flex; flex-direction: column; gap: 16px; padding: 28px 32px; }
.ui-list__filters:empty { display: none; }
.ui-list__filters {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px;
  box-shadow: var(--shadow-xs);
}
.ui-list__content { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-xs); }
.ui-list__error {
  background: var(--danger-soft);
  color: var(--danger);
  padding: 12px 14px;
  border-radius: var(--radius);
  border: 1px solid color-mix(in srgb, var(--danger) 30%, transparent);
  font: 500 13px var(--font-body);
}
.ui-list__loading { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); }
.ui-list__skeleton-row {
  height: 40px;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
  animation: ui-list-shimmer 1.5s ease-in-out infinite;
}
@keyframes ui-list-shimmer { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }

@media (max-width: 768px) { .ui-list { padding: 18px; } }
```

- [ ] **Step 5: `list-page/index.ts`**

```typescript
export * from './list-page.component';
```

- [ ] **Step 6: Create `frontend/src/app/shared/layouts/index.ts`** (new top-level barrel for layouts)

```typescript
export * from './list-page';
```

- [ ] **Step 7: Run tests, expect 45/45 PASS**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
```

---

## Task 9: FormPage template

**Goal:** Container for create/edit forms: header → optional sections wrapper → sticky footer with submit/cancel.

**Files:**
- Create: `frontend/src/app/shared/layouts/form-page/{form-page.component.ts, .html, .css, .spec.ts, index.ts}`

- [ ] **Step 1: `form-page.component.spec.ts`**

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormPageComponent } from './form-page.component';

@Component({
  standalone: true,
  imports: [FormPageComponent],
  template: `
    <ui-form-page title="Novo usuário" [saving]="saving" (cancelled)="onCancel()" (saved)="onSave()">
      <div>Campos</div>
    </ui-form-page>
  `,
})
class HostComponent {
  saving = false;
  cancelCount = 0;
  saveCount = 0;
  onCancel() { this.cancelCount++; }
  onSave()   { this.saveCount++; }
}

describe('FormPageComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders title and projected content', () => {
    const t = fixture.nativeElement.textContent;
    expect(t).toContain('Novo usuário');
    expect(t).toContain('Campos');
  });

  it('emits cancelled when cancel clicked', () => {
    const btns = fixture.nativeElement.querySelectorAll('button');
    const cancel = Array.from(btns).find((b: Element) => b.textContent?.includes('Cancelar')) as HTMLButtonElement;
    cancel.click();
    expect(fixture.componentInstance.cancelCount).toBe(1);
  });

  it('emits saved when save clicked', () => {
    const btns = fixture.nativeElement.querySelectorAll('button');
    const save = Array.from(btns).find((b: Element) => b.textContent?.includes('Salvar')) as HTMLButtonElement;
    save.click();
    expect(fixture.componentInstance.saveCount).toBe(1);
  });
});
```

- [ ] **Step 2: `form-page.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { ButtonComponent, PageHeaderComponent } from '@shared/ui';

@Component({
  selector: 'ui-form-page',
  standalone: true,
  imports: [PageHeaderComponent, ButtonComponent],
  templateUrl: './form-page.component.html',
  styleUrl: './form-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormPageComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly saving = input(false);
  readonly canSave = input(true);
  readonly saveLabel = input<string>('Salvar');
  readonly cancelLabel = input<string>('Cancelar');

  @Output() readonly saved = new EventEmitter<void>();
  @Output() readonly cancelled = new EventEmitter<void>();
}
```

- [ ] **Step 3: `form-page.component.html`**

```html
<div class="ui-form-page">
  <ui-page-header [title]="title()" [subtitle]="subtitle()">
    <ng-content select="[breadcrumb]" ngProjectAs="[breadcrumb]" />
  </ui-page-header>

  <div class="ui-form-page__body"><ng-content /></div>

  <footer class="ui-form-page__footer">
    <ui-button variant="secondary" (clicked)="cancelled.emit()">{{ cancelLabel() }}</ui-button>
    <ui-button [loading]="saving()" [disabled]="!canSave()" (clicked)="saved.emit()">{{ saveLabel() }}</ui-button>
  </footer>
</div>
```

- [ ] **Step 4: `form-page.component.css`**

```css
.ui-form-page { display: flex; flex-direction: column; gap: 18px; padding: 28px 32px 96px; }
.ui-form-page__body {
  display: flex; flex-direction: column; gap: 16px;
}
.ui-form-page__footer {
  position: sticky; bottom: 0; left: 0; right: 0;
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 32px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  box-shadow: 0 -8px 16px -10px rgba(15,23,42,.08);
  margin: 18px -32px 0;
}
[data-theme="dark"] .ui-form-page__footer { backdrop-filter: blur(20px); }
@media (max-width: 768px) {
  .ui-form-page { padding: 18px 18px 96px; }
  .ui-form-page__footer { padding: 14px 18px; margin: 18px -18px 0; }
}
```

- [ ] **Step 5: `form-page/index.ts`**

```typescript
export * from './form-page.component';
```

- [ ] **Step 6: Update `frontend/src/app/shared/layouts/index.ts`**

Add:

```typescript
export * from './form-page';
```

- [ ] **Step 7: Tests, expect 48/48 PASS**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
```

---

### ✅ Checkpoint C — Templates ready

`<ui-list-page>` and `<ui-form-page>` available from `@shared/layouts`. Pause for review.

---

## Task 10: Administração sub-shell + home redesign

**Goal:** Replace the admin sub-shell to use lucide icons and the new theming. Also redesign the admin "Visão geral" home to mirror the portal home pattern (hero + cards for each admin section).

**Files:**
- Modify: `frontend/src/app/modules/administracao/shell/administracao-shell.component.ts`
- Modify: `frontend/src/app/modules/administracao/shell/administracao-shell.component.html`
- Modify: `frontend/src/app/modules/administracao/shell/administracao-shell.component.css`
- Modify: `frontend/src/app/modules/administracao/home/administracao-home.component.ts`
- Modify: `frontend/src/app/modules/administracao/home/administracao-home.component.html`
- Modify: `frontend/src/app/modules/administracao/home/administracao-home.component.css`

### Sub-shell

- [ ] **Step 1: Replace `administracao-shell.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '@core/auth/services/auth.service';
import { CommandPaletteService } from '@shared/ui';

interface AdminNavItem { label: string; icon: string; route: string[]; exact?: boolean; }

@Component({
  selector: 'app-administracao-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './administracao-shell.component.html',
  styleUrl: './administracao-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministracaoShellComponent implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly palette = inject(CommandPaletteService);

  protected readonly navItems: AdminNavItem[] = [
    { label: 'Visão geral',   icon: 'LayoutDashboard', route: ['/administracao'], exact: true },
    { label: 'Usuários',      icon: 'Users',           route: ['/administracao', 'usuarios'] },
    { label: 'Grupos',        icon: 'Network',         route: ['/administracao', 'grupos'] },
    { label: 'Permissões',    icon: 'Lock',            route: ['/administracao', 'permissoes'] },
    { label: 'Configurações', icon: 'Settings',        route: ['/administracao', 'configuracoes'] },
  ];

  ngOnInit(): void {
    this.palette.registerMany('administracao', [
      { id: 'adm:users', label: 'Administração — Usuários',      group: 'Administração', route: '/administracao/usuarios' },
      { id: 'adm:groups', label: 'Administração — Grupos',       group: 'Administração', route: '/administracao/grupos' },
      { id: 'adm:perms', label: 'Administração — Permissões',    group: 'Administração', route: '/administracao/permissoes' },
      { id: 'adm:cfg',   label: 'Administração — Configurações', group: 'Administração', route: '/administracao/configuracoes' },
    ]);
  }

  ngOnDestroy(): void {
    this.palette.unregister('administracao');
  }
}
```

- [ ] **Step 2: Replace `administracao-shell.component.html`**

```html
<div class="adm-shell">
  <aside class="adm-shell__side" aria-label="Administração">
    <div class="adm-shell__title">Administração</div>
    <nav class="adm-shell__nav">
      @for (item of navItems; track item.route.join('/')) {
        <a
          class="adm-shell__nav-link"
          [routerLink]="item.route"
          routerLinkActive="adm-shell__nav-link--active"
          [routerLinkActiveOptions]="{ exact: !!item.exact }"
        >
          <lucide-icon [name]="item.icon" class="adm-shell__nav-icon" />
          <span>{{ item.label }}</span>
        </a>
      }
    </nav>
  </aside>
  <main class="adm-shell__main">
    <router-outlet />
  </main>
</div>
```

- [ ] **Step 3: Replace `administracao-shell.component.css`**

```css
.adm-shell {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 0;
  min-height: 100%;
}
.adm-shell__side {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 22px 14px;
  display: flex; flex-direction: column; gap: 10px;
}
.adm-shell__title {
  font: 700 11px/1 var(--font-body);
  letter-spacing: .12em; text-transform: uppercase;
  color: var(--text-subtle);
  padding: 0 8px 6px;
}
.adm-shell__nav { display: flex; flex-direction: column; gap: 2px; }
.adm-shell__nav-link {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  text-decoration: none;
  font: 600 13px/1 var(--font-body);
  transition: background-color var(--motion-default) var(--ease-out),
              color var(--motion-default) var(--ease-out);
  position: relative;
}
.adm-shell__nav-link:hover { background: var(--surface-2); color: var(--text); }
.adm-shell__nav-link--active { background: var(--accent-soft); color: var(--accent); }
.adm-shell__nav-icon { width: 16px; height: 16px; }
.adm-shell__main { min-width: 0; background: var(--bg); }
@media (max-width: 900px) {
  .adm-shell { grid-template-columns: 1fr; }
  .adm-shell__side { border-right: 0; border-bottom: 1px solid var(--border); }
  .adm-shell__nav { flex-direction: row; flex-wrap: wrap; }
  .adm-shell__nav-link { flex: 1 0 auto; }
}
```

- [ ] **Step 4: Register new icons in `frontend/src/app/app.config.ts`**

Add `LayoutDashboard`, `Users`, `Network`, `Lock` to both the import and the `LucideAngularModule.pick({...})` block.

### Admin Home

- [ ] **Step 5: Replace `administracao-home.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { CardComponent } from '@shared/ui';

interface AdminTile { id: string; label: string; description: string; icon: string; route: string; }

@Component({
  selector: 'app-administracao-home',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, CardComponent],
  templateUrl: './administracao-home.component.html',
  styleUrl: './administracao-home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministracaoHomeComponent {
  protected readonly tiles: AdminTile[] = [
    { id: 'usuarios',      label: 'Usuários',      description: 'Contas internas, perfis e ativação.',         icon: 'Users',    route: '/administracao/usuarios' },
    { id: 'grupos',        label: 'Grupos',        description: 'Coleções para gerenciar acesso em lote.',     icon: 'Network',  route: '/administracao/grupos' },
    { id: 'permissoes',    label: 'Permissões',    description: 'Catálogo de permissões disponíveis no portal.', icon: 'Lock',  route: '/administracao/permissoes' },
    { id: 'configuracoes', label: 'Configurações', description: 'Logo da empresa e outras preferências globais.', icon: 'Settings', route: '/administracao/configuracoes' },
  ];
}
```

- [ ] **Step 6: Replace `administracao-home.component.html`**

```html
<div class="adm-home">
  <header class="adm-home__hero">
    <h1>Administração do portal</h1>
    <p>Gestão de identidades, grupos, permissões e configurações globais.</p>
  </header>

  <div class="adm-home__grid">
    @for (tile of tiles; track tile.id) {
      <ui-card padding="md" [interactive]="true">
        <a class="adm-home__tile" [routerLink]="tile.route">
          <span class="adm-home__ico"><lucide-icon [name]="tile.icon" /></span>
          <span class="adm-home__body">
            <span class="adm-home__name">{{ tile.label }}</span>
            <span class="adm-home__desc">{{ tile.description }}</span>
          </span>
          <lucide-icon name="ArrowRight" class="adm-home__arrow" />
        </a>
      </ui-card>
    }
  </div>
</div>
```

- [ ] **Step 7: Replace `administracao-home.component.css`**

```css
.adm-home { padding: 28px 32px; display: flex; flex-direction: column; gap: 24px; }
.adm-home__hero h1 { font: 700 24px/1.2 var(--font-display); letter-spacing: -0.025em; color: var(--text); margin-bottom: 6px; }
.adm-home__hero p { font: 500 13.5px/1.5 var(--font-body); color: var(--text-muted); max-width: 560px; }

.adm-home__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
.adm-home__tile {
  display: flex; align-items: flex-start; gap: 14px;
  text-decoration: none; color: inherit;
  position: relative;
}
.adm-home__ico {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius);
  background: var(--accent-soft);
  color: var(--accent);
  flex-shrink: 0;
}
[data-theme="dark"] .adm-home__ico { background: var(--accent-grad); color: #fff; box-shadow: var(--glow); }
.adm-home__ico lucide-icon { width: 18px; height: 18px; }
.adm-home__body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.adm-home__name { font: 700 14px/1.2 var(--font-body); color: var(--text); }
.adm-home__desc { font: 500 12px/1.4 var(--font-body); color: var(--text-muted); }
.adm-home__arrow {
  position: absolute; top: 0; right: 0;
  width: 16px; height: 16px;
  color: var(--text-subtle);
  transition: transform var(--motion-default) var(--ease-out), color var(--motion-default) var(--ease-out);
}
.adm-home__tile:hover .adm-home__arrow { transform: translateX(3px); color: var(--accent); }
@media (max-width: 768px) { .adm-home { padding: 18px; } }
```

- [ ] **Step 8: Build + test**

```bash
cd frontend && npm run build -- --configuration=development && npm test -- --watch=false --browsers=ChromeHeadless
```
Expected: build clean. Tests 48/48 PASS.

---

### ✅ Checkpoint D — Administração shell + home redesigned

Pause for review.

---

## Task 11: Migrate `/administracao/usuarios`

**Goal:** Migrate the list page to use `<ui-list-page>`, `<ui-button>`, `<ui-input>`, `<ui-select>`, `<ui-badge>` — preserving the existing service/state logic (sort, pagination, filter, create form, status toggle). Move from inline template to separate `.html` and `.css`.

**Files:**
- Modify: `frontend/src/app/modules/administracao/usuarios/usuarios.component.ts`
- Create: `frontend/src/app/modules/administracao/usuarios/usuarios.component.html`
- Create: `frontend/src/app/modules/administracao/usuarios/usuarios.component.css`

- [ ] **Step 1: Replace `usuarios.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { UsuarioService } from '@modules/administracao/services/usuario.service';
import { TablePaginationComponent } from '@shared/components/table-pagination/table-pagination.component';
import { Usuario } from '@modules/administracao/models/usuario.model';
import { compactQueryParams, parsePositiveInt, parseSortDirection, SortDirection } from '@shared/utils/query-state';
import {
  BadgeComponent, ButtonComponent, InputComponent, SelectComponent, type SelectOption,
} from '@shared/ui';
import { ListPageComponent } from '@shared/layouts';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    ReactiveFormsModule, DatePipe, TablePaginationComponent,
    ListPageComponent, ButtonComponent, InputComponent, SelectComponent, BadgeComponent,
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuariosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly totalUsuarios = signal(0);
  protected readonly loading = signal(false);
  protected readonly errorMsg = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected readonly successMsg = signal<string | null>(null);

  protected usuariosPage = 1;
  protected usuariosPageSize = 10;
  protected usuariosSort = 'username';
  protected usuariosDir: SortDirection = 'ASC';

  protected readonly roleOptions: SelectOption[] = [
    { value: 'EDITOR',       label: 'EDITOR' },
    { value: 'ADMIN,EDITOR', label: 'ADMIN + EDITOR' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    nome: [''],
    email: [''],
    roles: ['EDITOR'],
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.usuariosSort = params.get('sort') ?? 'username';
      this.usuariosDir = parseSortDirection(params.get('dir'));
      this.usuariosPage = parsePositiveInt(params.get('page'), 1);
      this.usuariosPageSize = parsePositiveInt(params.get('size'), 10);
      this.carregar();
    });
  }

  protected carregar(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.usuarioService.listarUsuarios(this.usuariosPage, this.usuariosPageSize, this.usuariosSort, this.usuariosDir).subscribe({
      next: response => {
        this.usuarios.set(response.items);
        this.totalUsuarios.set(response.totalItems);
        this.usuariosPage = response.page;
        this.usuariosPageSize = response.size;
        this.loading.set(false);
      },
      error: () => { this.errorMsg.set('Erro ao carregar usuários.'); this.loading.set(false); },
    });
  }

  protected salvar(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    this.usuarioService.criarUsuario(raw).subscribe({
      next: () => { this.cancelar(); this.flashSuccess('Usuário criado.'); this.carregar(); },
      error: () => { this.saving.set(false); this.errorMsg.set('Erro ao criar usuário.'); },
    });
  }

  protected alterarStatus(u: Usuario): void {
    this.usuarioService.atualizarUsuario(u.id, { nome: u.nome, email: u.email, roles: u.roles, ativo: !u.ativo })
      .subscribe({
        next: () => { this.flashSuccess('Usuário atualizado.'); this.carregar(); },
        error: () => this.errorMsg.set('Erro ao atualizar.'),
      });
  }

  protected cancelar(): void {
    this.showForm.set(false);
    this.saving.set(false);
    this.form.reset({ roles: 'EDITOR' });
  }

  protected alterarPagina(page: number): void {
    this.usuariosPage = page;
    this.atualizarUrl();
  }

  protected alterarTamanhoPagina(size: number): void {
    this.usuariosPageSize = size;
    this.usuariosPage = 1;
    this.atualizarUrl();
  }

  protected ordenar(campo: string): void {
    if (this.usuariosSort === campo) {
      this.usuariosDir = this.usuariosDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.usuariosSort = campo;
      this.usuariosDir = 'ASC';
    }
    this.usuariosPage = 1;
    this.atualizarUrl();
  }

  protected indicacaoOrdenacao(campo: string): string {
    if (this.usuariosSort !== campo) return '↕';
    return this.usuariosDir === 'ASC' ? '↑' : '↓';
  }

  private flashSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 4000);
  }

  private atualizarUrl(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: compactQueryParams({
        sort: this.usuariosSort === 'username' && this.usuariosDir === 'ASC' ? null : this.usuariosSort,
        dir: this.usuariosSort === 'username' && this.usuariosDir === 'ASC' ? null : this.usuariosDir,
        page: this.usuariosPage,
        size: this.usuariosPageSize,
      }, { page: 1, size: 10 }),
    });
  }
}
```

- [ ] **Step 2: Create `usuarios.component.html`**

```html
<ui-list-page
  title="Usuários"
  [subtitle]="totalUsuarios() + ' contas com acesso à operação interna.'"
  [loading]="loading()"
  [isEmpty]="!loading() && totalUsuarios() === 0"
  [error]="errorMsg()"
  emptyTitle="Nenhum usuário cadastrado"
  emptyDescription="Cadastre o primeiro acesso editorial ou administrativo."
>
  <div actions>
    <ui-button icon="Plus" (clicked)="showForm.set(!showForm())">{{ showForm() ? 'Fechar' : 'Novo usuário' }}</ui-button>
  </div>

  @if (successMsg()) {
    <div filters class="usuarios__success" role="status">{{ successMsg() }}</div>
  }

  @if (showForm()) {
    <form class="usuarios__form" [formGroup]="form" (ngSubmit)="salvar()">
      <h3 class="usuarios__form-title">Novo acesso</h3>
      <p class="usuarios__form-sub">Cadastre usuários internos com perfil editorial ou administrativo.</p>
      <div class="usuarios__form-grid">
        <ui-input label="Username" formControlName="username" placeholder="usuario.softon" />
        <ui-input label="Nome" formControlName="nome" placeholder="Nome completo" />
        <ui-input label="E-mail" type="email" formControlName="email" placeholder="email@softon.com.br" />
        <ui-input label="Senha" type="password" formControlName="password" placeholder="••••••••" />
        <ui-select label="Função" [options]="roleOptions" formControlName="roles" />
      </div>
      <div class="usuarios__form-actions">
        <ui-button variant="secondary" type="button" (clicked)="cancelar()">Cancelar</ui-button>
        <ui-button type="submit" [loading]="saving()" [disabled]="form.invalid">Salvar</ui-button>
      </div>
    </form>
  }

  <table class="usuarios__table">
    <thead>
      <tr>
        <th class="usuarios__th-sort" (click)="ordenar('username')">Username <span>{{ indicacaoOrdenacao('username') }}</span></th>
        <th class="usuarios__th-sort" (click)="ordenar('nome')">Nome <span>{{ indicacaoOrdenacao('nome') }}</span></th>
        <th>Roles</th>
        <th class="usuarios__th-sort" (click)="ordenar('ativo')">Ativo <span>{{ indicacaoOrdenacao('ativo') }}</span></th>
        <th class="usuarios__th-sort" (click)="ordenar('createdAt')">Criado em <span>{{ indicacaoOrdenacao('createdAt') }}</span></th>
        <th class="usuarios__th-right">Ações</th>
      </tr>
    </thead>
    <tbody>
      @for (u of usuarios(); track u.id) {
        <tr>
          <td><strong>{{ u.username }}</strong></td>
          <td>{{ u.nome }}</td>
          <td><ui-badge tone="neutral">{{ u.roles }}</ui-badge></td>
          <td><ui-badge [tone]="u.ativo ? 'success' : 'neutral'" [dot]="true">{{ u.ativo ? 'Ativo' : 'Inativo' }}</ui-badge></td>
          <td>{{ u.createdAt | date:'short' }}</td>
          <td class="usuarios__td-right">
            <ui-button variant="ghost" size="sm" (clicked)="alterarStatus(u)">{{ u.ativo ? 'Desativar' : 'Ativar' }}</ui-button>
          </td>
        </tr>
      }
    </tbody>
  </table>
  <app-table-pagination
    [totalItems]="totalUsuarios()"
    [page]="usuariosPage"
    [pageSize]="usuariosPageSize"
    (pageChange)="alterarPagina($event)"
    (pageSizeChange)="alterarTamanhoPagina($event)"
  />
</ui-list-page>
```

- [ ] **Step 3: Create `usuarios.component.css`**

```css
.usuarios__success {
  background: var(--success-soft);
  color: var(--success);
  border: 1px solid color-mix(in srgb, var(--success) 30%, transparent);
  padding: 10px 14px;
  border-radius: var(--radius);
  font: 500 13px var(--font-body);
}
.usuarios__form {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 22px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: var(--shadow-xs);
  margin-bottom: 16px;
}
.usuarios__form-title { font: 700 14px/1.2 var(--font-display); color: var(--text); }
.usuarios__form-sub { font: 500 12.5px/1.4 var(--font-body); color: var(--text-muted); margin-bottom: 4px; }
.usuarios__form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.usuarios__form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 6px; }

.usuarios__table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13.5px;
}
.usuarios__table thead th {
  background: var(--surface-2);
  padding: 10px 16px;
  text-align: left;
  font: 700 11px/1 var(--font-body);
  letter-spacing: .06em; text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.usuarios__table tbody td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  vertical-align: middle;
}
.usuarios__table tbody tr:hover td { background: var(--surface-2); }
.usuarios__th-sort { cursor: pointer; user-select: none; }
.usuarios__th-sort span { opacity: .5; font-size: 10px; margin-left: 4px; }
.usuarios__th-right, .usuarios__td-right { text-align: right; }

@media (max-width: 1100px) { .usuarios__form-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 700px)  { .usuarios__form-grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 4: Register `Plus` icon if not present** in `frontend/src/app/app.config.ts`

(Plus was already added in Phase 1 Task 4 — verify and add if missing.)

- [ ] **Step 5: Build + test**

```bash
cd frontend && npm run build -- --configuration=development && npm test -- --watch=false --browsers=ChromeHeadless
```
Expected: clean build, 48/48 PASS.

- [ ] **Step 6: Manual smoke (optional)** — open `/administracao/usuarios`, sort columns, open form, create user, toggle status.

---

## Task 12: Migrate `/administracao/grupos`

**Goal:** Same pattern as usuarios but adapted to grupos data shape. Read existing `grupos.component.ts` first to learn the data, then mirror the migration approach.

**Files:**
- Modify: `frontend/src/app/modules/administracao/grupos/grupos.component.ts`
- Modify: `frontend/src/app/modules/administracao/grupos/grupos.component.html`
- Modify: `frontend/src/app/modules/administracao/grupos/grupos.component.css`

- [ ] **Step 1: Read existing component**

```bash
cat frontend/src/app/modules/administracao/grupos/grupos.component.ts
cat frontend/src/app/modules/administracao/grupos/grupos.component.html
cat frontend/src/app/modules/administracao/services/grupo.service.ts
```

Note the API surface — what columns are shown, what actions, what filters, whether it has a create form.

- [ ] **Step 2: Rewrite using the same approach as `usuarios`**

Apply the structural changes from Task 11 to `grupos.component.ts`, `grupos.component.html`, `grupos.component.css`:

- Use `ChangeDetectionStrategy.OnPush`.
- Switch instance fields to signals (`loading`, `errorMsg`, `successMsg`, `showForm`, etc.).
- Wrap presentation in `<ui-list-page>` with `actions` slot for "Novo grupo" button.
- Use `<ui-input>` / `<ui-select>` in the create form if present.
- Use `<ui-button>` everywhere a `<button>` appears.
- Use `<ui-badge>` for status indicators.
- Use the same `.usuarios__table` / `.usuarios__form` styles in a new `.grupos__*` namespace (copy patterns; don't share CSS between modules).

Preserve the service calls and routing exactly as they are in the existing file.

If the existing file has features the plan didn't anticipate (e.g., delete action, edit modal, vinculo to permissoes), preserve them — just swap their presentation to the new primitives.

- [ ] **Step 3: Build + test**

```bash
cd frontend && npm run build -- --configuration=development && npm test -- --watch=false --browsers=ChromeHeadless
```
Expected: clean build, 48/48 PASS.

---

## Task 13: Migrate `/administracao/permissoes`

**Goal:** Same approach as Task 12 but for `permissoes`. The existing file is likely a stub or a simple list — preserve whatever it does and just upgrade presentation.

**Files:**
- Modify: `frontend/src/app/modules/administracao/permissoes/permissoes.component.ts`
- Modify: `frontend/src/app/modules/administracao/permissoes/permissoes.component.html`
- Modify: `frontend/src/app/modules/administracao/permissoes/permissoes.component.css`

- [ ] **Step 1: Read existing files**

```bash
cat frontend/src/app/modules/administracao/permissoes/permissoes.component.ts
cat frontend/src/app/modules/administracao/permissoes/permissoes.component.html
```

- [ ] **Step 2: Rewrite using `<ui-list-page>` + design system primitives**

Mirror the approach from Tasks 11-12. Preserve service calls. Use the `permissoes__*` CSS namespace.

If the page is a stub ("em construção"), wrap the placeholder in `<ui-list-page title="Permissões" [isEmpty]="true" emptyTitle="..." emptyDescription="..." />`.

- [ ] **Step 3: Build + test**

```bash
cd frontend && npm run build -- --configuration=development && npm test -- --watch=false --browsers=ChromeHeadless
```
Expected: clean build, 48/48 PASS.

---

## Task 14: Migrate `/administracao/configuracoes`

**Goal:** Migrate the configurações page (logo upload) to the new design system. Use `<ui-page-header>` + `<ui-card>` directly rather than `<ui-form-page>` — this page is a single-config artifact (logo upload + remove), not a traditional create/edit form with save/cancel semantics, so the form-page template would force misleading buttons.

Existing logic to preserve: `verificarLogoEmpresa()`, `onLogoEmpresaSelected()`, `removerLogoEmpresa()`, `flash()` message, `uploadingLogo` / `removingLogo` state.

**Files:**
- Modify: `frontend/src/app/modules/administracao/configuracoes/configuracoes.component.ts`
- Modify: `frontend/src/app/modules/administracao/configuracoes/configuracoes.component.html`
- Modify: `frontend/src/app/modules/administracao/configuracoes/configuracoes.component.css`

- [ ] **Step 1: Replace `configuracoes.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { ConfiguracaoService } from '@modules/administracao/services/configuracao.service';
import { ButtonComponent, CardComponent, PageHeaderComponent } from '@shared/ui';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [LucideAngularModule, PageHeaderComponent, CardComponent, ButtonComponent],
  templateUrl: './configuracoes.component.html',
  styleUrl: './configuracoes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracoesComponent implements OnInit {
  private readonly configuracaoService = inject(ConfiguracaoService);

  protected readonly logoEmpresaUrl = signal<string>('');
  protected readonly uploadingLogo = signal(false);
  protected readonly removingLogo = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly isError = signal(false);

  ngOnInit(): void {
    this.verificarLogoEmpresa();
  }

  private verificarLogoEmpresa(): void {
    this.configuracaoService.logoEmpresaExiste().subscribe(existe => {
      this.logoEmpresaUrl.set(existe ? `${this.configuracaoService.logoEmpresaUrl}?t=${Date.now()}` : '');
    });
  }

  protected onLogoEmpresaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingLogo.set(true);
    this.configuracaoService.uploadLogoEmpresa(file).subscribe({
      next: () => {
        this.logoEmpresaUrl.set(this.configuracaoService.logoEmpresaUrl + '?t=' + Date.now());
        this.uploadingLogo.set(false);
        this.flash('Logo da empresa atualizado com sucesso.');
      },
      error: () => { this.uploadingLogo.set(false); this.flash('Erro ao enviar logo.', true); },
    });
    input.value = '';
  }

  protected removerLogoEmpresa(): void {
    this.removingLogo.set(true);
    this.configuracaoService.removerLogoEmpresa().subscribe({
      next: () => { this.logoEmpresaUrl.set(''); this.removingLogo.set(false); this.flash('Logo removido.'); },
      error: () => { this.removingLogo.set(false); this.flash('Erro ao remover logo.', true); },
    });
  }

  private flash(msg: string, isError = false): void {
    this.message.set(msg);
    this.isError.set(isError);
    setTimeout(() => this.message.set(null), 4000);
  }
}
```

- [ ] **Step 2: Replace `configuracoes.component.html`**

```html
<div class="config">
  <ui-page-header title="Configurações" subtitle="Preferências globais do portal." />

  @if (message()) {
    <div class="config__msg" [class.config__msg--err]="isError()" role="status">{{ message() }}</div>
  }

  <ui-card padding="lg">
    <div class="config__row">
      <div class="config__col">
        <h3 class="config__title">Logo da empresa</h3>
        <p class="config__desc">Exibido no topo do portal e na tela de login. PNG ou SVG, fundo transparente, máximo 256 KB.</p>
        <div class="config__actions">
          <label class="config__upload">
            <input type="file" accept="image/*" (change)="onLogoEmpresaSelected($event)" hidden #file>
            <ui-button icon="Upload" [loading]="uploadingLogo()" (clicked)="file.click()">
              {{ logoEmpresaUrl() ? 'Trocar logo' : 'Enviar logo' }}
            </ui-button>
          </label>
          @if (logoEmpresaUrl()) {
            <ui-button variant="danger" icon="Trash2" [loading]="removingLogo()" (clicked)="removerLogoEmpresa()">Remover</ui-button>
          }
        </div>
      </div>
      <div class="config__preview">
        @if (logoEmpresaUrl()) {
          <img [src]="logoEmpresaUrl()" alt="Logo atual">
        } @else {
          <div class="config__placeholder"><lucide-icon name="ImageOff" /><span>Sem logo configurado</span></div>
        }
      </div>
    </div>
  </ui-card>
</div>
```

- [ ] **Step 3: Replace `configuracoes.component.css`**

```css
.config { padding: 28px 32px; display: flex; flex-direction: column; gap: 16px; }
.config__msg {
  padding: 10px 14px;
  border-radius: var(--radius);
  font: 500 13px var(--font-body);
  background: var(--success-soft);
  color: var(--success);
  border: 1px solid color-mix(in srgb, var(--success) 30%, transparent);
}
.config__msg--err { background: var(--danger-soft); color: var(--danger); border-color: color-mix(in srgb, var(--danger) 30%, transparent); }

.config__row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 28px;
  align-items: center;
}
.config__col { display: flex; flex-direction: column; gap: 8px; }
.config__title { font: 700 15px/1.2 var(--font-display); color: var(--text); }
.config__desc  { font: 500 13px/1.5 var(--font-body); color: var(--text-muted); margin-bottom: 6px; }
.config__actions { display: flex; gap: 10px; flex-wrap: wrap; }

.config__preview {
  display: flex; align-items: center; justify-content: center;
  min-height: 160px;
  border-radius: var(--radius-lg);
  background: var(--surface-2);
  border: 1px dashed var(--border-strong);
  padding: 16px;
}
.config__preview img { max-width: 100%; max-height: 140px; object-fit: contain; }
.config__placeholder {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  color: var(--text-muted); font: 500 13px var(--font-body);
}
.config__placeholder lucide-icon { width: 28px; height: 28px; }

@media (max-width: 900px) { .config__row { grid-template-columns: 1fr; } .config { padding: 18px; } }
```

- [ ] **Step 4: Register icons `Upload`, `Trash2`, `ImageOff` in `frontend/src/app/app.config.ts`**

Add to import and `pick({...})`.

- [ ] **Step 5: Build + test**

```bash
cd frontend && npm run build -- --configuration=development && npm test -- --watch=false --browsers=ChromeHeadless
```
Expected: clean build, 48/48 PASS.

---

### ✅ Checkpoint E — Administração fully migrated

All 4 admin pages + shell + home use the design system. Pause for review.

---

## Task 15: Add missing specs (AppShell, Home, Skeleton)

**Goal:** Close the test coverage gaps the Phase 1 review identified. No production code changes — only specs.

**Files:**
- Create: `frontend/src/app/core/layout/shell/app-shell.component.spec.ts`
- Create: `frontend/src/app/modules/dashboard/pages/home/home.component.spec.ts`
- Create: `frontend/src/app/shared/ui/skeleton/skeleton.component.spec.ts`

- [ ] **Step 1: `app-shell.component.spec.ts`**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, House, FileText, Tag, Shield, Search, Bell, Sun, Moon, ChevronRight, LogOut, Check, ArrowRight, User, Settings, Plus, X, ChevronDown } from 'lucide-angular';

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
        importProvidersFrom(LucideAngularModule.pick({
          House, FileText, Tag, Shield, Search, Bell, Sun, Moon, ChevronRight,
          LogOut, Check, ArrowRight, User, Settings, Plus, X, ChevronDown,
        })),
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
```

- [ ] **Step 2: Run shell spec**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/app-shell.component.spec.ts'
```
Expected: 2/2 PASS.

- [ ] **Step 3: `home.component.spec.ts`**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, FileText, Tag, ArrowRight, Shield, User, Settings } from 'lucide-angular';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        importProvidersFrom(LucideAngularModule.pick({ FileText, Tag, ArrowRight, Shield, User, Settings })),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });

  it('renders the time-of-day greeting', () => {
    const text = fixture.nativeElement.textContent;
    expect(/Bom dia|Boa tarde|Boa noite|Boa madrugada/.test(text)).toBeTrue();
  });

  it('renders all registered modules', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Doc Flow');
    expect(text).toContain('Release Orchestrator');
  });

  it('renders the KPI strip with all 4 labels', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Releases / mês');
    expect(text).toContain('Manuais ativos');
    expect(text).toContain('Usuários ativos');
    expect(text).toContain('Incidentes 24h');
  });
});
```

- [ ] **Step 4: Run home spec**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/home.component.spec.ts'
```
Expected: 3/3 PASS.

- [ ] **Step 5: `skeleton.component.spec.ts`**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  let fixture: ComponentFixture<SkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SkeletonComponent] }).compileComponents();
    fixture = TestBed.createComponent(SkeletonComponent);
  });

  it('renders line shape by default', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('span');
    expect(el.classList.contains('ui-skel--line')).toBeTrue();
  });

  it('applies circle shape when shape="circle"', () => {
    fixture.componentRef.setInput('shape', 'circle');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('span').classList.contains('ui-skel--circle')).toBeTrue();
  });

  it('applies custom width and height', () => {
    fixture.componentRef.setInput('width', '120px');
    fixture.componentRef.setInput('height', '32px');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(el.style.width).toBe('120px');
    expect(el.style.height).toBe('32px');
  });
});
```

- [ ] **Step 6: Run skeleton spec**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/skeleton.component.spec.ts'
```
Expected: 3/3 PASS.

- [ ] **Step 7: Run full suite**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
```
Expected: 56/56 PASS (48 from before + 2 shell + 3 home + 3 skeleton).

---

## Task 16: Smoke + cleanup

**Goal:** Final verification. Production build passes. All tests pass. No legacy token leaks in Administração code. Update spec with Phase 2a status.

- [ ] **Step 1: Production build**

```bash
cd frontend && npm run build
```
Expected: clean build. The pre-existing `release-builder.component.css` warning may remain — that's outside Phase 2a scope (Phase 2b will handle Release Orchestrator).

- [ ] **Step 2: Audit no legacy `--blue-N`/`--slate-N` references in Administração**

```bash
grep -rE -- '--blue-[0-9]|--slate-[0-9]' frontend/src/app/modules/administracao
```
Expected: no matches.

- [ ] **Step 3: Audit no `pi-` icon classes in Administração**

```bash
grep -rE 'pi pi-|class="pi-|pi-[a-z-]+\b' frontend/src/app/modules/administracao
```
Expected: no matches. (All icons should be lucide now.)

- [ ] **Step 4: Full test suite with coverage**

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --code-coverage
```
Expected: 56/56 PASS. Coverage report at `frontend/coverage/`. Note line/statement/branch percentages.

- [ ] **Step 5: Update spec status**

Open `docs/superpowers/specs/2026-06-07-portal-redesign-premium-design.md`. In Section 10 (Roadmap), find the existing Phase 1 status line and add right after it:

```markdown
**Status Fase 2a:** Concluída em <YYYY-MM-DD>. Administração migrada para o design system. Próximo: Fase 2b (DocFlow) e Fase 2c (Release Orchestrator).
```

- [ ] **Step 6: Commit — SKIP (user opted to skip).**

---

### ✅ Checkpoint F — Phase 2a complete

All deliverables in. Administração is premium. Ready for Phase 2b (DocFlow) and 2c (Release Orchestrator), each in its own plan.

---

## Phase 2a Deliverable Recap

When fully executed, this plan delivers:

- **CommandPaletteService** with merge API (`registerMany` + `unregister`) so modules can register their own commands without overwriting each other.
- **Smooth theme transitions** on Card and Sidebar (overlay technique).
- **Cleaner `PortalModule` interface** without the unused `color` field.
- **7 new UI primitives** in `shared/ui/`: Select, Switch, Checkbox, Chip, PageHeader, EmptyState, Breadcrumb.
- **2 layout templates** in `shared/layouts/`: ListPage, FormPage.
- **Administração fully migrated** — sub-shell, home, usuarios (list+create), grupos, permissoes, configuracoes.
- **Test coverage gaps closed** — specs for AppShell, Home, Skeleton.
- **~56 passing specs** (up from 26 in Phase 1).

**Not included** (Phase 2b/2c work):
- DocFlow migration (separate plan).
- Release Orchestrator migration + CSS budget unblock at the source (separate plan).
- `<ui-detail-page>` template (introduced in Phase 2b where it's first needed).
- Tabs component (Phase 2b/2c when detail pages need them).
- Module-contextual `⌘K` commands beyond Administração (Phase 2b/2c).
- Keyboard shortcuts (`g h` / `g d` / `g r` / `g a`) — Phase 3 polish.
