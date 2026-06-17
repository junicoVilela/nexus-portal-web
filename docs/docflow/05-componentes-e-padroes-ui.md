# 05 — Componentes e Padrões UI

## 1. Stack visual

- **`shared/ui`**: biblioteca interna (`button`, `icon-button`, `card`, `input`, `select`, `checkbox`, `switch`, `badge`, `chip`, `tooltip`, `breadcrumb`, `page-header`, `empty-state`, `skeleton`, `command-palette`, `avatar`, `dialog`).
- **Ícones**: `lucide-angular` (registrar nomes no `app.config.ts`).
- **Tailwind v4** utilities + tokens semânticos em `src/styles/tokens/`.
- **CSS por componente** para estilos específicos.
- **Sem PrimeNG/PrimeIcons** — removidos do projeto.

---

## 2. Componentes específicos do módulo

### `<app-pagina-status-badge [status]>`

Mapeia `StatusPagina` → tom + label:

| Status     | Tom     | Label       |
|------------|---------|-------------|
| RASCUNHO   | neutral | Rascunho    |
| EM_REVISAO | warn    | Em revisão  |
| APROVADO   | info    | Aprovado    |
| PUBLICADO  | success | Publicado   |
| ARQUIVADO  | danger  | Arquivado   |

Localização: `modules/docflow/components/pagina-status-badge/`.

---

## 3. Empty state

`ListPageComponent` (em `@shared/layouts/list-page/`) já embute `<ui-empty-state>` via `[emptyTitle]` / `[emptyDescription]`. Para listas fora desse layout, importe `EmptyStateComponent` direto:

```html
<ui-empty-state icon="Package" title="Nada por aqui" description="Crie o primeiro item.">
  <ui-button icon="Plus" (clicked)="abrirNovo()">Criar</ui-button>
</ui-empty-state>
```

---

## 4. Confirm dialog

Use `ConfirmService` (`@shared/ui`) em qualquer ação destrutiva (delete, arquivar, remover logo, etc.):

```ts
async excluir(item: Item): Promise<void> {
  const ok = await this.confirmService.confirm({
    title: 'Excluir item?',
    message: 'Esta ação não pode ser desfeita.',
    acceptLabel: 'Excluir',
    variant: 'danger',
    icon: 'Trash2',
  });
  if (!ok) return;
  this.service.delete(item.id).subscribe(...);
}
```

Baseado em `@angular/cdk/dialog`. Estilos do backdrop/panel em `src/styles/base/elements.css`.

---

## 5. Loading

- Listas: `ListPageComponent` mostra placeholder vazio quando `loading` é true e dados ainda não chegaram.
- Skeleton: `<ui-skeleton width="100%" height="2rem" />` para shell de carregamento mais rico.
- Botão: `<ui-button [loading]="saving" ...>`.

---

## 6. Toast / mensagens

Hoje cada página tem `flash(msg, error?)` próprio que renderiza inline. Não há toast unificado ainda (TODO no `99`).

---

## 7. Tabelas

Use `<table class="...">` nativo + `<app-table-pagination>` (`@shared/components/table-pagination`). Indentação hierárquica via padding-left dinâmico (ver `paginas-list`).

---

## 8. Forms

Reactive Forms sempre. Use `FormPageComponent` (`@shared/layouts/form-page/`) quando houver título + breadcrumb + cancel/save. Para forms simples ou customizados (cliente-form com upload de logo), pode usar `PageHeaderComponent` direto.
