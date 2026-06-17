# 99 — Melhorias Sugeridas (Frontend DocFlow)

Backlog específico do **frontend** do módulo `docflow`. Para backend, ver `softon-portal-api/docs/doc-flow/99-melhorias-sugeridas.md` se existir.

> Categorias: A. UX | B. Arquitetura | C. Performance | D. Acessibilidade | E. Testes | F. Tooling | G. Outros

---

## A. UX

### A.1 Toolbar rich-text no editor de página
- **Status**: ✅ entregue via `PaginaRichEditorComponent` (`ngx-editor`, modo **rico** default).
- Ver `06-editor-paginas.md`.

### A.2 Indicador "salvo localmente às hh:mm"
- **Impacto**: médio.
- **Esforço**: S.
- **Onde**: `pagina-form` template — exibir `rascunhoSalvoEm` formatado.

### A.3 Tabs no detalhe da publicação
- **Impacto**: alto.
- **Esforço**: M.
- **Onde**: `publicacao-detalhe` ganha abas (Visão Geral / Páginas incluídas / Changelog / Downloads).

### A.4 Polling/SSE para publicações `GERANDO`
- **Status**: ✅ polling via `setInterval` em `publicacoes-list` (`TIMINGS.publicacoesPollIntervalMs`).
- **Melhoria futura**: SSE ou WebSocket.

### A.5 Diff visual entre revisões
- **Impacto**: alto.
- **Esforço**: L.
- **Hoje**: estrutura básica de diff por linhas existe; pode evoluir para diff side-by-side ou inline rico.

### A.6 Filtros salvos por usuário
- **Impacto**: médio.
- **Esforço**: M.
- **Onde**: listas de páginas/clientes — persistir combinações de filtros em localStorage.

### A.7 Atalhos de teclado
- **Impacto**: médio (power users).
- **Esforço**: M.
- Atalhos: `Ctrl+S` (salvar), `Ctrl+P` (publicar), `Esc` (fechar modal), `/` (foco busca).

---

## B. Arquitetura

### B.1 OpenAPI codegen
- **Impacto**: alto (elimina drift).
- **Esforço**: M.
- **Stack**: `orval` ou `openapi-typescript-codegen`.
- **Depende**: backend expor OpenAPI.

### B.2 Role guard nas rotas sensíveis
- **Impacto**: alto.
- **Esforço**: S.
- **Como**: `roleGuard('ADMIN','EDITOR')` em formulários de cliente, publicação, e ações de workflow.

### B.3 Estado global por entidade (Signal Store)
- **Impacto**: médio.
- **Esforço**: M-L.
- **Stack**: `@ngrx/signals`.
- **Decisão**: só se cache de listas começar a ser necessário em múltiplos lugares.

### B.4 ErrorHandler global
- **Impacto**: alto.
- **Esforço**: S.
- **Como**: `provideErrorHandler` que captura HTTP errors e mostra toast/redirect.

### B.5 `ToastService` unificado
- **Impacto**: alto.
- **Esforço**: M.
- Cada página implementa `flash()` próprio hoje — extrair para serviço + componente `<app-toast-host>` em `shared/ui/toast`.

---

## C. Performance

### C.1 OnPush change detection
- **Impacto**: médio-alto.
- **Esforço**: S por componente.
- Várias páginas estão em `ChangeDetectionStrategy.Default`. Migrar gradualmente.

### C.2 Virtual scroll em listas longas de páginas
- **Stack**: `@angular/cdk/scrolling`.
- **Esforço**: M.

### C.3 Cache leve em services de leitura
- **Onde**: `projetos()`, `modulos()` — listas que mudam pouco e são chamadas várias vezes em diferentes telas.

### C.4 Debounce em busca global
- **Estado**: verificar se já existe.
- **Esforço**: S.

---

## D. Acessibilidade

### D.1 Auditoria Lighthouse a11y
- **Esforço**: S inicial + M corrigir.
- Meta: ≥ 95.

### D.2 Labels e aria em todos os inputs
- **Esforço**: M.

### D.3 ARIA live regions para `flash` messages
- **Esforço**: S.

### D.4 Foco visível em todos os elementos interativos
- **Esforço**: S.

---

## E. Testes

### E.1 Unit tests dos services
- **Esforço**: M.

### E.2 Component tests críticos
- **Foco**: `pagina-form` (auto-save + canDeactivate + restauração), `paginas-list` (drag-drop + reorder), `publicacao-form` (preview + geração).

### E.3 E2E com Playwright
- **Cenário golden**: criar projeto → módulo → página → enviar revisão → aprovar → publicar → gerar pacote → download.

### E.4 A11y tests automatizados
- **Stack**: `axe-core` + Playwright.

---

## F. Tooling

### F.1 ESLint + Prettier
- **Esforço**: S.

### F.2 Storybook para `shared/ui`
- **Esforço**: M.
- Catálogo visual de componentes shared.

---

## G. Outros

### G.1 i18n
- **Esforço**: L.
- Não previsto no MVP.

### G.2 Print-friendly views
- **Esforço**: M.
- `@media print` para detalhe de página.

### G.3 Notificações em tempo real
- **Esforço**: L.
- WebSocket/SSE para "página X foi aprovada por Y".

---

## Quick wins (priorizados)

| # | Item | Categoria | Esforço |
|---|---|---|---|
| 1 | A.2 Indicador "salvo às hh:mm" no editor | UX | S | ✅ |
| 2 | A.4 Polling para publicações GERANDO | UX | M | ✅ |
| 3 | B.4 ErrorHandler global | Arquitetura | S |
| 4 | B.5 ToastService unificado | Arquitetura | M |
| 5 | C.1 OnPush nos componentes maduros | Performance | S |
| 6 | D.1 Auditoria Lighthouse a11y | A11y | S |
| 7 | B.2 Role guard | Arquitetura | S |

---

## Cross-reference

- `softon-portal-web/docs/release-orchestrator/README.md` — documentação do módulo irmão (frontend).
- [`softon-portal-api/docs/doc-flow/README.md`](../../../softon-portal-api/docs/doc-flow/README.md) — backend DocFlow.
- [`softon-portal-api/docs/jornadas/README.md`](../../../softon-portal-api/docs/jornadas/README.md) — jornadas de uso.
