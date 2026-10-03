import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LucideAngularModule } from 'lucide-angular';

import { BadgeComponent, ButtonComponent } from '@shared/ui';
import { BlocoPagina } from '../pagina-block-library';
import {
  AiCategoriaRejeicao,
  AiPageSpecResumo,
  AiProposta,
  AiRejeicao,
  CATEGORIAS_REJEICAO,
  rotuloCategoriaRejeicao,
} from '../../models/ai-proposta.model';

@Component({
  selector: 'app-ai-proposta-preview',
  standalone: true,
  imports: [BadgeComponent, ButtonComponent, LucideAngularModule],
  templateUrl: './ai-proposta-preview.component.html',
  styleUrl: './ai-proposta-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPropostaPreviewComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly proposta = input.required<AiProposta>();
  readonly componentesCatalogo = input<readonly BlocoPagina[]>([]);
  readonly loading = input(false);
  readonly regenerando = input(false);
  readonly disabled = input(false);
  /** Sem `PAGINA:AI_APLICAR` a proposta pode ser lida, regenerada ou rejeitada, mas não aplicada. */
  readonly podeAplicar = input(true);

  readonly rejeitando = input(false);

  readonly aplicar = output<void>();
  /** Emite a instrução de ajuste digitada pelo autor, ou `null` para só tentar de novo. */
  readonly regenerar = output<string | null>();
  /** Emite a categoria e o motivo da rejeição (ambos opcionais). */
  readonly rejeitar = output<AiRejeicao>();

  protected readonly instrucao = signal('');
  protected readonly confirmandoRejeicao = signal(false);
  protected readonly motivoRejeicao = signal('');
  protected readonly categoriaRejeicao = signal<AiCategoriaRejeicao | null>(null);
  protected readonly categorias = CATEGORIAS_REJEICAO;
  protected readonly rotuloRejeicao = computed(() => {
    const p = this.proposta();
    return [rotuloCategoriaRejeicao(p.categoriaRejeicao), p.motivoRejeicao].filter(Boolean).join(' — ');
  });

  protected readonly pendente = computed(() => this.proposta().status === 'PENDENTE');

  protected readonly rejeitada = computed(() => this.proposta().status === 'REJEITADA');

  protected readonly previewHtml = computed<SafeHtml | null>(() => {
    const html = this.proposta().conteudoHtml;
    return html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
  });

  protected readonly qualidadeOk = computed(() => this.proposta().qualidade?.filter(i => i.ok).length ?? 0);

  protected readonly qualidadeTotal = computed(() => this.proposta().qualidade?.length ?? 0);

  protected readonly avisosGeracao = computed(() => this.proposta().avisosGeracao ?? []);

  protected readonly composicaoUsada = computed(() => {
    const json = this.proposta().pageSpecJson;
    if (!json) return [];
    try {
      const spec = JSON.parse(json) as Partial<AiPageSpecResumo>;
      if (!Array.isArray(spec.blocos)) return [];
      const nomes = new Map(this.componentesCatalogo().map(bloco => [bloco.id, bloco.nome]));
      return spec.blocos
        .filter(
          (bloco): bloco is { componenteId: string } =>
            typeof bloco?.componenteId === 'string' && bloco.componenteId.length > 0,
        )
        .map(bloco => ({
          id: bloco.componenteId,
          nome: nomes.get(bloco.componenteId) ?? this.humanizar(bloco.componenteId),
        }));
    } catch {
      return [];
    }
  });

  protected emitirRegenerar(): void {
    const texto = this.instrucao().trim();
    this.regenerar.emit(texto || null);
    this.instrucao.set('');
  }

  protected confirmarRejeicao(): void {
    const texto = this.motivoRejeicao().trim();
    this.rejeitar.emit({ categoria: this.categoriaRejeicao(), motivo: texto || null });
    this.confirmandoRejeicao.set(false);
    this.motivoRejeicao.set('');
    this.categoriaRejeicao.set(null);
  }

  private humanizar(id: string): string {
    return id
      .split(/[-_]/)
      .filter(Boolean)
      .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(' ');
  }
}
