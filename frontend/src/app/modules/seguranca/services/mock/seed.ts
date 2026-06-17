import { Dominio } from '../../models/dominio.model';
import { Funcionalidade } from '../../models/funcionalidade.model';
import { GrupoAcesso } from '../../models/grupo-acesso.model';
import { Permissao } from '../../models/permissao.model';
import { Usuario } from '../../models/usuario.model';
import { agora, novoId } from './in-memory-store';

/**
 * Dados de bootstrap usados na primeira inicialização do mock.
 * Cobre o "Permissões Iniciais" da spec: grupo ADMIN com tudo + um usuário
 * admin permanente.
 */

const NOW = agora();

const ADMIN_USER_ID = 'usuario-admin';
const ADMIN_GROUP_ID = 'grupo-admin';

const dominios: Dominio[] = [
  {
    id: 'dom-seguranca',
    nome: 'Segurança',
    codigo: 'SEGURANCA',
    descricao: 'Identidade, grupos, permissões e escopos.',
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'dom-sistema',
    nome: 'Sistema',
    codigo: 'SISTEMA',
    descricao: 'Configurações gerais.',
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'dom-doc-flow',
    nome: 'Doc Flow',
    codigo: 'DOC_FLOW',
    descricao: 'Manuais de cliente.',
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'dom-release-orchestrator',
    nome: 'Release Orchestrator',
    codigo: 'RELEASE_ORCHESTRATOR',
    descricao: 'Releases, entregas a clientes e orquestração de pacotes.',
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
];

const funcionalidades: Funcionalidade[] = [
  // SEGURANCA
  {
    id: 'func-usuario',
    dominioId: 'dom-seguranca',
    dominioCodigo: 'SEGURANCA',
    nome: 'Usuário',
    codigo: 'USUARIO',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'func-grupo-acesso',
    dominioId: 'dom-seguranca',
    dominioCodigo: 'SEGURANCA',
    nome: 'Grupo de acesso',
    codigo: 'GRUPO_ACESSO',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'func-dominio',
    dominioId: 'dom-seguranca',
    dominioCodigo: 'SEGURANCA',
    nome: 'Domínio',
    codigo: 'DOMINIO',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'func-funcionalidade',
    dominioId: 'dom-seguranca',
    dominioCodigo: 'SEGURANCA',
    nome: 'Funcionalidade',
    codigo: 'FUNCIONALIDADE',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'func-permissao',
    dominioId: 'dom-seguranca',
    dominioCodigo: 'SEGURANCA',
    nome: 'Permissão',
    codigo: 'PERMISSAO',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'func-escopo',
    dominioId: 'dom-seguranca',
    dominioCodigo: 'SEGURANCA',
    nome: 'Escopo de acesso',
    codigo: 'ESCOPO',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'func-auditoria',
    dominioId: 'dom-seguranca',
    dominioCodigo: 'SEGURANCA',
    nome: 'Auditoria',
    codigo: 'AUDITORIA',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'func-historico-login',
    dominioId: 'dom-seguranca',
    dominioCodigo: 'SEGURANCA',
    nome: 'Histórico de login',
    codigo: 'HISTORICO_LOGIN',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'func-politica-senha',
    dominioId: 'dom-seguranca',
    dominioCodigo: 'SEGURANCA',
    nome: 'Política de senha',
    codigo: 'POLITICA_SENHA',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'func-sessao',
    dominioId: 'dom-seguranca',
    dominioCodigo: 'SEGURANCA',
    nome: 'Sessão de usuário',
    codigo: 'SESSAO',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'func-acesso-temporario',
    dominioId: 'dom-seguranca',
    dominioCodigo: 'SEGURANCA',
    nome: 'Acesso temporário',
    codigo: 'ACESSO_TEMPORARIO',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },

  // SISTEMA
  {
    id: 'func-configuracao',
    dominioId: 'dom-sistema',
    dominioCodigo: 'SISTEMA',
    nome: 'Configuração',
    codigo: 'CONFIGURACAO',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },

  // DOC_FLOW
  {
    id: 'func-cliente',
    dominioId: 'dom-doc-flow',
    dominioCodigo: 'DOC_FLOW',
    nome: 'Cliente',
    codigo: 'CLIENTE',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'func-projeto',
    dominioId: 'dom-doc-flow',
    dominioCodigo: 'DOC_FLOW',
    nome: 'Projeto',
    codigo: 'PROJETO',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'func-modulo',
    dominioId: 'dom-doc-flow',
    dominioCodigo: 'DOC_FLOW',
    nome: 'Módulo',
    codigo: 'MODULO',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'func-pagina',
    dominioId: 'dom-doc-flow',
    dominioCodigo: 'DOC_FLOW',
    nome: 'Página',
    codigo: 'PAGINA',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'func-publicacao',
    dominioId: 'dom-doc-flow',
    dominioCodigo: 'DOC_FLOW',
    nome: 'Publicação',
    codigo: 'PUBLICACAO',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },

  // RELEASE_ORCHESTRATOR
  {
    id: 'func-release',
    dominioId: 'dom-release-orchestrator',
    dominioCodigo: 'RELEASE_ORCHESTRATOR',
    nome: 'Release',
    codigo: 'RELEASE',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'func-template',
    dominioId: 'dom-release-orchestrator',
    dominioCodigo: 'RELEASE_ORCHESTRATOR',
    nome: 'Template',
    codigo: 'TEMPLATE',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: 'func-produto',
    dominioId: 'dom-release-orchestrator',
    dominioCodigo: 'RELEASE_ORCHESTRATOR',
    nome: 'Produto',
    codigo: 'PRODUTO',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
];

const ACOES_CRUD = ['LER', 'CRIAR', 'EDITAR', 'EXCLUIR'] as const;

const permissoes: Permissao[] = funcionalidades.flatMap(func =>
  ACOES_CRUD.map(acao => ({
    id: novoId(),
    funcionalidadeId: func.id,
    funcionalidadeCodigo: func.codigo,
    dominioCodigo: func.dominioCodigo,
    acao,
    codigo: `${func.codigo}:${acao}`,
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  })),
);

// Ações especiais (vínculo, etc.) – extras além do CRUD
permissoes.push(
  {
    id: novoId(),
    funcionalidadeId: 'func-grupo-acesso',
    funcionalidadeCodigo: 'GRUPO_ACESSO',
    dominioCodigo: 'SEGURANCA',
    acao: 'VINCULAR_PERMISSAO',
    codigo: 'GRUPO_ACESSO:VINCULAR_PERMISSAO',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: novoId(),
    funcionalidadeId: 'func-historico-login',
    funcionalidadeCodigo: 'HISTORICO_LOGIN',
    dominioCodigo: 'SEGURANCA',
    acao: 'VISUALIZAR',
    codigo: 'HISTORICO_LOGIN:VISUALIZAR',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: novoId(),
    funcionalidadeId: 'func-auditoria',
    funcionalidadeCodigo: 'AUDITORIA',
    dominioCodigo: 'SEGURANCA',
    acao: 'VISUALIZAR',
    codigo: 'AUDITORIA:VISUALIZAR',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: novoId(),
    funcionalidadeId: 'func-sessao',
    funcionalidadeCodigo: 'SESSAO',
    dominioCodigo: 'SEGURANCA',
    acao: 'REVOGAR',
    codigo: 'SESSAO:REVOGAR',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: novoId(),
    funcionalidadeId: 'func-acesso-temporario',
    funcionalidadeCodigo: 'ACESSO_TEMPORARIO',
    dominioCodigo: 'SEGURANCA',
    acao: 'REVOGAR',
    codigo: 'ACESSO_TEMPORARIO:REVOGAR',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: novoId(),
    funcionalidadeId: 'func-usuario',
    funcionalidadeCodigo: 'USUARIO',
    dominioCodigo: 'SEGURANCA',
    acao: 'RESETAR_SENHA',
    codigo: 'USUARIO:RESETAR_SENHA',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
  {
    id: novoId(),
    funcionalidadeId: 'func-usuario',
    funcionalidadeCodigo: 'USUARIO',
    dominioCodigo: 'SEGURANCA',
    acao: 'BLOQUEAR',
    codigo: 'USUARIO:BLOQUEAR',
    descricao: null,
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
  },
);

const gruposAcesso: GrupoAcesso[] = [
  {
    id: ADMIN_GROUP_ID,
    nome: 'Administradores',
    codigo: 'ADMIN',
    descricao: 'Grupo com todas as permissões.',
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
    permissaoIds: permissoes.map(p => p.id),
  },
  {
    id: 'grupo-leitor',
    nome: 'Leitores',
    codigo: 'LEITOR',
    descricao: 'Apenas leitura.',
    ativo: true,
    criadoEm: NOW,
    atualizadoEm: null,
    permissaoIds: permissoes.filter(p => p.acao === 'LER').map(p => p.id),
  },
];

const usuarios: Usuario[] = [
  {
    id: ADMIN_USER_ID,
    nome: 'Administrador',
    email: 'admin@softon.dev',
    login: 'admin',
    ativo: true,
    bloqueado: false,
    tentativasInvalidas: 0,
    trocarSenhaProximoLogin: false,
    ultimoLogin: null,
    criadoEm: NOW,
    atualizadoEm: null,
    grupoIds: [ADMIN_GROUP_ID],
  },
];

/** Senhas no mock (não persiste em memória depois — só pra simular login). */
const senhasMock: Record<string, string> = {
  [ADMIN_USER_ID]: 'admin',
};

/**
 * Política de senha inicial — permissiva para não quebrar o seed admin/admin.
 * O administrador pode endurecer pela tela /seguranca/politica-senha.
 */
import { PoliticaSenha } from '../../models/politica-senha.model';

const politicaSenha: PoliticaSenha = {
  id: 'politica-padrao',
  tamanhoMinimo: 4,
  exigirMaiuscula: false,
  exigirMinuscula: false,
  exigirNumero: false,
  exigirEspecial: false,
  expiraSenhaDias: null,
  quantidadeHistorico: 3,
  maxTentativasInvalidas: 5,
  ativo: true,
  criadoEm: NOW,
  atualizadoEm: null,
};

export const SEED = {
  ADMIN_USER_ID,
  ADMIN_GROUP_ID,
  usuarios,
  gruposAcesso,
  dominios,
  funcionalidades,
  permissoes,
  senhas: senhasMock,
  politicaSenha,
};
