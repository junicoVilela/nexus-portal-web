import { FilterPreset, listarPresets, removerPreset, renomearPreset, salvarPreset } from './filter-presets';

const ESCOPO = 'unit-test-scope';

describe('filter-presets', () => {
  beforeEach(() => localStorage.clear());
  afterAll(() => localStorage.clear());

  it('listarPresets retorna [] quando vazio', () => {
    expect(listarPresets(ESCOPO)).toEqual([]);
  });

  it('salvarPreset persiste e retorna preset com id + criadoEm', () => {
    const preset = salvarPreset(ESCOPO, 'Meu filtro', { status: 'ATIVO' });
    expect(preset.id).toBeTruthy();
    expect(preset.criadoEm).toBeGreaterThan(0);
    expect(listarPresets<{ status: string }>(ESCOPO)[0].nome).toBe('Meu filtro');
  });

  it('salvarPreset insere o mais novo no topo', () => {
    salvarPreset(ESCOPO, 'A', {});
    salvarPreset(ESCOPO, 'B', {});
    expect(listarPresets(ESCOPO).map(p => p.nome)).toEqual(['B', 'A']);
  });

  it('removerPreset remove pelo id', () => {
    const p = salvarPreset(ESCOPO, 'X', {});
    salvarPreset(ESCOPO, 'Y', {});
    removerPreset(ESCOPO, p.id);
    expect(listarPresets(ESCOPO).map(p2 => p2.nome)).toEqual(['Y']);
  });

  it('renomearPreset atualiza apenas o nome', () => {
    const p = salvarPreset(ESCOPO, 'Antigo', {});
    renomearPreset(ESCOPO, p.id, 'Novo');
    const lista = listarPresets(ESCOPO);
    expect(lista[0].nome).toBe('Novo');
    expect(lista[0].id).toBe(p.id);
  });

  it('JSON malformado é tratado como vazio', () => {
    localStorage.setItem('filter-presets:' + ESCOPO, '{nao valido');
    expect(listarPresets(ESCOPO)).toEqual([]);
  });

  it('persistência sobrevive entre listagens', () => {
    salvarPreset(ESCOPO, 'Persistente', { x: 1 });
    const restored = listarPresets<{ x: number }>(ESCOPO);
    expect(restored[0].filtros.x).toBe(1);
  });

  it('formato dos itens segue FilterPreset', () => {
    const p = salvarPreset(ESCOPO, 'Z', { a: 'b' });
    const lista: FilterPreset<{ a: string }>[] = listarPresets(ESCOPO);
    expect(lista[0]).toEqual(jasmine.objectContaining({ id: p.id, nome: 'Z' }));
  });
});
