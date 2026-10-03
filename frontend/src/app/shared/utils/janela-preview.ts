/** Janela de prévia aberta pelo usuário; o conteúdo chega depois (gerado no servidor). */
export interface JanelaPreview {
  /** Substitui o "carregando" pelo HTML final da prévia. */
  exibir(html: string): void;
  /** Mostra a falha na própria janela, para o usuário não ficar com uma aba em branco. */
  erro(mensagem: string): void;
}

/**
 * Abre a aba de prévia já com uma mensagem de "preparando". Precisa ser chamada no gesto do
 * usuário (clique), antes de qualquer `await`, ou o navegador bloqueia o popup.
 *
 * @returns `null` quando o navegador bloqueou a janela.
 */
export function abrirJanelaPreview(
  mensagemCarregando = 'Sincronizando conteúdo e preparando a prévia fiel…',
  alvo: Pick<Window, 'open'> = window,
): JanelaPreview | null {
  const janela = alvo.open('', '_blank');
  if (!janela) return null;
  escrever(janela, paginaMensagem('Preparando prévia', mensagemCarregando, '#5f6368'));
  return {
    exibir: html => escrever(janela, html),
    erro: mensagem => escrever(janela, paginaMensagem('Erro na prévia', mensagem, '#b42318')),
  };
}

/** Escapa texto para interpolar com segurança em HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function paginaMensagem(titulo: string, mensagem: string, cor: string): string {
  return (
    `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>${escapeHtml(titulo)}</title>` +
    `<body style="font:14px system-ui;padding:32px;color:${cor}">${escapeHtml(mensagem)}</body></html>`
  );
}

function escrever(janela: Window, html: string): void {
  janela.document.open();
  janela.document.write(html);
  janela.document.close();
}
