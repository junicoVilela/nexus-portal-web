# 11 — Índice: Telas de Entregas (Fase 1 — a implementar)

> **Estado**: 📋 Especificado no backend — **sem implementação no frontend** ainda.  
> **Código atual**: apenas gestão de releases (`/release-orchestrator/*`).  
> **Specs completas**: [`nexus-portal-api/docs/release-orchestrator/`](../../../nexus-portal-api/docs/release-orchestrator/README.md).

---

## Escopo

Este índice mapeia as telas do **orchestrator de entregas a clientes** (Fase 1) para as specs da API e rotas sugeridas. Quando cada tela for implementada, criar arquivo dedicado nesta pasta (ex.: `12-clientes-lista.md`).

**Rotas previstas** (prefixo `/release-orchestrator/orchestrator/` ou conforme [`30-rotas-angular-sugeridas.md`](../../../nexus-portal-api/docs/release-orchestrator/30-rotas-angular-sugeridas.md)):

---

## Mapa tela → spec API → rota sugerida

| Tela | Spec API | Rota sugerida | Estado front |
|---|---|---|---|
| Dashboard entregas | `01-dashboard.md` | `/orchestrator` | 📋 não implementado |
| Clientes — lista | `02-clientes-lista.md` | `/orchestrator/clientes` | 📋 |
| Clientes — cadastro | `03-clientes-cadastro.md` | `/orchestrator/clientes/novo`, `/:id/editar` | 📋 |
| Cliente — visão geral | `04-cliente-visao-geral.md` | `/orchestrator/clientes/:id` | 📋 |
| Resumo funcional (todos os clientes) | `05-cliente-dominios-funcionalidades.md` §8 | `/orchestrator/clientes/resumo-funcionalidades` | 📋 |
| Domínios e funcionalidades (matriz) | `05-cliente-dominios-funcionalidades.md` | `/orchestrator/clientes/:id/funcionalidades` | 📋 |
| Produtos contratados | `06-cliente-produtos-contratados.md` | `/orchestrator/clientes/:id/produtos` | 📋 |
| Configurações de entrega | `07-cliente-configuracoes-entrega.md` | `/orchestrator/clientes/:id/entrega` | 📋 |
| Produtos — cadastro (GitHub/Jenkins) | `09-produtos-cadastro.md` | `/orchestrator/produtos/:id/editar` | 📋 (produtos básicos em `08-produtos.md`) |
| Módulos por produto | `10-produtos-modulos-artefatos.md` | `/orchestrator/produtos/:id/modulos` | 📋 |
| Catálogo domínios/funcionalidades | `11-produtos-catalogo-funcional.md` | `/orchestrator/produtos/:id/catalogo-funcional` | 📋 |
| Release — aba PDF/artefatos | `14-release-orchestrator-detalhe.md` | `/releases/:id` (aba) | 📋 PDF sem backend |
| Próximas entregas — agenda | `16-proximas-entregas-agenda.md` | `/orchestrator/entregas/agenda` | 📋 |
| Próximas entregas — cadastro | `17-proximas-entregas-cadastro.md` | `/orchestrator/entregas/agenda/nova` | 📋 |
| Assistente nova entrega | `18-nova-entrega-assistente.md` | `/orchestrator/entregas/nova` | 📋 |
| Seleção de módulos | `19-selecao-modulos.md` | wizard step | 📋 |
| Range / delta | `20-range-manual-delta.md` | wizard step | 📋 |
| Geração de pacote | `21-geracao-pacote.md` | `/orchestrator/entregas/:id/geracao` | 📋 |
| Detalhe da entrega | `22-detalhes-entrega.md` | `/orchestrator/entregas/:id` | 📋 |
| Histórico de entregas | `23-historico-entregas.md` | `/orchestrator/entregas` | 📋 |
| Relatórios | `26-relatorios.md` | `/orchestrator/relatorios` | 📋 |
| Suporte operacional | `27-suporte-operacional.md` | `/orchestrator/suporte` | 📋 |
| Configurações gerais | `28-configuracoes.md` | `/orchestrator/configuracoes` | 📋 |

---

## CI/CD (fora do frontend)

Trabalho nos **repositórios de produto** — não gera tela no portal na Fase 2 inicial:

| Tópico | Spec API |
|---|---|
| Jenkinsfile, assets GitHub, checklist por módulo | [`39-entregaveis-cicd-repositorios.md`](../../../nexus-portal-api/docs/release-orchestrator/39-entregaveis-cicd-repositorios.md) |
| Guia versão/tag | [`40-guia-versao-tag.md`](../../../nexus-portal-api/docs/release-orchestrator/40-guia-versao-tag.md) |

Campos GitHub/Jenkins no formulário de produto: spec `09` + ROADMAP F2.9.

---

## Legenda de estado

| Símbolo | Significado |
|---|---|
| ✅ | Implementado no `nexus-portal-web` |
| 📋 | Especificado; aguardando implementação |
| 🔧 | Nos repositórios de produto, não no portal |

---

## Documentação relacionada

- [README](README.md) — telas já implementadas (releases).
- [00-indice.md](00-indice.md) — rotas e enums do código atual.
- [`ROADMAP`](../../../nexus-portal-api/docs/ROADMAP.md) — Fase 0, 1 e 2.
