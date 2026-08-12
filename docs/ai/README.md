# Assistente IA — Frontend (DocFlow)

A UI de IA vive **dentro do DocFlow** (`frontend/src/app/modules/docflow/`), não como módulo Angular separado.

> Backend: `nexus-portal-api/docs/ai/README.md`  
> Desenho: `nexus-portal-api/docs/doc-flow/10-assistente-ia-paginas.md`  
> UX detalhada (wizard): [`../docflow/07-assistente-ia-paginas.md`](../docflow/07-assistente-ia-paginas.md)

---

## Rotas

Base: `/doc-flow` (lazy em `app.routes.ts`). Redirect de compatibilidade: `/ai/**` → `/doc-flow/assistente`.

| Rota | Tela | Status |
|---|---|---|
| `/doc-flow/assistente` | Wizard Brief → Chat → Revisar | ✅ S3 |
| `/doc-flow/propostas-ia` | Fila PR → propostas | 📋 S6 |

**Entrada DocFlow:** lista de páginas → **Criar com IA** (`?origem=ia` → assistente).  
Feature flag: `AiFeatureService` (`GET /ai/status`); CTAs ocultos se `enabled=false`.

---

## Estrutura

```text
frontend/src/app/modules/docflow/
├── pages/{assistente,propostas-ia}/
├── components/{ai-documento-importacao,ai-perguntas,ai-proposta-preview}/
├── services/{ai-assistente,ai-feature}.service.ts
└── models/ai-*.model.ts
```

API base: `environment.aiApiUrl` (`/api/ai` → proxy → `/api/v1/ai`).

## Importação de um manual

- O primeiro passo aceita arrastar ou selecionar `DOC`, `DOCX`, PDF pesquisável e `TXT` de até 15 MB.
- O backend devolve um plano persistido com projeto, módulos, páginas, ordem e modelo recomendado.
- A árvore fica disponível para revisão antes de gerar; **Usar no briefing** coloca somente o
  conteúdo da página escolhida no pipeline existente, sem perder os textos do documento.
- `importacaoId` fica na URL, permitindo recarregar ou voltar do editor e continuar o plano.
- PDFs sem texto selecionável mostram uma orientação clara para aplicar OCR antes da importação.

## Decisão de modelo e componentes

- O wizard consulta `POST /api/ai/templates/recomendacao` após o debounce do briefing.
- Alta confiança: seleção automática; baixa confiança: confirmação entre até três candidatos.
- O usuário sempre pode forçar um modelo em **Avançado**.
- A biblioteca do editor consulta `GET /api/doc-flow/paginas/blocos`; não existe mais catálogo
  HTML duplicado no bundle Angular.
- O assistente consulta `GET /api/v1/docflow/paginas/blueprints` e apresenta a composição ligada
  ao modelo: componentes-base e opcionais selecionados conforme o conteúdo.
- Se a API estiver desatualizada ou indisponível, a biblioteca mostra um erro operacional em vez
  de “Nenhum bloco encontrado”.

## Acompanhamento e retomada

- Ao criar a sessão, o wizard mantém `sessaoId` na URL; recarregar a página retoma chat,
  geração ou revisão no ponto persistido pelo backend.
- Durante a geração, a interface mostra etapa, percentual e número da tentativa, atualizados por
  SSE com polling como fallback.
- Após o tempo esperado, a interface reduz a frequência do polling, mas não encerra o
  acompanhamento por um timeout artificial do navegador.
- Uma falha transitória de rede não encerra o acompanhamento, e um clique repetido em gerar
  reutiliza o job ativo devolvido pela API.
- Erros exibem a mensagem segura e, quando disponível, o identificador de diagnóstico para o
  suporte localizar o detalhe técnico sem expô-lo na interface.

Runbook local (backend): `nexus-portal-api/docs/ai/RUNBOOK-LOCAL.md`.
E2E: `frontend/e2e/ai-assistente-flow.spec.ts`.
