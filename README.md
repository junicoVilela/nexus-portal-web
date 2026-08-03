# Release Orchestrator

Este README documenta somente o módulo **Release Orchestrator** do Nexus Portal Web.

O Release Orchestrator é o módulo responsável por centralizar o ciclo de vida das releases dos produtos da Nexus. Ele organiza, registra, revisa, publica e comunica mudanças de versão, funcionando como uma ponte entre desenvolvimento, suporte, operação e áreas que precisam entender o que mudou em cada sistema.

Na aplicação Angular, o módulo fica em:

```text
frontend/src/app/modules/release-orchestrator/
```

A rota principal do módulo é:

```text
/release-orchestrator
```

## Para que Serve

O Release Orchestrator serve para transformar mudanças técnicas de sistemas em uma release rastreável, revisável e comunicável.

Em vez de cada alteração ficar dispersa em tickets, commits, conversas ou documentos avulsos, o módulo cria um fluxo único onde cada versão possui:

- produto relacionado;
- número da versão;
- tipo da release;
- status no ciclo de aprovação;
- data prevista ou data de publicação;
- responsável;
- resumo;
- observações;
- lista de itens entregues;
- histórico de ações;
- geração de PDF para distribuição.

Na prática, ele responde perguntas como:

- Qual produto recebeu uma nova versão?
- O que mudou nessa versão?
- A release ainda está em desenvolvimento, em revisão, aprovada ou publicada?
- Quais itens são novidade, melhoria, correção, segurança ou ajuste técnico?
- Quem publicou ou alterou a release?
- A release pode ser comunicada ao cliente ou ainda possui pendências?
- É possível gerar um documento interno da release?

## Objetivo do Módulo

O objetivo central é dar previsibilidade e governança ao processo de publicação de versões.

O módulo não é apenas uma lista de releases. Ele modela um fluxo operacional completo:

1. cadastrar produtos que recebem versões;
2. criar uma release para um produto;
3. registrar os itens que compõem aquela entrega;
4. classificar cada item por categoria e visibilidade;
5. enviar a release para revisão;
6. validar pendências antes da publicação;
7. publicar oficialmente;
8. manter histórico e gerar PDF.

Esse fluxo reduz perda de informação, evita publicações sem revisão e facilita a comunicação entre times técnicos e não técnicos.

## Visão Funcional

O Release Orchestrator é dividido em áreas internas acessadas pelo menu próprio do módulo.

```text
/release-orchestrator                    Dashboard
/release-orchestrator/builder            Registro rápido de release
/release-orchestrator/releases           Lista de releases
/release-orchestrator/releases/nova      Cadastro tradicional de release
/release-orchestrator/releases/:id       Detalhe da release
/release-orchestrator/releases/:id/editar
/release-orchestrator/releases/:id/revisao
/release-orchestrator/produtos           Produtos atendidos pelo fluxo
/release-orchestrator/templates          Templates de texto para releases
/release-orchestrator/guia               Guia de uso do módulo
```

## Como Funciona

### 1. Produtos

Antes de registrar uma release, o módulo precisa conhecer os produtos que recebem versões.

Um produto representa um sistema, plataforma ou solução da Nexus. Ele possui nome, sigla, descrição, cor visual, responsável e estado ativo/inativo.

Exemplo conceitual:

```text
Produto: Portal Nexus
Sigla: PORTAL
Cor: #2563eb
Ativo: Sim
```

As releases sempre pertencem a um produto. Isso permite filtrar, agrupar e identificar visualmente as versões por sistema.

Arquivo principal:

```text
frontend/src/app/modules/release-orchestrator/pages/produtos/
```

Service:

```text
ProdutoRhService
```

Endpoint base usado pelo frontend:

```text
{environment.apiUrl}/release-orchestrator/produtos
```

Operações previstas:

- listar produtos;
- listar somente produtos ativos para seleção;
- buscar produto por ID;
- criar produto;
- atualizar produto;
- ativar ou inativar produto;
- excluir produto;
- enviar logo do produto.

### 2. Templates

Templates são modelos reutilizáveis de estrutura textual para releases.

Eles servem para padronizar releases recorrentes, principalmente quando um produto ou tipo de entrega costuma seguir o mesmo formato de comunicação. Um template pode estar associado a um tipo de release e opcionalmente a um produto.

Exemplos de uso:

- modelo para hotfix;
- modelo para release major;
- modelo para publicação de correções;
- modelo específico de um produto.

Arquivo principal:

```text
frontend/src/app/modules/release-orchestrator/pages/templates/
```

Service:

```text
ReleaseTemplateService
```

Endpoint base usado pelo frontend:

```text
{environment.apiUrl}/release-orchestrator/templates
```

Operações previstas:

- listar templates;
- buscar template por ID;
- criar template;
- atualizar template;
- ativar ou inativar template;
- excluir template.

O uso de template é opcional. Uma release pode ser criada sem template.

### 3. Cadastro da Release

Uma release representa uma versão publicada ou em preparação para um produto.

Campos principais:

- `produtoId`: produto ao qual a release pertence;
- `versao`: número da versão;
- `titulo`: nome descritivo da release;
- `tipo`: classificação da entrega;
- `status`: etapa atual do fluxo;
- `dataPrevista`: previsão de publicação;
- `dataPublicacao`: data efetiva de publicação;
- `responsavelId`: responsável pela release;
- `resumo`: explicação curta da entrega;
- `observacoes`: informações adicionais;
- `totalItens`: quantidade de itens registrados.

Tipos de release:

```text
MAJOR    Mudança grande, geralmente com impacto relevante.
MINOR    Evolução incremental, comum para novas funcionalidades.
PATCH    Correção ou ajuste pequeno.
HOTFIX   Correção emergencial.
FEATURE  Entrega focada em uma funcionalidade.
```

Arquivos principais:

```text
frontend/src/app/modules/release-orchestrator/pages/releases/form/
frontend/src/app/modules/release-orchestrator/models/release.model.ts
```

Service:

```text
ReleaseService
```

Endpoint base usado pelo frontend:

```text
{environment.apiUrl}/release-orchestrator/releases
```

Operações previstas:

- listar releases com filtros;
- buscar release por ID;
- criar release;
- atualizar release;
- alterar status;
- publicar;
- cancelar;
- duplicar;
- excluir;
- listar histórico;
- validar revisão.

### 4. Builder de Release

O Builder é uma tela de registro rápido.

Ele foi criado para agilizar o trabalho de quem está documentando uma release durante ou logo após o desenvolvimento. Em vez de criar a release em uma tela e depois navegar para adicionar itens, o usuário faz isso em sequência.

Fluxo do Builder:

1. selecionar produto;
2. informar versão;
3. informar título;
4. escolher tipo de release;
5. criar a release já em `EM_DESENVOLVIMENTO`;
6. adicionar itens por categoria;
7. encerrar e enviar para revisão.

Arquivo principal:

```text
frontend/src/app/modules/release-orchestrator/pages/builder/
```

O Builder usa Reactive Forms e salva itens por meio do `ReleaseItemService`.

### 5. Itens da Release

Itens são as mudanças concretas entregues dentro de uma release.

Cada item representa uma unidade de comunicação, como uma nova funcionalidade, melhoria, correção, ajuste de segurança ou alteração técnica.

Campos principais:

- `categoria`: tipo de mudança;
- `titulo`: resumo objetivo do item;
- `descricao`: explicação mais completa;
- `visibilidade`: público interno que pode ver o item;
- `ordem`: posição do item na release;
- `ticket`: referência a chamado ou tarefa;
- `commit`: referência técnica;
- `pullRequest`: referência de revisão de código;
- `responsavelId`: responsável pelo item.

Categorias disponíveis:

```text
NOVIDADE
MELHORIA
CORRECAO
SEGURANCA
PERFORMANCE
DOCUMENTACAO
AJUSTE_TECNICO
IMPACTO_OPERACIONAL
IMPORTANTE
```

Visibilidades disponíveis:

```text
TODOS
TECNICO
SUPORTE
```

Arquivo principal:

```text
frontend/src/app/modules/release-orchestrator/models/release-item.model.ts
```

Service:

```text
ReleaseItemService
```

Endpoints usados pelo frontend:

```text
GET    /release-orchestrator/releases/:releaseId/itens
POST   /release-orchestrator/releases/:releaseId/itens
PUT    /release-orchestrator/releases/:releaseId/itens/:itemId
DELETE /release-orchestrator/releases/:releaseId/itens/:itemId
PUT    /release-orchestrator/releases/:releaseId/itens/reordenar
POST   /release-orchestrator/releases/:releaseId/itens/:itemId/duplicar
```

Os itens são exibidos agrupados por categoria no detalhe e na revisão da release.

### 6. Ciclo de Status

A release passa por um ciclo controlado de status.

Status existentes:

```text
RASCUNHO
EM_DESENVOLVIMENTO
EM_REVISAO
APROVADA
PUBLICADA
CANCELADA
```

Fluxo permitido pelo frontend:

```text
RASCUNHO
  -> EM_DESENVOLVIMENTO
  -> CANCELADA

EM_DESENVOLVIMENTO
  -> EM_REVISAO
  -> CANCELADA

EM_REVISAO
  -> APROVADA
  -> RASCUNHO
  -> CANCELADA

APROVADA
  -> PUBLICADA
  -> EM_REVISAO
  -> CANCELADA
```

Regras importantes:

- releases em `RASCUNHO` e `EM_DESENVOLVIMENTO` podem ser editadas;
- releases em revisão devem passar por validação;
- releases aprovadas estão prontas para publicação;
- releases publicadas ficam bloqueadas para edição;
- releases canceladas permanecem para consulta e auditoria.

Essa regra está declarada em:

```text
frontend/src/app/modules/release-orchestrator/models/release.model.ts
```

### 7. Detalhe da Release

A tela de detalhe é o centro operacional de uma release.

Nela o usuário consulta os dados principais, gerencia itens, acompanha histórico, altera status e gera PDF.

Recursos da tela:

- visualização do cabeçalho da release;
- agrupamento de itens por categoria;
- criação, edição, duplicação e remoção de itens;
- alternância entre aba de itens e aba de histórico;
- ações de mudança de status;
- acesso à tela de revisão;
- geração de PDF interno.

Arquivo principal:

```text
frontend/src/app/modules/release-orchestrator/pages/releases/detalhe/
```

### 8. Revisão

A tela de revisão existe para impedir que uma release seja publicada sem validação mínima.

Ela carrega:

- dados da release;
- itens agrupados por categoria;
- resultado da validação da API;
- pendências;
- alertas;
- totais de itens internos e de cliente.

O botão de publicação só é efetivo quando a validação indica que a release está válida.

Arquivo principal:

```text
frontend/src/app/modules/release-orchestrator/pages/releases/revisao/
```

Endpoint usado para validação:

```text
GET /release-orchestrator/releases/:id/validar
```

Modelo de validação esperado:

```text
valida: boolean
pendencias: string[]
alertas: string[]
totalItensCliente: number
totalItensInternos: number
```

### 9. Publicação

Publicar é o ato de oficializar uma release.

Ao publicar, a release sai do ciclo de edição e passa a representar uma versão comunicável. A publicação deve ocorrer depois da aprovação e da validação.

Endpoint usado:

```text
POST /release-orchestrator/releases/:id/publicar
```

Depois de publicada, a release pode continuar sendo consultada e exportada, mas não deve ser editada como uma release em preparação.

### 10. Histórico

O histórico registra eventos relevantes do ciclo da release.

Ações previstas:

```text
CRIADA
EDITADA
ITEM_ADICIONADO
ITEM_EDITADO
ITEM_REMOVIDO
ENVIADA_REVISAO
APROVADA
PUBLICADA
CANCELADA
REABERTA
DUPLICADA
PDF_GERADO
ENVIADA_CLIENTE
```

Cada registro contém:

- release relacionada;
- ação realizada;
- descrição;
- status anterior;
- status novo;
- usuário;
- data de criação.

Arquivo principal:

```text
frontend/src/app/modules/release-orchestrator/models/release-historico.model.ts
```

Endpoint usado:

```text
GET /release-orchestrator/releases/:id/historico
```

## Dashboard

O dashboard oferece uma visão geral do módulo.

Ele apresenta:

- total de releases publicadas;
- total de releases em revisão;
- total de releases em desenvolvimento;
- total de itens registrados;
- lista de releases recentes;
- atalhos para registrar release, listar releases e abrir o guia.

Arquivo principal:

```text
frontend/src/app/modules/release-orchestrator/pages/dashboard/
```

O dashboard consulta as releases recentes e calcula indicadores no frontend com base nos dados retornados pela API.

## Lista de Releases

A listagem concentra a consulta operacional.

Ela permite:

- filtrar por texto;
- filtrar por produto;
- filtrar por status;
- filtrar por tipo;
- paginar resultados;
- abrir detalhes;
- duplicar release;
- cancelar release;
- excluir release quando permitido;
- gerar PDF interno.

Arquivo principal:

```text
frontend/src/app/modules/release-orchestrator/pages/releases/list/
```

Releases publicadas não devem ser removidas. O frontend também trata erro da API caso a exclusão seja negada.

## Geração de PDF

O módulo possui um serviço específico para gerar e baixar PDFs.

Service:

```text
ReleasePdfService
```

Arquivo:

```text
frontend/src/app/modules/release-orchestrator/services/release-pdf.service.ts
```

Endpoint usado:

```text
GET /release-orchestrator/releases/:releaseId/pdf?tipo=CLIENTE
GET /release-orchestrator/releases/:releaseId/pdf?tipo=INTERNO
```

Tipos suportados:

```text
CLIENTE
INTERNO
```

O serviço recebe o `Blob` retornado pela API, cria uma URL temporária no navegador e dispara o download do arquivo.

## Guia de Uso

O módulo inclui uma tela de guia para orientar usuários.

Ela explica o fluxo recomendado:

```text
produtos -> release -> itens -> revisão -> publicação
```

Também apresenta o ciclo de status e atalhos para cada etapa.

Arquivo principal:

```text
frontend/src/app/modules/release-orchestrator/pages/guia/
```

## Estrutura Técnica

Estrutura do módulo:

```text
release-orchestrator/
├── models/
│   ├── guia-passo.model.ts
│   ├── produto-rh.model.ts
│   ├── release-historico.model.ts
│   ├── release-item.model.ts
│   ├── release-template.model.ts
│   └── release.model.ts
├── pages/
│   ├── builder/
│   ├── dashboard/
│   ├── guia/
│   ├── produtos/
│   ├── releases/
│   │   ├── detalhe/
│   │   ├── form/
│   │   ├── list/
│   │   └── revisao/
│   └── templates/
├── services/
│   ├── produto-rh.service.ts
│   ├── release-item.service.ts
│   ├── release-pdf.service.ts
│   ├── release-template.service.ts
│   └── release.service.ts
├── shell/
│   ├── release-orchestrator-shell.component.css
│   ├── release-orchestrator-shell.component.html
│   └── release-orchestrator-shell.component.ts
└── release-orchestrator.routes.ts
```

## Responsabilidades por Camada

### Models

Os models definem os contratos de dados usados pelo frontend.

Eles representam:

- releases;
- formulários de release;
- itens;
- templates;
- produtos;
- histórico;
- passos do guia.

### Services

Os services concentram a comunicação com a API.

Components não chamam `HttpClient` diretamente. Cada service conhece seu endpoint e retorna `Observable`, seguindo o padrão arquitetural do projeto.

### Pages

As pages cuidam da interface e da interação do usuário.

Elas usam os services para buscar e salvar dados, controlam estados de loading, erro, formulários e navegação.

### Shell

O shell fornece a navegação interna do módulo.

Ele contém o menu lateral do Release Orchestrator com links para:

- Dashboard;
- Registrar;
- Releases;
- Produtos;
- Templates;
- Como usar.

## Integração com o Portal

O módulo é carregado por lazy loading a partir das rotas principais da aplicação.

No portal, ele aparece como módulo chamado **Release Orchestrator**, com descrição voltada à gestão de releases, changelog e comunicação de novidades para clientes.

A entrada no shell principal está configurada para a rota:

```text
/release-orchestrator
```

## Resumo do Fluxo Completo

Um uso típico do Release Orchestrator acontece assim:

1. o administrador cadastra os produtos em `/release-orchestrator/produtos`;
2. opcionalmente cria templates em `/release-orchestrator/templates`;
3. o usuário cria uma release pelo Builder ou pelo formulário tradicional;
4. a release recebe status inicial de rascunho ou desenvolvimento;
5. itens são adicionados com categoria, descrição e referências técnicas;
6. a release é enviada para revisão;
7. a revisão valida pendências e alertas;
8. uma release válida pode ser aprovada;
9. uma release aprovada pode ser publicada;
10. após a publicação, o PDF pode ser gerado e distribuído;
11. todo o histórico permanece disponível para rastreabilidade.

## Benefícios

O Release Orchestrator entrega valor porque:

- padroniza o registro de versões;
- reduz comunicação informal e dispersa;
- melhora rastreabilidade de entregas;
- facilita auditoria de mudanças;
- separa informação técnica de comunicação operacional;
- permite revisão antes da publicação;
- mantém histórico de ações;
- gera material em PDF;
- organiza releases por produto, tipo, status e categoria.

## O que Este Módulo Não Faz

O Release Orchestrator não substitui ferramentas de versionamento, CI/CD ou gestão de tarefas.

Ele não é responsável por:

- fazer deploy;
- criar tags em repositórios;
- executar pipelines;
- aprovar pull requests;
- substituir Jira, GitHub, GitLab ou Azure DevOps;
- autenticar usuários;
- controlar permissões globais do portal.

Sua responsabilidade é documentar, organizar, revisar e comunicar releases dentro do portal.
