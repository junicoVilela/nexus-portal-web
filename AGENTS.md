# AGENTS.md - Softon Portal Web

Frontend do **Softon Portal Web** — Angular 21+ / TypeScript / PrimeNG.

A aplicação Angular fica em `frontend/`.

## Padrões e arquitetura

Toda a documentação de padrões está centralizada em `.ai/`. Consulte antes de gerar código:

- `.ai/project/PROJECT_CONTEXT.md` — objetivo, framework, módulos
- `.ai/project/FRONTEND_ARCHITECTURE.md` — estrutura de pastas, core/shared/modules, rotas, aliases
- `.ai/project/FRONTEND_STANDARDS.md` — nomenclatura, components, services, forms, rotas
- `.ai/project/UI_UX_STANDARDS.md` — layout, tabelas, formulários, badges
- `.ai/project/API_INTEGRATION.md` — prefixos API, services Angular, JWT, paginação

## Módulos

| Módulo | Status | Spec |
|--------|--------|------|
| Dashboard | Implementado | `.ai/modules/docflow.md` |
| DocFlow | Implementado | `.ai/modules/docflow.md` |
| Auth (login) | Implementado | `.ai/modules/auth.md` |
| Administração | Stub funcional | `.ai/modules/usuarios.md`, `.ai/modules/configuracoes.md` |
| Release Orchestrator | Planejado | `.ai/modules/releases.md` → `docs/release-orchestrator/` |
| Sistemas | Planejado | `.ai/modules/sistemas.md` |
| Access Control | Planejado | `.ai/modules/access-control.md` |
| Monitoramento | Planejado | `.ai/modules/monitoramento.md` |
| Notificações | Planejado | `.ai/modules/notificacoes.md` |

## Prompts reutilizáveis

- `.ai/prompts/create-feature.md`
- `.ai/prompts/create-page.md`
- `.ai/prompts/create-form.md`
- `.ai/prompts/create-service.md`
- `.ai/prompts/review-ui.md`

## Exemplo de estrutura

- `.ai/examples/frontend-feature-structure.txt`
