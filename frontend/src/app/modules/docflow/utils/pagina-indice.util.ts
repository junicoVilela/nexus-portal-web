import { Pagina } from '../models/pagina.model';
import { PaginaService } from '../services/pagina.service';
import { ToastService } from '@shared/ui';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function contarItensIndiceGuias(conteudoHtml?: string | null): number | undefined {
  if (!conteudoHtml?.trim()) return undefined;
  const doc = new DOMParser().parseFromString(`<body>${conteudoHtml}</body>`, 'text/html');
  const secao = Array.from(doc.body.querySelectorAll('section')).find(item => {
    const h2 = item.querySelector('h2');
    return h2?.textContent?.trim().toLowerCase() === 'guias disponíveis';
  });
  if (!secao) return undefined;
  return secao.querySelectorAll('.resource-item').length;
}

export function temSecaoGuiasDisponiveis(html: string): boolean {
  return contarItensIndiceGuias(html) !== undefined;
}

export function montarSecaoGuiasDisponiveis(filhos: Pagina[]): string {
  const items = filhos
    .map((filho, index) => {
      const resumo = (filho.resumo?.trim() || 'Sem resumo').slice(0, 80);
      return (
        `<article class="resource-item"><span class="number-badge">${index + 1}</span><span><strong>${escapeHtml(filho.titulo)}</strong><small>${escapeHtml(resumo)}</small></span>` +
        `<span class="resource-item__meta">${escapeHtml(filho.codigoTela)}</span></article>`
      );
    })
    .join('');
  return `<section class="doc-section"><h2>Guias disponíveis</h2><div class="resource-list resource-list--large">${items}</div></section>`;
}

export function substituirOuAdicionarSecaoGuias(html: string, secaoHtml: string): string {
  if (!html.trim()) return secaoHtml;
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const body = doc.body;
  const existente = Array.from(body.querySelectorAll('section')).find(secao => {
    const h2 = secao.querySelector('h2');
    return h2?.textContent?.trim().toLowerCase() === 'guias disponíveis';
  });
  if (existente) {
    const temp = new DOMParser().parseFromString(secaoHtml, 'text/html');
    const nova = temp.body.firstElementChild;
    if (nova) existente.replaceWith(nova);
  } else {
    body.insertAdjacentHTML('beforeend', secaoHtml);
  }
  return body.innerHTML;
}

export function sincronizarIndicePai(
  paginaService: PaginaService,
  toast: ToastService,
  parentId: string,
): void {
  paginaService.pagina(parentId).subscribe({
    next: parent => {
      if (!temSecaoGuiasDisponiveis(parent.conteudoHtml ?? '')) return;
      paginaService.paginas({ moduloId: parent.moduloId }).subscribe({
        next: siblings => {
          const filhos = siblings
            .filter(pagina => pagina.parentId === parentId)
            .sort((a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo));
          const secaoHtml = montarSecaoGuiasDisponiveis(filhos);
          const novoHtml = substituirOuAdicionarSecaoGuias(parent.conteudoHtml ?? '', secaoHtml);
          if (novoHtml === parent.conteudoHtml) return;
          paginaService
            .salvarPagina(
              {
                titulo: parent.titulo,
                slug: parent.slug,
                codigoTela: parent.codigoTela,
                resumo: parent.resumo,
                conteudoHtml: novoHtml,
                ordem: parent.ordem,
                ativo: parent.ativo,
                moduloId: parent.moduloId,
                parentId: parent.parentId,
                version: parent.version,
              },
              parent.id,
            )
            .subscribe({
              next: () => toast.success('Índice de guias do pai atualizado.'),
              error: () => toast.warn('Não foi possível atualizar o índice do pai.'),
            });
        },
        error: () => toast.warn('Não foi possível atualizar o índice do pai.'),
      });
    },
    error: () => toast.warn('Não foi possível atualizar o índice do pai.'),
  });
}
