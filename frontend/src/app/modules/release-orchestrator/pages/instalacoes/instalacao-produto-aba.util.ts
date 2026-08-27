/** Código da instalação irmã: BMW + CR → BMW-CR. */
export function codigoInstalacaoProduto(codigoBase: string, sigla: string): string {
  const base = (codigoBase ?? '').trim().toUpperCase();
  const s = (sigla ?? '').trim().toUpperCase();
  if (!s) {
    return base.slice(0, 40);
  }
  if (!base) {
    return s.slice(0, 40);
  }
  if (base === s || base.endsWith(`-${s}`)) {
    return base.slice(0, 40);
  }
  return `${base}-${s}`.slice(0, 40);
}

/** Nome da instalação irmã: "BMW - V5" + CR → "BMW - V5 — CR". */
export function nomeInstalacaoProduto(nomeBase: string, sigla: string): string {
  const nome = (nomeBase ?? '').trim();
  const s = (sigla ?? '').trim().toUpperCase();
  if (!s) {
    return nome;
  }
  if (!nome) {
    return s;
  }
  const sufixo = ` — ${s}`;
  if (nome.toUpperCase().endsWith(sufixo.toUpperCase()) || nome.toUpperCase() === s) {
    return nome;
  }
  return `${nome}${sufixo}`;
}

export function rotuloAbaProduto(sigla: string, nome: string): string {
  const s = (sigla ?? '').trim();
  const n = (nome ?? '').trim();
  if (s && n && n.toUpperCase() !== s.toUpperCase()) {
    return `${s} — ${n}`;
  }
  return s || n || 'Produto';
}

/** Checkbox da implantação: criar instalação irmã ou atualizar a versão já cadastrada. */
export function rotuloAcaoProdutoAba(temInstalacao: boolean): string {
  return temInstalacao ? 'Atualizar versão' : 'Criar neste host';
}

export function toggleProdutoHabilitado(
  atual: ReadonlySet<string>,
  produtoId: string,
  marcado: boolean,
): Set<string> {
  const next = new Set(atual);
  if (!produtoId) {
    return next;
  }
  if (marcado) {
    next.add(produtoId);
  } else {
    next.delete(produtoId);
  }
  return next;
}

/** Aba que deve ficar visível depois de marcar/desmarcar o produto. */
export function abaAposToggleProduto(
  habilitados: ReadonlySet<string>,
  produtoId: string,
  marcado: boolean,
  abaAtual: string,
  fallbackId: string,
): string {
  if (marcado) {
    return produtoId;
  }
  if (abaAtual && abaAtual !== produtoId && habilitados.has(abaAtual)) {
    return abaAtual;
  }
  if (fallbackId && habilitados.has(fallbackId)) {
    return fallbackId;
  }
  return [...habilitados][0] ?? '';
}

export function chaveSiteInstalacao(item: {
  clienteId: string;
  hostId: string;
  ambiente: string;
}): string {
  return `${item.clienteId}|${item.hostId}|${item.ambiente}`;
}

export interface GrupoInstalacaoSite<T> {
  chave: string;
  clienteId: string;
  clienteSigla: string;
  hostId: string;
  hostCodigo: string;
  ambiente: string;
  tipoImplantacao: string;
  codigo: string;
  nome: string;
  produtos: T[];
}

function stripSufixoProduto<T extends { produtoSigla?: string; nome: string; codigo: string }>(
  valor: string,
  itens: T[],
  separador: string,
): string {
  let atual = (valor ?? '').trim();
  for (const item of itens) {
    const s = (item.produtoSigla ?? '').trim().toUpperCase();
    if (!s) continue;
    const sufixo = `${separador}${s}`;
    if (atual.toUpperCase().endsWith(sufixo.toUpperCase())) {
      atual = atual.slice(0, -sufixo.length).trim();
    }
  }
  return atual;
}

/** Nome do site sem o sufixo ` — SIGLA` das fichas irmãs. */
export function nomeSiteInstalacao<T extends { produtoSigla?: string; nome: string; codigo: string }>(
  itens: T[],
): string {
  if (itens.length === 0) return '';
  if (itens.length === 1) return itens[0].nome;
  const nomes = itens
    .map(i => stripSufixoProduto(i.nome, itens, ' — '))
    .filter(Boolean)
    .sort((a, b) => a.length - b.length || a.localeCompare(b));
  return nomes[0] ?? itens[0].nome;
}

export function codigoSiteInstalacao<T extends { produtoSigla?: string; nome: string; codigo: string }>(
  itens: T[],
): string {
  if (itens.length === 0) return '';
  if (itens.length === 1) return itens[0].codigo;
  const codigos = itens
    .map(i => stripSufixoProduto(i.codigo, itens, '-'))
    .filter(Boolean)
    .sort((a, b) => a.length - b.length || a.localeCompare(b));
  return (codigos[0] ?? itens[0].codigo).slice(0, 40);
}

export function agruparInstalacoesPorSite<
  T extends {
    id: string;
    clienteId: string;
    clienteSigla: string;
    hostId: string;
    hostCodigo: string;
    ambiente: string;
    tipoImplantacao: string;
    produtoSigla: string;
    nome: string;
    codigo: string;
  },
>(itens: T[]): GrupoInstalacaoSite<T>[] {
  const ordem = new Map<string, T[]>();
  for (const item of itens) {
    const chave = chaveSiteInstalacao(item);
    const grupo = ordem.get(chave);
    if (grupo) {
      grupo.push(item);
    } else {
      ordem.set(chave, [item]);
    }
  }
  return [...ordem.values()].map(produtos => {
    const ordenados = [...produtos].sort((a, b) =>
      (a.produtoSigla ?? '').localeCompare(b.produtoSigla ?? '', undefined, { sensitivity: 'base' }),
    );
    const p0 = ordenados[0];
    return {
      chave: chaveSiteInstalacao(p0),
      clienteId: p0.clienteId,
      clienteSigla: p0.clienteSigla,
      hostId: p0.hostId,
      hostCodigo: p0.hostCodigo,
      ambiente: p0.ambiente,
      tipoImplantacao: p0.tipoImplantacao,
      codigo: codigoSiteInstalacao(ordenados),
      nome: nomeSiteInstalacao(ordenados),
      produtos: ordenados,
    };
  });
}
