import { AiMetricasPrompt } from '../models/ai-metricas.model';
import { rotuloCategoriaRejeicao } from '../models/ai-proposta.model';

/** Abaixo disso a diferença entre versões ainda é ruído (decididas = aceitas + rejeitadas + regeneradas). */
export const MIN_DECISOES_COMPARACAO = 10;

/** Versão atual de um prompt contra a anterior, no mesmo período do painel. */
export interface ComparacaoPrompt {
  /** Nome antes do `@` (ex.: `gerar-page-spec`). */
  familia: string;
  atual: AiMetricasPrompt;
  anterior: AiMetricasPrompt | null;
  /** Diferença de aceite em pontos percentuais (0–1); nula sem as duas taxas. */
  deltaAceite: number | null;
  deltaTextoMantido: number | null;
  /** Rótulo da categoria mais citada nas rejeições da versão atual. */
  principalRejeicao: string | null;
  amostraPequena: boolean;
}

/**
 * Agrupa `porPrompt` por família (`nome@versao`) e compara as duas versões mais novas. Propostas
 * anteriores ao versionamento (sem `@`) ficam de fora.
 */
export function compararVersoesPrompt(porPrompt: readonly AiMetricasPrompt[]): ComparacaoPrompt[] {
  const familias = new Map<string, AiMetricasPrompt[]>();
  for (const p of porPrompt) {
    const [familia, versao] = p.promptVersao.split('@');
    if (!versao) continue;
    familias.set(familia, [...(familias.get(familia) ?? []), p]);
  }
  return [...familias.entries()]
    .map(([familia, versoes]) => {
      const [atual, anterior = null] = [...versoes].sort((a, b) => compararVersao(b, a));
      return {
        familia,
        atual,
        anterior,
        deltaAceite: diferenca(atual.taxaAceite, anterior?.taxaAceite),
        deltaTextoMantido: diferenca(atual.textoMantido, anterior?.textoMantido),
        principalRejeicao: principalCategoria(atual),
        amostraPequena: decididas(atual) < MIN_DECISOES_COMPARACAO,
      };
    })
    .sort((a, b) => a.familia.localeCompare(b.familia));
}

/** `2.10` > `2.9`: compara cada parte numérica. */
function compararVersao(a: AiMetricasPrompt, b: AiMetricasPrompt): number {
  const pa = partes(a.promptVersao);
  const pb = partes(b.promptVersao);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

function partes(promptVersao: string): number[] {
  return (promptVersao.split('@')[1] ?? '').split('.').map(n => Number.parseInt(n, 10) || 0);
}

function diferenca(atual: number | null, anterior: number | null | undefined): number | null {
  return atual === null || anterior === null || anterior === undefined ? null : atual - anterior;
}

function decididas(p: AiMetricasPrompt): number {
  return p.aceitas + p.rejeitadas + p.regeneradas;
}

function principalCategoria(p: AiMetricasPrompt): string | null {
  const [maior] = Object.entries(p.rejeicoesPorCategoria ?? {})
    .filter((par): par is [string, number] => (par[1] ?? 0) > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return maior ? rotuloCategoriaRejeicao(maior[0]) : null;
}
