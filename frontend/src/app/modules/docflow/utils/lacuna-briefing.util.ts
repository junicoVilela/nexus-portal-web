/** Limite do briefing levado pela URL até o assistente. */
const MAX_TERMO = 120;

/**
 * Briefing inicial do assistente a partir de uma busca sem resultado no manual (lacuna, INT-606).
 * O redator completa com a tela e o passo a passo antes de gerar.
 */
export function briefingDaLacuna(termo: string, ocorrencias: number): string {
  const texto = termo.trim().slice(0, MAX_TERMO);
  const vezes = ocorrencias === 1 ? '1 vez' : `${ocorrencias} vezes`;
  return [
    `Leitores do manual buscaram "${texto}" ${vezes} nos últimos 30 dias e não encontraram nada.`,
    '',
    `Crie uma página que responda a essa busca: o que é "${texto}", em qual tela do sistema fica e o passo a passo.`,
    'Use as palavras que o leitor usou no título ou no resumo, para a busca encontrar a página.',
  ].join('\n');
}
