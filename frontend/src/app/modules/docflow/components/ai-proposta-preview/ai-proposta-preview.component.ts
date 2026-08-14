import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LucideAngularModule } from 'lucide-angular';

import { BadgeComponent, ButtonComponent } from '@shared/ui';
import { BlocoPagina } from '../pagina-block-library';
import { AiPageSpecResumo, AiProposta } from '../../models/ai-proposta.model';

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

  readonly aplicar = output<void>();
  readonly regenerar = output<void>();

  protected readonly previewHtml = computed<SafeHtml | null>(() => {
    const html = this.proposta().conteudoHtml;
    return html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
  });

  protected readonly qualidadeOk = computed(() => this.proposta().qualidade?.filter(i => i.ok).length ?? 0);

  protected readonly qualidadeTotal = computed(() => this.proposta().qualidade?.length ?? 0);

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

  private humanizar(id: string): string {
    return id
      .split(/[-_]/)
      .filter(Boolean)
      .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(' ');
  }
}
