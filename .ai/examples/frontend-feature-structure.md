# Exemplo — Estrutura de Módulo Frontend

Estrutura padrão de um módulo do Nexus Portal Web. **Módulos de negócio vivem em `src/app/modules/`**, não em `features/`. A infraestrutura global (auth, layout, config) fica em `src/app/core/`, e código reutilizável em `src/app/shared/`.

## Módulo simples (uma área coesa)

Exemplo: `modules/manual-usuario/` (DocFlow completo).

```text
src/app/modules/manual-usuario/
├── pages/
│   ├── clientes/
│   │   ├── clientes-list/
│   │   │   └── clientes.component.ts
│   │   └── cliente-form/
│   │       └── cliente-form.component.ts
│   ├── projetos/
│   ├── modulos/
│   ├── paginas/
│   ├── publicacoes/
│   ├── dashboard/
│   └── busca-global/
├── services/
│   ├── cliente.service.ts
│   ├── projeto.service.ts
│   ├── modulo.service.ts
│   ├── pagina.service.ts
│   └── publicacao.service.ts
├── models/
│   ├── cliente.model.ts
│   ├── projeto.model.ts
│   ├── modulo.model.ts
│   ├── pagina.model.ts
│   └── publicacao.model.ts
└── manual-usuario.routes.ts
```

## Módulo guarda-chuva (várias sub-áreas)

Exemplo: `modules/administracao/` agrega usuários, configurações, grupos e permissões.

```text
src/app/modules/administracao/
├── usuarios/
├── configuracoes/
├── grupos/
├── permissoes/
├── home/
├── shell/
├── services/
│   ├── usuario.service.ts
│   └── configuracao.service.ts
├── models/
│   └── usuario.model.ts
└── administracao.routes.ts
```

## Observações

- Components não chamam `HttpClient` direto — sempre via service do módulo.
- Services retornam `Observable`.
- Models tipam request/response.
- Lazy loading nas rotas via `loadComponent` / `loadChildren`.
- Aliases TS: `@modules/*`, `@core/*`, `@shared/*`, `@env/*`.
- Novos módulos: registrar em `core/config/portal-modules.registry.ts`.
