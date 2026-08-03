# CLAUDE.md - Nexus Portal Web

Frontend do **Nexus Portal Web** — Angular 21+ / TypeScript / Tailwind / componentes próprios em `shared/ui` / ícones Lucide.

A aplicação Angular fica em `frontend/`.

---

## Padrões e arquitetura

Toda a documentação de padrões está centralizada em `.ai/`. Consulte antes de gerar código:

| Arquivo | Conteúdo |
|---------|----------|
| `.ai/project/PROJECT_CONTEXT.md` | Objetivo, framework, módulos implementados e planejados |
| `.ai/project/FRONTEND_ARCHITECTURE.md` | Estrutura de pastas, core/shared/modules, rotas, aliases |
| `.ai/project/FRONTEND_STANDARDS.md` | Nomenclatura, components, services, forms, rotas, estado |
| `.ai/project/UI_UX_STANDARDS.md` | Layout, tabelas, formulários, badges, mensagens |
| `.ai/project/API_INTEGRATION.md` | Prefixos API, services Angular, models, autenticação JWT, paginação |

## Specs por módulo

| Arquivo | Módulo |
|---------|--------|
| `.ai/modules/docflow.md` | DocFlow (manuais, clientes, projetos, módulos, páginas) |
| `.ai/modules/releases.md` | Release Orchestrator (aponta para `docs/release-orchestrator/`) |
| `.ai/modules/auth.md` | Auth (login, guards, interceptor) |
| `.ai/modules/usuarios.md` | Usuários |
| `.ai/modules/configuracoes.md` | Configurações |

## Documentação funcional

| Diretório | Conteúdo |
|-----------|----------|
| `docs/release-orchestrator/` | Spec técnica do Release Orchestrator: endpoints, DTOs, regras de negócio |
| `docs/release-orchestrator/` | Spec funcional: telas, rotas, modelo de dados (fonte: backend) |

## Prompts e exemplos

| Diretório | Conteúdo |
|-----------|----------|
| `.ai/prompts/` | Prompts para criar feature, page, form, service, review UI |
| `.ai/examples/` | Exemplo de estrutura de feature frontend |
