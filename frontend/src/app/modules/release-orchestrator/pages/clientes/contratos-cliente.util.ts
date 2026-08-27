export interface ContratoClienteRef {
  id: string;
  produtoId: string;
}

/** Diferença entre os produtos marcados no cadastro e os contratos já salvos. */
export function diffContratosCliente(
  marcados: Iterable<string>,
  originais: ContratoClienteRef[],
): { contratar: string[]; manter: ContratoClienteRef[]; rescindir: ContratoClienteRef[] } {
  const desejados = new Set([...marcados].filter(Boolean));
  const manter: ContratoClienteRef[] = [];
  const rescindir: ContratoClienteRef[] = [];
  const jaTem = new Set<string>();
  for (const c of originais) {
    if (desejados.has(c.produtoId)) {
      manter.push(c);
      jaTem.add(c.produtoId);
    } else {
      rescindir.push(c);
    }
  }
  const contratar = [...desejados].filter(id => !jaTem.has(id));
  return { contratar, manter, rescindir };
}

export function chaveModuloCliente(produtoId: string, moduloId: string): string {
  return `${produtoId}:${moduloId}`;
}

export function moduloIdDaChave(chave: string): string {
  const i = chave.indexOf(':');
  return i < 0 ? chave : chave.slice(i + 1);
}

export function produtoIdDaChave(chave: string): string {
  const i = chave.indexOf(':');
  return i < 0 ? '' : chave.slice(0, i);
}
