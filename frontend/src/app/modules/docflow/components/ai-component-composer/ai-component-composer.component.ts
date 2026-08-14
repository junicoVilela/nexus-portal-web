import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { AiComponenteCandidato, AiTemplateRecomendacao } from '../../models/ai-template-recomendacao.model';

@Component({
  selector: 'app-ai-component-composer',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './ai-component-composer.component.html',
  styleUrl: './ai-component-composer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiComponentComposerComponent {
  readonly plano = input.required<AiTemplateRecomendacao>();
  readonly selecionados = input.required<readonly string[]>();
  readonly disabled = input(false);
  readonly selecionadosChange = output<string[]>();

  protected readonly totalSelecionados = computed(() => this.selecionados().length);

  protected selecionado(componente: AiComponenteCandidato): boolean {
    return this.selecionados().includes(componente.id);
  }

  protected podeRemover(componente: AiComponenteCandidato): boolean {
    return !componente.obrigatorio && this.totalSelecionados() > 3;
  }

  protected alternar(componente: AiComponenteCandidato): void {
    if (this.disabled() || componente.obrigatorio) return;
    const atuais = this.selecionados();
    if (atuais.includes(componente.id)) {
      if (!this.podeRemover(componente)) return;
      this.selecionadosChange.emit(atuais.filter(id => id !== componente.id));
      return;
    }
    if (atuais.length >= 12) return;
    const ordem = this.plano().componentes.map(item => item.id);
    const proximos = [...atuais, componente.id].sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
    this.selecionadosChange.emit(proximos);
  }

  protected restaurar(): void {
    if (this.disabled()) return;
    this.selecionadosChange.emit(this.plano().componentes.map(componente => componente.id));
  }

  protected necessidadeLabel(componente: AiComponenteCandidato): string {
    const labels: Record<AiComponenteCandidato['necessidade'], string> = {
      OBRIGATORIA: 'Essencial',
      RECOMENDADA: 'Recomendado',
      OPCIONAL: 'Contextual',
      CONTEXTUAL: 'Detectado no texto',
    };
    return labels[componente.necessidade];
  }

  protected acaoLabel(componente: AiComponenteCandidato): string {
    if (componente.obrigatorio) {
      return `${componente.nome} é essencial e permanecerá na composição`;
    }
    return `${this.selecionado(componente) ? 'Remover' : 'Adicionar'} ${componente.nome} da composição`;
  }
}
