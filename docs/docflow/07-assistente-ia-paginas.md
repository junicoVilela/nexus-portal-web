# 07 — Assistente de IA para Páginas (Frontend)

> Status: **S3 em implementação** — wizard em `/ai/assistente`, CTA lista DocFlow, aplicar no `pagina-form`.  
> Contrato backend: [`nexus-portal-api/docs/doc-flow/10-assistente-ia-paginas.md`](../../../nexus-portal-api/docs/doc-flow/10-assistente-ia-paginas.md)

---

## 1. Papel da tela

Permitir que o editor crie (Fase A) ou ajuste (Fase B) uma página do DocFlow a partir de um **briefing colado** e de um **diálogo curto** com a IA, sempre desembocando no `pagina-form` existente como `RASCUNHO` / conteúdo editável.

**Módulo Angular isolado:** `frontend/src/app/modules/ai/` (rotas `/ai`).  
Não substitui o editor: **preenche** o formulário e o HTML (navegação para `/doc-flow/paginas/...`).

---

## 2. Entradas

| Origem | Rota / ação |
|---|---|
| Lista de páginas | Botão primário secundário: **Criar com IA** → `/doc-flow/paginas/novo?origem=ia` |
| Form novo | Passo 0 do `app-pagina-creation-progress` ou CTA no header |
| Form edição (Fase B) | Toggle **Assistente** na toolbar do editor |
| Fila PR (Fase C) | `/doc-flow/propostas-ia` → Abrir no editor |

Feature flag: se `GET /auth/me` ou config pública indicar IA desligada, ocultar todos os CTAs.

---

## 3. Layout (Fase A)

Espelha o espírito do assistente de entrega (sidebar de passos), mas embutido no fluxo de página.

### 3.1 Modo wizard (criação)

```text
┌────────────────────────────────────────────────────────────────────────┐
│ < Voltar        Nova página com IA                                     │
├──────────┬─────────────────────────────────────────────────────────────┤
│ Passos:  │                                                             │
│          │  Passo 1 de 3: Briefing                                     │
│ ① Brief  │  ─────────────────────────────────────                      │
│ ② Chat   │                                                             │
│ ③ Revisar│  Cole a especificação, changelog ou descrição da tela:      │
│          │  ┌──────────────────────────────────────────────────────┐   │
│          │  │ (textarea grande)                                    │   │
│          │  └──────────────────────────────────────────────────────┘   │
│          │                                                             │
│          │  Contexto                                                   │
│          │  Projeto [____]  Módulo [____]  Template (opc.) [____]      │
│          │                                                             │
│          │                    [Cancelar]              [Continuar →]    │
└──────────┴─────────────────────────────────────────────────────────────┘
```

### 3.2 Passo Chat

- Bolhas de mensagens (usuário / assistente).
- Quando `status=AGUARDANDO_USUARIO`: formulário das `perguntas[]` (radio/select/texto).
- Botão **Gerar rascunho** chama `POST .../gerar` e mostra estado `GERANDO` (spinner + texto).
- Escuta SSE `/ai/eventos` com fallback polling 3–5s.

### 3.3 Passo Revisar proposta

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Proposta                                                               │
│ Título / Código tela / Resumo (editáveis inline)                       │
│ ─────────────────────────────────────────────────────────────────────  │
│ Preview HTML (.df-doc-content)     │  Checklist qualidade (itens)      │
│                                    │                                   │
│ [Aplicar no editor]  [Regenerar]   │  avisos/erros da pré-avaliação    │
└────────────────────────────────────────────────────────────────────────┘
```

**Aplicar no editor** (modo `FORM`): navega ou permanece em `/paginas/novo` com o form hidratado; fecha o wizard IA.

---

## 4. Layout embutido no editor (alternativa / Fase B)

Rail direito no `.pf-body`, ao lado de `#pagina-revisao`:

```text
┌─────────────────────────────┬──────────────────────┐
│ Editor (rich / split)       │ Assistente IA        │
│                             │ [mensagens…]         │
│                             │ [input]              │
│                             │ [Aplicar seleção]    │
│ Qualidade (#pagina-revisao) │                      │
└─────────────────────────────┴──────────────────────┘
```

Componentes sugeridos (standalone):

```text
docflow/components/
  pagina-ai-assistant/
    pagina-ai-assistant.component.ts|html|css
  pagina-ai-proposta-preview/
  pagina-ai-perguntas/
```

Service:

```text
docflow/services/pagina-ai.service.ts
```

Métodos espelhando o backend: `criarSessao`, `enviarMensagem`, `gerar`, `obterProposta`, `aplicar`, `eventosAi()` (SSE).

Models em `docflow/models/pagina-ai.model.ts`.

---

## 5. Integração com o form existente

Ao aplicar proposta no `PaginaFormComponent`:

1. `patchValue` em `titulo`, `slug`, `codigoTela`, `resumo`, `conteudoHtml`.
2. Setar `templateOrigemId` / `templateOrigemVersao` se vierem na proposta.
3. Garantir `projetoId` / `moduloId` do contexto da sessão.
4. Disparar avaliação local `avaliarQualidadePagina()` (já usada no form).
5. Não chamar `publicar` / `enviar-revisao` automaticamente.
6. Respeitar autosave: se já existir `editId` em `RASCUNHO`, o próximo debounce persiste; se for criação, o primeiro autosave/`salvar` cria a página.

Inserção parcial (Fase B): API do rich editor `inserirHtml` / substituição de seção — só depois do fluxo full-page está estável.

---

## 6. Estados de UI

| Estado sessão | UI |
|---|---|
| `ABERTA` | Briefing |
| `AGUARDANDO_USUARIO` | Formulário de perguntas |
| `GERANDO` | Skeleton + desabilita ações destrutivas |
| `PRONTA` | Preview da proposta |
| `APLICADA` | Banner “Aplicado — continue no editor” |
| `ERRO` | Alert + retry `gerar` |
| `CANCELADA` | Volta à lista / form limpo |

---

## 7. Fase C — fila de propostas (sketch)

Rota: `/doc-flow/propostas-ia` (lazy no shell DocFlow).

Colunas: origem (PR #), tipo `NOVA|ATUALIZACAO`, título sugerido, `codigoTela`, status, datas, ações.

Aceitar → abre editor com proposta aplicada (ou cria `RASCUNHO`).  
Rejeitar → `POST` rejeição com motivo opcional.

---

## 8. Acessibilidade e copy

- Textarea de briefing com label visível e contador mínimo (ex.: 80 caracteres — alinhado à regra `CONTEUDO` da qualidade).
- Estados de loading anunciados (`aria-live`).
- CTAs claros: **Aplicar no editor** (não “Publicar”).
- Tom da UI em português, consistente com o restante do DocFlow.

---

## 9. Testes frontend

| Tipo | Cenário |
|---|---|
| Unit | Service monta payload; mapper proposta → form |
| Component | Perguntas obrigatórias bloqueiam “Gerar” |
| Component | Aplicar preenche controles sem navegar para publicar |
| e2e (Playwright) | Flag on → briefing mock (intercept API) → form com HTML |

Provider LLM deve ser mockado via intercept; e2e não chama rede externa.

---

## 10. Critérios de aceite (UI Fase A)

- [ ] CTA “Criar com IA” só aparece com flag + `PAGINA:CRIAR`.
- [ ] Fluxo briefing → (perguntas?) → proposta → form preenchido.
- [ ] Cancelar abandona sessão (`cancelar`) sem criar página.
- [ ] Preview usa classes `.df-doc-content` iguais ao preview atual.
- [ ] Erro 503 (IA off) mostra empty state amigável, sem quebrar o form manual.
