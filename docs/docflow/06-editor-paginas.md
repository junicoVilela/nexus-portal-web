# 06 — Editor de Páginas

A tela mais densa do módulo. Em `pages/paginas/pagina-form/`.

## 1. Modos do editor

| Modo     | O que mostra                                                              |
|----------|---------------------------------------------------------------------------|
| **rico** | **WYSIWYG via `ngx-editor` com toolbar** (negrito, itálico, listas, headings, links, imagens, cores, alinhamento). **Default.** |
| código   | textarea HTML em full-width                                               |
| split    | textarea à esquerda, preview à direita                                    |
| preview  | apenas preview renderizado                                                |

Toggle via `definirEditorModo('rico' | 'codigo' | 'split' | 'preview')`. Persistido em query param `modo=...` para deep-link.

O editor rico é um `ngx-editor` baseado em **prosemirror**, integrado com Reactive Forms via `ControlValueAccessor`. Output: `outputFormat="html"` — entrega HTML diretamente para o `formControlName="conteudoHtml"`, mesmo control que os outros modos consomem (alternar modos não perde conteúdo).

## 2. Atalhos de inserção

### Estrutura
H1, H2, P, Lista, Tabela, Código — cada botão insere um snippet padrão na posição do cursor.

### Blocos recorrentes
Foto, Dica, Atenção, Passo a passo, FAQ — wrappers semânticos comuns no manual.

Implementação em `inserirHtml(snippet)` / `inserirDica()` / etc.

## 3. Anexos

Lista de anexos abaixo do editor:
- Upload via `<input type="file">` → `paginaService.anexarPagina(id, file)`.
- Excluir passa por `ConfirmService` (variant: danger, icon Trash2).
- URL de download via `paginaService.downloadAnexoUrl(anexo)`.

## 4. Auto-save em localStorage

Toda mudança no form é salva com debounce de **800ms** em `localStorage` sob a chave `docflow:pagina-form:<editId|novo>`.

Ao abrir o form:
- Se existe rascunho com idade < 7 dias, restaura e mostra flash "Rascunho local restaurado."
- Se > 7 dias, descarta.

Ao salvar com sucesso, o rascunho é apagado.

Indicador `rascunhoSalvoEm: Date | null` está disponível para exibir "salvo às hh:mm" (não exposto no template ainda — opcional).

## 5. canDeactivate guard

A rota está marcada com `canDeactivate: [canDeactivateGuard]` (de `@shared/guards`).

Quando o usuário tenta sair com o form dirty, um `ConfirmDialog` pergunta "Sair sem salvar?" e bloqueia se a resposta for não.

`PaginaFormComponent` implementa `CanDeactivateComponent`:

```ts
hasUnsavedChanges(): boolean { return this.dirty && !this.justSaved; }
```

`this.dirty` é setado pelo `valueChanges` da subscription de auto-save.
`this.justSaved` previne o prompt logo após um save bem-sucedido (antes do redirect).

## 6. Sanitização

Preview usa `[innerHTML]="conteudoPreview"` — Angular sanitiza automaticamente (remove `<script>`, atributos `onclick`, `javascript:`, etc.). Não usar `bypassSecurityTrustHtml` aqui (desligaria a sanitização).

## 7. Revisões

Lista paginada (`paginaService.listarRevisoesPagina`) com sort/dir configuráveis e diff visual entre versões selecionadas (linhas `+`/`-`/` `).

## 8. Pendências (ver `99-melhorias-sugeridas.md`)

- ~~Toolbar rich-text~~ — entregue via `ngx-editor` (modo "rico").
- ~~Indicador visual de "salvo localmente às hh:mm"~~ — entregue.
- Drag-and-drop de blocos no preview (reordenar seções visualmente).
- Inserir blocos recorrentes (Dica/Atenção/FAQ) dentro do editor rico via plugin custom.
