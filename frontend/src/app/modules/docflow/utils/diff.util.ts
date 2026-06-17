export interface DiffToken {
  tipo: '+' | '-' | ' ';
  texto: string;
}

export interface DiffLinha {
  tipo: '+' | '-' | ' ';
  tokens: DiffToken[];
}

let diffLib: typeof import('diff') | null = null;

async function loadDiff(): Promise<typeof import('diff')> {
  if (!diffLib) diffLib = await import('diff');
  return diffLib;
}

/** Diff palavra-a-palavra entre dois textos curtos (título, resumo). */
export async function diffPalavras(antigo: string, novo: string): Promise<DiffToken[]> {
  const { diffWordsWithSpace } = await loadDiff();
  return diffWordsWithSpace(antigo, novo).map(part => ({
    tipo: part.added ? '+' : part.removed ? '-' : ' ',
    texto: part.value,
  }));
}

/**
 * Diff linha-a-linha; cada linha alterada vira um par "-/+" com tokens word-level.
 * Adequado para conteúdo multi-linha (corpo de página).
 */
export async function diffLinhasPalavras(antigo: string, novo: string): Promise<DiffLinha[]> {
  const { diffLines, diffWordsWithSpace } = await loadDiff();
  const partes = diffLines(antigo, novo);
  const resultado: DiffLinha[] = [];

  for (let i = 0; i < partes.length; i++) {
    const parte = partes[i];
    const proxima = partes[i + 1];

    if (parte.removed && proxima?.added) {
      const tokensRem = diffWordsWithSpace(parte.value, proxima.value).filter(t => !t.added);
      const tokensAdd = diffWordsWithSpace(parte.value, proxima.value).filter(t => !t.removed);
      resultado.push({
        tipo: '-',
        tokens: tokensRem.map(t => ({ tipo: t.removed ? '-' : ' ', texto: t.value })),
      });
      resultado.push({
        tipo: '+',
        tokens: tokensAdd.map(t => ({ tipo: t.added ? '+' : ' ', texto: t.value })),
      });
      i++;
    } else if (parte.added) {
      resultado.push({ tipo: '+', tokens: [{ tipo: '+', texto: parte.value }] });
    } else if (parte.removed) {
      resultado.push({ tipo: '-', tokens: [{ tipo: '-', texto: parte.value }] });
    } else {
      resultado.push({ tipo: ' ', tokens: [{ tipo: ' ', texto: parte.value }] });
    }
  }

  return resultado;
}
