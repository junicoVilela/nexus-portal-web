# Módulo Segurança (SOFTON-AUTH)

## Responsabilidade

Identidade, autorização e governança de acesso do Softon Ops Manager. Implementa as **34 histórias SOFTON-AUTH (001-034)** com mocks que simulam o backend descrito em `/home/junico-home/Documentos/softon-auth-stories-md/`.

A implementação é dividida em duas regiões:

- `core/auth/` — infraestrutura global (login, JWT, guards de rota base)
- `modules/seguranca/` — gestão de identidade, política de senha, sessões, acessos temporários, histórico/auditoria

## Estrutura

```text
src/app/modules/seguranca/
├── models/                          ← 12 entidades + DTOs
│   ├── acesso-temporario.model.ts
│   ├── auditoria.model.ts
│   ├── auth.model.ts                ← UsuarioAutenticado, LoginResponse
│   ├── dominio.model.ts
│   ├── escopo-acesso.model.ts
│   ├── funcionalidade.model.ts
│   ├── grupo-acesso.model.ts
│   ├── historico-login.model.ts
│   ├── permissao.model.ts
│   ├── politica-senha.model.ts
│   ├── sessao.model.ts
│   ├── usuario.model.ts
│   └── index.ts
├── services/                        ← 12 services (8 com specs)
│   ├── acesso-temporario.service.ts
│   ├── auditoria.service.ts
│   ├── auth-api.service.ts
│   ├── dominio.service.ts
│   ├── escopo.service.ts
│   ├── funcionalidade.service.ts
│   ├── grupo.service.ts
│   ├── historico-login.service.ts
│   ├── permissao.service.ts
│   ├── politica-senha.service.ts
│   ├── sessao.service.ts
│   ├── usuario.service.ts
│   └── mock/
│       ├── in-memory-store.ts       ← paginar, pesquisar, simularRequisicao
│       ├── mock-store.service.ts    ← singleton: signals + localStorage
│       └── seed.ts                  ← admin/admin, ADMIN/LEITOR, política padrão
├── guards/
│   └── permissao.guard.ts           ← CanActivateFn lê data.permissoes
├── directives/
│   └── permissao.directive.ts       ← *appPermissao + appPermissaoOu
└── pages/                           ← 11 telas (9 com smoke specs)
    ├── home/                        ← /seguranca (cards filtrados)
    ├── acesso-negado/
    ├── usuarios/{usuarios-list,usuario-form}/
    ├── grupos/{grupos-list,grupo-form,grupo-permissoes}/
    ├── matriz/                      ← /seguranca/dominios (3 colunas master-detail)
    ├── escopos/                     ← /seguranca/escopo-acesso
    ├── historico-login/             ← /seguranca/historico-login
    ├── auditoria/                   ← /seguranca/auditoria
    ├── politica-senha/              ← /seguranca/politica-senha
    ├── sessoes/                     ← /seguranca/sessoes
    └── acessos-temporarios/         ← /seguranca/acessos-temporarios
```

## Rotas

Todas dentro do shell, com `permissaoGuard`:

| Rota | Permissão | Componente |
|---|---|---|
| `/seguranca` | — | `SegurancaHomeComponent` (10 cards filtrados) |
| `/seguranca/acesso-negado` | — | `AcessoNegadoComponent` |
| `/seguranca/usuarios[/novo\|/:id/editar]` | `USUARIO:LER\|CRIAR\|EDITAR` | `UsuariosListComponent` / `UsuarioFormComponent` |
| `/seguranca/grupos[/novo\|/:id/editar\|/:id/permissoes]` | `GRUPO_ACESSO:LER\|CRIAR\|EDITAR\|VINCULAR_PERMISSAO` | `GruposListComponent` / `GrupoFormComponent` / `GrupoPermissoesComponent` |
| `/seguranca/dominios` | `DOMINIO:LER` | `MatrizComponent` (3 colunas) |
| `/seguranca/escopo-acesso` | `ESCOPO:LER` | `EscoposComponent` |
| `/seguranca/historico-login` | `HISTORICO_LOGIN:VISUALIZAR` | `HistoricoLoginComponent` |
| `/seguranca/auditoria` | `AUDITORIA:VISUALIZAR` | `AuditoriaComponent` |
| `/seguranca/politica-senha` | `POLITICA_SENHA:EDITAR` | `PoliticaSenhaComponent` |
| `/seguranca/sessoes` | `SESSAO:LER` | `SessoesComponent` |
| `/seguranca/acessos-temporarios` | `ACESSO_TEMPORARIO:LER` | `AcessosTemporariosComponent` |

Compatibilidade: rotas `/administracao/*` redirecionam para `/seguranca/*` e `/doc-flow/configuracoes`.

## Stories implementadas

### Telas (frontend explícito)

| ID | Tela | Destaques |
|---|---|---|
| **029** | Tela de login | core/auth/pages/login (existente) |
| **030** | Controle de rotas protegidas | `permissaoGuard`, `*appPermissao`, menu reativo |
| **031** | Usuários | Lista, filtros, criar/editar, ativar/inativar, bloquear, reset senha, vincular grupos |
| **032** | Grupos de acesso | Lista, form, vinculo de permissões agrupadas por domínio, contagem de usuários |
| **033** | Domínios/Funcionalidades/Permissões | Master-detail 3 colunas, CRUD inline, preview de código `FUNCIONALIDADE:ACAO` |
| **034** | Escopo de acesso | Tabs usuário/grupo, escopos **diretos** + **herdados** |
| **027** | Histórico de login | Lista com filtros (usuário/data/sucesso), badge sucesso/falha, motivo de falha, user-agent |
| **028** | Auditoria de segurança | Lista com filtros, expand por linha mostrando diff JSON anterior/novo, sanitização de senhas |
| **020** | Política de senha | Form singleton, tester de senha ao vivo, aplicação em criar/reset/troca |
| **023+024** | Sessões ativas + revogar | Lista, badge ativa/encerrada/revogada, sid no JWT, refresh invalida sessão revogada |
| **025+026** | Acesso temporário + expiração | Lista, form com vigência, expiração lazy ("job" disparado no listar()), revogação |

### Backend (mocks completos, com integração explícita no frontend)

| ID | Implementação no mock |
|---|---|
| **001** Login | `AuthApiService.login()` valida senha, registra histórico, abre sessão, gera JWT |
| **002** Logout | `AuthService.logout()` chama `encerrarSessaoAtual()` antes de limpar local |
| **003** /me | `AuthApiService.me()` resolve grupos + permissões reativas |
| **004** Refresh token | Verifica sessão ativa antes de renovar |
| **005-019** | CRUD completo + escopos + validação de permissão consumida por todo o módulo |
| **021** Histórico de senhas | `PoliticaSenhaService.reutilizada()` checa contra `historicoSenhas` em criar/reset/troca |
| **022** Bloqueio por tentativas | `incrementarTentativas()` no login falho (limite consultando política) |

## Permissões

Padrão **`DOMINIO:ACAO`**. Domínios no seed (`services/mock/seed.ts`):

- **SEGURANCA**: USUARIO, GRUPO_ACESSO, DOMINIO, FUNCIONALIDADE, PERMISSAO, ESCOPO, AUDITORIA
- **SISTEMA**: CONFIGURACAO (legado, configurações estão em `modules/docflow/`)
- **DOC_FLOW**: CLIENTE, PROJETO, MODULO, PAGINA, PUBLICACAO
- **RELEASE_ORCHESTRATOR**: RELEASE, TEMPLATE, PRODUTO

Funcionalidades no domínio SEGURANCA:
- USUARIO, GRUPO_ACESSO, DOMINIO, FUNCIONALIDADE, PERMISSAO, ESCOPO, AUDITORIA
- HISTORICO_LOGIN, POLITICA_SENHA, SESSAO, ACESSO_TEMPORARIO

Ações CRUD: `LER`, `CRIAR`, `EDITAR`, `EXCLUIR`. Ações especiais:
- `USUARIO:BLOQUEAR`, `USUARIO:RESETAR_SENHA`
- `GRUPO_ACESSO:VINCULAR_PERMISSAO`
- `HISTORICO_LOGIN:VISUALIZAR`, `AUDITORIA:VISUALIZAR`
- `SESSAO:REVOGAR`, `ACESSO_TEMPORARIO:REVOGAR`

Grupos seed:
- **ADMIN**: todas as permissões (populado dinamicamente via `permissoes.map(p => p.id)`). Protegido — UI desabilita edição de permissões e `vincularPermissoes()` é no-op para ele
- **LEITOR**: apenas `:LER` (populado via `permissoes.filter(p => p.acao === 'LER')`)

## Auditoria automática

Todas as ações sensíveis registram em `AuditoriaService.registrar()` (sanitiza senhas/tokens). Aparece em `/seguranca/auditoria`.

| Service | Ações auditadas |
|---|---|
| UsuarioService | CRIAR, EDITAR, ATIVAR/INATIVAR, BLOQUEAR/DESBLOQUEAR, RESETAR_SENHA, VINCULAR_GRUPOS |
| GrupoService | CRIAR, EDITAR, ATIVAR/INATIVAR, VINCULAR_PERMISSAO |
| AuthApiService | TROCAR_SENHA_PROPRIA |
| PoliticaSenhaService | EDITAR |
| SessaoService | REVOGAR |
| AcessoTemporarioService | CRIAR, REVOGAR, EXPIRAR (automática) |
| EscopoService | CRIAR, EDITAR, ATIVAR/INATIVAR, EXCLUIR (snapshot anterior em exclusão) |
| DominioService | CRIAR, EDITAR, ATIVAR/INATIVAR |
| FuncionalidadeService | CRIAR, EDITAR, ATIVAR/INATIVAR |
| PermissaoService | CRIAR, EDITAR, ATIVAR/INATIVAR |

Cobertura completa: todos os 10 services CRUD do módulo Segurança registram eventos.

## Política de senha — pontos de aplicação

Três pontos de entrada protegidos pela `PoliticaSenhaService.validar()` + `reutilizada()` + `registrarNoHistorico()`:

| Operação | Validação | Histórico (anti-reuso) | Registra | Audita |
|---|---|---|---|---|
| `UsuarioService.criar()` | ✓ | — | ✓ | ✓ |
| `UsuarioService.resetarSenha()` (admin) | ✓ | ✓ | ✓ | ✓ |
| `AuthApiService.alterarSenhaPropria()` (usuário) | ✓ | ✓ | ✓ | ✓ |

## Sessões — ciclo de vida

```
login()                 → SessaoService.abrir() → JWT inclui sid
logout()                → SessaoService.encerrarPorLogout() (status=encerrada)
revogar() (admin/user)  → SessaoService.revogar() (status=revogada, audita)
refresh()               → checa SessaoService.obterAtiva(sid); 401 se inativa
```

## Acesso temporário — máquina de estados

```
criar() → status = AGENDADO (início > now) ou ATIVO (início ≤ now)
listar() chama expirarVencidos() — varre lista, promove AGENDADO→ATIVO e ATIVO→EXPIRADO
revogar() → status = REVOGADO (só se AGENDADO/ATIVO)
```

Auditoria automática em `CRIAR`, `REVOGAR` e cada `EXPIRAR`.

## Infraestrutura compartilhada

### Mock backend

- `MockStore` (singleton): signals + persistência em `localStorage` namespace `seguranca-mock:`
- 13 signals: usuarios, grupos, dominios, funcionalidades, permissoes, escopos, historicoLogin, auditoria, politicaSenha, historicoSenhas, sessoes, acessosTemporarios, senhas
- `simularRequisicao<T>()` envolve resultado com delay configurável (default 30 ms; `environment.mockDelayMs`; 0 = síncrono)
- `simularErro<T>()` simula erros HTTP (400, 404, 409) com mesmo delay
- `paginar<T>()` retorna `PageResult<T>` completo
- Auditoria e histórico de login têm cap automático (`environment.mockHistoryCap`, default 500 entradas) para evitar crescimento descontrolado do `localStorage`
- `MockStore.reset()` reseta para o seed inicial (QA)

> O mesmo padrão de mock foi aplicado em `modules/docflow/services/configuracao.service.ts` (logo da empresa como data URL em `localStorage`).

### AuthService (`core/auth/services/auth.service.ts`)

Consome `AuthApiService` (mockado). Expõe signals reativos:

```ts
me()           // UsuarioAutenticado | null
permissoes()   // string[] (códigos DOMINIO:ACAO)
grupos()       // { id, codigo, nome }[]
tem()          // (codigo: string) => boolean
```

`carregarMe()` chamado via `provideAppInitializer` no boot. Cacheia `/me` em `localStorage` (`doc-flow-me`).

### Guard de permissão

```ts
{
  path: 'usuarios',
  canActivate: [permissaoGuard],
  data: { permissoes: ['USUARIO:LER'] },
  loadComponent: () => import('...').then(m => m.UsuariosListComponent),
}
```

- Sem `data.permissoes` → libera (só authGuard)
- Lista → exige **todas** (AND) — falha redireciona para `/seguranca/acesso-negado`

### Diretiva `*appPermissao`

```html
<ui-button *appPermissao="'USUARIO:CRIAR'">Novo</ui-button>
<button *appPermissao="['USUARIO:EDITAR','USUARIO:BLOQUEAR']">…</button>  <!-- AND -->
<button *appPermissao="'USUARIO:LER'" appPermissaoOu="['ADMIN:*']">…</button>  <!-- AND + OR -->
```

Reativa via `effect()` — re-renderiza quando `auth.me()` muda.

## Padrões aplicados

- 100% standalone components + `ChangeDetectionStrategy.OnPush`
- Signals (`signal`/`computed`/`input`/`output`/`effect`)
- Templates com `@if`/`@for`/`@empty`
- Reactive Forms (`fb.nonNullable.group`)
- Lazy load por rota (`loadComponent`)
- Services retornam `Observable<PageResult<T>>` — assinatura idêntica ao backend futuro
- `ConfirmService` (CDK Dialog) para ações destrutivas
- `ToastService` para feedback
- **Botão "Voltar"** padronizado via `PageHeaderComponent.backRoute` (e `ListPageComponent.backRoute`) — aplicado em 32 telas dos 3 módulos
- **Menus reativos por permissão**: tanto o `AppShellComponent` global quanto os shells internos (`DocflowShellComponent`, `ReleaseOrchestratorShellComponent`) filtram itens via `computed()` sobre `auth.tem()`. Itens sem permissão declarada permanecem sempre visíveis (ex.: Dashboard, Busca, Guia)

## Credenciais de desenvolvimento

```
login: admin
senha: admin
```

Grupo ADMIN com todas as permissões. Definido em `services/mock/seed.ts`. Política inicial permissiva (mín 4 chars) para preservar admin/admin — endurece pela tela `/seguranca/politica-senha`.

## Pontos de troca quando o backend chegar

1. Cada service injeta `MockStore` → trocar por `HttpClient` mantém a interface
2. `AuthApiService` gera JWT mock → substituir por chamada real a `/api/auth/login`
3. Senhas estão em `mockStore.senhas` (apenas dev). Backend usará BCrypt — histórico armazena os mesmos valores texto, deve passar a armazenar hashes
4. Campos string em escopo (`clienteId`, `produtoId`, `ambienteId`) viram FKs reais quando esses módulos expuserem `listarTodos()`
5. `AcessoTemporarioService.expirarVencidos()` é "lazy" (disparado em `listar()`). No backend deve virar job agendado

## Métricas finais

| Métrica | Valor |
|---|---|
| LOC TypeScript | 5.207+ |
| LOC HTML | 1.422+ |
| LOC CSS | 1.484+ |
| Models | 12 |
| Services | 12 (todos com auditoria onde aplicável, +8 specs) |
| Pages | 11 (+9 smoke specs) |
| Stories implementadas | 34/34 |
| Total de testes (projeto) | 364 |

## Referências

- Specs completas: `/home/junico-home/Documentos/softon-auth-stories-md/` (34 histórias + modelo de banco + permissões iniciais)
- Infra global de auth: [`auth.md`](auth.md)
- Configurações operacionais (movidas): [`configuracoes.md`](configuracoes.md)
- Usuários (resumo): [`usuarios.md`](usuarios.md)
