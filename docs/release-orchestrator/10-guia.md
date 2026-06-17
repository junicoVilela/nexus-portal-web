# Tela: Guia (Como usar)

## Identificação

- **Componente**: `RfGuiaComponent` (`pages/guia/rf-guia.component.ts`)
- **Rota**: `/release-orchestrator/guia`

## Objetivo

Guia interativo passo a passo (conteúdo **hardcoded**) + diagrama de ciclo de status clicável. Sem chamadas de API.

## Estado (signals)

`passoAtual`(0), `visitados` (`Set<number>`), `statusSelecionado` (`RASCUNHO`). Computados: `passo`, `progressoPct`, `ehPrimeiro`, `ehUltimo`, `fluxoPrincipal`, `statusAtivo`.

## Conteúdo

- `passos: GuiaPasso[]` (9 passos: boas-vindas, dashboard, produtos, templates, registrar, itens, ciclo de status, revisão, publicar). Cada passo tem `titulo`, `resumo`, `icon`, `dicas[]`, `rota?`, `acaoLabel?`.
- `fluxoStatus: StatusGuia[]` (6 status com `label`, `descricao`, `cor`). O passo 6 (`passoEhFluxo()`) renderiza o diagrama de fluxo.

## Navegação

`selecionarPasso`, `anterior`, `proximo`, `selecionarStatus`, `passoVisitado`. Barra de progresso por `progressoPct`. Atalhos rápidos (cards) e botão final "Registrar minha release".

## Models

`GuiaPasso`, `StatusGuia` em `models/guia-passo.model.ts`.

## Observações

- Conteúdo embutido no `.ts` (não carregado de arquivos). Migrar para Markdown estático é melhoria sugerida.
