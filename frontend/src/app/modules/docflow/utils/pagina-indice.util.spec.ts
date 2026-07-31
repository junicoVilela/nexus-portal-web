import { Pagina } from '../models/pagina.model';
import {
  contarItensIndiceGuias,
  montarSecaoGuiasDisponiveis,
  substituirOuAdicionarSecaoGuias,
} from './pagina-indice.util';

describe('pagina-indice.util', () => {
  const filho = (overrides: Partial<Pagina> = {}): Pagina => ({
    id: overrides.id ?? 'f1',
    version: 1,
    titulo: overrides.titulo ?? 'Filho',
    slug: 'filho',
    codigoTela: overrides.codigoTela ?? 'FILHO-001',
    resumo: overrides.resumo ?? 'Resumo',
    status: 'RASCUNHO',
    ordem: overrides.ordem ?? 1,
    ativo: true,
    moduloId: 'm1',
    moduloNome: 'Módulo',
    projetoId: 'p1',
    projetoNome: 'Projeto',
    parentId: overrides.parentId,
    ...overrides,
  });

  it('monta e substitui seção Guias disponíveis', () => {
    const secao = montarSecaoGuiasDisponiveis([filho({ titulo: 'Lista' })]);
    expect(secao).toContain('Guias disponíveis');
    expect(secao).toContain('Lista');

    const html = '<section><h2>Introdução</h2><p>Texto</p></section>';
    const atualizado = substituirOuAdicionarSecaoGuias(html, secao);
    expect(contarItensIndiceGuias(atualizado)).toBe(1);
    expect(atualizado).toContain('Introdução');
  });
});
