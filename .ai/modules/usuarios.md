# Módulo Usuários

## Status

**Implementado dentro de `modules/seguranca/` (SOFTON-AUTH-031).**

Usuários fazem parte do módulo guarda-chuva de identidade e acesso (segurança), não são um módulo Angular separado.

Veja também:
- [`.ai/modules/seguranca.md`](seguranca.md) — documentação completa do módulo
- [`.ai/modules/auth.md`](auth.md) — infraestrutura de autenticação

## Localização atual

```text
src/app/modules/seguranca/pages/usuarios/
├── usuarios-list/usuarios-list.component.ts
└── usuario-form/usuario-form.component.ts

src/app/modules/seguranca/services/usuario.service.ts
src/app/modules/seguranca/models/usuario.model.ts
```

## Rotas

```text
/seguranca/usuarios                  → UsuariosListComponent  (USUARIO:LER)
/seguranca/usuarios/novo             → UsuarioFormComponent   (USUARIO:CRIAR)
/seguranca/usuarios/:id/editar       → UsuarioFormComponent   (USUARIO:EDITAR)
```

Definidas em `modules/seguranca/seguranca.routes.ts`. Todas com `permissaoGuard`.

## Implementado

**Lista (`usuarios-list/`):**
- Listagem com paginação (10/page)
- Busca por nome, login ou e-mail
- Filtros por status (ativo/inativo) e bloqueio
- Coluna de grupos vinculados (nomes resolvidos via cache)
- Ações por linha (todas com `*appPermissao`):
  - Editar → `USUARIO:EDITAR`
  - Ativar/Inativar (com confirm) → `USUARIO:EDITAR`
  - Bloquear/Desbloquear (com confirm) → `USUARIO:BLOQUEAR`
  - Resetar senha (com prompt + flag `trocarSenhaProximoLogin`) → `USUARIO:RESETAR_SENHA`

**Form (`usuario-form/`):**
- Modo criar / editar (rota detecta `:id`)
- Campos: nome, login, e-mail, senha (obrigatória só na criação), ativo
- Seleção múltipla de grupos com checkboxes
- Validators: nome ≥2, login ≥3, e-mail válido
- Cancelamento e redirect para lista após sucesso

**Service (`usuario.service.ts`):**
```ts
listar(filter)        // Observable<PageResult<Usuario>>
buscarPorId(id)       // Observable<Usuario>
criar(form)           // Observable<Usuario>
atualizar(id, form)   // Observable<Usuario>
alterarStatus(id, ativo)
bloquear(id, bloqueado)
resetarSenha(id, novaSenha)  // seta trocarSenhaProximoLogin = true
vincularGrupos(id, grupoIds)
```

Validações no mock: login duplicado → 409, e-mail duplicado → 409.

## Model

```ts
interface Usuario {
  id: string;
  nome: string;
  email: string;
  login: string;
  ativo: boolean;
  bloqueado: boolean;
  tentativasInvalidas: number;
  trocarSenhaProximoLogin: boolean;
  ultimoLogin: string | null;
  criadoEm: string;
  atualizadoEm: string | null;
  grupoIds?: string[];
}
```

## Regras UI

- Nunca exibir senha ou hash
- Ações destrutivas (bloquear, inativar) passam por `ConfirmService`
- Reset de senha força `trocarSenhaProximoLogin = true`
- Botões/ações ocultos via `*appPermissao` quando o usuário logado não tem permissão
