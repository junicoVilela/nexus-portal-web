# Nexus AI — Frontend

Módulo Angular **`modules/ai/`**, isolado do DocFlow para facilitar extração futura.

> Backend: `nexus-portal-api/docs/ai/README.md`  
> Desenho: `nexus-portal-api/docs/doc-flow/10-assistente-ia-paginas.md`  
> UX detalhada (wizard): [`../docflow/07-assistente-ia-paginas.md`](../docflow/07-assistente-ia-paginas.md)

---

## Rotas

Base: `/ai` (lazy em `app.routes.ts`).

| Rota | Tela | Status |
|---|---|---|
| `/ai` | Home + status do backend | ✅ |
| `/ai/assistente` | Wizard Brief → Chat → Revisar | ✅ S3 |
| `/ai/propostas` | Fila PR → propostas | 📋 S6 |

**Entrada DocFlow:** lista de páginas → **Criar com IA** (`?origem=ia` → assistente).  
Feature flag: `AiFeatureService` (`GET /ai/status`); CTAs ocultos se `enabled=false`.

---

## Estrutura

```text
frontend/src/app/modules/ai/
├── ai.routes.ts
├── shell/
├── pages/{home,assistente,propostas}/
├── components/{ai-perguntas,ai-proposta-preview}/
├── services/{ai-assistente,ai-feature}.service.ts
└── models/
```

API base: `environment.aiApiUrl` (`/api/ai` → proxy → `/api/v1/ai`).

Runbook local (backend): `nexus-portal-api/docs/ai/RUNBOOK-LOCAL.md`.  
E2E: `frontend/e2e/ai-assistente-flow.spec.ts`.

---

## Extração

1. Apontar `aiApiUrl` para o host do serviço AI.
2. Manter navegação para DocFlow via rotas absolutas (`/doc-flow/...`).
3. Opcional: publicar o módulo como lib npm se o front também separar.
