# 00 — Visão Geral (Frontend)

Documentação do módulo **DocFlow** no projeto `softon-portal-web`. **Foco frontend** — para backend, ver `softon-portal-api/docs/doc-flow/`.

---

## 1. O que é

UI Angular para criação, edição, organização e publicação de **documentação técnica** (manuais de usuário) por cliente. Organiza conteúdo em hierarquia `Cliente → Projeto → Módulo → Página`, gera **pacotes ZIP/PDF** por cliente em **publicações** versionadas.

---

## 2. Onde vive no código

```text
softon-portal-web/frontend/src/app/modules/docflow/
├── docflow.routes.ts                 ← DOCFLOW_ROUTES
├── shell/
│   └── docflow-shell.component.ts    ← DocflowShellComponent (sidebar + outlet)
├── pages/
│   ├── dashboard/                    ← DashboardComponent
│   ├── busca-global/                 ← BuscaGlobalComponent
│   ├── clientes/{cliente-form, clientes-list}/
│   ├── projetos/{projeto-form, projetos-list}/
│   ├── modulos/{modulo-form, modulos-list}/
│   ├── paginas/{pagina-form, paginas-list}/
│   ├── publicacoes/{publicacao-detalhe, publicacao-form, publicacoes-list}/
│   └── configuracoes/                ← ConfiguracoesComponent (logo empresa)
├── components/
│   ├── pagina-status-badge/
│   ├── pagina-rich-editor/           ← ngx-editor (modo rico)
│   ├── pagina-revisoes/, pagina-anexos/, …
├── services/
│   ├── cliente.service.ts
│   ├── projeto.service.ts
│   ├── modulo.service.ts
│   ├── pagina.service.ts
│   ├── publicacao.service.ts
│   └── configuracao.service.ts
└── models/
    ├── cliente.model.ts
    ├── projeto.model.ts
    ├── modulo.model.ts
    ├── pagina.model.ts
    └── publicacao.model.ts
```

> Nome técnico anterior era `manual-usuario`. Renomeado para `docflow` em 2026-06-09 (símbolos/paths/imports).

---

## 3. Rotas

Base: `/doc-flow` (montado em `app.routes.ts` via `loadChildren` lazy).

| Rota | Componente |
|---|---|
| `/doc-flow` | Dashboard |
| `/doc-flow/busca` | Busca global em páginas |
| `/doc-flow/clientes` | Listagem de clientes + vínculos |
| `/doc-flow/clientes/novo` | Form de cliente |
| `/doc-flow/clientes/:id/editar` | Form de cliente |
| `/doc-flow/projetos` | Listagem |
| `/doc-flow/projetos/novo` | Form |
| `/doc-flow/projetos/:id/editar` | Form |
| `/doc-flow/modulos` | Listagem filtrada por projeto |
| `/doc-flow/modulos/novo` | Form |
| `/doc-flow/modulos/:id/editar` | Form |
| `/doc-flow/paginas` | Listagem hierárquica com filtros e status |
| `/doc-flow/paginas/novo` | Editor HTML (canDeactivate guard) |
| `/doc-flow/paginas/:id/editar` | Editor HTML (canDeactivate guard) |
| `/doc-flow/publicacoes` | Histórico |
| `/doc-flow/publicacoes/novo` | Geração de pacote |
| `/doc-flow/publicacoes/:id/detalhe` | Detalhe + changelog + downloads |
| `/doc-flow/configuracoes` | Logo da empresa |

Todas dentro do **shell** (sidebar + outlet). Lazy loading via `loadChildren`.

---

## 4. Conceitos-chave

| Termo | Significado no frontend |
|---|---|
| **Cliente** | Tenant que recebe a documentação publicada. Pode ter logo. |
| **Projeto** | Agrupador de módulos (ex.: um sistema interno). |
| **Módulo** | Agrupador de páginas dentro de um projeto. |
| **Página** | Unidade de conteúdo HTML editável com workflow editorial. |
| **Anexo** | Imagem ou arquivo vinculado a uma página. |
| **Revisão** | Snapshot histórico de uma página. |
| **Publicação** | Pacote ZIP/PDF de um conjunto de páginas para um cliente em uma versão. |
| **Preview token** | Link temporário para o cliente visualizar antes do release público. |
| **Vínculos** | Quais projetos/módulos/páginas o cliente enxerga. |

---

## 5. Fluxo editorial (status da página)

```
RASCUNHO → EM_REVISAO → APROVADO → PUBLICADO
                 ↘                       ↘
              ARQUIVADO ←─────────────────┘
```

Cada transição é um endpoint POST dedicado (`/paginas/:id/enviar-revisao`, `/aprovar`, `/publicar`, `/arquivar`).

---

## 6. Status (2026-06-16)

### Implementado
- CRUD de clientes, projetos, módulos, páginas, publicações.
- Workflow editorial completo (enviar revisão, aprovar, publicar, arquivar, duplicar).
- Editor em 4 modos: **rico** (`ngx-editor`), código, split, preview + atalhos de blocos.
- Auto-save de rascunho em `localStorage` + indicador “salvo às HH:mm” + canDeactivate guard.
- Anexos por página (upload + delete com confirmação) + revisões com diff.
- Vínculos por cliente (projetos/módulos/páginas) + copiar de outro cliente.
- Logo do cliente (API) e tela de configurações (logo empresa — service ainda mock).
- Geração de pacote: preview → criar → reprocessar → download ZIP/PDF + link público.
- Polling automático de publicações `GERANDO` na listagem.
- Status badge, reordenação (botões + drag-and-drop hierárquico), busca global.
- Testes unitários nos services principais e em componentes críticos.

### Pendente / integração
- Tabs no detalhe da publicação (Visão Geral / Páginas / Changelog / Downloads).
- UI de preview tokens (API no `ClienteService`, sem tela).
- `ConfiguracaoService` → API real `/docflow/empresa/logo`.
- Alinhar paths API (`/api/doc-flow` vs `/api/v1/docflow`) e auth (mock → JWT).
- Telas admin grupos/usuários/auditoria (API existe; UI hoje no mock `seguranca`).
- E2E do fluxo editorial completo.

Ver `99-melhorias-sugeridas.md` e [`softon-portal-api/docs/doc-flow/README.md`](../../../softon-portal-api/docs/doc-flow/README.md) § Integração.

---

## 7. Cross-references

- [`softon-portal-api/docs/doc-flow/README.md`](../../../softon-portal-api/docs/doc-flow/README.md) — Backend (API, gaps de integração).
- [`softon-portal-api/docs/jornadas/00-cenario-feliz-acme.md`](../../../softon-portal-api/docs/jornadas/00-cenario-feliz-acme.md) — Jornada integrada manual + release.
- `softon-portal-web/.ai/modules/docflow.md` — Spec resumida do módulo para IA.
- `softon-portal-web/docs/release-orchestrator/` — Doc do módulo Release Orchestrator (irmão).
