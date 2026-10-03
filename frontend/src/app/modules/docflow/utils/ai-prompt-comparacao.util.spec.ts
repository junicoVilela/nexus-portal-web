import { AiMetricasPrompt } from '../models/ai-metricas.model';
import { compararVersoesPrompt } from './ai-prompt-comparacao.util';

function prompt(promptVersao: string, parcial: Partial<AiMetricasPrompt> = {}): AiMetricasPrompt {
  return {
    promptVersao,
    propostas: 0,
    aceitas: 0,
    rejeitadas: 0,
    regeneradas: 0,
    pendentes: 0,
    comAvisos: 0,
    taxaAceite: null,
    textoMantido: null,
    amostrasTextoMantido: 0,
    rejeicoesPorCategoria: {},
    ...parcial,
  };
}

describe('compararVersoesPrompt', () => {
  it('compara a versão mais nova com a anterior (2.10 é mais nova que 2.9)', () => {
    const [comparacao] = compararVersoesPrompt([
      prompt('gerar-page-spec@2.9', { taxaAceite: 0.5, textoMantido: 0.7 }),
      prompt('gerar-page-spec@2.10', {
        aceitas: 9,
        rejeitadas: 3,
        taxaAceite: 0.75,
        textoMantido: 0.6,
        rejeicoesPorCategoria: { LINGUAGEM: 1, FALTOU_INFORMACAO: 2 },
      }),
    ]);

    expect(comparacao.atual.promptVersao).toBe('gerar-page-spec@2.10');
    expect(comparacao.anterior?.promptVersao).toBe('gerar-page-spec@2.9');
    expect(comparacao.deltaAceite).toBeCloseTo(0.25);
    expect(comparacao.deltaTextoMantido).toBeCloseTo(-0.1);
    expect(comparacao.principalRejeicao).toBe('Faltou informação');
    expect(comparacao.amostraPequena).toBeFalse();
  });

  it('versão única não tem delta e amostra pequena é sinalizada', () => {
    const [comparacao] = compararVersoesPrompt([prompt('ajustar-pagina@1.1', { aceitas: 2, taxaAceite: 1 })]);
    expect(comparacao.anterior).toBeNull();
    expect(comparacao.deltaAceite).toBeNull();
    expect(comparacao.amostraPequena).toBeTrue();
  });

  it('ignora propostas sem versão e separa as famílias', () => {
    const familias = compararVersoesPrompt([
      prompt('sem versão (antes do V40)'),
      prompt('gerar-page-spec@2.2'),
      prompt('ajustar-pagina@1.1'),
    ]).map(c => c.familia);
    expect(familias).toEqual(['ajustar-pagina', 'gerar-page-spec']);
  });
});
