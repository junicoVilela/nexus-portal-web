# Feature Configurações (DocFlow)

## Objetivo

Gerenciar o **logo da empresa** exibido nos manuais gerados pelo DocFlow. É uma feature operacional do próprio DocFlow, não um módulo separado.

## Localização

```text
src/app/modules/docflow/pages/configuracoes/configuracoes.component.ts
src/app/modules/docflow/services/configuracao.service.ts
```

## Rota

```text
/doc-flow/configuracoes
```

Definida em `modules/docflow/docflow.routes.ts`.

Redirects de compatibilidade (em `app.routes.ts`):
- `/configuracoes` → `/doc-flow/configuracoes`
- `/sistema/configuracoes` → `/doc-flow/configuracoes`
- `/administracao/configuracoes` → `/doc-flow/configuracoes`

## Service

`ConfiguracaoService` — métodos:

- `logoEmpresaUrl()` — URL do logo atual
- `logoEmpresaExiste()` — flag de existência
- `uploadLogoEmpresa(file)` — upload
- `removerLogoEmpresa()` — remoção

Endpoints sob `/api/doc-flow/...`.

## Menu

Aparece em **Menu lateral → seção DocFlow → "Configurações"**, com ícone `Settings` e protegido por `CONFIGURACAO:EDITAR` (permissão herdada do domínio SISTEMA no seed; pode ser ajustada depois).

## Regras UI

- Configurações sensíveis não devem exibir valor em texto claro
- Alterações sensíveis devem pedir confirmação via `ConfirmService`
