# DocFlow — Especificação Frontend

Documentação do módulo **DocFlow** do projeto `nexus-portal-web`. **Foco frontend.**

Para backend (modelo de dados, endpoints, regras de negócio), ver [`nexus-portal-api/docs/doc-flow/README.md`](../../../nexus-portal-api/docs/doc-flow/README.md).

Jornada integrada (manual + entrega técnica): [`nexus-portal-api/docs/jornadas/00-cenario-feliz-acme.md`](../../../nexus-portal-api/docs/jornadas/00-cenario-feliz-acme.md).

## Como ler

1. Comece por [`00-visao-geral.md`](00-visao-geral.md) para o panorama.
2. Spec **01** descreve arquitetura e camadas.
3. Spec **02** descreve rotas e shell.
4. Spec **03** inventariga as páginas.
5. Specs **04-06** detalham services, componentes e padrões.
6. Spec **99** é o backlog de melhorias.

## Stack

- Angular 21+ (standalone components, signals)
- TypeScript 5.9
- Tailwind v4 + componentes próprios em `shared/ui/`
- Ícones `lucide-angular`
- RxJS 7
- Reactive Forms
- HttpClient + proxy de dev

## Localização no repositório

```text
nexus-portal-web/
├── frontend/
│   └── src/app/modules/docflow/   ← código do módulo
└── docs/docflow/                  ← esta documentação
```

## Índice

| # | Spec | Conteúdo |
|---|---|---|
| 00 | [Visão Geral](00-visao-geral.md) | Escopo, conceitos, status |
| 01 | [Arquitetura Frontend](01-arquitetura-frontend.md) | Pastas, camadas, dependências |
| 02 | [Rotas e Shell](02-rotas-e-shell.md) | Sidebar, lazy loading |
| 03 | [Páginas](03-paginas.md) | Dashboard, clientes, projetos, módulos, páginas, publicações, busca |
| 04 | [Services e Models](04-services-e-models.md) | Interfaces TS, contratos |
| 05 | [Componentes e Padrões UI](05-componentes-e-padroes-ui.md) | Status badges, EmptyState, ConfirmDialog |
| 06 | [Editor de Páginas](06-editor-paginas.md) | Modos código/split/preview, auto-save, canDeactivate |
| 99 | [Melhorias Sugeridas](99-melhorias-sugeridas.md) | Backlog específico frontend |

## Cross-references

- [`nexus-portal-api/docs/doc-flow/README.md`](../../../nexus-portal-api/docs/doc-flow/README.md) — Backend.
- [`nexus-portal-api/docs/jornadas/`](../../../nexus-portal-api/docs/jornadas/README.md) — Jornadas de uso.
- `nexus-portal-web/.ai/modules/docflow.md` — Spec resumida do módulo para IA.
- `nexus-portal-web/docs/release-orchestrator/` — Doc do módulo irmão Release Orchestrator.
