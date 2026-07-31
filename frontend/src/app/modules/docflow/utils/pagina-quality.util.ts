import { PaginaQualidadeItem } from '../models/pagina.model';

export interface PaginaQualityInput {
  titulo?: string | null;
  codigoTela?: string | null;
  projetoId?: string | null;
  moduloId?: string | null;
  resumo?: string | null;
  conteudoHtml?: string | null;
}

export function avaliarQualidadePagina(raw: PaginaQualityInput): PaginaQualidadeItem[] {
  const document = new DOMParser().parseFromString(raw.conteudoHtml || '', 'text/html');
  document
    .querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, td, th, br')
    .forEach(element => element.append(' '));
  const texto = document.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const placeholder =
    /\{\{\s*[a-zA-Z0-9_.-]+\s*}}|\b(explique|descreva|informe|liste|registre aqui|nome do campo|escreva uma resposta)\b/i;
  const placeholderEncontrado = texto.match(placeholder)?.[0];
  const imagensSemAlt = Array.from(document.querySelectorAll('img'))
    .map((imagem, indice) => ({ imagem, indice: indice + 1 }))
    .filter(({ imagem }) => !imagem.getAttribute('alt')?.trim())
    .map(({ indice }) => indice);
  const imagensSemOrigem = Array.from(document.querySelectorAll('img'))
    .map((imagem, indice) => ({ imagem, indice: indice + 1 }))
    .filter(({ imagem }) => !imagem.getAttribute('src')?.trim())
    .map(({ indice }) => indice);

  const temScreenPlaceholder = document.querySelector('.screen-placeholder') !== null;
  const temImagem = document.querySelector('img') !== null;
  const temImagemEmFrame = document.querySelector('.screen-frame img') !== null;
  const temSteps = document.querySelector('.steps') !== null || /passo a passo/i.test(texto);
  const temResultCard = document.querySelector('.result-card') !== null;
  const temChecklist = document.querySelector('.checklist') !== null;
  const temPreRequisitos = /pré-requisitos/i.test(texto);
  const codigosVerTambem = Array.from(document.querySelectorAll('[data-codigo-tela]'))
    .map(elemento => elemento.getAttribute('data-codigo-tela')?.trim() ?? '')
    .filter(valor => valor.length > 0);
  const codigosVerTambemInvalidos = codigosVerTambem.filter(valor => !valor || /^CODIGO/i.test(valor));

  return [
    item('TITULO', 'Título definido', 'Informe um título claro para a página.', !!raw.titulo?.trim(), 'ERRO'),
    item(
      'CODIGO_TELA',
      'Código da tela definido',
      'Vincule a documentação à tela correta.',
      !!raw.codigoTela?.trim(),
      'ERRO',
    ),
    item(
      'CONTEXTO',
      'Projeto e módulo selecionados',
      'Defina onde esta página será publicada.',
      !!raw.projetoId && !!raw.moduloId,
      'ERRO',
    ),
    item(
      'CONTEUDO',
      'Conteúdo desenvolvido',
      'A página precisa ter pelo menos 80 caracteres de conteúdo útil.',
      texto.length >= 80,
      'ERRO',
    ),
    item(
      'PLACEHOLDERS',
      'Textos de orientação substituídos',
      placeholderEncontrado
        ? `Substitua ou remova “${placeholderEncontrado}” do conteúdo.`
        : 'Não há instruções de modelo pendentes no conteúdo.',
      !placeholderEncontrado,
      'ERRO',
    ),
    item(
      'IMAGENS_ALT',
      'Imagens acessíveis',
      imagensSemAlt.length
        ? `Inclua texto alternativo na imagem ${imagensSemAlt.join(', ')}.`
        : 'Toda imagem possui texto alternativo.',
      imagensSemAlt.length === 0,
      'ERRO',
    ),
    item(
      'IMAGENS_ORIGEM',
      'Imagens disponíveis',
      imagensSemOrigem.length
        ? `Informe uma origem válida para a imagem ${imagensSemOrigem.join(', ')}.`
        : 'Toda imagem possui uma origem válida.',
      imagensSemOrigem.length === 0,
      'ERRO',
    ),
    item(
      'LINKS',
      'Links válidos',
      'Links não podem estar vazios nem usar endereços JavaScript.',
      Array.from(document.querySelectorAll('a')).every(link => linkValido(link.getAttribute('href'))),
      'ERRO',
    ),
    item(
      'TITULOS',
      'Hierarquia de títulos consistente',
      'Organize as seções sem saltar níveis de título.',
      titulosConsistentes(document),
      'AVISO',
    ),
    item(
      'RESUMO',
      'Resumo preenchido',
      'Inclua uma descrição curta para buscas e navegação.',
      (raw.resumo?.trim().length ?? 0) >= 30,
      'AVISO',
    ),
    item(
      'SECOES',
      'Conteúdo organizado em seções',
      'Use ao menos um título de seção para facilitar a leitura.',
      !!document.querySelector('h2, h3'),
      'AVISO',
    ),
    item(
      'CAPTURA',
      'Captura de tela inserida',
      temScreenPlaceholder && !temImagemEmFrame && !temImagem
        ? 'Substitua o placeholder por uma captura real da tela.'
        : 'Captura de tela presente ou sem placeholder pendente.',
      !temScreenPlaceholder || temImagemEmFrame || temImagem,
      'AVISO',
    ),
    item(
      'RESULTADO',
      'Resultado esperado documentado',
      temSteps && !temResultCard
        ? 'Inclua um bloco de resultado esperado após o passo a passo.'
        : 'Resultado esperado presente ou passo a passo não utilizado.',
      !temSteps || temResultCard,
      'AVISO',
    ),
    item(
      'VER_TAMBEM',
      'Links “Ver também” com código válido',
      codigosVerTambem.length && codigosVerTambemInvalidos.length
        ? 'Substitua códigos genéricos ou vazios em data-codigo-tela.'
        : 'Links “Ver também” com códigos válidos ou não utilizados.',
      codigosVerTambem.length === 0 || codigosVerTambemInvalidos.length === 0,
      'AVISO',
    ),
    item(
      'PRE_REQS',
      'Pré-requisitos documentados',
      temSteps && !temChecklist && !temPreRequisitos
        ? 'Inclua pré-requisitos ou checklist antes do passo a passo.'
        : 'Pré-requisitos presentes ou passo a passo não utilizado.',
      !temSteps || temChecklist || temPreRequisitos,
      'AVISO',
    ),
  ];
}

function linkValido(href: string | null): boolean {
  if (!href?.trim()) return false;
  const normalizado = href.trim().toLowerCase();
  return !normalizado.startsWith('javascript:') && normalizado !== '#';
}

function titulosConsistentes(document: Document): boolean {
  let nivelAnterior = 0;
  for (const titulo of Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))) {
    const nivelAtual = Number(titulo.tagName.slice(1));
    if (nivelAnterior > 0 && nivelAtual > nivelAnterior + 1) return false;
    nivelAnterior = nivelAtual;
  }
  return true;
}

function item(
  codigo: string,
  titulo: string,
  descricao: string,
  ok: boolean,
  severidade: 'ERRO' | 'AVISO',
): PaginaQualidadeItem {
  return { codigo, titulo, descricao, ok, severidade };
}
