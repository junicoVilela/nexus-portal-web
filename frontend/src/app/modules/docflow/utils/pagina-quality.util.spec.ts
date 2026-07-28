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
});
