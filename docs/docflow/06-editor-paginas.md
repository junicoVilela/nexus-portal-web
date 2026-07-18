# 06 — Editor de Páginas

A tela mais densa do módulo. Em `pages/paginas/pagina-form/`.

## 1. Modos do editor

| Modo     | O que mostra                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **rico** | **WYSIWYG via `ngx-editor` com toolbar** (negrito, itálico, listas, headings, links, imagens, cores, alinhamento). **Default.** |
| código   | textarea HTML em full-width                                                                                                     |
| split    | textarea à esquerda, preview à direita                                                                                          |
| preview  | apenas preview renderizado                                                                                                      |

Toggle via `definirEditorModo('rico' | 'codigo' | 'split' | 'preview')`. Persistido em query param `modo=...` para deep-link.

O editor rico é um `ngx-editor` baseado em **prosemirror**, integrado com Reactive Forms via `ControlValueAccessor`. Output: `outputFormat="html"` — entrega HTML diretamente para o `formControlName="conteudoHtml"`, mesmo control que os outros modos consomem (alternar modos não perde conteúdo).

O schema ProseMirror do DocFlow estende o padrão para preservar containers semânticos,
classes editoriais, tabelas e listas estilizadas usados pelos modelos de página.

## 2. Atalhos de inserção

### Estrutura

H1, H2, P, Lista, Tabela, Código — cada botão insere um snippet padrão na posição do cursor.

### Blocos recorrentes

Foto, Dica, Atenção, Passo a passo, FAQ — wrappers semânticos comuns no manual.

Implementação em `inserirHtml(snippet)` / `inserirDica()` / etc.

No modo rico, os atalhos usam `Editor.commands.insertHTML()` do `ngx-editor` e inserem o
bloco na seleção atual. Nos modos código/split, a inserção continua usando a posição do
cursor do textarea.

## 3. Modelos de página

Páginas novas exibem uma galeria carregada por `GET /paginas/templates`. Modelos iniciais:

- central de ajuda;
- funcionalidade;
- passo a passo;
- cadastro ou edição;
- consulta ou listagem;
- guia de relatório;
- dicionário de campos;
- fluxo de processo;
- índice de categoria;
- primeiros passos;
- perguntas frequentes;
- solução de problemas;
- página em branco.

A galeria apresenta uma miniatura da estrutura antes da aplicação. As variações distinguem
visualmente páginas orientadas a tela, fluxos, dicionários, FAQ e diagnóstico, sem precisar
renderizar o HTML completo dentro de cada cartão.

Cada cartão também oferece **Prévia**, que resolve as variáveis no backend com título,
código, projeto, módulo e cliente selecionados, mas não altera o conteúdo atual. O painel
mostra contexto resolvido, variáveis pendentes e o HTML sanitizado; somente a ação
**Aplicar este modelo** substitui o editor. O primeiro autosave mantém esse painel aberto
enquanto transforma a página nova em rascunho editável.

Aplicar outro modelo sobre conteúdo existente exige confirmação.

Os modelos usam a linguagem visual compartilhada `df-doc-content`, aplicada no editor,
na prévia local e na prévia da publicação. Além dos blocos básicos, ela oferece card de
objetivo, quadro para captura de tela, marcações numeradas, grades de regras, cartões de
etapas, fluxo horizontal responsivo, badges e tabela de dicionário. O HTML continua
semântico e editável; a aparência é definida pelo front e pelo pacote gerado.

A migração `V21__docflow__09_templates_portal_ajuda.sql` atualiza somente o catálogo.
Conteúdo de páginas existentes não é sobrescrito.

A migração `V22__docflow__10_templates_portal_ajuda_expandido.sql` acrescenta os modelos
de central, categoria, onboarding e relatório, totalizando 12 estruturas ativas.

### Modelos personalizados

A ação **Salvar como modelo** copia o HTML atual e cria um modelo com escopo exclusivo de
projeto ou cliente. O painel exige nome e escopo, usa o projeto atual como valor inicial e
permite selecionar qualquer cliente ativo. A galeria identifica a origem de cada estrutura
e fica disponível tanto em páginas novas quanto existentes, com filtros para modelos do
sistema, de projetos e de clientes.

Somente modelos personalizados exibem exclusão. A operação usa confirmação e não altera
páginas que já aplicaram o modelo, pois a aplicação sempre copia `conteudoHtml` em vez de
manter uma referência. A API sanitiza o HTML, protege os 12 modelos do sistema e registra
criação e exclusão na auditoria. A persistência é criada pela migration
`V23__docflow__11_templates_personalizados.sql`.

### Variáveis e aplicação contextual

Os modelos podem usar `{{ cliente.nome }}`, `{{ projeto.nome }}`, `{{ modulo.nome }}`,
`{{ pagina.titulo }}`, `{{ pagina.codigo }}` e `{{ data.atual }}`. A aplicação é feita pela
API, que valida o escopo e preenche os valores conhecidos. Marcadores ainda sem contexto ficam
visíveis no editor, são resolvidos quando os campos correspondentes são preenchidos e continuam
como erro no checklist enquanto permanecerem no HTML.

A galeria abre no modo compatível: modelos do sistema, do projeto atual e de clientes vinculados
ao projeto. O usuário pode alternar para o catálogo completo e incluir itens arquivados.

### Ciclo de vida e versões

Modelos personalizados podem ser editados, duplicados, arquivados, reativados e excluídos.
Duplicar um modelo do sistema cria uma cópia personalizada no projeto atual. Na edição, nome,
descrição e escopo podem ser alterados; substituir a estrutura pelo conteúdo da página aberta é
uma escolha explícita.

Criação, edição, arquivamento, reativação e restauração geram snapshots imutáveis. O histórico
mostra autor, data e quantas páginas nasceram de cada versão. Restaurar nunca apaga versões:
o snapshot escolhido vira uma nova versão atual. A página guarda o ID e a versão de origem,
mas seu HTML continua independente.

### Biblioteca de blocos

Abaixo da toolbar, a biblioteca expansível oferece 13 seções reutilizáveis, filtradas por
Estrutura, Orientação, Referência e Navegação. A inserção respeita o cursor nos modos rico,
código e dividido e não substitui o conteúdo existente. O catálogo inclui introdução,
objetivo, visão da tela, elementos numerados, regras, fluxo, jornada, dicionário, lista de
conteúdos, FAQ, checklist, boas práticas e links relacionados.

Ao digitar `/` no início de uma linha vazia, o editor abre a biblioteca com o campo de
busca em foco. A pesquisa considera nome, descrição e categoria, ignorando acentos. O
atalho funciona nos modos rico, código e dividido; `Esc` fecha o menu. Barras usadas em
URLs ou depois de conteúdo continuam com o comportamento normal.

### Organização visual das seções

Na prévia, a ação **Organizar seções** transforma os blocos de primeiro nível em cartões
reordenáveis. O usuário pode arrastar pela alça ou usar os botões de subir e descer; esta
segunda opção mantém o recurso acessível por teclado. Títulos e parágrafos soltos de
páginas antigas são agrupados logicamente, enquanto os blocos `<section>` dos templates
atuais permanecem independentes. Cada alteração atualiza `conteudoHtml` e segue o mesmo
fluxo de autosave e versionamento da página.

Cada cartão também oferece ações para duplicar e excluir. A exclusão usa o diálogo de
confirmação compartilhado do sistema e pode ser revertida pelo botão **Desfazer**. O
organizador mantém as 20 alterações mais recentes da sessão e limpa esse histórico quando
detecta uma edição externa feita no editor rico ou no código-fonte. O cabeçalho apresenta
o estado atual do autosave, incluindo salvando, salvo, offline, conflito e erro.

## 4. Anexos

Lista de anexos abaixo do editor:

- Upload via `<input type="file">` → `paginaService.anexarPagina(id, file)`.
- Excluir passa por `ConfirmService` (variant: danger, icon Trash2).
- URL de download via `paginaService.downloadAnexoUrl(anexo)`.

Em uma página nova, a primeira tentativa de inserir imagem cria a página como `RASCUNHO`,
mantém o usuário no editor e só então envia o arquivo. Imagens novas não são mais gravadas
como Base64 no HTML.

## 5. Auto-save no servidor e backup local

Toda mudança válida no formulário é persistida no servidor com debounce de **800ms**.
Páginas novas são criadas como rascunho assim que os campos obrigatórios estiverem válidos.
O `localStorage`, sob a chave `docflow:pagina-form:<editId|novo>`, permanece como fallback
para falha de conexão.

Ao abrir o form:

- Se existe rascunho com idade < 7 dias, restaura e mostra flash "Rascunho local restaurado."
- Se > 7 dias, descarta.

Ao salvar no servidor com sucesso, o backup local é apagado. Se o backup for mais antigo
que `updatedAt` do servidor, ele não é restaurado.

O editor apresenta os estados salvando, salvo, offline, erro e conflito. HTTP 409 interrompe
o autosave e oferece carregar a versão do servidor ou sobrescrever conscientemente com a
versão local.

As consultas de projetos, módulos e catálogo de templates usam cache leve com TTL e
`shareReplay`. Mutações invalidam o cache correspondente para evitar dados obsoletos.

## 6. Prontidão editorial e prévia fiel

O checklist reage ao conteúdo do formulário e valida título, código da tela, tamanho mínimo,
placeholders do modelo, acessibilidade das imagens, resumo e organização em seções. Erros
impedem o envio para revisão no backend; avisos são recomendações.

“Abrir prévia fiel” sincroniza o rascunho e carrega `GET /paginas/:id/preview` como HTML via
`HttpClient`, usando o renderizador editorial do pacote em uma nova janela autenticada.

## 7. Ações de salvamento

- **Salvar e voltar** — persiste e retorna à lista.
- **Salvar e continuar** — persiste e mantém o editor aberto.
- **Salvar e criar próxima** — mantém projeto, módulo e página pai como contexto.
- `Ctrl+S` / `Cmd+S` — equivale a salvar e continuar.

Ao abrir uma nova página a partir da listagem, os filtros atuais de projeto e módulo são
levados para o formulário.

## 8. canDeactivate guard

A rota está marcada com `canDeactivate: [canDeactivateGuard]` (de `@shared/guards`).

Quando o usuário tenta sair com o form dirty, um `ConfirmDialog` pergunta "Sair sem salvar?" e bloqueia se a resposta for não.

`PaginaFormComponent` implementa `CanDeactivateComponent`:

```ts
hasUnsavedChanges(): boolean { return this.dirty && !this.justSaved; }
```

`this.dirty` é setado pelo `valueChanges` da subscription de auto-save.
`this.justSaved` previne o prompt logo após um save bem-sucedido (antes do redirect).

## 9. Sanitização

Preview usa `[innerHTML]="conteudoPreview"` — Angular sanitiza automaticamente (remove `<script>`, atributos `onclick`, `javascript:`, etc.). Não usar `bypassSecurityTrustHtml` aqui (desligaria a sanitização).

## 10. Revisões

Lista paginada (`paginaService.listarRevisoesPagina`) com evento editorial identificado,
descrição, autor e data. O diff usa o conteúdo HTML das duas versões mais recentes, com
fallback para o título.

## 11. Pendências (ver `99-melhorias-sugeridas.md`)

- ~~Toolbar rich-text~~ — entregue via `ngx-editor` (modo "rico").
- ~~Indicador visual de "salvo localmente às hh:mm"~~ — entregue.
- ~~Drag-and-drop de blocos no preview (reordenar seções visualmente)~~ — entregue.
- ~~Menu `/` para localizar e inserir blocos por teclado~~ — entregue.
- ~~Prévia contextual antes de aplicar um modelo~~ — entregue.
- ~~Fluxo E2E de criação até publicação~~ — entregue com Playwright e mock HTTP stateful.
