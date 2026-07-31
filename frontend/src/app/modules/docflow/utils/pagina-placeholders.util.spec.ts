import { aplicarPlaceholdersConteudo } from './pagina-placeholders.util';

describe('aplicarPlaceholdersConteudo', () => {
  const ctx = {
    titulo: 'Lista de registros',
    codigoTela: 'LISTA-001',
    moduloNome: 'Cadastros',
    projetoNome: 'Portal',
    clienteNome: 'Organização',
    dataAtual: '31/07/2026',
  };

  it('substitui chaves pontuadas com escape HTML', () => {
    const html = '<h2>{{pagina.titulo}}</h2><p>{{modulo.nome}} · {{projeto.nome}}</p>';
    expect(aplicarPlaceholdersConteudo(html, ctx)).toBe(
      '<h2>Lista de registros</h2><p>Cadastros · Portal</p>',
    );
  });

  it('substitui aliases TITULO, CODIGO_TELA, MODULO, PROJETO e CLIENTE', () => {
    const html = '{{TITULO}} · {{CODIGO_TELA}} · {{MODULO}} · {{PROJETO}} · {{CLIENTE}}';
    expect(aplicarPlaceholdersConteudo(html, ctx)).toBe(
      'Lista de registros · LISTA-001 · Cadastros · Portal · Organização',
    );
  });

  it('mantém tokens desconhecidos e vazios', () => {
    const html = '{{desconhecido}} {{pagina.titulo}} {{TITULO}}';
    expect(aplicarPlaceholdersConteudo(html, { titulo: '' })).toBe('{{desconhecido}} {{pagina.titulo}} {{TITULO}}');
  });

  it('escapa caracteres HTML no valor substituído', () => {
    expect(aplicarPlaceholdersConteudo('{{TITULO}}', { titulo: '<script>alert(1)</script>' })).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  it('resolve data.atual quando presente', () => {
    expect(aplicarPlaceholdersConteudo('{{data.atual}}', { dataAtual: '31/07/2026' })).toBe('31/07/2026');
  });
});
