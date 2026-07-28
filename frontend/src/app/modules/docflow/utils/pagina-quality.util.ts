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
