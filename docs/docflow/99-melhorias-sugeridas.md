# 99 — Melhorias Sugeridas (Frontend DocFlow)

Backlog específico do **frontend** do módulo `docflow`. Para backend, ver `softon-portal-api/docs/doc-flow/99-melhorias-sugeridas.md` se existir.

> Categorias: A. UX | B. Arquitetura | C. Performance | D. Acessibilidade | E. Testes | F. Tooling | G. Outros

---

## A. UX

### A.1 Toolbar rich-text no editor de página

- **Status**: ✅ entregue via `PaginaRichEditorComponent` (`ngx-editor`, modo **rico** default).
- Ver `06-editor-paginas.md`.

### A.2 Indicador "salvo localmente às hh:mm"

- **Status**: ✅ evoluído para autosave no servidor, indicador de estado e backup local.

### A.3 Tabs no detalhe da publicação

- **Impacto**: alto.
- **Esforço**: M.
- **Onde**: `publicacao-detalhe` ganha abas (Visão Geral / Páginas incluídas / Changelog / Downloads).

### A.4 Polling/SSE para publicações `GERANDO`

- **Status**: ✅ polling via `setInterval` em `publicacoes-list` (`TIMINGS.publicacoesPollIntervalMs`).
- **Melhoria futura**: SSE ou WebSocket.

### A.5 Diff visual entre revisões

- **Status**: ✅ diff do conteúdo HTML e identificação dos eventos editoriais entregues.
- **Melhoria futura**: evoluir para comparação side-by-side ou inline rica.

### A.10 Segurança editorial

- **Status**: ✅ entregue.
- Concorrência otimista, resolução explícita de conflitos, checklist de prontidão e prévia fiel.

### A.6 Filtros salvos por usuário

- **Impacto**: médio.
- **Esforço**: M.
- **Onde**: listas de páginas/clientes — persistir combinações de filtros em localStorage.

### A.7 Atalhos de teclado

- **Impacto**: médio (power users).
- **Esforço**: M.
- Atalhos: `Ctrl+S` (salvar), `Ctrl+P` (publicar), `Esc` (fechar modal), `/` (foco busca).
- **Status parcial**: ✅ `Ctrl+S` / `Cmd+S` entregue no editor de página.

### A.8 Modelos de página e criação sequencial

- **Status**: ✅ entregue.
- Galeria de modelos persistidos no backend, contexto herdado da lista e ações
  "salvar e continuar" / "salvar e criar próxima".
- Evoluído com criação e administração de modelos personalizados por projeto ou cliente.
- Evoluído com variáveis contextuais, visibilidade por escopo, edição, duplicação,
  arquivamento, restauração e versionamento com rastreabilidade de uso.

### A.9 Imagem na primeira edição

- **Status**: ✅ entregue.
- A primeira imagem cria um rascunho persistido antes do upload; não usa mais Base64.

---

## B. Arquitetura

### B.1 OpenAPI codegen

- **Status**: ✅ entregue.
- Backend expõe `/v3/api-docs` e `/swagger-ui`; o snapshot versionado gera tipos, SDK e
  cliente Angular com `@hey-api/openapi-ts` via `npm run api:generate`.
- `npm run api:check` detecta divergência depois da geração em CI.

### B.2 Role guard nas rotas sensíveis

- **Status**: ✅ entregue com RBAC por permissão (`DOMINIO:ACAO`).
- Formulários, listas, busca e detalhe usam `permissaoGuard`; botões, workflow,
  exclusões, ordenação e administração de modelos usam `PermissaoDirective`.

### B.3 Estado global por entidade (Signal Store)

- **Impacto**: médio.
- **Esforço**: M-L.
- **Stack**: `@ngrx/signals`.
- **Decisão**: só se cache de listas começar a ser necessário em múltiplos lugares.

### B.4 ErrorHandler global

- **Status**: ✅ entregue.
- `GlobalErrorHandler` captura exceções de runtime e rejeições; erros HTTP continuam sob
  responsabilidade dos interceptors para não duplicar mensagens.

### B.5 `ToastService` unificado

- **Status**: ✅ entregue com `ToastService`, host global e integração ao interceptor HTTP.

---

## C. Performance

### C.1 OnPush change detection

- **Status**: ✅ entregue nos componentes maduros do DocFlow.

### C.2 Virtual scroll em listas longas de páginas

- **Stack**: `@angular/cdk/scrolling`.
- **Esforço**: M.

### C.3 Cache leve em services de leitura

- **Status**: ✅ entregue para projetos, módulos e templates, com TTL e invalidação em mutações.

### C.4 Debounce em busca global

- **Estado**: verificar se já existe.
- **Esforço**: S.

---

## D. Acessibilidade

### D.1 Auditoria Lighthouse a11y

- **Status**: ✅ base automatizada entregue com axe + Playwright.
- A prévia contextual é validada contra WCAG 2 A/AA e o catálogo possui cenário mobile.
- **Melhoria futura**: adicionar Lighthouse CI e ampliar axe para todas as rotas autenticadas.

### D.2 Labels e aria em todos os inputs

- **Status parcial**: filtros de modelos, estados de carregamento, botões de prévia e
  campos críticos do editor revisados; manter auditoria progressiva nas demais telas.

### D.3 ARIA live regions para `flash` messages

- **Status**: ✅ entregue no host global de toast e nos estados contextuais.

### D.4 Foco visível em todos os elementos interativos

- **Status**: ✅ reforçado no seletor de templates e componentes compartilhados.

---

## E. Testes

### E.1 Unit tests dos services

- **Esforço**: M.

### E.2 Component tests críticos

- **Foco**: `pagina-form` (auto-save + canDeactivate + restauração), `paginas-list` (drag-drop + reorder), `publicacao-form` (preview + geração).

### E.3 E2E com Playwright

- **Status**: ✅ fluxo editorial entregue.
- Cenário stateful: criar cliente → projeto → módulo → página → prévia/aplicação de modelo
  → enviar revisão → aprovar → publicar.
- **Melhoria futura**: acrescentar geração e download do pacote com backend real em CI.

### E.4 A11y tests automatizados

- **Status**: ✅ entregue com `@axe-core/playwright` no fluxo de ouro.

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

| #   | Item                                     | Categoria   | Esforço | Status |
| --- | ---------------------------------------- | ----------- | ------- | ------ |
| 1   | A.2 Indicador "salvo às hh:mm" no editor | UX          | S       | ✅     |
| 2   | A.4 Polling para publicações GERANDO     | UX          | M       | ✅     |
| 3   | B.4 ErrorHandler global                  | Arquitetura | S       | ✅     |
| 4   | B.5 ToastService unificado               | Arquitetura | M       | ✅     |
| 5   | C.1 OnPush nos componentes maduros       | Performance | S       | ✅     |
| 6   | D.1 Base automatizada de a11y            | A11y        | S       | ✅     |
| 7   | B.2 Guard e controles por permissão      | Arquitetura | S       | ✅     |

---

## Cross-reference

- `softon-portal-web/docs/release-orchestrator/README.md` — documentação do módulo irmão (frontend).
- [`softon-portal-api/docs/doc-flow/README.md`](../../../softon-portal-api/docs/doc-flow/README.md) — backend DocFlow.
- [`softon-portal-api/docs/jornadas/README.md`](../../../softon-portal-api/docs/jornadas/README.md) — jornadas de uso.
