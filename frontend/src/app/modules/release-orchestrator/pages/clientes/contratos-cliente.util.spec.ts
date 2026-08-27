import {
  chaveModuloCliente,
  diffContratosCliente,
  moduloIdDaChave,
  produtoIdDaChave,
} from './contratos-cliente.util';

describe('diffContratosCliente', () => {
  it('contrata os novos, mantém os marcados e rescinde os desmarcados', () => {
    const r = diffContratosCliente(['p1', 'p3'], [
      { id: 'c1', produtoId: 'p1' },
      { id: 'c2', produtoId: 'p2' },
    ]);
    expect(r.contratar).toEqual(['p3']);
    expect(r.manter.map(c => c.produtoId)).toEqual(['p1']);
    expect(r.rescindir.map(c => c.produtoId)).toEqual(['p2']);
  });

  it('não contrata de novo o que já existe', () => {
    const r = diffContratosCliente(['p1'], [{ id: 'c1', produtoId: 'p1' }]);
    expect(r.contratar).toEqual([]);
    expect(r.manter.length).toBe(1);
    expect(r.rescindir).toEqual([]);
  });
});

describe('chaveModuloCliente', () => {
  it('compõe e decompõe produto:modulo', () => {
    const chave = chaveModuloCliente('prod', 'mod');
    expect(chave).toBe('prod:mod');
    expect(produtoIdDaChave(chave)).toBe('prod');
    expect(moduloIdDaChave(chave)).toBe('mod');
  });
});
