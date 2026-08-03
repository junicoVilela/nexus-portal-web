# Nexus Portal Web — Premium Redesign

**Status:** Aprovado para implementação
**Data:** 2026-06-07
**Escopo:** Redesign visual + sistema de design do Nexus Portal Web (frontend Angular 21+).

---

## 1. Contexto e objetivo

O Nexus Portal Web é o portal interno corporativo da Nexus. Tem login, shell global (sidebar escura + topbar), home com cards de módulos, e quatro módulos com sub-shells: DocFlow, Release Orchestrator, Administração e Dashboard. A camada visual atual usa Inter + escala azul/slate + PrimeNG e funciona, mas tem aparência de SaaS genérico.

O objetivo deste redesign é elevar o portal para o padrão visual de produtos como Linear, Vercel e Stripe, mantendo a densidade de informação que um portal corporativo exige.

**Em escopo:**
- Login, app shell global, home
- Sub-shells e páginas dos quatro módulos existentes
- Sistema de tokens, temas light + dark, design system próprio
- Templates de página (lista, detalhe, formulário)
- Movimento, acessibilidade, atalhos de teclado

**Fora de escopo:**
- Mudanças em rotas, contratos de API, models, services
- Implementação dos módulos planejados ainda não codados (Release Orchestrator, Sistemas, Access Control, Monitoramento, Notificações) — eles só ganham registro na home
- Reescrever lógica de negócio dos módulos
- Migração de testes existentes

## 2. Direção visual

**Quiet Pro (light) + Premium Glass (dark)** — um sistema, dois modos.

### 2.1 Princípios

1. **Conteúdo primeiro.** Chrome (sidebar/topbar) silenciado; dados e ações em destaque.
2. **Densidade calibrada.** Linhas de tabela 40px. Padding em escalas de 4px (4, 8, 12, 16, 20, 24, 32, 40, 56).
3. **Um accent só.** Indigo é a cor de ação. Cores semânticas (sucesso, alerta, erro, info) só em estado.
4. **Movimento sutil.** Animações ≤ 200ms com easing custom. Nunca distração.

### 2.2 Paleta

**Light · Quiet Pro**

| Token | Hex | Uso |
|---|---|---|
| `--surface` | `#FFFFFF` | superfícies (cards, modais, sidebar) |
| `--bg` | `#F7F8FA` | fundo da aplicação |
| `--border` | `#E5E8EE` | bordas e divisores |
| `--text` | `#0B1220` | texto primário |
| `--text-muted` | `#6B7280` | texto secundário |
| `--accent` | `#4F46E5` | accent (indigo) |
| `--accent-700` | `#4338CA` | hover de accent |
| `--accent-50` | `#EEF0FF` | fundo suave de accent |
| `--success` | `#10B981` | estado positivo |
| `--warn` | `#F59E0B` | estado de atenção |
| `--danger` | `#EF4444` | estado de erro |
| `--info` | `#3B82F6` | estado neutro/info |

**Dark · Premium Glass**

| Token | Hex / valor | Uso |
|---|---|---|
| `--base` | `#060818` | fundo absoluto |
| `--bg` | `#0B0E1F` | fundo da aplicação |
| `--surface` | `rgba(255,255,255,.04)` | superfícies translúcidas |
| `--surface-elevated` | `rgba(255,255,255,.06)` | superfícies elevadas |
| `--border` | `rgba(255,255,255,.08)` | bordas |
| `--text` | `#E6E8F2` | texto primário |
| `--text-muted` | `#8B91B0` | texto secundário |
| `--accent` | `#818CF8` | accent (indigo lifted) |
| `--accent-cyan` | `#22D3EE` | accent secundário (gradiente assinatura) |
| `--accent-grad` | `linear-gradient(135deg, #7C3AED, #06B6D4)` | gradiente em estados ativos |
| `--success` | `#6EE7B7` | estado positivo |
| `--warn` | `#FCD34D` | atenção |
| `--danger` | `#FCA5A5` | erro |

**Gradiente assinatura** (`#7C3AED → #06B6D4`) aparece apenas em: ícone de brand mark, indicador de item ativo na sidebar, glow sob botão primário no dark, focus ring no dark. Não usar como fundo de cards inteiros.

### 2.3 Tipografia

| Família | Uso |
|---|---|
| **Inter Tight** — peso 700 | Display (38px), H1 (28px) — letter-spacing apertado (-.03em a -.04em) |
| **Inter** — pesos 500 / 600 / 700 | H2 (20px), corpo (14px), small (12px), labels |
| **JetBrains Mono** — peso 500 | Números, IDs (REL-2026.06-018), timestamps, versões, código |

Escala vertical: 38 / 28 / 20 / 16 / 14 / 12. Line-height: 1.05 / 1.15 / 1.2 / 1.4 / 1.55 / 1.45.

### 2.4 Iconografia

- **Lucide** (`lucide-angular`) para toda UI custom — traço 1.5px, 18px padrão.
- **PrimeIcons** mantido apenas dentro de componentes PrimeNG nativos.

### 2.5 Sombras e raios

- Raios: 4 / 6 / 8 / 10 / 12 / 14 / 16 / 9999.
- Sombras (light): `xs` `sm` `md` `lg` com base em rgba(15,23,42,.04 a .18). Dark usa sombras maiores com rgba(0,0,0,.35 a .5) + glow accent em estados ativos.

## 3. Stack — decisão e justificativa

**Híbrido: Tailwind v4 + PrimeNG selecionado + design system próprio em `shared/ui/`.**

### 3.1 Tailwind v4
Usado em modo CSS-first via `@theme` directive. Integra direto com as CSS variables (token semântico vira utility automaticamente). Sem dependência de PostCSS pesada. Substitui boa parte do CSS solto que existe hoje em `styles.css`.

### 3.2 PrimeNG — mantido onde dá trabalho real reescrever
- `p-table` (sort, lazy, scroll virtual, expand)
- `p-dialog`, `p-confirmdialog`
- `p-overlaypanel`
- `p-autocomplete`
- `p-calendar`
- `p-toast`

Cada um recebe theming via CSS vars para casar com o design system (sem `::ng-deep` solto — uso de `pt` props quando disponível).

### 3.3 Componentes próprios — `shared/ui/`
Substituem PrimeNG ou CSS solto onde dá ganho de identidade e simplicidade:

`Button`, `IconButton`, `Badge`, `Card`, `Input`, `Select`, `Textarea`, `Switch`, `Checkbox`, `Radio`, `Avatar`, `Skeleton`, `Tooltip`, `Chip`, `ChipFilter`, `PageHeader`, `EmptyState`, `LoadingState`, `ErrorState`, `Breadcrumb`, `Tabs`, `CommandPalette`.

Cada componente é standalone Angular, recebe inputs tipados, expõe um `variant`/`size` quando faz sentido. Sem regra de "componente compartilhado antes de ter reuso real" — a UI library nasce porque o redesign já tem demanda em todas as telas.

## 4. Sistema de tokens

### 4.1 Arquitetura em camadas

```
primitivos      → --indigo-500, --slate-900, --space-4 (valores crus)
semânticos      → --surface, --text, --accent, --border (refs lógicas)
componente      → --btn-primary-bg, --card-border (opcional)
```

Componentes consomem **apenas** semânticos. Primitivos ficam isolados em `styles/tokens/_primitives.css`. Mudar a marca da Nexus = ajustar uma linha em primitivos.

### 4.2 Theming

```html
<html data-theme="light">  <!-- ou "dark" -->
```

- `:root` define o tema light (default).
- `[data-theme="dark"]` redefine os semânticos.
- `ThemeService` em `core/theme/` aplica em `document.documentElement`, persiste em `localStorage['portal-theme']`, respeita `prefers-color-scheme` no primeiro load.
- Toggle no topbar com transição CSS de 200ms.

### 4.3 Arquivos

```
frontend/src/app/styles/
├── tokens/
│   ├── _primitives.css      (cores cruas, escalas)
│   ├── _semantic-light.css  (mapeamentos light)
│   ├── _semantic-dark.css   (mapeamentos dark)
│   ├── _typography.css      (família, tamanhos, line-height)
│   ├── _radii.css
│   ├── _shadows.css
│   └── _motion.css          (duração e easing padrão)
├── base/
│   ├── reset.css
│   ├── elements.css         (html, body, headings, link)
│   └── primeng-overrides.css
├── tailwind.css             (@theme com os semânticos)
└── index.css                (ponto de entrada)
```

## 5. Component strategy — o que vai em `shared/ui/`

Cada componente standalone, em `frontend/src/app/shared/ui/<nome>/`. Estrutura:

```
shared/ui/button/
├── button.component.ts
├── button.component.html
├── button.component.css
└── index.ts
```

API mínima:

| Componente | Inputs principais |
|---|---|
| `<ui-button>` | `variant: 'primary' \| 'secondary' \| 'ghost' \| 'danger'`, `size: 'sm' \| 'md' \| 'lg'`, `loading`, `icon` |
| `<ui-icon-button>` | `icon`, `tone`, `tooltip` |
| `<ui-badge>` | `tone: 'neutral' \| 'success' \| 'warn' \| 'danger' \| 'info' \| 'accent'` |
| `<ui-card>` | `padding`, `interactive` |
| `<ui-input>` | `label`, `hint`, `error`, `prefixIcon`, `suffixIcon` |
| `<ui-select>` | `label`, `options`, `searchable` |
| `<ui-avatar>` | `name`, `src`, `size`, `gradient` |
| `<ui-skeleton>` | `shape: 'line' \| 'block' \| 'circle'`, `width`, `height` |
| `<ui-tooltip>` | diretiva `[uiTooltip]` |
| `<ui-chip>` | `tone`, `removable` |
| `<ui-page-header>` | `title`, `subtitle`, `breadcrumb`, `actions` (slot) |
| `<ui-empty-state>` | `icon`, `title`, `description`, `action` (slot) |
| `<ui-command-palette>` | controlado por `CommandPaletteService` |

Componentes existentes (`audit-stamp`, `table-pagination`) ficam onde estão por enquanto e podem ser migrados em fase 3.

## 6. Layout templates

Três templates cobrem >90% das telas. Implementados como componentes containers em `shared/layouts/`.

### 6.1 `<ui-list-page>`
- `PageHeader` com breadcrumb, título, subtítulo, ações.
- `<ng-content select="[filters]">` para filter bar sticky.
- `<ng-content>` para conteúdo principal (tabela).
- Slots para estados loading / empty / error embutidos (controlados por inputs `loading`, `isEmpty`, `error`).
- Usado em: usuários, grupos, permissões, manuais, releases, changelog, templates, produtos, configurações.

### 6.2 `<ui-detail-page>`
- Breadcrumb + título + metadata strip.
- `<ng-content select="[tabs]">` opcional para tabs.
- `<ng-content>` para corpo.
- `<ng-content select="[aside]">` opcional para sidebar contextual sticky.
- Usado em: detalhe de release, detalhe de manual, página de manual.

### 6.3 `<ui-form-page>`
- Header com título.
- `<ng-content>` agrupado em `<ui-form-section>` (seções com título + descrição + campos).
- Sticky footer com botões salvar / cancelar.
- Dirty-guard integrado: `canDeactivate` bloqueia navegação se houver alterações não salvas.
- Usado em: criação/edição em todos os módulos.

### 6.4 `<app-shell>` (redesenhado)
- Sidebar colapsável (240px ↔ 64px).
  - Brand mark com letra "S" + gradiente.
  - Nav items agrupados por seção, indicador lateral animado no ativo.
  - User fixo no rodapé com avatar gradiente, nome, role, botão logout.
  - Light mode: sidebar clara (`#FFFFFF`). Dark mode: vidro (`backdrop-filter: blur(20px)`).
- Topbar:
  - Breadcrumb dinâmico.
  - Global search `⌘K` (abre `CommandPalette`).
  - Notifications icon (presente no design, sem comportamento — wire-up fica para fase futura quando houver módulo de Notificações).
  - Theme toggle.
  - Avatar do usuário com menu.

### 6.5 Sub-shells por módulo
DocFlow, Release Orchestrator e Administração continuam com sub-shells próprios. Eles passam a usar uma sub-sidebar ou tabs internas no mesmo sistema de tokens.

## 7. Páginas — mudanças por tela

| Tela atual | Mudança |
|---|---|
| `/login` | Aside com gradiente animado sutil (canvas leve, não a textura SVG atual), tipografia editorial, inputs e botão do design system novo. Single column em mobile. |
| `/` (home) | Hero com saudação contextual ("Boa noite, X — Y pendências"), strip de 4 KPIs do portal, grid responsivo de módulos. Cards com hover + arrow animado. |
| `/doc-flow/...` | Sub-shell redesenhado, todas as páginas migram para `ListPage` / `DetailPage` / `FormPage`. |
| `/release-orchestrator/...` | Sub-shell redesenhado, idem. |
| `/administracao/...` | Idem. Home da administração ganha cards no estilo da home global. |

Páginas planejadas (Release Orchestrator, Sistemas, Access Control, Monitoramento, Notificações): só registro no `portal-modules.registry.ts` com card "em breve" desabilitado.

## 8. Movimento

- **Duração padrão:** hover 150ms, slide/fade 200ms, modal enter 220ms.
- **Easing padrão:** `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo suavizada).
- **Skeletons** em listas e cards durante loading (shimmer 1.5s ease-in-out infinite).
- **Page transitions** sutis no router (fade de 150ms).
- **Sem** animações em scroll, sem parallax, sem fontes animadas — é portal corporativo, não landing page.

## 9. Acessibilidade

- **Contraste WCAG AA** validado para todos os pares texto/fundo nos dois temas.
- **Focus visible** sempre — ring 3px na cor accent com alpha 15-18%. Nunca `outline:none` sem replacement.
- **Keyboard navigation:** `⌘K` busca, `Esc` fecha overlays, `↑↓ Enter` em listas, `Tab` ordem lógica.
- **Atalhos globais:** `g h` home, `g d` doc-flow, `g r` release-orchestrator, `g a` administração (padrão Linear).
- **aria-label** obrigatório em icon buttons.
- **prefers-reduced-motion** desativa animações de slide e shimmer; mantém só opacidade.

## 10. Roadmap — 3 fases

### Fase 1 — Foundation
**Entregável:** portal navega com tema novo em todas as telas existentes, com login, shell e home redesenhados. Páginas dos módulos ainda mostram aparência antiga (transitória).

- Adicionar Tailwind v4 + estrutura de tokens.
- `ThemeService` + toggle.
- Construir `shared/ui/` com primitivos (Button, Badge, Card, Input, Select, Switch, Avatar, Skeleton, Tooltip, Chip, PageHeader, EmptyState, Breadcrumb, Tabs).
- Redesenhar `<app-shell>`, login e home.
- Adicionar `CommandPalette` (sem comandos de módulo ainda, só navegação básica).
- Migrar `index.html` para carregar Inter Tight + JetBrains Mono.
- Instalar `lucide-angular`.

### Fase 2 — Módulos
**Entregável:** todas as páginas dos quatro módulos com o design novo. Um PR por módulo.

- **DocFlow:** sub-shell + páginas de cliente, projeto, módulo, página, publicação migram para os templates.
- **Release Orchestrator:** sub-shell + páginas de releases (lista, detalhe, criação), changelog, templates, produtos.
- **Administração:** home, usuários, grupos, permissões, configurações.
- Filtros agrupados em chip-bar.
- Toasts via PrimeNG temado.

### Fase 3 — Polish
- ⌘K palette ganha comandos contextuais por módulo.
- Atalhos `g h`, `g d`, `g r`, `g a`.
- Skeletons em todas as listas.
- Micro-animations finais (arrow no card, badge entrada).
- Auditoria a11y com axe-core, ajustes finais.
- Migrar `audit-stamp` e `table-pagination` para o novo sistema.

**Status Fase 1:** Concluída em 2026-06-07. Próximo: Fase 2 (migração dos módulos para os templates).

**Status Fase 2a:** Concluída em 2026-06-07. Administração migrada para o design system. Próximo: Fase 2b (DocFlow) e Fase 2c (Release Orchestrator).

## 11. Regras de implementação

- Não mexer em services, models, guards, interceptors.
- Não mudar rotas nem signatures de componentes públicos (inputs / outputs).
- CSS solto vai sendo movido para tokens + Tailwind à medida que a tela é migrada. Não é necessário esvaziar `styles.css` em uma única passada.
- Cada componente novo em `shared/ui/` vem com test mínimo (render + estados principais).
- PrimeNG override só via CSS vars ou `pt` props; sem `::ng-deep` solto.

## 12. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Período transitório com aparência misturada entre fase 1 e fase 2 | Tema novo é coerente o suficiente para conviver; CSS solto antigo fica intocado até a migração da página |
| PrimeNG não themar bem em alguns componentes | Override com `pt` props (Angular 19+) ou CSS variables; se inviável, substitui pelo componente próprio |
| Tailwind v4 + Angular 21 compatibilidade | Validar setup logo no início da Fase 1; fallback para Tailwind v3 se preciso |
| Acessibilidade do dark mode com gradientes | Manter texto sempre sobre superfícies sólidas, não sobre gradiente; validar contraste com axe |

## 13. Questões abertas

Nenhuma bloqueante. Decisões a confirmar durante a Fase 1, com exemplos rodando:

- Densidade default das tabelas (cozy 40px vs compact 32px).
- Persistir estado de sidebar colapsada por usuário ou global.
- Se a saudação contextual do hero da home deve mudar por hora do dia ou ficar fixa.
