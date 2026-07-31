import { avaliarQualidadePagina } from './pagina-quality.util';

describe('avaliarQualidadePagina', () => {
  it('bloqueia revisão quando faltam contexto e conteúdo útil', () => {
    const itens = avaliarQualidadePagina({ titulo: 'Cadastro', codigoTela: 'CAD_01' });

    expect(itens.find(item => item.codigo === 'CONTEXTO')?.ok).toBe(false);
    expect(itens.find(item => item.codigo === 'CONTEUDO')?.ok).toBe(false);
  });

  it('detecta placeholders e imagens sem texto alternativo', () => {
    const itens = avaliarQualidadePagina({
      titulo: 'Cadastro',
      codigoTela: 'CAD_01',
      projetoId: 'p1',
      moduloId: 'm1',
      conteudoHtml: `<h2>Como utilizar</h2><p>Descreva o procedimento com detalhes suficientes para o usuário.</p><img src="tela.png">`,
    });

    expect(itens.find(item => item.codigo === 'PLACEHOLDERS')?.ok).toBe(false);
    expect(itens.find(item => item.codigo === 'IMAGENS_ALT')?.ok).toBe(false);
  });

  it('detecta imagens sem origem, links inseguros e salto na hierarquia de títulos', () => {
    const itens = avaliarQualidadePagina({
      titulo: 'Cadastro',
      codigoTela: 'CAD_01',
      projetoId: 'p1',
      moduloId: 'm1',
      conteudoHtml: `<h2>Cadastro</h2><h4>Detalhes</h4><p>${'Conteúdo útil '.repeat(10)}</p><img alt="Tela"><a href="javascript:alert(1)">Ajuda</a>`,
    });

    expect(itens.find(item => item.codigo === 'IMAGENS_ORIGEM')?.ok).toBe(false);
    expect(itens.find(item => item.codigo === 'LINKS')?.ok).toBe(false);
    expect(itens.find(item => item.codigo === 'TITULOS')?.ok).toBe(false);
  });

  it('avisa quando há placeholder de captura sem imagem', () => {
    const itens = avaliarQualidadePagina({
      titulo: 'Lista',
      codigoTela: 'LISTA-001',
      projetoId: 'p1',
      moduloId: 'm1',
      conteudoHtml:
        '<figure class="screen-frame"><div class="screen-placeholder"><p>Captura</p></div></figure>' +
        `<p>${'Conteúdo útil '.repeat(10)}</p>`,
    });

    expect(itens.find(item => item.codigo === 'CAPTURA')?.ok).toBe(false);
  });

  it('avisa quando há passo a passo sem resultado esperado', () => {
    const itens = avaliarQualidadePagina({
      titulo: 'Inclusão',
      codigoTela: 'INCLUIR-001',
      projetoId: 'p1',
      moduloId: 'm1',
      conteudoHtml: `<div class="steps"><h2>Passo a passo</h2><ol><li>Primeiro</li></ol></div><p>${'Conteúdo útil '.repeat(10)}</p>`,
    });

    expect(itens.find(item => item.codigo === 'RESULTADO')?.ok).toBe(false);
  });

  it('avisa quando ver também usa código genérico', () => {
    const itens = avaliarQualidadePagina({
      titulo: 'Operações',
      codigoTela: 'OPS-001',
      projetoId: 'p1',
      moduloId: 'm1',
      conteudoHtml: `<div class="related-links"><span data-codigo-tela="CODIGO-1">Guia</span></div><p>${'Conteúdo útil '.repeat(10)}</p>`,
    });

    expect(itens.find(item => item.codigo === 'VER_TAMBEM')?.ok).toBe(false);
  });

  it('avisa quando há passo a passo sem pré-requisitos', () => {
    const itens = avaliarQualidadePagina({
      titulo: 'Inclusão',
      codigoTela: 'INCLUIR-001',
      projetoId: 'p1',
      moduloId: 'm1',
      conteudoHtml: `<div class="steps"><h2>Passo a passo</h2><ol><li>Primeiro</li></ol></div><p>${'Conteúdo útil '.repeat(10)}</p>`,
    });

    expect(itens.find(item => item.codigo === 'PRE_REQS')?.ok).toBe(false);
  });

  it('não avalia INDICE_FILHOS quando contagens não são informadas', () => {
    const itens = avaliarQualidadePagina({
      titulo: 'Operações',
      codigoTela: 'OPS-001',
      projetoId: 'p1',
      moduloId: 'm1',
      conteudoHtml: `<section class="doc-section"><h2>Guias disponíveis</h2><div class="resource-list"><article class="resource-item">1</article></div></section><p>${'Conteúdo útil '.repeat(10)}</p>`,
    });

    expect(itens.find(item => item.codigo === 'INDICE_FILHOS')?.ok).toBe(true);
  });

  it('avisa quando índice de guias difere da quantidade de filhos', () => {
    const itens = avaliarQualidadePagina({
      titulo: 'Operações',
      codigoTela: 'OPS-001',
      projetoId: 'p1',
      moduloId: 'm1',
      filhosCount: 3,
      indiceItemCount: 2,
      conteudoHtml: `<section class="doc-section"><h2>Guias disponíveis</h2><div class="resource-list"><article class="resource-item">1</article><article class="resource-item">2</article></div></section><p>${'Conteúdo útil '.repeat(10)}</p>`,
    });

    expect(itens.find(item => item.codigo === 'INDICE_FILHOS')?.ok).toBe(false);
  });

  it('aprova INDICE_FILHOS quando contagens coincidem', () => {
    const itens = avaliarQualidadePagina({
      titulo: 'Operações',
      codigoTela: 'OPS-001',
      projetoId: 'p1',
      moduloId: 'm1',
      filhosCount: 2,
      indiceItemCount: 2,
      conteudoHtml: `<section class="doc-section"><h2>Guias disponíveis</h2><div class="resource-list"><article class="resource-item">1</article><article class="resource-item">2</article></div></section><p>${'Conteúdo útil '.repeat(10)}</p>`,
    });

    expect(itens.find(item => item.codigo === 'INDICE_FILHOS')?.ok).toBe(true);
  });
});
