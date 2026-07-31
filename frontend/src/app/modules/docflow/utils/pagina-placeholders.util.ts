export interface ContextoPlaceholdersPagina {
  titulo?: string | null;
  codigoTela?: string | null;
  moduloNome?: string | null;
  projetoNome?: string | null;
  clienteNome?: string | null;
  dataAtual?: string | null;
}

const ALIAS_MAP: Record<string, keyof ContextoPlaceholdersPagina> = {
  TITULO: 'titulo',
  CODIGO_TELA: 'codigoTela',
  MODULO: 'moduloNome',
  PROJETO: 'projetoNome',
  CLIENTE: 'clienteNome',
};

const CHAVE_MAP: Record<string, keyof ContextoPlaceholdersPagina> = {
  'pagina.titulo': 'titulo',
  'pagina.codigo': 'codigoTela',
  'modulo.nome': 'moduloNome',
  'projeto.nome': 'projetoNome',
  'cliente.nome': 'clienteNome',
  'data.atual': 'dataAtual',
};

export function aplicarPlaceholdersConteudo(html: string, ctx: ContextoPlaceholdersPagina): string {
  return html.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (token, chave: string) => {
    const campo = CHAVE_MAP[chave] ?? ALIAS_MAP[chave];
    if (!campo) return token;
    const valor = ctx[campo]?.trim();
    return valor ? escapeHtml(valor) : token;
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
