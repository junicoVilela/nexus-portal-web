import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { environment } from '@env/environment';
import { ButtonComponent, ToastService } from '@shared/ui';
import { mensagemErroHttp } from '@shared/utils/http-error-message';
import { AiManualResposta } from '../../models/ai-manual.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { ClientePreviewLinkService } from '../../services/cliente-preview-link.service';

/**
 * Aba "Perguntar" da publicação (Onda E): testa o answer engine sobre o snapshot desta versão e
 * mostra como conectar um agente (Claude, Cursor…) ao manual via MCP.
 */
@Component({
  selector: 'app-publicacao-perguntar',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './publicacao-perguntar.component.html',
  styleUrl: './publicacao-perguntar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicacaoPerguntarComponent {
  private readonly ai = inject(AiAssistenteService);
  private readonly previewLink = inject(ClientePreviewLinkService);
  private readonly toast = inject(ToastService);

  readonly publicacaoId = input.required<string>();
  readonly clienteId = input.required<string>();
  readonly clienteSlug = input<string>('manual');

  protected readonly pergunta = signal('');
  protected readonly perguntando = signal(false);
  protected readonly resposta = signal<AiManualResposta | null>(null);
  protected readonly erro = signal<string | null>(null);
  protected readonly comandoMcp = signal<string | null>(null);
  protected readonly gerandoComando = signal(false);

  protected readonly podePerguntar = computed(
    () => this.pergunta().trim().length >= 3 && !this.perguntando(),
  );
  /** URL do MCP pelo mesmo caminho da API que o portal usa (proxy/gateway). */
  protected readonly urlMcp = `${window.location.origin}${environment.apiUrl}/mcp`;

  protected perguntar(): void {
    if (!this.podePerguntar()) return;
    this.perguntando.set(true);
    this.erro.set(null);
    this.ai
      .perguntarPublicacao(this.publicacaoId(), this.pergunta().trim())
      .pipe(finalize(() => this.perguntando.set(false)))
      .subscribe({
        next: resposta => this.resposta.set(resposta),
        error: err => this.erro.set(mensagemErroHttp(err, 'Não foi possível perguntar ao manual.')),
      });
  }

  /** Comando pronto para o Claude Code, com o token de leitura do cliente. */
  protected gerarComandoMcp(): void {
    this.gerandoComando.set(true);
    this.previewLink
      .tokenValido(this.clienteId())
      .pipe(finalize(() => this.gerandoComando.set(false)))
      .subscribe({
        next: token =>
          this.comandoMcp.set(
            `claude mcp add --transport http manual-${this.clienteSlug()} ${this.urlMcp} ` +
              `--header "Authorization: Bearer ${token.token}"`,
          ),
        error: (erro: unknown) =>
          this.toast.error(
            erro instanceof Error ? erro.message : 'Não foi possível gerar o token de leitura.',
          ),
      });
  }

  protected copiar(texto: string): void {
    navigator.clipboard
      .writeText(texto)
      .then(() => this.toast.success('Copiado.'))
      .catch(() => this.toast.error('Não foi possível copiar.'));
  }
}
