# Módulo Release Orchestrator (Frontend)

## Objetivo

Interface para gerenciar releases, itens, produtos e templates do Release Orchestrator.

## Status

Planejado (backend já implementado).

## Especificação técnica (API)

A spec técnica completa dos endpoints, DTOs e regras de negócio está em:

```text
docs/release-orchestrator/
```

Consulte antes de criar telas ou services:

- `03-api-endpoints.md` — todos os endpoints REST com contratos request/response.
- `04-regras-negocio.md` — fluxo de status, validações, restrições.
- `05-dtos.md` — todos os DTOs de request e response (base para os models TypeScript).

## Especificação funcional (telas)

A spec funcional das telas do Release Orchestrator (que inclui telas do Release Orchestrator) está em:

```text
docs/release-orchestrator/
```

## API base

```text
/api/v1/release-orchestrator
```

IDs são UUID (tipo `string` no TypeScript).

## Estrutura sugerida

```text
modules/releases/
├── pages/
│   ├── release-list/
│   ├── release-form/
│   ├── release-detalhe/
│   ├── produto-list/
│   └── produto-form/
├── services/
│   ├── release.service.ts
│   ├── release-item.service.ts
│   ├── produto.service.ts
│   └── release-template.service.ts
├── models/
│   ├── release.model.ts
│   ├── release-item.model.ts
│   ├── produto.model.ts
│   └── release-template.model.ts
└── releases.routes.ts
```

## Componentes sugeridos

- release-status-badge (RASCUNHO, EM_DESENVOLVIMENTO, EM_REVISAO, APROVADA, PUBLICADA, CANCELADA)
- release-item-list
- release-item-form
- release-historico-timeline
- release-validacao-panel
