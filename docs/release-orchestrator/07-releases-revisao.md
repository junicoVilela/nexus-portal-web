# Tela: Revisão da Release

## Identificação

- **Componente**: `ReleaseRevisaoComponent` (`pages/releases/revisao/release-revisao.component.ts`)
- **Rota**: `/release-orchestrator/releases/:id/revisao`
- **Resolver**: `releaseResolver`

## Objetivo

Validar a release antes de publicar: exibe pendências/alertas, contagens e permite publicar.

## Estado (signals)

`loading`, `erro`, `erroVariant`, `publicando`, `release`, `itens`, `validacao` (`RevisaoValidacao | null`).

**Computado**: `itensPorCategoria` (agrupado).

## Validação (`carregarValidacao`)

`ReleaseService.validarRevisao(id)` → `GET /releases/{id}/validar`:

```ts
interface RevisaoValidacao {
  valida: boolean;
  pendencias: string[];   // bloqueantes
  alertas: string[];      // não bloqueantes
  totalItensCliente: number;
  totalItensInternos: number;
}
```

## Ações

- `publicar()`: só se `validacao().valida`; `ReleaseService.publicar` → `NotificationService` (sucesso, com link) → navega para detalhe. Erro → `publicando=false`.
- `gerarPdf()` → `ReleasePdfService.download(id,'INTERNO',...)`.

## Estados de UI

Loading, erro (`ErrorStateComponent` + `classificarErro`). Layout em `ui-card` (validação + métricas).

## Backend consumido

`GET /releases/{id}`, `GET /releases/{id}/itens`, `GET /releases/{id}/validar`, `POST /releases/{id}/publicar`, `GET /releases/{id}/pdf` (ver ressalva).
