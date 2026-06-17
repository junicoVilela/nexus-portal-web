# Módulo Auth (Identidade & Acesso)

## Responsabilidade

Identidade e autorização do portal: login/sessão, JWT, guards e diretivas de permissão.

A implementação é dividida em duas regiões do código:

- `core/auth/` — infraestrutura global (login, JWT, guards e interceptor)
- `modules/seguranca/` — gestão (usuários, grupos, matriz de permissões, escopo de acesso)

> A tela de configurações (upload do logo) é uma feature operacional do DocFlow em `modules/docflow/pages/configuracoes/`. Veja `.ai/modules/configuracoes.md`.

> A documentação detalhada do módulo de gestão está em [`.ai/modules/seguranca.md`](seguranca.md).

## Infraestrutura — `core/auth/`

```text
src/app/core/auth/
├── guards/
│   ├── auth.guard.ts          ← protege rotas → redireciona /login
│   └── guest.guard.ts         ← bloqueia /login se já autenticado
├── interceptors/
│   └── auth.interceptor.ts    ← Bearer token + trata 401 global
├── services/
│   └── auth.service.ts        ← signals me/permissoes/grupos/tem; consome AuthApiService
├── pages/
│   └── login/                 ← /login (público, guestGuard, fora do shell)
└── auth.routes.ts             ← AUTH_ROUTES
```

`AuthService` foi refit para consumir `AuthApiService` (do `modules/seguranca/services/`) em vez de `HttpClient` direto. Quando o backend chegar, basta trocar `AuthApiService`.

## Gestão — `modules/seguranca/`

Resumo (detalhes em [`seguranca.md`](seguranca.md)):

```text
src/app/modules/seguranca/
├── models/                    ← 8 entidades
├── services/                  ← 7 services + mock store
│   ├── auth-api.service.ts    ← login/me/refresh/alterarSenhaPropria (mock JWT 1h)
│   ├── usuario.service.ts
│   ├── grupo.service.ts
│   ├── dominio.service.ts
│   ├── funcionalidade.service.ts
│   ├── permissao.service.ts
│   ├── escopo.service.ts
│   └── mock/                  ← in-memory store + seed + localStorage
├── guards/
│   └── permissao.guard.ts     ← CanActivateFn lê data.permissoes
├── directives/
│   └── permissao.directive.ts ← *appPermissao + appPermissaoOu
└── pages/
    ├── home/                  ← /seguranca (cards)
    ├── acesso-negado/
    ├── usuarios/              ← lista + form
    ├── grupos/                ← lista + form + vínculo de permissões
    ├── matriz/                ← /seguranca/dominios (3 colunas master-detail)
    └── escopos/               ← /seguranca/escopo-acesso (tabs usuário/grupo)
```

## Rotas

```text
/login                                        → core/auth (fora do shell, guestGuard)
/seguranca                                    → modules/seguranca (home com cards)
/seguranca/usuarios[/novo|/:id/editar]        → permissaoGuard USUARIO:LER|CRIAR|EDITAR
/seguranca/grupos[/novo|/:id/editar|/:id/permissoes]
                                              → permissaoGuard GRUPO_ACESSO:LER|CRIAR|EDITAR|VINCULAR_PERMISSAO
/seguranca/dominios                           → permissaoGuard DOMINIO:LER (matriz)
/seguranca/escopo-acesso                      → permissaoGuard ESCOPO:LER
/seguranca/acesso-negado                      → tela de erro de autorização
/doc-flow/configuracoes                       → modules/docflow (logo da empresa)
```

Rotas antigas `/administracao/*` redirecionam para `/seguranca/*` e `/doc-flow/configuracoes` por compatibilidade.

## Modelo de permissões

Padrão **`DOMINIO:ACAO`** (ex.: `USUARIO:LER`, `GRUPO_ACESSO:VINCULAR_PERMISSAO`).

Estrutura hierárquica:
- **Domínio** (ex.: `SEGURANCA`) agrupa funcionalidades
- **Funcionalidade** (ex.: `USUARIO`) define o "objeto" gerenciado
- **Permissão** = `FUNCIONALIDADE:ACAO` (ex.: `USUARIO:LER`)

CRUD padrão: `LER`, `CRIAR`, `EDITAR`, `EXCLUIR`. Ações especiais: `USUARIO:BLOQUEAR`, `USUARIO:RESETAR_SENHA`, `GRUPO_ACESSO:VINCULAR_PERMISSAO`.

## API reativa

`AuthService` expõe signals consumíveis por componentes/diretivas:

```ts
me()           // UsuarioAutenticado | null
permissoes()   // string[]
grupos()       // { id, codigo, nome }[]
tem()          // (codigo: string) => boolean -- chamar dentro de effect/computed
isAuthenticated()
```

`provideAppInitializer` carrega `/me` no boot. Resultado é cacheado em `localStorage` (chave `doc-flow-me`) para hidratação rápida.

## Guard de rota por permissão

```ts
{
  path: 'usuarios',
  canActivate: [permissaoGuard],
  data: { permissoes: ['USUARIO:LER'] },
  loadComponent: () => import('...').then(m => m.UsuariosListComponent),
}
```

- Sem `data.permissoes` → guard libera (apenas autenticação)
- Lista no `data.permissoes` → exige **todas** (AND)
- Falha → redireciona para `/seguranca/acesso-negado`

## Diretiva `*appPermissao`

```html
<!-- string única -->
<ui-button *appPermissao="'USUARIO:CRIAR'">Novo</ui-button>

<!-- array = AND -->
<button *appPermissao="['USUARIO:EDITAR','USUARIO:BLOQUEAR']">…</button>

<!-- combinação AND + OR -->
<button *appPermissao="'USUARIO:LER'" appPermissaoOu="['ADMIN:*','SUPORTE:*']">…</button>
```

Reativa via `effect()`: re-renderiza quando `auth.me()` muda.

## Menu do shell

`AppShellComponent` filtra `sections` via `computed()` sobre as permissões do usuário. Itens declaram `permissao?: string`. Sem permissão → item some do menu (e do command palette).

## Implementado

Stories SOFTON-AUTH 001-034. Telas reais entregues:

- 029: Tela de login (`core/auth/pages/login/`)
- 030: Controle de rotas protegidas (`permissaoGuard`, `*appPermissao`, filtro de menu)
- 031: Tela de Usuários
- 032: Tela de Grupos de Acesso
- 033: Matriz Domínios / Funcionalidades / Permissões
- 034: Tela de Escopo de Acesso

Stories 001-028 (backend): mocks completos no `MockStore` (login/logout/refresh/me, CRUDs, histórico de login).

## Pendências

Sem tela própria (mas com modelos e parcial no mock):

- Story 020: Política de senha
- Story 021: Histórico de senhas
- Stories 023-024: Sessões ativas / revogar sessão
- Stories 025-026: Acesso temporário
- Story 027: Histórico de login (visualização)
- Story 028: Auditoria de segurança

## Regras UI

- Nunca exibir senhas, hashes ou tokens
- Toda ação destrutiva passa por `ConfirmService`
- Permissões filtram **menu**, **rotas** e **botões/ações** (3 níveis de defesa)
- Token JWT é gerenciado por `core/auth/services/auth.service.ts` — services de domínio nunca lidam com token diretamente

## Credenciais de desenvolvimento

```
login: admin
senha: admin
```

Grupo ADMIN com todas as permissões. Definido em `modules/seguranca/services/mock/seed.ts`.

## Referências

- Specs completas: `/home/junico-home/Documentos/softon-auth-stories-md/` (34 histórias + modelo de banco + permissões iniciais)
- Detalhes do módulo de gestão: [`seguranca.md`](seguranca.md)
- Configurações operacionais (movidas): [`configuracoes.md`](configuracoes.md)
