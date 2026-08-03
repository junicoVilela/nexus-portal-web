# Documentação funcional

A especificação funcional completa do sistema (telas, modelo de dados, decisões técnicas, backlog) vive no repositório do backend:

```text
nexus-portal-api/docs/release-orchestrator/
```

Comece por `00-visao-geral-fluxo-integrado.md` e leia em ordem numérica. Padrões gerais de tela (estados, filtros, auditoria, responsividade) estão em `99-padroes-tela.md`.

## Pontos especialmente relevantes para o frontend
- `30-rotas-angular-sugeridas.md` — estrutura de rotas.
- `31-guia-figma-handoff.md` — padrão visual, componentes e telas prioritárias.
- `99-padroes-tela.md` — estados obrigatórios em toda tela.
- `01`–`28` — descrições de cada tela (objetivos, campos, regras).
- `32-modelo-dados-sugerido.md` — usar como referência para tipar os models e DTOs no frontend.

A spec é fonte única — sem cópia neste repo para evitar drift.
