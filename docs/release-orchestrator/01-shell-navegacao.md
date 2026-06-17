# Tela: Shell / Navegação

## Identificação

- **Componente**: `ReleaseOrchestratorShellComponent` (`shell/release-orchestrator-shell.component.ts`)
- **Rota**: container de todas as rotas (`path: ''`)
- **Arquivos**: `release-orchestrator-shell.component.{ts,html,css}` + `.spec.ts`

## Objetivo

Moldura do módulo: sidebar fixa com a marca "Release Orchestrator", menu de navegação filtrado por permissão e `<router-outlet>` para as telas filhas.

## Layout

- `aside.rf-shell__side`: marca (ícone `Tag` + "Release Orchestrator" / "Gestão de releases") e `nav` com links.
- `main.rf-shell__main`: `<router-outlet />`.
- Link ativo via `routerLinkActive` (com `exact` apenas no Dashboard).

## Itens de menu (`navItemsTodos`)

| Label | Ícone | Rota | Permissão exigida |
|---|---|---|---|
| Dashboard | `House` | `/release-orchestrator` (exact) | — |
| Registrar | `PlayCircle` | `/release-orchestrator/builder` | `RELEASE:CRIAR` |
| Releases | `Tag` | `/release-orchestrator/releases` | `RELEASE:LER` |
| Produtos | `Box` | `/release-orchestrator/produtos` | `PRODUTO:LER` |
| Templates | `FilePen` | `/release-orchestrator/templates` | `TEMPLATE:LER` |
| Como usar | `HelpCircle` | `/release-orchestrator/guia` | — |

- `navItems` = `computed` que filtra por `auth.tem(permissao)` (`AuthService`).

## Command Palette

No `ngOnInit` registra 6 comandos no `CommandPaletteService` (grupo "Release Orchestrator"): dashboard, builder, releases, produtos, templates, guia. `ngOnDestroy` chama `palette.unregister('release-orchestrator')`.

## Dependências

- `@core/auth/services/auth.service` (`AuthService`)
- `@shared/ui` (`CommandPaletteService`)
- `RouterOutlet`, `RouterLink`, `RouterLinkActive`, `LucideAngularModule`

## Observações / drift

- O menu usa **permissões granulares** (`RELEASE:CRIAR`, etc.), mas o backend protege os endpoints por **role** (`hasAnyRole('ADMIN','EDITOR')`). Há divergência entre o modelo de permissão do front (nav) e o de role do back.
