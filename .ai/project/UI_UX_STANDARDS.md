# Padrões de UI/UX

## Objetivo visual

Interface corporativa limpa, moderna e objetiva.

## Princípios

- Menos ruído visual.
- Informações importantes primeiro.
- Ações principais em destaque.
- Formulários organizados.
- Tabelas com filtros úteis.
- Feedback claro para ações.
- Responsividade.

## Layout padrão de página

Toda página principal deve ter:

- título
- subtítulo opcional
- botão de ação principal
- filtros quando necessário
- conteúdo principal
- estado vazio
- loading
- mensagem de erro

## Componentes compartilhados sugeridos

```text
shared/components/
├── page-header/
├── status-badge/
├── confirm-dialog/
├── empty-state/
├── loading-state/
├── data-table/
├── search-input/
└── action-menu/
```

## Tabelas

Tabelas devem ter:

- coluna de ações
- loading
- empty state
- paginação quando necessário
- filtro por texto quando útil
- status formatado com badge

## Formulários

Formulários devem ter:

- agrupamento visual claro
- campos obrigatórios marcados
- mensagens de erro por campo
- botão salvar
- botão cancelar/voltar
- loading ao salvar

## Mensagens

Usar mensagens objetivas:

- "Manual criado com sucesso."
- "Release publicada com sucesso."
- "Não foi possível carregar os sistemas."
- "Verifique os campos obrigatórios."

## Status badges

Usar badges para status como:

- ATIVO
- INATIVO
- PUBLICADO
- RASCUNHO
- ONLINE
- OFFLINE
- ERRO

## Evitar

- Telas muito carregadas.
- Muitos botões primários.
- Misturar muitos estilos.
- Duplicar componentes parecidos.
- Criar componente compartilhado antes de existir reutilização real.
