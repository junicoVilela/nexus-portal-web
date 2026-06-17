# Softon Portal Web — Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the foundation of the portal redesign — tokens, theming, design system primitives, redesigned app-shell, login and home — so the portal navigates with the new theme while module pages still render with the old aesthetic (transitional state).

**Architecture:** Tailwind v4 (CSS-first via `@theme`) + selected PrimeNG (`p-table`, `p-dialog`, etc.) + a new design system in `shared/ui/`. Tokens live in layered CSS files (`primitives → semantic-light → semantic-dark`). `ThemeService` toggles `data-theme` on `<html>` and persists in `localStorage`. Standalone Angular components, signals where appropriate.

**Tech Stack:** Angular 21.2, TypeScript 5.9, Tailwind v4, PrimeNG 21, lucide-angular, Karma + Jasmine, Inter + Inter Tight + JetBrains Mono.

**Reference spec:** `docs/superpowers/specs/2026-06-07-portal-redesign-premium-design.md`

**Checkpoints:**
- ✅ Checkpoint A: Tokens + theming working end-to-end (after Task 3).
- ✅ Checkpoint B: Design system primitives available (after Task 9).
- ✅ Checkpoint C: App shell with new sidebar + topbar + theme toggle + ⌘K (after Task 12).
- ✅ Checkpoint D: Login redesigned (after Task 13).
- ✅ Checkpoint E: Home redesigned, end-to-end smoke pass (after Task 15).

---

## File Structure

**New files:**
```
frontend/
├── .postcssrc.json
├── karma.conf.js
├── tsconfig.spec.json
└── src/
    ├── styles/
    │   ├── index.css                          (entry point)
    │   ├── tokens/
    │   │   ├── _primitives.css
    │   │   ├── _semantic-light.css
    │   │   ├── _semantic-dark.css
    │   │   ├── _typography.css
    │   │   ├── _radii.css
    │   │   ├── _shadows.css
    │   │   └── _motion.css
    │   └── base/
    │       ├── reset.css
    │       ├── elements.css
    │       └── primeng-overrides.css
    └── app/
        ├── core/theme/
        │   ├── theme.service.ts
        │   └── theme.service.spec.ts
        └── shared/ui/
            ├── index.ts                       (barrel)
            ├── button/
            │   ├── button.component.ts
            │   ├── button.component.html
            │   ├── button.component.css
            │   └── button.component.spec.ts
            ├── icon-button/
            ├── badge/
            ├── card/
            ├── input/
            ├── avatar/
            └── command-palette/
                ├── command-palette.component.ts
                ├── command-palette.component.html
                ├── command-palette.component.css
                ├── command-palette.component.spec.ts
                ├── command-palette.service.ts
                └── command-palette.service.spec.ts
```

**Modified files:**
```
frontend/
├── package.json                                (deps + scripts)
├── angular.json                                (styles entry, test config)
├── src/index.html                              (font preconnect)
├── src/styles.css                              (replaced by styles/index.css import)
└── src/app/
    ├── core/layout/shell/
    │   ├── app-shell.component.ts              (rewritten)
    │   ├── app-shell.component.html            (rewritten)
    │   └── app-shell.component.css             (rewritten)
    ├── core/auth/pages/login/
    │   ├── login.component.ts                  (rewritten)
    │   ├── login.component.html                (rewritten)
    │   └── login.component.css                 (rewritten)
    └── modules/dashboard/pages/home/
        ├── home.component.ts                   (rewritten)
        ├── home.component.html                 (rewritten)
        └── home.component.css                  (rewritten)
```

---

## Task 1: Project Setup — Tailwind v4, fonts, lucide, Karma

**Goal:** Install Tailwind v4, lucide-angular, Karma + Jasmine, load Inter Tight + JetBrains Mono. After this task, `npm test` runs (zero tests) and a hello-tailwind `<div class="bg-red-500">` renders red.

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/.postcssrc.json`
- Create: `frontend/karma.conf.js`
- Create: `frontend/tsconfig.spec.json`
- Modify: `frontend/angular.json`
- Modify: `frontend/src/index.html`

- [ ] **Step 1: Install Tailwind v4 + lucide + Karma deps**

```bash
cd frontend
npm install tailwindcss@^4.0.0 @tailwindcss/postcss@^4.0.0 lucide-angular@^0.460.0
npm install --save-dev postcss@^8.4.0 karma@^6.4.0 karma-chrome-launcher@^3.2.0 karma-coverage@^2.2.0 karma-jasmine@^5.1.0 karma-jasmine-html-reporter@^2.1.0 jasmine-core@^5.1.0 @types/jasmine@^5.1.0
```

- [ ] **Step 2: Create `.postcssrc.json` so Angular's build picks up Tailwind**

```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

- [ ] **Step 3: Create `karma.conf.js`**

```javascript
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: { jasmine: {}, clearContext: false },
    jasmineHtmlReporter: { suppressAll: true },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['ChromeHeadless'],
    restartOnFileChange: true,
  });
};
```

- [ ] **Step 4: Create `tsconfig.spec.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": ["jasmine"]
  },
  "include": ["src/**/*.spec.ts", "src/**/*.d.ts"]
}
```

- [ ] **Step 5: Wire test config in `angular.json` — add `test` options under the `architect.test` block**

Replace the `architect.test` block (currently `"builder": "@angular-devkit/build-angular:karma"` only) with:

```json
"test": {
  "builder": "@angular-devkit/build-angular:karma",
  "options": {
    "polyfills": ["zone.js", "zone.js/testing"],
    "tsConfig": "tsconfig.spec.json",
    "karmaConfig": "karma.conf.js",
    "assets": ["src/assets"],
    "styles": ["src/styles.css"],
    "scripts": []
  }
}
```

- [ ] **Step 6: Verify Karma boots with zero specs**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless`
Expected: builds, opens headless Chrome, prints `Executed 0 of 0 SUCCESS`. (If Chrome is not installed, install it or use `--browsers=ChromiumHeadless` after installing `karma-chromium-launcher`.)

- [ ] **Step 7: Update `src/index.html` — load fonts and Tailwind reset baseline**

Replace the `<head>` block with:

```html
<head>
  <meta charset="utf-8">
  <title>Softon Portal</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
</head>
```

- [ ] **Step 8: Smoke test — temporarily add a Tailwind class to verify build picks it up**

In `frontend/src/styles.css`, prepend:

```css
@import "tailwindcss";
```

Run: `cd frontend && npm run build -- --configuration=development`
Expected: build succeeds, no errors, output references Tailwind classes.

- [ ] **Step 9: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/.postcssrc.json frontend/karma.conf.js frontend/tsconfig.spec.json frontend/angular.json frontend/src/index.html frontend/src/styles.css
git commit -m "chore(setup): add Tailwind v4, lucide-angular, Karma/Jasmine, premium fonts"
```

---

## Task 2: Design Tokens — primitives, light, dark, typography, radii, shadows, motion

**Goal:** Create all token files. After this task, CSS variables for every design token from the spec exist at `:root` and `[data-theme="dark"]`, ready to be consumed by components.

**Files:**
- Create: `frontend/src/styles/tokens/_primitives.css`
- Create: `frontend/src/styles/tokens/_semantic-light.css`
- Create: `frontend/src/styles/tokens/_semantic-dark.css`
- Create: `frontend/src/styles/tokens/_typography.css`
- Create: `frontend/src/styles/tokens/_radii.css`
- Create: `frontend/src/styles/tokens/_shadows.css`
- Create: `frontend/src/styles/tokens/_motion.css`
- Create: `frontend/src/styles/base/reset.css`
- Create: `frontend/src/styles/base/elements.css`
- Create: `frontend/src/styles/base/primeng-overrides.css`
- Create: `frontend/src/styles/index.css`
- Modify: `frontend/src/styles.css` (becomes a one-line import)
- Modify: `frontend/angular.json` (point styles to new entry)

- [ ] **Step 1: Create `frontend/src/styles/tokens/_primitives.css`**

```css
/* Primitive tokens — raw values. Consumed only by semantic layers. */
:root {
  /* Indigo scale */
  --indigo-50:  #EEF0FF;
  --indigo-100: #DFE3FF;
  --indigo-200: #C7CFFF;
  --indigo-300: #A4B0FF;
  --indigo-400: #818CF8;
  --indigo-500: #6366F1;
  --indigo-600: #4F46E5;
  --indigo-700: #4338CA;
  --indigo-800: #3730A3;
  --indigo-900: #312E81;

  /* Cyan scale (dark mode accent secondary) */
  --cyan-300: #67E8F9;
  --cyan-400: #22D3EE;
  --cyan-500: #06B6D4;

  /* Violet (gradient signature) */
  --violet-500: #8B5CF6;
  --violet-600: #7C3AED;

  /* Neutrals (slate-ish) */
  --neutral-0:    #FFFFFF;
  --neutral-50:   #F7F8FA;
  --neutral-100:  #F1F3F7;
  --neutral-200:  #E5E8EE;
  --neutral-300:  #C7CCD8;
  --neutral-400:  #94A3B8;
  --neutral-500:  #6B7280;
  --neutral-600:  #4B5563;
  --neutral-700:  #374151;
  --neutral-800:  #1F2937;
  --neutral-900:  #0B1220;

  /* Dark base */
  --dark-base:    #060818;
  --dark-bg:      #0B0E1F;
  --dark-surface: #1A1F3A;

  /* Semantic colors (raw) */
  --green-300: #6EE7B7;
  --green-500: #10B981;
  --green-700: #047857;
  --amber-300: #FCD34D;
  --amber-500: #F59E0B;
  --amber-700: #B45309;
  --red-300:   #FCA5A5;
  --red-500:   #EF4444;
  --red-700:   #B91C1C;
  --blue-500:  #3B82F6;

  /* Spacing scale */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-14: 56px;
}
```

- [ ] **Step 2: Create `frontend/src/styles/tokens/_semantic-light.css`**

```css
:root, [data-theme="light"] {
  --surface:         var(--neutral-0);
  --surface-2:       var(--neutral-50);
  --bg:              var(--neutral-50);
  --border:          var(--neutral-200);
  --border-strong:   var(--neutral-300);
  --text:            var(--neutral-900);
  --text-muted:      var(--neutral-500);
  --text-subtle:     var(--neutral-400);

  --accent:          var(--indigo-600);
  --accent-hover:    var(--indigo-700);
  --accent-soft:     var(--indigo-50);
  --accent-text:     var(--neutral-0);
  --accent-ring:     rgba(79, 70, 229, .18);

  --success:         var(--green-500);
  --success-soft:    #ECFDF5;
  --warn:            var(--amber-500);
  --warn-soft:       #FFFBEB;
  --danger:          var(--red-500);
  --danger-soft:     #FEF2F2;
  --info:            var(--blue-500);
  --info-soft:       #EFF6FF;

  --sidebar-bg:      var(--neutral-0);
  --sidebar-border:  var(--neutral-200);
  --sidebar-text:    var(--neutral-600);
  --sidebar-active-bg:   rgba(79, 70, 229, .08);
  --sidebar-active-text: var(--indigo-600);
  --sidebar-active-bar:  var(--indigo-600);

  --topbar-bg:       var(--neutral-0);
  --topbar-border:   var(--neutral-200);
}
```

- [ ] **Step 3: Create `frontend/src/styles/tokens/_semantic-dark.css`**

```css
[data-theme="dark"] {
  --surface:         rgba(255, 255, 255, .04);
  --surface-2:       rgba(255, 255, 255, .06);
  --bg:              var(--dark-bg);
  --border:          rgba(255, 255, 255, .08);
  --border-strong:   rgba(255, 255, 255, .14);
  --text:            #E6E8F2;
  --text-muted:      #8B91B0;
  --text-subtle:     #5E657F;

  --accent:          var(--indigo-400);
  --accent-hover:    var(--indigo-300);
  --accent-soft:     rgba(129, 140, 248, .14);
  --accent-text:     var(--dark-base);
  --accent-ring:     rgba(129, 140, 248, .25);
  --accent-grad:     linear-gradient(135deg, var(--violet-600), var(--cyan-500));

  --success:         var(--green-300);
  --success-soft:    rgba(110, 231, 183, .12);
  --warn:            var(--amber-300);
  --warn-soft:       rgba(252, 211, 77, .12);
  --danger:          var(--red-300);
  --danger-soft:     rgba(252, 165, 165, .14);
  --info:            #93C5FD;
  --info-soft:       rgba(147, 197, 253, .14);

  --sidebar-bg:      rgba(255, 255, 255, .02);
  --sidebar-border:  rgba(255, 255, 255, .05);
  --sidebar-text:    #B5BAD0;
  --sidebar-active-bg:   linear-gradient(90deg, rgba(124, 58, 237, .15), rgba(34, 211, 238, .06));
  --sidebar-active-text: #FFFFFF;
  --sidebar-active-bar:  linear-gradient(180deg, var(--indigo-400), var(--cyan-400));

  --topbar-bg:       rgba(255, 255, 255, .02);
  --topbar-border:   rgba(255, 255, 255, .05);

  /* Dark-only base background gradient for body */
  --body-bg-image:   radial-gradient(120% 80% at 0% 0%, #1A1F3A 0%, #0B0E1F 60%, #060818 100%);
}

:root, [data-theme="light"] {
  --body-bg-image:   none;
}
```

- [ ] **Step 4: Create `frontend/src/styles/tokens/_typography.css`**

```css
:root {
  --font-display: "Inter Tight", Inter, system-ui, sans-serif;
  --font-body:    Inter, system-ui, -apple-system, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;

  --fs-display: 38px;
  --fs-h1:      28px;
  --fs-h2:      20px;
  --fs-h3:      16px;
  --fs-body:    14px;
  --fs-small:   12px;

  --lh-display: 1.05;
  --lh-h1:      1.15;
  --lh-h2:      1.2;
  --lh-body:    1.55;
  --lh-small:   1.45;

  --ls-display: -0.04em;
  --ls-h1:      -0.03em;
  --ls-h2:      -0.02em;
  --ls-body:    0;
  --ls-label:   0.06em;
}
```

- [ ] **Step 5: Create `frontend/src/styles/tokens/_radii.css`**

```css
:root {
  --radius-xs:   4px;
  --radius-sm:   6px;
  --radius:      8px;
  --radius-md:   10px;
  --radius-lg:   12px;
  --radius-xl:   14px;
  --radius-2xl:  16px;
  --radius-full: 9999px;
}
```

- [ ] **Step 6: Create `frontend/src/styles/tokens/_shadows.css`**

```css
:root, [data-theme="light"] {
  --shadow-xs: 0 1px 2px 0 rgba(15, 23, 42, .04);
  --shadow-sm: 0 1px 3px 0 rgba(15, 23, 42, .08), 0 1px 2px -1px rgba(15, 23, 42, .06);
  --shadow:    0 4px 6px -1px rgba(15, 23, 42, .08), 0 2px 4px -2px rgba(15, 23, 42, .06);
  --shadow-md: 0 10px 15px -3px rgba(15, 23, 42, .08), 0 4px 6px -4px rgba(15, 23, 42, .06);
  --shadow-lg: 0 20px 25px -5px rgba(15, 23, 42, .10), 0 8px 10px -6px rgba(15, 23, 42, .08);
  --glow:      none;
}

[data-theme="dark"] {
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, .35);
  --shadow-sm: 0 2px 8px -2px rgba(0, 0, 0, .40);
  --shadow:    0 6px 14px -6px rgba(0, 0, 0, .50);
  --shadow-md: 0 14px 28px -10px rgba(0, 0, 0, .55);
  --shadow-lg: 0 26px 50px -12px rgba(0, 0, 0, .65);
  --glow:      0 0 12px rgba(129, 140, 248, .35);
}
```

- [ ] **Step 7: Create `frontend/src/styles/tokens/_motion.css`**

```css
:root {
  --motion-fast:    120ms;
  --motion-default: 150ms;
  --motion-slow:    200ms;
  --motion-slower:  240ms;
  --ease-out:       cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out:    cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-fast:    0ms;
    --motion-default: 0ms;
    --motion-slow:    0ms;
    --motion-slower:  0ms;
  }
}
```

- [ ] **Step 8: Create `frontend/src/styles/base/reset.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 14px; scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body {
  font-family: var(--font-body);
  font-size:   var(--fs-body);
  line-height: var(--lh-body);
  color:       var(--text);
  background:  var(--bg);
  background-image: var(--body-bg-image);
  background-attachment: fixed;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  transition: background-color var(--motion-slow) var(--ease-out),
              color var(--motion-slow) var(--ease-out);
}
button, input, select, textarea { font: inherit; color: inherit; }
img, svg, video { display: block; max-width: 100%; }
a { color: inherit; text-decoration: none; }
```

- [ ] **Step 9: Create `frontend/src/styles/base/elements.css`**

```css
h1, h2, h3, h4, h5 { font-family: var(--font-display); color: var(--text); }
h1 { font-size: var(--fs-h1); line-height: var(--lh-h1); letter-spacing: var(--ls-h1); font-weight: 700; }
h2 { font-size: var(--fs-h2); line-height: var(--lh-h2); letter-spacing: var(--ls-h2); font-weight: 700; }
h3 { font-size: var(--fs-h3); line-height: 1.3; font-weight: 700; letter-spacing: -0.01em; }
p  { color: var(--text); }
:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 3px var(--accent-ring);
  border-radius: var(--radius-sm);
}
```

- [ ] **Step 10: Create `frontend/src/styles/base/primeng-overrides.css`**

```css
/* PrimeNG theming via CSS vars. Overrides are kept minimal — components consumed
   from PrimeNG (p-table, p-dialog, p-overlaypanel, p-autocomplete, p-calendar,
   p-toast) read these to match the design system. */
:root {
  --p-primary-color:       var(--accent);
  --p-primary-color-text:  var(--accent-text);
  --p-surface-0:           var(--surface);
  --p-surface-50:          var(--surface-2);
  --p-content-border-color:var(--border);
  --p-text-color:          var(--text);
  --p-text-muted-color:    var(--text-muted);
}
```

- [ ] **Step 11: Create `frontend/src/styles/index.css` (single entry point)**

```css
@import "tailwindcss";

/* Tokens — primitives first, then semantic mappings, then atomic groups */
@import "./tokens/_primitives.css";
@import "./tokens/_semantic-light.css";
@import "./tokens/_semantic-dark.css";
@import "./tokens/_typography.css";
@import "./tokens/_radii.css";
@import "./tokens/_shadows.css";
@import "./tokens/_motion.css";

/* Base */
@import "./base/reset.css";
@import "./base/elements.css";
@import "./base/primeng-overrides.css";

/* Tailwind theme — expose semantic tokens as utility classes */
@theme {
  --color-surface:     var(--surface);
  --color-surface-2:   var(--surface-2);
  --color-bg:          var(--bg);
  --color-border:      var(--border);
  --color-text:        var(--text);
  --color-text-muted:  var(--text-muted);
  --color-accent:      var(--accent);
  --color-success:     var(--success);
  --color-warn:        var(--warn);
  --color-danger:      var(--danger);
  --color-info:        var(--info);

  --font-display:      var(--font-display);
  --font-sans:         var(--font-body);
  --font-mono:         var(--font-mono);

  --radius-sm:         var(--radius-sm);
  --radius:            var(--radius);
  --radius-md:         var(--radius-md);
  --radius-lg:         var(--radius-lg);
}
```

- [ ] **Step 12: Replace `frontend/src/styles.css` with a single import (preserves the angular.json entry path)**

```css
@import "./styles/index.css";
```

- [ ] **Step 13: Verify build succeeds**

Run: `cd frontend && npm run build -- --configuration=development`
Expected: builds successfully, no missing-file errors. The old design system in `styles.css` is gone but no page imports it directly.

- [ ] **Step 14: Smoke-render — add `<html data-theme="light">` default and verify in browser**

Modify `frontend/src/index.html`, set `<html lang="pt-BR" data-theme="light">`.

Run: `cd frontend && npm start`
Expected: app builds and serves; sidebar may look broken (old CSS gone) — that's expected and fixed in later tasks.

- [ ] **Step 15: Commit**

```bash
git add frontend/src/styles frontend/src/styles.css frontend/src/index.html
git commit -m "feat(tokens): introduce token layers (primitives, light/dark semantics, typography, radii, shadows, motion)"
```

---

## Task 3: ThemeService — toggle light/dark with persistence

**Goal:** A service that switches `data-theme` on `<html>`, persists choice to `localStorage`, and respects `prefers-color-scheme` on first load. After this task, calling `themeService.toggle()` flips the document theme attribute.

**Files:**
- Create: `frontend/src/app/core/theme/theme.service.ts`
- Create: `frontend/src/app/core/theme/theme.service.spec.ts`

- [ ] **Step 1: Write the failing test `theme.service.spec.ts`**

```typescript
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const STORAGE_KEY = 'portal-theme';

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({ providers: [ThemeService] });
  });

  it('initializes with light when no preference and no storage', () => {
    const matchMedia = spyOn(window, 'matchMedia').and.returnValue({
      matches: false, media: '', onchange: null,
      addEventListener: () => {}, removeEventListener: () => {},
      addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
    } as unknown as MediaQueryList);

    const svc = TestBed.inject(ThemeService);
    svc.init();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });

  it('initializes with dark when prefers-color-scheme=dark', () => {
    spyOn(window, 'matchMedia').and.returnValue({
      matches: true, media: '', onchange: null,
      addEventListener: () => {}, removeEventListener: () => {},
      addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
    } as unknown as MediaQueryList);

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
```

- [ ] **Step 2: Run test, confirm fail**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/theme.service.spec.ts'`
Expected: FAIL — `ThemeService` cannot be found.

- [ ] **Step 3: Implement `theme.service.ts`**

```typescript
import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'portal-theme';
const ATTR = 'data-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>('light');
  readonly theme = this._theme.asReadonly();

  /** Call once at app bootstrap. */
  init(): void {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial: Theme = stored
      ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.apply(initial);
  }

  toggle(): void {
    this.apply(this._theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this.apply(theme);
  }

  private apply(theme: Theme): void {
    this._theme.set(theme);
    document.documentElement.setAttribute(ATTR, theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }
}
```

- [ ] **Step 4: Run test, confirm pass**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/theme.service.spec.ts'`
Expected: PASS — 4 specs.

- [ ] **Step 5: Wire `init()` into bootstrap**

Modify `frontend/src/app/app.config.ts`:

```typescript
import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from '@core/auth/interceptors/auth.interceptor';
import { ThemeService } from '@core/theme/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => inject(ThemeService).init()),
  ],
};
```

- [ ] **Step 6: Manually verify in the browser**

Run: `cd frontend && npm start`
Open `http://localhost:4200`. In DevTools console: `document.documentElement.dataset.theme` should return `"light"` (or `"dark"` if OS prefers dark). Run `localStorage.setItem('portal-theme','dark'); location.reload()` — `<html>` should carry `data-theme="dark"` after reload.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/core/theme/ frontend/src/app/app.config.ts
git commit -m "feat(theme): add ThemeService with persistence and prefers-color-scheme detection"
```

---

### ✅ Checkpoint A — Tokens + theming working

At this point: tokens exist as CSS vars, the body picks up theme background, ThemeService toggles. Pause for review before continuing. The shell still uses old CSS so visually the app is broken; that's expected.

---

## Task 4: shared/ui/button — Button component

**Goal:** A standalone Button with `variant` (primary/secondary/ghost/danger), `size` (sm/md/lg), `loading`, optional `icon` (lucide name), disabled state, click event. Used in topbar, login, forms.

**Files:**
- Create: `frontend/src/app/shared/ui/button/button.component.ts`
- Create: `frontend/src/app/shared/ui/button/button.component.html`
- Create: `frontend/src/app/shared/ui/button/button.component.css`
- Create: `frontend/src/app/shared/ui/button/button.component.spec.ts`
- Create: `frontend/src/app/shared/ui/button/index.ts`

- [ ] **Step 1: Write failing test `button.component.spec.ts`**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let fixture: ComponentFixture<ButtonComponent>;
  let component: ButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ButtonComponent] }).compileComponents();
    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
  });

  it('renders a button with primary variant by default', () => {
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
    expect(btn.classList.contains('ui-btn--primary')).toBeTrue();
    expect(btn.classList.contains('ui-btn--md')).toBeTrue();
  });

  it('applies the requested variant and size', () => {
    fixture.componentRef.setInput('variant', 'danger');
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.classList.contains('ui-btn--danger')).toBeTrue();
    expect(btn.classList.contains('ui-btn--sm')).toBeTrue();
  });

  it('disables button and suppresses click when loading', () => {
    let clicks = 0;
    component.clicked.subscribe(() => clicks++);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBeTrue();
    btn.click();
    expect(clicks).toBe(0);
  });

  it('emits clicked when enabled', () => {
    let clicks = 0;
    component.clicked.subscribe(() => clicks++);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    btn.click();
    expect(clicks).toBe(1);
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/button.component.spec.ts'`
Expected: FAIL — `ButtonComponent` cannot be found.

- [ ] **Step 3: Implement `button.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly icon = input<string | null>(null);
  readonly iconPosition = input<'leading' | 'trailing'>('leading');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly fullWidth = input(false);

  @Output() readonly clicked = new EventEmitter<void>();

  protected onClick(): void {
    if (this.disabled() || this.loading()) return;
    this.clicked.emit();
  }
}
```

- [ ] **Step 4: Implement `button.component.html`**

```html
<button
  [type]="type()"
  [disabled]="disabled() || loading()"
  [class]="'ui-btn ui-btn--' + variant() + ' ui-btn--' + size() + (fullWidth() ? ' ui-btn--full' : '')"
  (click)="onClick()"
>
  @if (loading()) {
    <span class="ui-btn__spinner" aria-hidden="true"></span>
  } @else if (icon() && iconPosition() === 'leading') {
    <lucide-icon [name]="icon()!" class="ui-btn__icon" />
  }
  <span class="ui-btn__label"><ng-content /></span>
  @if (!loading() && icon() && iconPosition() === 'trailing') {
    <lucide-icon [name]="icon()!" class="ui-btn__icon" />
  }
</button>
```

- [ ] **Step 5: Implement `button.component.css`**

```css
.ui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: var(--radius);
  font-family: var(--font-body);
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color var(--motion-default) var(--ease-out),
    color var(--motion-default) var(--ease-out),
    box-shadow var(--motion-default) var(--ease-out),
    transform var(--motion-fast) var(--ease-out);
  white-space: nowrap;
  user-select: none;
}
.ui-btn:disabled { opacity: .55; cursor: not-allowed; }
.ui-btn--full   { width: 100%; }

.ui-btn--sm { font-size: 12.5px; padding: 6px 10px; height: 30px; }
.ui-btn--md { font-size: 13px;   padding: 8px 14px; height: 36px; }
.ui-btn--lg { font-size: 14px;   padding: 10px 18px; height: 42px; }

.ui-btn--primary {
  background: var(--accent);
  color: var(--accent-text);
  box-shadow: var(--shadow-xs);
}
[data-theme="dark"] .ui-btn--primary {
  background: var(--accent-grad);
  box-shadow: var(--shadow-xs), var(--glow);
}
.ui-btn--primary:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.ui-btn--secondary {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
}
.ui-btn--secondary:hover:not(:disabled) {
  background: var(--surface-2);
  border-color: var(--border-strong);
}

.ui-btn--ghost {
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--accent-soft);
}
.ui-btn--ghost:hover:not(:disabled) { background: var(--accent-soft); }

.ui-btn--danger {
  background: var(--danger);
  color: #fff;
}
.ui-btn--danger:hover:not(:disabled) { filter: brightness(.94); }

.ui-btn__icon { width: 16px; height: 16px; }

.ui-btn__spinner {
  width: 14px; height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: ui-spin .7s linear infinite;
}
@keyframes ui-spin { to { transform: rotate(360deg); } }
```

- [ ] **Step 6: Create barrel `button/index.ts`**

```typescript
export * from './button.component';
```

- [ ] **Step 7: Provide lucide icons globally — modify `app.config.ts`**

```typescript
import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideLucideIcons } from 'lucide-angular';
import {
  Home, FileText, Tag, Shield, Search, Bell, Sun, Moon, ChevronRight,
  ChevronDown, LogOut, User, Settings, Plus, Check, X, ArrowRight,
} from 'lucide-angular';

import { routes } from './app.routes';
import { authInterceptor } from '@core/auth/interceptors/auth.interceptor';
import { ThemeService } from '@core/theme/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => inject(ThemeService).init()),
    provideLucideIcons({
      Home, FileText, Tag, Shield, Search, Bell, Sun, Moon, ChevronRight,
      ChevronDown, LogOut, User, Settings, Plus, Check, X, ArrowRight,
    }),
  ],
};
```

- [ ] **Step 8: Run test, confirm pass**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/button.component.spec.ts'`
Expected: PASS — 4 specs.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/app/shared/ui/button frontend/src/app/app.config.ts
git commit -m "feat(ui): add Button component with variants, sizes, loading state"
```

---

## Task 5: shared/ui/icon-button — IconButton

**Goal:** A square button used in topbars/toolbars. Takes only an icon, optional tone, optional aria-label.

**Files:**
- Create: `frontend/src/app/shared/ui/icon-button/icon-button.component.ts`
- Create: `frontend/src/app/shared/ui/icon-button/icon-button.component.html`
- Create: `frontend/src/app/shared/ui/icon-button/icon-button.component.css`
- Create: `frontend/src/app/shared/ui/icon-button/icon-button.component.spec.ts`
- Create: `frontend/src/app/shared/ui/icon-button/index.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconButtonComponent } from './icon-button.component';

describe('IconButtonComponent', () => {
  let fixture: ComponentFixture<IconButtonComponent>;
  let component: IconButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [IconButtonComponent] }).compileComponents();
    fixture = TestBed.createComponent(IconButtonComponent);
    component = fixture.componentInstance;
  });

  it('renders a button with the requested icon and aria-label', () => {
    fixture.componentRef.setInput('icon', 'Search');
    fixture.componentRef.setInput('ariaLabel', 'Buscar');
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBe('Buscar');
  });

  it('emits clicked when not disabled', () => {
    let count = 0;
    component.clicked.subscribe(() => count++);
    fixture.componentRef.setInput('icon', 'Search');
    fixture.componentRef.setInput('ariaLabel', 'x');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(count).toBe(1);
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/icon-button.component.spec.ts'`
Expected: FAIL.

- [ ] **Step 3: Implement `icon-button.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export type IconButtonTone = 'default' | 'accent' | 'danger';
export type IconButtonSize = 'sm' | 'md';

@Component({
  selector: 'ui-icon-button',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './icon-button.component.html',
  styleUrl: './icon-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconButtonComponent {
  readonly icon = input.required<string>();
  readonly ariaLabel = input.required<string>();
  readonly tone = input<IconButtonTone>('default');
  readonly size = input<IconButtonSize>('md');
  readonly disabled = input(false);

  @Output() readonly clicked = new EventEmitter<void>();

  protected onClick(): void {
    if (!this.disabled()) this.clicked.emit();
  }
}
```

- [ ] **Step 4: Implement `icon-button.component.html`**

```html
<button
  type="button"
  [attr.aria-label]="ariaLabel()"
  [disabled]="disabled()"
  [class]="'ui-icon-btn ui-icon-btn--' + tone() + ' ui-icon-btn--' + size()"
  (click)="onClick()"
>
  <lucide-icon [name]="icon()" />
</button>
```

- [ ] **Step 5: Implement `icon-button.component.css`**

```css
.ui-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius);
  color: var(--text-muted);
  cursor: pointer;
  transition: background-color var(--motion-default) var(--ease-out),
              color var(--motion-default) var(--ease-out),
              border-color var(--motion-default) var(--ease-out);
}
.ui-icon-btn:disabled { opacity: .5; cursor: not-allowed; }

.ui-icon-btn--sm { width: 28px; height: 28px; }
.ui-icon-btn--md { width: 34px; height: 34px; }

.ui-icon-btn lucide-icon { width: 16px; height: 16px; }

.ui-icon-btn--default { background: var(--surface-2); border-color: var(--border); }
.ui-icon-btn--default:hover:not(:disabled) { color: var(--text); border-color: var(--border-strong); }

.ui-icon-btn--accent { color: var(--accent); }
.ui-icon-btn--accent:hover:not(:disabled) { background: var(--accent-soft); }

.ui-icon-btn--danger { color: var(--danger); }
.ui-icon-btn--danger:hover:not(:disabled) { background: var(--danger-soft); }
```

- [ ] **Step 6: Barrel + test + commit**

Create `index.ts`:
```typescript
export * from './icon-button.component';
```

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/icon-button.component.spec.ts'`
Expected: PASS — 2 specs.

```bash
git add frontend/src/app/shared/ui/icon-button
git commit -m "feat(ui): add IconButton component"
```

---

## Task 6: shared/ui/badge — Badge

**Goal:** Inline status pill with tones (neutral/success/warn/danger/info/accent), optional leading dot.

**Files:**
- Create: `frontend/src/app/shared/ui/badge/badge.component.ts`
- Create: `frontend/src/app/shared/ui/badge/badge.component.html`
- Create: `frontend/src/app/shared/ui/badge/badge.component.css`
- Create: `frontend/src/app/shared/ui/badge/badge.component.spec.ts`
- Create: `frontend/src/app/shared/ui/badge/index.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BadgeComponent] }).compileComponents();
    fixture = TestBed.createComponent(BadgeComponent);
  });

  it('renders with neutral tone by default', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('span');
    expect(el.classList.contains('ui-badge--neutral')).toBeTrue();
  });

  it('applies the requested tone', () => {
    fixture.componentRef.setInput('tone', 'success');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('span').classList.contains('ui-badge--success')).toBeTrue();
  });

  it('shows leading dot when dot=true', () => {
    fixture.componentRef.setInput('dot', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ui-badge__dot')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/badge.component.spec.ts'`
Expected: FAIL.

- [ ] **Step 3: Implement `badge.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'success' | 'warn' | 'danger' | 'info' | 'accent';

@Component({
  selector: 'ui-badge',
  standalone: true,
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  readonly tone = input<BadgeTone>('neutral');
  readonly dot = input(false);
}
```

- [ ] **Step 4: Implement `badge.component.html`**

```html
<span [class]="'ui-badge ui-badge--' + tone()">
  @if (dot()) { <span class="ui-badge__dot" aria-hidden="true"></span> }
  <ng-content />
</span>
```

- [ ] **Step 5: Implement `badge.component.css`**

```css
.ui-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  border: 1px solid transparent;
  white-space: nowrap;
  font-family: var(--font-body);
}
.ui-badge__dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: currentColor;
}

.ui-badge--neutral { background: var(--surface-2); color: var(--text-muted); border-color: var(--border); }
.ui-badge--success { background: var(--success-soft); color: var(--success); border-color: color-mix(in srgb, var(--success) 35%, transparent); }
.ui-badge--warn    { background: var(--warn-soft);    color: var(--warn);    border-color: color-mix(in srgb, var(--warn) 35%, transparent); }
.ui-badge--danger  { background: var(--danger-soft);  color: var(--danger);  border-color: color-mix(in srgb, var(--danger) 35%, transparent); }
.ui-badge--info    { background: var(--info-soft);    color: var(--info);    border-color: color-mix(in srgb, var(--info) 35%, transparent); }
.ui-badge--accent  { background: var(--accent-soft);  color: var(--accent);  border-color: color-mix(in srgb, var(--accent) 35%, transparent); }
```

- [ ] **Step 6: Barrel + test + commit**

Create `index.ts`:
```typescript
export * from './badge.component';
```

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/badge.component.spec.ts'`
Expected: PASS — 3 specs.

```bash
git add frontend/src/app/shared/ui/badge
git commit -m "feat(ui): add Badge component with tones"
```

---

## Task 7: shared/ui/card — Card

**Goal:** A container for module cards and KPI cards. Optional `interactive` (adds hover lift). Optional `padding`.

**Files:**
- Create: `frontend/src/app/shared/ui/card/card.component.ts`
- Create: `frontend/src/app/shared/ui/card/card.component.html`
- Create: `frontend/src/app/shared/ui/card/card.component.css`
- Create: `frontend/src/app/shared/ui/card/card.component.spec.ts`
- Create: `frontend/src/app/shared/ui/card/index.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let fixture: ComponentFixture<CardComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CardComponent] }).compileComponents();
    fixture = TestBed.createComponent(CardComponent);
  });

  it('renders a non-interactive card by default', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('div.ui-card');
    expect(el).toBeTruthy();
    expect(el.classList.contains('ui-card--interactive')).toBeFalse();
  });

  it('adds interactive class when interactive=true', () => {
    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('div.ui-card').classList.contains('ui-card--interactive')).toBeTrue();
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/card.component.spec.ts'`
Expected: FAIL.

- [ ] **Step 3: Implement `card.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CardPadding = 'sm' | 'md' | 'lg' | 'none';

@Component({
  selector: 'ui-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  readonly padding = input<CardPadding>('md');
  readonly interactive = input(false);
}
```

- [ ] **Step 4: Implement `card.component.html`**

```html
<div
  [class]="'ui-card ui-card--pad-' + padding() + (interactive() ? ' ui-card--interactive' : '')"
>
  <ng-content />
</div>
```

- [ ] **Step 5: Implement `card.component.css`**

```css
.ui-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
  transition: border-color var(--motion-default) var(--ease-out),
              box-shadow   var(--motion-default) var(--ease-out),
              transform    var(--motion-fast)    var(--ease-out);
}
[data-theme="dark"] .ui-card {
  background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.01));
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-xs), inset 0 1px 0 rgba(255,255,255,.04);
}
.ui-card--pad-none { padding: 0; }
.ui-card--pad-sm   { padding: var(--space-3); }
.ui-card--pad-md   { padding: var(--space-5); }
.ui-card--pad-lg   { padding: var(--space-6); }

.ui-card--interactive { cursor: pointer; }
.ui-card--interactive:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
[data-theme="dark"] .ui-card--interactive:hover {
  box-shadow: var(--shadow-md), var(--glow);
}
```

- [ ] **Step 6: Barrel + test + commit**

Create `index.ts`:
```typescript
export * from './card.component';
```

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/card.component.spec.ts'`
Expected: PASS — 2 specs.

```bash
git add frontend/src/app/shared/ui/card
git commit -m "feat(ui): add Card component with padding and interactive variants"
```

---

## Task 8: shared/ui/input — Input

**Goal:** A reactive-forms-friendly input. Reusable for login form, search field. Supports `label`, `hint`, `error`, optional leading/trailing icon.

**Files:**
- Create: `frontend/src/app/shared/ui/input/input.component.ts`
- Create: `frontend/src/app/shared/ui/input/input.component.html`
- Create: `frontend/src/app/shared/ui/input/input.component.css`
- Create: `frontend/src/app/shared/ui/input/input.component.spec.ts`
- Create: `frontend/src/app/shared/ui/input/index.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { InputComponent } from './input.component';

@Component({
  standalone: true,
  imports: [InputComponent, ReactiveFormsModule],
  template: `<ui-input label="Email" [formControl]="ctrl" />`,
})
class HostComponent {
  ctrl = new FormControl('');
}

describe('InputComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the label', () => {
    expect(fixture.nativeElement.querySelector('label').textContent).toContain('Email');
  });

  it('two-way binds with FormControl', () => {
    const inp: HTMLInputElement = fixture.nativeElement.querySelector('input');
    inp.value = 'a@b.com';
    inp.dispatchEvent(new Event('input'));
    expect(host.ctrl.value).toBe('a@b.com');
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/input.component.spec.ts'`
Expected: FAIL.

- [ ] **Step 3: Implement `input.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputComponent), multi: true },
  ],
})
export class InputComponent implements ControlValueAccessor {
  readonly label = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly placeholder = input<string>('');
  readonly type = input<'text' | 'email' | 'password' | 'search'>('text');
  readonly leadingIcon = input<string | null>(null);
  readonly trailingIcon = input<string | null>(null);
  readonly autocomplete = input<string>('off');

  protected readonly value = signal<string>('');
  protected readonly disabledSig = signal(false);

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: string): void { this.value.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabledSig.set(isDisabled); }

  protected onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChange(v);
  }
  protected onBlur(): void { this.onTouched(); }
}
```

- [ ] **Step 4: Implement `input.component.html`**

```html
<label class="ui-input">
  @if (label()) { <span class="ui-input__label">{{ label() }}</span> }
  <span class="ui-input__field" [class.ui-input__field--error]="!!error()">
    @if (leadingIcon()) { <lucide-icon [name]="leadingIcon()!" class="ui-input__lead" /> }
    <input
      [type]="type()"
      [placeholder]="placeholder()"
      [value]="value()"
      [disabled]="disabledSig()"
      [autocomplete]="autocomplete()"
      (input)="onInput($event)"
      (blur)="onBlur()"
    />
    @if (trailingIcon()) { <lucide-icon [name]="trailingIcon()!" class="ui-input__trail" /> }
  </span>
  @if (error()) {
    <span class="ui-input__error">{{ error() }}</span>
  } @else if (hint()) {
    <span class="ui-input__hint">{{ hint() }}</span>
  }
</label>
```

- [ ] **Step 5: Implement `input.component.css`**

```css
.ui-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: var(--font-body);
}
.ui-input__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.005em;
}
.ui-input__field {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1.5px solid var(--border);
  transition: border-color var(--motion-default) var(--ease-out),
              box-shadow   var(--motion-default) var(--ease-out);
}
.ui-input__field:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-ring);
}
.ui-input__field--error { border-color: var(--danger); }
.ui-input__field--error:focus-within {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--danger) 22%, transparent);
}
.ui-input__field input {
  border: 0;
  outline: 0;
  background: transparent;
  flex: 1;
  font: 500 13.5px/1.4 var(--font-body);
  color: var(--text);
  min-width: 0;
}
.ui-input__field input::placeholder { color: var(--text-subtle); }
.ui-input__lead, .ui-input__trail { width: 16px; height: 16px; color: var(--text-muted); flex-shrink: 0; }
.ui-input__hint { font-size: 11.5px; color: var(--text-muted); }
.ui-input__error { font-size: 11.5px; color: var(--danger); }
```

- [ ] **Step 6: Barrel + test + commit**

Create `index.ts`:
```typescript
export * from './input.component';
```

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/input.component.spec.ts'`
Expected: PASS — 2 specs.

```bash
git add frontend/src/app/shared/ui/input
git commit -m "feat(ui): add Input component with ControlValueAccessor"
```

---

## Task 9: shared/ui/avatar — Avatar

**Goal:** A circular avatar showing initials or image. Used in sidebar user and topbar user.

**Files:**
- Create: `frontend/src/app/shared/ui/avatar/avatar.component.ts`
- Create: `frontend/src/app/shared/ui/avatar/avatar.component.html`
- Create: `frontend/src/app/shared/ui/avatar/avatar.component.css`
- Create: `frontend/src/app/shared/ui/avatar/avatar.component.spec.ts`
- Create: `frontend/src/app/shared/ui/avatar/index.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  let fixture: ComponentFixture<AvatarComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AvatarComponent] }).compileComponents();
    fixture = TestBed.createComponent(AvatarComponent);
  });

  it('renders initials derived from name', () => {
    fixture.componentRef.setInput('name', 'Júnico Vilela');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('JV');
  });

  it('shows single initial when single-word name', () => {
    fixture.componentRef.setInput('name', 'Marina');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('M');
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/avatar.component.spec.ts'`
Expected: FAIL.

- [ ] **Step 3: Implement `avatar.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-avatar',
  standalone: true,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  readonly name = input<string>('?');
  readonly src = input<string | null>(null);
  readonly size = input<AvatarSize>('md');
  readonly gradient = input(true);

  protected readonly initials = computed<string>(() => {
    const parts = this.name().trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
  });
}
```

- [ ] **Step 4: Implement `avatar.component.html`**

```html
<span
  [class]="'ui-avatar ui-avatar--' + size() + (gradient() ? ' ui-avatar--grad' : '')"
  [attr.aria-label]="name()"
>
  @if (src()) {
    <img [src]="src()!" [alt]="name()" />
  } @else {
    <span class="ui-avatar__initials">{{ initials() }}</span>
  }
</span>
```

- [ ] **Step 5: Implement `avatar.component.css`**

```css
.ui-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text);
  font-family: var(--font-body);
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
}
.ui-avatar--grad {
  background: linear-gradient(135deg, var(--indigo-500), var(--indigo-700));
  color: #fff;
}
[data-theme="dark"] .ui-avatar--grad {
  background: linear-gradient(135deg, var(--indigo-400), var(--cyan-400));
  color: var(--dark-base);
}
.ui-avatar img { width: 100%; height: 100%; object-fit: cover; }

.ui-avatar--sm { width: 24px; height: 24px; font-size: 10px; }
.ui-avatar--md { width: 32px; height: 32px; font-size: 12px; }
.ui-avatar--lg { width: 40px; height: 40px; font-size: 14px; }
```

- [ ] **Step 6: Barrel + test + commit**

Create `index.ts`:
```typescript
export * from './avatar.component';
```

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/avatar.component.spec.ts'`
Expected: PASS — 2 specs.

```bash
git add frontend/src/app/shared/ui/avatar
git commit -m "feat(ui): add Avatar with initials"
```

---

### ✅ Checkpoint B — Design system primitives available

After Task 9: Button, IconButton, Badge, Card, Input and Avatar exist with tests passing. Pause for visual review by importing all five into a temporary `playground.component.ts` if desired (not required — they will be exercised in Tasks 11–14).

---

## Task 10: shared/ui — barrel + tooltip directive + sample skeleton

**Goal:** Add a barrel for `shared/ui`, a minimal directive-based Tooltip (no overlay panel, native + CSS), and a tiny skeleton component used by topbar loading.

**Files:**
- Create: `frontend/src/app/shared/ui/index.ts`
- Create: `frontend/src/app/shared/ui/tooltip/tooltip.directive.ts`
- Create: `frontend/src/app/shared/ui/tooltip/tooltip.directive.spec.ts`
- Create: `frontend/src/app/shared/ui/tooltip/index.ts`
- Create: `frontend/src/app/shared/ui/skeleton/skeleton.component.ts`
- Create: `frontend/src/app/shared/ui/skeleton/skeleton.component.html`
- Create: `frontend/src/app/shared/ui/skeleton/skeleton.component.css`
- Create: `frontend/src/app/shared/ui/skeleton/index.ts`

- [ ] **Step 1: Write failing test for tooltip directive**

```typescript
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TooltipDirective } from './tooltip.directive';

@Component({
  standalone: true,
  imports: [TooltipDirective],
  template: `<button [uiTooltip]="'Salvar'">Save</button>`,
})
class HostComponent {}

describe('TooltipDirective', () => {
  it('sets title attribute on host', async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('title')).toBe('Salvar');
    expect(btn.getAttribute('aria-label')).toBe('Salvar');
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/tooltip.directive.spec.ts'`
Expected: FAIL.

- [ ] **Step 3: Implement `tooltip.directive.ts` (MVP — native title; richer overlay in Phase 2)**

```typescript
import { Directive, ElementRef, effect, inject, input } from '@angular/core';

@Directive({
  selector: '[uiTooltip]',
  standalone: true,
})
export class TooltipDirective {
  readonly uiTooltip = input.required<string>();
  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    effect(() => {
      const v = this.uiTooltip();
      const el = this.host.nativeElement;
      el.setAttribute('title', v);
      if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', v);
    });
  }
}
```

- [ ] **Step 4: Implement Skeleton (no test — pure visual)**

`skeleton.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SkeletonShape = 'line' | 'block' | 'circle';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly shape = input<SkeletonShape>('line');
  readonly width = input<string>('100%');
  readonly height = input<string>('14px');
}
```

`skeleton.component.html`:

```html
<span
  [class]="'ui-skel ui-skel--' + shape()"
  [style.width]="width()"
  [style.height]="height()"
  aria-hidden="true"
></span>
```

`skeleton.component.css`:

```css
.ui-skel {
  display: inline-block;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
  animation: ui-shimmer 1.5s ease-in-out infinite;
}
.ui-skel--circle { border-radius: 50%; }
.ui-skel--block  { border-radius: var(--radius); }
@keyframes ui-shimmer {
  0%, 100% { opacity: .55; }
  50%      { opacity: 1; }
}
```

- [ ] **Step 5: Create barrels**

`shared/ui/tooltip/index.ts`:
```typescript
export * from './tooltip.directive';
```

`shared/ui/skeleton/index.ts`:
```typescript
export * from './skeleton.component';
```

`shared/ui/index.ts`:
```typescript
export * from './avatar';
export * from './badge';
export * from './button';
export * from './card';
export * from './icon-button';
export * from './input';
export * from './skeleton';
export * from './tooltip';
```

- [ ] **Step 6: Run tooltip test, confirm pass**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/tooltip.directive.spec.ts'`
Expected: PASS — 1 spec.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/shared/ui/tooltip frontend/src/app/shared/ui/skeleton frontend/src/app/shared/ui/index.ts
git commit -m "feat(ui): add tooltip directive, skeleton and shared/ui barrel"
```

---

## Task 11: CommandPalette — service + component (⌘K)

**Goal:** Centered modal triggered by ⌘K (Mac) or Ctrl+K (Win/Linux). Lists navigation commands (home, doc-flow, release-orchestrator, administracao). Filters by query. Enter navigates, Esc closes. Phase 1 ships navigation only; module-contextual commands come later.

**Files:**
- Create: `frontend/src/app/shared/ui/command-palette/command-palette.service.ts`
- Create: `frontend/src/app/shared/ui/command-palette/command-palette.service.spec.ts`
- Create: `frontend/src/app/shared/ui/command-palette/command-palette.component.ts`
- Create: `frontend/src/app/shared/ui/command-palette/command-palette.component.html`
- Create: `frontend/src/app/shared/ui/command-palette/command-palette.component.css`
- Create: `frontend/src/app/shared/ui/command-palette/command-palette.component.spec.ts`
- Create: `frontend/src/app/shared/ui/command-palette/index.ts`

- [ ] **Step 1: Write failing test for service**

```typescript
import { TestBed } from '@angular/core/testing';
import { CommandPaletteService, PaletteCommand } from './command-palette.service';

describe('CommandPaletteService', () => {
  let svc: CommandPaletteService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CommandPaletteService] });
    svc = TestBed.inject(CommandPaletteService);
  });

  it('starts closed and with empty results', () => {
    expect(svc.isOpen()).toBeFalse();
    expect(svc.results().length).toBe(0);
  });

  it('open() + register() + filter()', () => {
    const cmds: PaletteCommand[] = [
      { id: 'home', label: 'Início', group: 'Navegação', route: '/' },
      { id: 'doc-flow', label: 'DocFlow', group: 'Navegação', route: '/doc-flow' },
      { id: 'release', label: 'Release Orchestrator', group: 'Navegação', route: '/release-orchestrator' },
    ];
    svc.register(cmds);
    svc.open();
    expect(svc.isOpen()).toBeTrue();
    expect(svc.results().length).toBe(3);

    svc.query.set('flow');
    expect(svc.results().map(c => c.id)).toEqual(['doc-flow', 'release']);
  });

  it('close() clears query and closes', () => {
    svc.register([{ id: 'home', label: 'Início', group: 'Navegação', route: '/' }]);
    svc.open();
    svc.query.set('hom');
    svc.close();
    expect(svc.isOpen()).toBeFalse();
    expect(svc.query()).toBe('');
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/command-palette.service.spec.ts'`
Expected: FAIL.

- [ ] **Step 3: Implement `command-palette.service.ts`**

```typescript
import { Injectable, computed, signal } from '@angular/core';

export interface PaletteCommand {
  id: string;
  label: string;
  group: string;
  route?: string;
  action?: () => void;
}

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private readonly _open = signal(false);
  private readonly _commands = signal<PaletteCommand[]>([]);
  readonly query = signal<string>('');

  readonly isOpen = this._open.asReadonly();
  readonly results = computed<PaletteCommand[]>(() => {
    const q = this.query().toLowerCase().trim();
    const all = this._commands();
    if (!q) return all;
    return all.filter(c => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
  });

  register(cmds: PaletteCommand[]): void { this._commands.set(cmds); }
  open(): void { this._open.set(true); }
  close(): void { this.query.set(''); this._open.set(false); }
  toggle(): void { this._open() ? this.close() : this.open(); }
}
```

- [ ] **Step 4: Run service test, confirm pass**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/command-palette.service.spec.ts'`
Expected: PASS — 3 specs.

- [ ] **Step 5: Write failing component test**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CommandPaletteComponent } from './command-palette.component';
import { CommandPaletteService } from './command-palette.service';

describe('CommandPaletteComponent', () => {
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let svc: CommandPaletteService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandPaletteComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(CommandPaletteComponent);
    svc = TestBed.inject(CommandPaletteService);
    fixture.detectChanges();
  });

  it('does not render the modal when closed', () => {
    expect(fixture.nativeElement.querySelector('.ui-palette')).toBeNull();
  });

  it('renders commands when open', () => {
    svc.register([{ id: 'home', label: 'Início', group: 'Navegação', route: '/' }]);
    svc.open();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ui-palette')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Início');
  });

  it('closes on Escape key', () => {
    svc.open();
    fixture.detectChanges();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(svc.isOpen()).toBeFalse();
  });
});
```

- [ ] **Step 6: Run test, confirm fail**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/command-palette.component.spec.ts'`
Expected: FAIL.

- [ ] **Step 7: Implement `command-palette.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CommandPaletteService, PaletteCommand } from './command-palette.service';

@Component({
  selector: 'ui-command-palette',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent {
  protected readonly svc = inject(CommandPaletteService);
  private readonly router = inject(Router);

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const cmdOrCtrl = e.metaKey || e.ctrlKey;
    if (cmdOrCtrl && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.svc.toggle();
      return;
    }
    if (this.svc.isOpen() && e.key === 'Escape') {
      e.preventDefault();
      this.svc.close();
    }
  }

  protected onQuery(event: Event): void {
    this.svc.query.set((event.target as HTMLInputElement).value);
  }

  protected run(cmd: PaletteCommand): void {
    if (cmd.action) cmd.action();
    if (cmd.route) this.router.navigateByUrl(cmd.route);
    this.svc.close();
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.svc.close();
  }
}
```

- [ ] **Step 8: Implement `command-palette.component.html`**

```html
@if (svc.isOpen()) {
  <div class="ui-palette__backdrop" (click)="onBackdrop($event)">
    <div class="ui-palette" role="dialog" aria-modal="true" aria-label="Paleta de comandos">
      <div class="ui-palette__search">
        <lucide-icon name="Search" class="ui-palette__search-ico" />
        <input
          autofocus
          type="search"
          placeholder="Para onde você quer ir?"
          [value]="svc.query()"
          (input)="onQuery($event)"
        />
        <kbd>esc</kbd>
      </div>
      <ul class="ui-palette__list">
        @for (cmd of svc.results(); track cmd.id) {
          <li class="ui-palette__item" (click)="run(cmd)">
            <span class="ui-palette__label">{{ cmd.label }}</span>
            <span class="ui-palette__group">{{ cmd.group }}</span>
          </li>
        } @empty {
          <li class="ui-palette__empty">Nenhum comando.</li>
        }
      </ul>
    </div>
  </div>
}
```

- [ ] **Step 9: Implement `command-palette.component.css`**

```css
.ui-palette__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, .45);
  backdrop-filter: blur(8px);
  z-index: 999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
}
.ui-palette {
  width: min(620px, 90vw);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: ui-palette-in 200ms var(--ease-out);
}
[data-theme="dark"] .ui-palette {
  background: var(--dark-surface);
  border-color: rgba(255, 255, 255, .08);
}
@keyframes ui-palette-in { from { transform: translateY(-6px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.ui-palette__search {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
}
.ui-palette__search input {
  flex: 1;
  border: 0; outline: 0; background: transparent;
  font: 500 15px/1.4 var(--font-body);
  color: var(--text);
}
.ui-palette__search-ico { width: 18px; height: 18px; color: var(--text-muted); }
.ui-palette__search kbd {
  font: 600 10px var(--font-mono);
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}
.ui-palette__list { list-style: none; max-height: 50vh; overflow-y: auto; padding: 6px; }
.ui-palette__item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-radius: var(--radius);
  cursor: pointer;
  transition: background-color var(--motion-default) var(--ease-out);
}
.ui-palette__item:hover { background: var(--surface-2); }
.ui-palette__label { font: 600 13.5px/1.2 var(--font-body); color: var(--text); }
.ui-palette__group { font: 500 11px/1 var(--font-body); color: var(--text-muted); }
.ui-palette__empty { padding: 18px; text-align: center; color: var(--text-muted); }
```

- [ ] **Step 10: Run component test, confirm pass**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --include='**/command-palette.component.spec.ts'`
Expected: PASS — 3 specs.

- [ ] **Step 11: Update `shared/ui/index.ts` barrel**

Add to `frontend/src/app/shared/ui/index.ts`:

```typescript
export * from './command-palette';
```

Create `frontend/src/app/shared/ui/command-palette/index.ts`:

```typescript
export * from './command-palette.service';
export * from './command-palette.component';
```

- [ ] **Step 12: Commit**

```bash
git add frontend/src/app/shared/ui/command-palette frontend/src/app/shared/ui/index.ts
git commit -m "feat(ui): add CommandPalette service + component with ⌘K trigger"
```

---

## Task 12: AppShell — redesigned sidebar + topbar

**Goal:** Replace the existing sidebar and topbar. Light mode uses bright sidebar; dark mode uses glass. Brand mark with gradient. Theme toggle and ⌘K trigger in topbar. Mobile menu still works.

**Files:**
- Modify: `frontend/src/app/core/layout/shell/app-shell.component.ts`
- Modify: `frontend/src/app/core/layout/shell/app-shell.component.html`
- Modify: `frontend/src/app/core/layout/shell/app-shell.component.css`

- [ ] **Step 1: Rewrite `app-shell.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '@core/auth/services/auth.service';
import { ThemeService } from '@core/theme/theme.service';
import {
  AvatarComponent, BadgeComponent, CommandPaletteComponent,
  CommandPaletteService, IconButtonComponent,
} from '@shared/ui';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
  meta?: number;
}
interface NavSection { label?: string; items: NavItem[]; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule,
    IconButtonComponent, AvatarComponent, BadgeComponent, CommandPaletteComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly palette = inject(CommandPaletteService);

  protected readonly mobileOpen = signal(false);
  protected readonly breadcrumb = signal<string>('Início');

  protected readonly sections: NavSection[] = [
    { items: [{ label: 'Início', icon: 'Home', route: '/', exact: true }] },
    {
      label: 'Módulos',
      items: [
        { label: 'DocFlow',      icon: 'FileText', route: '/doc-flow' },
        { label: 'Release Orchestrator', icon: 'Tag',      route: '/release-orchestrator' },
      ],
    },
    {
      label: 'Administração',
      items: [{ label: 'Administração', icon: 'Shield', route: '/administracao' }],
    },
  ];

  ngOnInit(): void {
    this.palette.register([
      { id: 'nav-home',  label: 'Ir para Início',        group: 'Navegação', route: '/' },
      { id: 'nav-doc',   label: 'Ir para DocFlow',        group: 'Navegação', route: '/doc-flow' },
      { id: 'nav-rel',   label: 'Ir para Release Orchestrator',   group: 'Navegação', route: '/release-orchestrator' },
      { id: 'nav-adm',   label: 'Ir para Administração',  group: 'Navegação', route: '/administracao' },
      { id: 'theme',     label: 'Alternar tema',          group: 'Preferências', action: () => this.theme.toggle() },
      { id: 'logout',    label: 'Sair',                   group: 'Sessão',       action: () => this.auth.logout() },
    ]);

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(),
    ).subscribe((e) => {
      this.mobileOpen.set(false);
      this.breadcrumb.set(this.deriveBreadcrumb((e as NavigationEnd).urlAfterRedirects));
    });
  }

  protected toggleMobile(): void { this.mobileOpen.update(v => !v); }
  protected toggleTheme(): void { this.theme.toggle(); }
  protected openPalette(): void { this.palette.open(); }
  protected logout(): void { this.auth.logout(); }

  private deriveBreadcrumb(url: string): string {
    const seg = url.split(/[?#]/)[0]!.split('/').filter(Boolean)[0] ?? '';
    if (!seg) return 'Início';
    const map: Record<string, string> = {
      'doc-flow': 'DocFlow',
      'release-orchestrator': 'Release Orchestrator',
      'administracao': 'Administração',
    };
    return map[seg] ?? seg;
  }
}
```

- [ ] **Step 2: Rewrite `app-shell.component.html`**

```html
<div class="shell" [class.shell--mobile-open]="mobileOpen()">
  <aside class="shell__sidebar" aria-label="Navegação principal">
    <a class="shell__brand" routerLink="/">
      <span class="shell__brand-mark">S</span>
      <span class="shell__brand-text">
        <span class="shell__brand-name">Softon Portal</span>
        <span class="shell__brand-tag">Intranet</span>
      </span>
    </a>

    <nav class="shell__nav">
      @for (section of sections; track section.label ?? '_root') {
        @if (section.label) { <div class="shell__nav-group">{{ section.label }}</div> }
        @for (item of section.items; track item.route) {
          <a
            class="shell__nav-link"
            [routerLink]="item.route"
            routerLinkActive="shell__nav-link--active"
            [routerLinkActiveOptions]="{ exact: !!item.exact }"
          >
            <lucide-icon [name]="item.icon" class="shell__nav-icon" />
            <span class="shell__nav-label">{{ item.label }}</span>
            @if (item.meta) { <ui-badge tone="accent">{{ item.meta }}</ui-badge> }
          </a>
        }
      }
    </nav>

    <div class="shell__user">
      <ui-avatar [name]="auth.userName() ?? 'Usuário'" size="md" />
      <div class="shell__user-info">
        <div class="shell__user-name">{{ auth.userName() ?? 'Usuário' }}</div>
        <div class="shell__user-role">{{ auth.userRole() ?? '' }}</div>
      </div>
      <ui-icon-button icon="LogOut" ariaLabel="Sair" tone="danger" (clicked)="logout()" />
    </div>
  </aside>

  <div class="shell__main">
    <header class="shell__topbar">
      <button class="shell__mobile-toggle" type="button" (click)="toggleMobile()" aria-label="Menu">
        <lucide-icon name="ChevronRight" />
      </button>
      <div class="shell__crumb">
        <span>Portal</span><lucide-icon name="ChevronRight" /><span>{{ breadcrumb() }}</span>
      </div>
      <div class="shell__topbar-actions">
        <button class="shell__search" type="button" (click)="openPalette()" aria-label="Abrir paleta de comandos">
          <lucide-icon name="Search" />
          <span>Buscar…</span>
          <kbd>⌘K</kbd>
        </button>
        <ui-icon-button icon="Bell" ariaLabel="Notificações" tone="default" />
        <ui-icon-button
          [icon]="theme.theme() === 'dark' ? 'Sun' : 'Moon'"
          [ariaLabel]="theme.theme() === 'dark' ? 'Tema claro' : 'Tema escuro'"
          tone="default"
          (clicked)="toggleTheme()"
        />
        <ui-avatar [name]="auth.userName() ?? 'Usuário'" size="sm" />
      </div>
    </header>

    <main class="shell__content">
      <router-outlet />
    </main>
  </div>

  <ui-command-palette />
</div>
```

- [ ] **Step 3: Rewrite `app-shell.component.css`**

```css
.shell {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}
.shell__sidebar {
  width: 248px;
  flex-shrink: 0;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  display: flex; flex-direction: column;
  position: sticky; top: 0; height: 100vh;
  overflow-y: auto;
}
[data-theme="dark"] .shell__sidebar { backdrop-filter: blur(20px); }

.shell__brand {
  display: flex; align-items: center; gap: 12px;
  padding: 20px 18px 18px;
  text-decoration: none; color: inherit;
  border-bottom: 1px solid var(--sidebar-border);
}
.shell__brand-mark {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius);
  background: linear-gradient(135deg, var(--indigo-500), var(--indigo-700));
  color: #fff; font: 800 14px/1 var(--font-display); letter-spacing: -0.04em;
}
[data-theme="dark"] .shell__brand-mark {
  background: linear-gradient(135deg, var(--indigo-400), var(--cyan-400));
  color: var(--dark-base);
}
.shell__brand-text { display: flex; flex-direction: column; gap: 3px; }
.shell__brand-name { font: 700 14px/1 var(--font-display); letter-spacing: -0.02em; color: var(--text); }
.shell__brand-tag  { font: 600 9.5px/1 var(--font-body); letter-spacing: .12em; text-transform: uppercase; color: var(--text-muted); }

.shell__nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; }
.shell__nav-group {
  padding: 14px 12px 6px;
  font: 700 10.5px/1 var(--font-body);
  letter-spacing: .12em; text-transform: uppercase;
  color: var(--text-subtle);
}
.shell__nav-link {
  position: relative;
  display: flex; align-items: center; gap: 11px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  font: 600 13px/1 var(--font-body);
  color: var(--sidebar-text);
  text-decoration: none;
  transition: background-color var(--motion-default) var(--ease-out),
              color var(--motion-default) var(--ease-out);
}
.shell__nav-link:hover { background: var(--surface-2); color: var(--text); }
.shell__nav-link--active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
}
.shell__nav-link--active::before {
  content: '';
  position: absolute; left: -10px; top: 22%; bottom: 22%;
  width: 3px;
  background: var(--sidebar-active-bar);
  border-radius: 0 3px 3px 0;
}
.shell__nav-icon { width: 16px; height: 16px; flex-shrink: 0; }
.shell__nav-label { flex: 1; }

.shell__user {
  padding: 12px;
  margin: 10px;
  border-radius: var(--radius);
  background: var(--surface-2);
  display: flex; align-items: center; gap: 10px;
  border: 1px solid var(--border);
}
.shell__user-info { flex: 1; min-width: 0; }
.shell__user-name { font: 600 12.5px/1.2 var(--font-body); color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.shell__user-role { font: 500 11px/1 var(--font-body); color: var(--text-muted); margin-top: 2px; }

.shell__main { flex: 1; min-width: 0; display: flex; flex-direction: column; }

.shell__topbar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 22px;
  background: var(--topbar-bg);
  border-bottom: 1px solid var(--topbar-border);
  position: sticky; top: 0; z-index: 5;
}
[data-theme="dark"] .shell__topbar { backdrop-filter: blur(20px); }

.shell__crumb { display: flex; align-items: center; gap: 6px; font: 500 12.5px/1 var(--font-body); color: var(--text-muted); }
.shell__crumb lucide-icon { width: 12px; height: 12px; }

.shell__topbar-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }

.shell__search {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px;
  border-radius: var(--radius);
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font: 500 12.5px/1 var(--font-body);
  cursor: pointer;
  min-width: 220px;
  transition: border-color var(--motion-default) var(--ease-out);
}
.shell__search:hover { border-color: var(--border-strong); color: var(--text); }
.shell__search lucide-icon { width: 14px; height: 14px; }
.shell__search span { flex: 1; text-align: left; }
.shell__search kbd { font: 600 10px var(--font-mono); padding: 2px 5px; border: 1px solid var(--border); border-radius: var(--radius-xs); color: var(--text-muted); background: var(--surface); }

.shell__content { flex: 1; min-width: 0; }

.shell__mobile-toggle {
  display: none;
  background: transparent; border: 0;
  width: 32px; height: 32px;
  color: var(--text);
}

@media (max-width: 768px) {
  .shell__sidebar {
    position: fixed; left: 0; top: 0; height: 100vh; z-index: 100;
    transform: translateX(-100%);
    transition: transform var(--motion-slow) var(--ease-out);
  }
  .shell--mobile-open .shell__sidebar { transform: translateX(0); }
  .shell__mobile-toggle { display: inline-flex; align-items: center; justify-content: center; }
  .shell__search { min-width: 0; flex: 1; }
}
```

- [ ] **Step 4: Ensure `AuthService` exposes `userName()` and `userRole()` signals — if not, add stub returns**

Open `frontend/src/app/core/auth/services/auth.service.ts`. If `userName` and `userRole` accessors don't exist, add (without breaking existing API):

```typescript
// add inside AuthService class
userName(): string | null { return this.session?.name ?? null; }
userRole(): string | null { return this.session?.role ?? null; }
```

Replace `this.session?.name`/`role` with whatever the existing session object actually stores. If unsure, return `'Usuário'` and `''` temporarily so the shell compiles, with a `// TODO(phase-2):` comment.

- [ ] **Step 5: Manually verify in browser**

Run: `cd frontend && npm start`
- Navigate to `/`. Sidebar should render with light or dark theme matching `data-theme`.
- Click the theme toggle (moon/sun in topbar). Body and chrome should switch.
- Press `⌘K` (Mac) or `Ctrl+K`. Palette opens. Type "doc" — DocFlow command appears. Enter (click) navigates.
- Resize browser below 768px. Sidebar hides; mobile toggle appears.

- [ ] **Step 6: Run all tests, confirm none regressed**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless`
Expected: all specs pass (theme + ui primitives + palette).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/core/layout/shell frontend/src/app/core/auth/services/auth.service.ts
git commit -m "feat(shell): redesign app shell with theme toggle and ⌘K palette"
```

---

### ✅ Checkpoint C — App shell premium

Theme toggle works, ⌘K opens, sidebar/topbar match the proposal. Module pages still render in the OLD aesthetic — that is the intended transitional state. Pause for review.

---

## Task 13: Login — redesigned split layout

**Goal:** Replace login with the split layout from the proposal: gradient aside on the left, white form area on the right, premium typography, design-system inputs/button. Single column on mobile.

**Files:**
- Modify: `frontend/src/app/core/auth/pages/login/login.component.ts`
- Modify: `frontend/src/app/core/auth/pages/login/login.component.html`
- Modify: `frontend/src/app/core/auth/pages/login/login.component.css`

- [ ] **Step 1: Inspect the current login to preserve its inputs/behavior**

Run: `cat frontend/src/app/core/auth/pages/login/login.component.ts`
Note the FormGroup, the submit handler, and any state signals — they must be preserved.

- [ ] **Step 2: Rewrite `login.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '@core/auth/services/auth.service';
import { ButtonComponent, InputComponent } from '@shared/ui';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, ButtonComponent, InputComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  protected submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.serverError.set(null);

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => { this.router.navigateByUrl('/'); },
      error: (e: Error) => {
        this.serverError.set(e.message || 'Não foi possível entrar.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  protected emailError(): string | null {
    const c = this.form.controls.email;
    if (!c.touched || !c.invalid) return null;
    if (c.errors?.['required']) return 'Informe seu e-mail.';
    if (c.errors?.['email'])    return 'E-mail inválido.';
    return null;
  }

  protected passwordError(): string | null {
    const c = this.form.controls.password;
    if (!c.touched || !c.invalid) return null;
    if (c.errors?.['required']) return 'Informe sua senha.';
    if (c.errors?.['minlength']) return 'Senha muito curta.';
    return null;
  }
}
```

> If `auth.login(email, password)` does not match the existing signature, adapt accordingly. Inspect the existing `AuthService.login()` in Step 1 and keep the call equivalent to current behavior.

- [ ] **Step 3: Rewrite `login.component.html`**

```html
<div class="login">
  <aside class="login__aside">
    <div class="login__aside-bg" aria-hidden="true"></div>
    <a class="login__aside-brand" href="/">
      <span class="login__brand-mark">S</span>
      <span class="login__brand-name">Softon Portal</span>
    </a>
    <div class="login__aside-content">
      <h1>O dia da equipe começa aqui.</h1>
      <p>Documentação, releases e administração em um só lugar — desenhado para a velocidade do dia a dia.</p>
      <ul class="login__features">
        <li><lucide-icon name="Check" /> Doc Flow com manuais por cliente</li>
        <li><lucide-icon name="Check" /> Release Orchestrator integrado ao changelog</li>
        <li><lucide-icon name="Check" /> Acesso unificado por SSO interno</li>
      </ul>
    </div>
    <div class="login__aside-footer">© Softon · {{ year }}</div>
  </aside>

  <section class="login__form-area">
    <div class="login__form-box">
      <h2>Entrar</h2>
      <p class="login__sub">Use suas credenciais corporativas.</p>

      @if (serverError()) {
        <div class="login__server-error" role="alert">{{ serverError() }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()">
        <ui-input
          label="E-mail"
          type="email"
          placeholder="voce@softon.com.br"
          autocomplete="email"
          leadingIcon="User"
          [error]="emailError()"
          formControlName="email"
        />
        <ui-input
          label="Senha"
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
          [error]="passwordError()"
          formControlName="password"
        />
        <ui-button type="submit" [loading]="loading()" [fullWidth]="true">Entrar</ui-button>
      </form>
    </div>
  </section>
</div>
```

- [ ] **Step 4: Implement `login.component.css`**

```css
.login {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--bg);
}

.login__aside {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px;
  color: #fff;
  overflow: hidden;
  background: linear-gradient(155deg, #0F1226 0%, #1E2A5E 50%, #4F46E5 100%);
}
.login__aside-bg {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 80%, rgba(124, 58, 237, .35) 0%, transparent 60%),
    radial-gradient(ellipse 60% 60% at 80% 20%, rgba(34, 211, 238, .25) 0%, transparent 55%);
  animation: login-bg-pulse 18s ease-in-out infinite;
}
@keyframes login-bg-pulse { 0%, 100% { opacity: .85; } 50% { opacity: 1; } }

.login__aside-brand {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 12px;
  color: inherit; text-decoration: none;
}
.login__brand-mark {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius);
  background: rgba(255, 255, 255, .14);
  border: 1px solid rgba(255, 255, 255, .22);
  font: 800 18px var(--font-display); letter-spacing: -0.04em;
  backdrop-filter: blur(8px);
}
.login__brand-name { font: 700 18px/1 var(--font-display); letter-spacing: -0.02em; }

.login__aside-content { position: relative; z-index: 1; max-width: 440px; }
.login__aside-content h1 {
  font: 700 36px/1.1 var(--font-display);
  letter-spacing: -0.04em;
  margin-bottom: 14px;
  color: #fff;
}
.login__aside-content p {
  font: 500 15px/1.6 var(--font-body);
  color: rgba(255, 255, 255, .72);
  max-width: 380px;
}
.login__features {
  list-style: none; margin-top: 28px;
  display: flex; flex-direction: column; gap: 10px;
}
.login__features li {
  display: flex; align-items: center; gap: 10px;
  font: 500 13px/1 var(--font-body);
  color: rgba(255, 255, 255, .78);
}
.login__features lucide-icon { width: 14px; height: 14px; color: var(--cyan-400); }

.login__aside-footer {
  position: relative; z-index: 1;
  font: 500 12px/1 var(--font-body);
  color: rgba(255, 255, 255, .45);
}

.login__form-area {
  display: flex; align-items: center; justify-content: center;
  padding: 48px;
  background: var(--surface);
}
.login__form-box { width: 100%; max-width: 380px; }
.login__form-box h2 {
  font: 700 24px/1.15 var(--font-display);
  letter-spacing: -0.025em;
  color: var(--text);
  margin-bottom: 4px;
}
.login__sub {
  font: 500 13.5px/1.5 var(--font-body);
  color: var(--text-muted);
  margin-bottom: 28px;
}

.login__server-error {
  background: var(--danger-soft);
  color: var(--danger);
  padding: 10px 12px;
  border-radius: var(--radius);
  border: 1px solid color-mix(in srgb, var(--danger) 30%, transparent);
  font: 500 12.5px var(--font-body);
  margin-bottom: 16px;
}

.login__form-box form {
  display: flex; flex-direction: column; gap: 16px;
}

@media (max-width: 900px) {
  .login { grid-template-columns: 1fr; }
  .login__aside { display: none; }
}
```

- [ ] **Step 5: Add `year` getter — modify `login.component.ts`**

Add inside the class:
```typescript
protected readonly year = new Date().getFullYear();
```

- [ ] **Step 6: Manually verify in browser**

Run: `cd frontend && npm start`
- Open `/login` (logout if needed: `localStorage.removeItem('doc-flow-jwt'); location.reload()`).
- Confirm split layout, gradient aside, form on right, validation messages on blur.
- Resize below 900px: aside hides, form occupies full width.
- Toggle theme via `document.documentElement.dataset.theme = 'dark'` in DevTools — form area should darken.

- [ ] **Step 7: Run all tests**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless`
Expected: all specs pass.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/core/auth/pages/login
git commit -m "feat(login): redesign with split layout and design system components"
```

---

### ✅ Checkpoint D — Login redesigned

Pause for review.

---

## Task 14: Home — hero greeting + KPI strip + module grid

**Goal:** Rewrite the dashboard home with the new layout: time-of-day greeting, KPI strip (4 stat cards), module grid (using existing `portal-modules.registry.ts`). Hover lift on cards.

**Files:**
- Modify: `frontend/src/app/modules/dashboard/pages/home/home.component.ts`
- Modify: `frontend/src/app/modules/dashboard/pages/home/home.component.html`
- Modify: `frontend/src/app/modules/dashboard/pages/home/home.component.css`

- [ ] **Step 1: Inspect current home + module registry**

Run:
```bash
cat frontend/src/app/modules/dashboard/pages/home/home.component.ts
cat frontend/src/app/core/config/portal-modules.registry.ts
```

Note: keep the existing module registry data source. Just adapt the rendering.

- [ ] **Step 2: Rewrite `home.component.ts`**

```typescript
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '@core/auth/services/auth.service';
import { PORTAL_MODULES, PortalModule } from '@core/config/portal-modules.registry';
import { BadgeComponent, CardComponent } from '@shared/ui';

interface Kpi { label: string; value: string; trend?: { dir: 'up' | 'down' | 'flat'; text: string }; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, CardComponent, BadgeComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly modules = PORTAL_MODULES;
  protected readonly userName = computed(() => this.auth.userName() ?? 'Usuário');
  protected readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 5)  return 'Boa madrugada';
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  });

  protected readonly kpis: Kpi[] = [
    { label: 'Releases / mês',    value: '—', trend: { dir: 'flat', text: 'sem dados' } },
    { label: 'Manuais ativos',    value: '—', trend: { dir: 'flat', text: 'sem dados' } },
    { label: 'Usuários ativos',   value: '—', trend: { dir: 'flat', text: 'sem dados' } },
    { label: 'Incidentes 24h',    value: '0', trend: { dir: 'flat', text: 'estável' } },
  ];

  protected onModule(m: PortalModule): void {
    if (m.disabled) return;
    this.router.navigateByUrl(m.route);
  }
}
```

> If `PortalModule` lacks `disabled` or `route` exactly, adapt to the actual schema in `portal-modules.registry.ts`. KPIs are intentionally placeholder values for Phase 1 — they wire to APIs in Phase 2 when modules expose endpoints.

- [ ] **Step 3: Rewrite `home.component.html`**

```html
<div class="home">
  <header class="home__hero">
    <h1>{{ greeting() }}, {{ userName() }}.</h1>
    <p>Você tem tudo o que precisa para tocar o dia abaixo. Use ⌘K para pular direto ao que quiser.</p>
  </header>

  <section class="home__kpis" aria-label="Indicadores do portal">
    @for (kpi of kpis; track kpi.label) {
      <ui-card padding="md">
        <div class="home__kpi">
          <span class="home__kpi-label">{{ kpi.label }}</span>
          <span class="home__kpi-value">{{ kpi.value }}</span>
          @if (kpi.trend) {
            <span class="home__kpi-trend" [attr.data-dir]="kpi.trend.dir">{{ kpi.trend.text }}</span>
          }
        </div>
      </ui-card>
    }
  </section>

  <section class="home__modules">
    <div class="home__section-title">Seus módulos</div>
    <div class="home__module-grid">
      @for (m of modules; track m.key) {
        <ui-card padding="md" [interactive]="!m.disabled">
          <a class="home__module" [class.home__module--disabled]="m.disabled" (click)="onModule(m)" [attr.href]="m.disabled ? null : m.route">
            <span class="home__module-ico"><lucide-icon [name]="m.icon" /></span>
            <span class="home__module-body">
              <span class="home__module-name">{{ m.label }}</span>
              <span class="home__module-desc">{{ m.description }}</span>
              @if (m.disabled) { <ui-badge tone="neutral">Em breve</ui-badge> }
            </span>
            @if (!m.disabled) { <lucide-icon name="ArrowRight" class="home__module-arrow" /> }
          </a>
        </ui-card>
      }
    </div>
  </section>
</div>
```

- [ ] **Step 4: Implement `home.component.css`**

```css
.home {
  padding: 28px 32px;
  display: flex; flex-direction: column; gap: 24px;
}

.home__hero h1 {
  font: 700 28px/1.15 var(--font-display);
  letter-spacing: -0.03em;
  color: var(--text);
  margin-bottom: 6px;
}
.home__hero p {
  font: 500 14px/1.5 var(--font-body);
  color: var(--text-muted);
  max-width: 560px;
}

.home__kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.home__kpi { display: flex; flex-direction: column; gap: 4px; }
.home__kpi-label {
  font: 700 10.5px/1 var(--font-body);
  letter-spacing: .1em; text-transform: uppercase;
  color: var(--text-muted);
}
.home__kpi-value {
  font: 700 22px/1 var(--font-display);
  letter-spacing: -0.03em;
  color: var(--text);
  font-feature-settings: "tnum" 1;
}
.home__kpi-trend {
  font: 600 11px/1 var(--font-body);
  color: var(--text-muted);
}
.home__kpi-trend[data-dir="up"]   { color: var(--success); }
.home__kpi-trend[data-dir="down"] { color: var(--danger); }

.home__section-title {
  font: 700 11px/1 var(--font-body);
  letter-spacing: .1em; text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 10px;
}
.home__module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}
.home__module {
  display: flex; align-items: flex-start; gap: 14px;
  text-decoration: none; color: inherit;
  position: relative;
}
.home__module--disabled { cursor: not-allowed; opacity: .55; }
.home__module-ico {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius);
  background: var(--accent-soft);
  color: var(--accent);
  flex-shrink: 0;
}
[data-theme="dark"] .home__module-ico {
  background: var(--accent-grad);
  color: #fff;
  box-shadow: var(--glow);
}
.home__module-ico lucide-icon { width: 18px; height: 18px; }
.home__module-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.home__module-name { font: 700 14px/1.2 var(--font-body); color: var(--text); letter-spacing: -0.01em; }
.home__module-desc { font: 500 12px/1.4 var(--font-body); color: var(--text-muted); }
.home__module-arrow {
  position: absolute; top: 0; right: 0;
  width: 16px; height: 16px;
  color: var(--text-subtle);
  transition: transform var(--motion-default) var(--ease-out), color var(--motion-default) var(--ease-out);
}
.home__module:hover .home__module-arrow {
  transform: translateX(3px);
  color: var(--accent);
}

@media (max-width: 1100px) {
  .home__kpis { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .home { padding: 18px; }
  .home__kpis { grid-template-columns: 1fr 1fr; }
}
```

- [ ] **Step 5: Manually verify in browser**

Run: `cd frontend && npm start`
- Open `/`. Confirm hero greeting (correct time of day), KPI strip, module grid.
- Hover a module card — should lift slightly.
- Toggle theme — colors swap, module icons gain gradient + glow in dark.
- Confirm responsive at <1100px and <768px.

- [ ] **Step 6: Run all tests**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless`
Expected: all specs pass.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/modules/dashboard/pages/home
git commit -m "feat(home): redesign with greeting, KPI strip and module grid"
```

---

## Task 15: Integration smoke + cleanup

**Goal:** Verify nothing regressed across the existing module pages (they still render even though their internal aesthetic is old), audit Lighthouse for the redesigned screens, and delete dead CSS.

**Files:**
- Modify: `frontend/src/styles.css` (will end up just the one-line import)
- Possibly modify: `frontend/src/app/styles/base/primeng-overrides.css` if PrimeNG widgets look broken inside module pages

- [ ] **Step 1: Walk through every existing route in dev mode**

Run: `cd frontend && npm start`

Visit each route and confirm it renders without console errors (the inner page may look unstyled — that is expected):
- `/login`
- `/`
- `/doc-flow` (and any sub-route exercised by clicking around)
- `/release-orchestrator`
- `/administracao`
- `/administracao/usuarios`
- `/administracao/grupos`
- `/administracao/permissoes`
- `/administracao/configuracoes`

For each, confirm:
- Sidebar + topbar render with new theme.
- ⌘K opens palette.
- Theme toggle works.
- No `[ERROR]` in browser console.

- [ ] **Step 2: Check PrimeNG components inside old module pages**

If `p-table`, `p-dialog` or other PrimeNG components look broken (wrong border color, contrast issue), extend `frontend/src/app/styles/base/primeng-overrides.css` with the minimum CSS variables needed. Do not rewrite their CSS — only set vars they consume.

- [ ] **Step 3: Confirm no leftover `--blue-*`/`--slate-*` references in the redesigned components**

Run: `grep -rE '--blue-|--slate-|--blue-500|--slate-900' frontend/src/app/core/layout frontend/src/app/core/auth frontend/src/app/modules/dashboard frontend/src/app/shared/ui`
Expected: no matches. If any, replace with the matching semantic token.

- [ ] **Step 4: Verify production build**

Run: `cd frontend && npm run build`
Expected: clean build, no errors, no `anyComponentStyle` budget warning.

- [ ] **Step 5: Run all tests one last time**

Run: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless --code-coverage`
Expected: all specs pass; coverage report generated under `frontend/coverage/`.

- [ ] **Step 6: Final commit**

```bash
git add frontend/src/app/styles
git commit -m "chore(redesign): finalize phase 1 foundation — smoke and PrimeNG overrides"
```

- [ ] **Step 7: Update spec status**

Open `docs/superpowers/specs/2026-06-07-portal-redesign-premium-design.md`. Add at the end of Section 10:

```markdown
**Status Fase 1:** Concluída em <YYYY-MM-DD>. Próximo: Fase 2 (migração dos módulos para os templates).
```

```bash
git add docs/superpowers/specs/2026-06-07-portal-redesign-premium-design.md
git commit -m "docs(spec): mark phase 1 foundation complete"
```

---

### ✅ Checkpoint E — Foundation complete

Login + shell + home are premium. Sidebar/topbar work in both themes. ⌘K opens. Module pages still render their old internals (transitional) but inherit the new chrome. Hand off to Phase 2 (Modules) — a separate plan.

---

## Phase 1 Deliverable Recap

When this plan is fully executed, the engineer will have:

- A token system that lives in clearly-bounded CSS files.
- A `ThemeService` with persistence and OS preference detection.
- `shared/ui/` with 8 production-ready components (Button, IconButton, Badge, Card, Input, Avatar, Skeleton, Tooltip directive) + CommandPalette.
- A premium `AppShell` with theme toggle and ⌘K palette.
- A redesigned login.
- A redesigned home with hero, KPIs, and module grid.
- Karma + Jasmine wired with ~20 passing specs.
- Tailwind v4 + lucide-angular installed and consumed.

**Not included** (Phase 2 work):
- Redesigning DocFlow, Release Orchestrator, Administração module internals.
- `<ui-list-page>`, `<ui-detail-page>`, `<ui-form-page>` templates.
- Select, Textarea, Switch, Checkbox, Radio, Chip, Tabs, Breadcrumb component, PageHeader, EmptyState, ErrorState, LoadingState.
- Module-contextual ⌘K commands.
- Keyboard navigation shortcuts (`g h`, `g d`, etc.).
