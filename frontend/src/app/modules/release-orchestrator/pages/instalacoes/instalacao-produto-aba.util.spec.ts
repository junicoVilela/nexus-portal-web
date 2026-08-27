import {
  abaAposToggleProduto,
  agruparInstalacoesPorSite,
  codigoInstalacaoProduto,
  nomeInstalacaoProduto,
  rotuloAbaProduto,
  rotuloAcaoProdutoAba,
  toggleProdutoHabilitado,
} from './instalacao-produto-aba.util';

describe('codigoInstalacaoProduto', () => {
  it('sufixa a sigla no código base', () => {
    expect(codigoInstalacaoProduto('BMW', 'CR')).toBe('BMW-CR');
  });

  it('não duplica a sigla já presente', () => {
    expect(codigoInstalacaoProduto('BMW-CR', 'CR')).toBe('BMW-CR');
    expect(codigoInstalacaoProduto('CR', 'CR')).toBe('CR');
  });
});

describe('nomeInstalacaoProduto', () => {
  it('acrescenta a sigla ao nome', () => {
    expect(nomeInstalacaoProduto('BMW - V5', 'CR')).toBe('BMW - V5 — CR');
  });
});

describe('rotuloAbaProduto', () => {
  it('mostra sigla e nome', () => {
    expect(rotuloAbaProduto('LD', 'Softon V5')).toBe('LD — Softon V5');
    expect(rotuloAbaProduto('CR', 'CR')).toBe('CR');
  });
});

describe('rotuloAcaoProdutoAba', () => {
  it('distingue criar e atualizar', () => {
    expect(rotuloAcaoProdutoAba(false)).toBe('Criar neste host');
    expect(rotuloAcaoProdutoAba(true)).toBe('Atualizar versão');
  });
});

describe('toggleProdutoHabilitado', () => {
  it('marca e desmarca sem mutar o set original', () => {
    const atual = new Set(['ld']);
    const ligado = toggleProdutoHabilitado(atual, 'cr', true);
    expect([...ligado].sort()).toEqual(['cr', 'ld']);
    expect(atual.has('cr')).toBeFalse();
    expect([...toggleProdutoHabilitado(ligado, 'cr', false)]).toEqual(['ld']);
  });
});

describe('abaAposToggleProduto', () => {
  it('ao marcar, seleciona o produto clicado', () => {
    expect(abaAposToggleProduto(new Set(['ld', 'cr']), 'cr', true, 'ld', 'ld')).toBe('cr');
  });

  it('ao desmarcar a aba ativa, cai no produto da ficha', () => {
    expect(abaAposToggleProduto(new Set(['ld']), 'cr', false, 'cr', 'ld')).toBe('ld');
  });
});

describe('agruparInstalacoesPorSite', () => {
  const ld = {
    id: '1',
    codigo: 'BMW',
    nome: 'BMW - V5',
    clienteId: 'c1',
    clienteSigla: 'BMW',
    hostId: 'h1',
    hostCodigo: 'LOCAL',
    ambiente: 'HOM',
    tipoImplantacao: 'LINUX_MANUAL',
    produtoSigla: 'LD',
  };
  const cr = {
    ...ld,
    id: '2',
    codigo: 'BMW-CR',
    nome: 'BMW - V5 — CR',
    produtoSigla: 'CR',
  };

  it('agrupa irmãs do mesmo cliente+host+ambiente', () => {
    const grupos = agruparInstalacoesPorSite([ld, cr]);
    expect(grupos).toHaveSize(1);
    expect(grupos[0].codigo).toBe('BMW');
    expect(grupos[0].nome).toBe('BMW - V5');
    expect(grupos[0].produtos.map(p => p.produtoSigla)).toEqual(['CR', 'LD']);
  });

  it('mantém sites distintos separados', () => {
    const outro = { ...ld, id: '3', hostId: 'h2', hostCodigo: 'SRV2', codigo: 'BMW-2', nome: 'BMW 2' };
    const grupos = agruparInstalacoesPorSite([ld, outro]);
    expect(grupos).toHaveSize(2);
  });
});
