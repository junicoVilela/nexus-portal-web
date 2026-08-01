# 99 — Melhorias Sugeridas (Frontend DocFlow)

Backlog específico do **frontend** do módulo `docflow`. Para backend, ver `softon-portal-api/docs/doc-flow/99-melhorias-sugeridas.md` se existir.

> Categorias: A. UX | B. Arquitetura | C. Performance | D. Acessibilidade | E. Testes | F. Tooling | G. Outros

---

## A. UX

### A.0 Operação editorial consolidada

- **Status**: ✅ entregue.
- Dashboard calculado no backend, com saúde editorial, taxa de sucesso e fila acionável.
- Central de revisão com SLA visual, checklist, comentários, diff, aprovação e devolução.
- Biblioteca de mídia global com busca, paginação, cópia de URL e acesso à página de origem.
- Publicações com filtro de status no servidor e reprocessamento em lote.
- Qualidade automática alinhada entre cliente e servidor para imagens, links e títulos.

### A.1 Toolbar rich-text no editor de página

- **Status**: ✅ entregue via `PaginaRichEditorComponent` (`ngx-editor`, modo **rico** default).
- Ver `06-editor-paginas.md`.

### A.2 Indicador "salvo localmente às hh:mm"

- **Status**: ✅ evoluído para autosave no servidor, indicador de estado e backup local.

### A.3 Tabs no detalhe da publicação

- **Status**: ✅ entregue.
- **Onde**: `publicacao-detalhe` com abas Visão Geral / Páginas / Changelog / Downloads.
- A aba Páginas usa snapshot `GET /publicacoes/{id}/paginas` (fallback: changelog plano).

### A.4 Polling/SSE para publicações `GERANDO`

- **Status**: ✅ SSE autenticado como canal principal e polling visibility-aware como contingência.

### A.5 Diff visual entre revisões

- **Status**: ✅ diff unificado (linha/palavra) e comparação **lado a lado** do HTML renderizado (`df-doc-content`) na central de revisão e no editor (`pagina-revisoes`).

### A.10 Segurança editorial

- **Status**: ✅ entregue.
- Concorrência otimista, resolução explícita de conflitos, checklist de prontidão e prévia fiel.

### A.6 Filtros salvos por usuário

- **Status**: ✅ presets persistidos em `localStorage` via `<ui-filter-presets>` (escopo por lista).
- **Impacto**: médio.
- **Esforço**: M.
- **Onde**: listas de páginas/clientes — persistir combinações de filtros em localStorage.

### A.7 Atalhos de teclado

- **Impacto**: médio (power users).
- **Esforço**: M.
- Atalhos: `Ctrl+S` (salvar), `Ctrl+P` (publicar), `Esc` (fechar modal), `/` (foco busca).
- **Status**: ✅ `Ctrl+S` / `Cmd+S` e `Ctrl+P` / `Cmd+P` no editor (publicar quando APROVADO); `/` na lista de páginas; `Esc` fecha seletor de modelos e painéis aninhados (ex.: biblioteca de blocos).

### A.8 Modelos de página e criação sequencial

- **Status**: ✅ entregue.
- Galeria de modelos persistidos no backend, contexto herdado da lista e ações
  "salvar e continuar" / "salvar e criar próxima".
- Evoluído com criação e administração de modelos personalizados por projeto ou cliente.
- Evoluído com variáveis contextuais, visibilidade por escopo, edição, duplicação,
  arquivamento, restauração e versionamento com rastreabilidade de uso.
- Hierarquia: botão visível **Nova subpágina**, subtítulo no form com pai, e tipo
  **Menu / pasta** (`tipoPagina=menu` + kit-menu) no frontend (backend ainda trata como página HTML).

### A.9 Imagem na primeira edição

- **Status**: ✅ entregue.
- A primeira imagem cria um rascunho persistido antes do upload; não usa mais Base64.

### A.11 Preview tokens na lista de clientes

- **Status**: ✅ entregue no painel de vínculos (`clientes-list`): gerar token (72h), listar, copiar URL e revogar.
- Permissões: `PUBLICACAO:LER` (listar) e `PUBLICACAO:EDITAR` (gerar/revogar).

---

## B. Arquitetura

### B.1 OpenAPI codegen

- **Status**: ✅ entregue.
- Backend expõe `/v3/api-docs` e `/swagger-ui`; o snapshot versionado gera tipos, SDK e
  cliente Angular com `@hey-api/openapi-ts` via `npm run api:generate`.
- `npm run api:check` detecta divergência depois da geração em CI.
- O domínio de templates já usa o SDK gerado; a migração dos demais services é incremental.
- Após gerar um pacote, o snapshot da árvore de páginas fica disponível em `GET /publicacoes/{id}/paginas`.

### B.2 Role guard nas rotas sensíveis

- **Status**: ✅ entregue com RBAC por permissão (`DOMINIO:ACAO`).
- Formulários, listas, busca e detalhe usam `permissaoGuard`; botões, workflow,
  exclusões, ordenação e administração de modelos usam `PermissaoDirective`.

### B.3 Estado global por entidade (Signal Store)

- **Impacto**: médio.
- **Esforço**: M-L.
- **Stack**: `@ngrx/signals`.
- **Decisão**: **deferido** — cache com TTL nos services de leitura é suficiente; ainda não há dor de sincronização multi-tela.

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

- **Decisão**: listas administrativas permanecem paginadas no servidor e, portanto, mantêm
  o DOM limitado. Virtual scroll fica reservado a um futuro catálogo sem paginação.

### C.3 Cache leve em services de leitura

- **Status**: ✅ entregue para projetos, módulos e templates, com TTL e invalidação em mutações.

### C.4 Debounce em busca global

- **Status**: ✅ `debounceTime(TIMINGS.searchDebounceMs)` e `distinctUntilChanged`.

---

## D. Acessibilidade

### D.1 Auditoria Lighthouse a11y

- **Status**: ✅ axe + Playwright em `/login`, `/doc-flow`, `/doc-flow/midias` (`npm run a11y:routes`).
- A prévia contextual é validada contra WCAG 2 A/AA e o catálogo possui cenário mobile.
- **Lighthouse CI**: ✅ `npm run lighthouse:ci` no workflow do frontend — 3 execuções em `/login` com `minScore` 0.85 (warn) para acessibilidade.

### D.2 Labels e aria em todos os inputs

- **Status**: ✅ evoluído — headers ordenáveis com `aria-label`/`aria-sort` (páginas,
  publicações, clientes, revisões), `aria-pressed` nos modos do editor, tabela de páginas
  e handle de drag nomeados; E2E axe também cobre `/doc-flow/paginas` e `/doc-flow/publicacoes`.
  Manter auditoria pontual em telas novas.

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
- **Status**: ✅ `pagina-form` cobre canDeactivate, autosave/debounce, restauração de rascunho local, `parentId` e `tipoPagina=menu`; listas/publicação/revisões já tinham cobertura ampliada.

### E.3 E2E com Playwright

- **Status**: ✅ fluxo editorial entregue.
- Cenário stateful: criar cliente → projeto → módulo → página → prévia/aplicação de modelo
  → enviar revisão → aprovar → publicar.
- **Status backend real**: ✅ `PublicacaoDownloadIntegrationTest` sobe PostgreSQL com
  Testcontainers, gera uma publicação e valida downloads ZIP e PDF na suíte Maven do CI.

### E.4 A11y tests automatizados

- **Status**: ✅ entregue com `@axe-core/playwright` no fluxo de ouro.

---

## F. Tooling

### F.1 ESLint + Prettier

- **Status**: ✅ lint sem avisos e geração formatada verificados no CI.

### F.2 Storybook para `shared/ui`

- **Status**: ✅ entregue — catálogo `shared/ui` (26+ stories) e `DocFlow/PaginaStatusBadge`.
- Páginas DocFlow não catalogadas (foco em componentes compartilhados).

---

## G. Outros

### G.1 i18n

- **Esforço**: L.
- **Decisão**: **deferido** fora do MVP — apenas `$localize` pontual em `error-state`; sem `ngx-translate`.

### G.2 Print-friendly views

- **Status**: ✅ `@media print` global (`_print.css`) oculta chrome (nav, toasts, editor de código) e preserva `.df-doc-content`, `.pf-preview-body`, `.pubf__html-content` e detalhe de publicação; botões `window.print()` em prévia de página, formulário de publicação e detalhe de publicação.

### G.3 Notificações em tempo real

- **Status**: ✅ — SSE de páginas (`GET /paginas/eventos`) em enviar-revisão/aprovar/publicar/**arquivar/devolver**; frontend notifica em `paginas-list` e `revisoes` (ignora evento do próprio usuário quando `usuario` disponível). Publicações já tinham SSE (`/publicacoes/eventos`). Ambos documentados no snapshot OpenAPI (`text/event-stream`).

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
