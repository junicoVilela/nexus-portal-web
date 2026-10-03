import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { AiGeracaoAcompanhamento } from './ai-geracao-acompanhamento';

/**
 * Etapa, progresso e tentativa da geração em andamento. Lê o {@link AiGeracaoAcompanhamento}
 * fornecido pelo wizard, então só pode ser usado dentro dele.
 */
@Component({
  selector: 'app-ai-geracao-status',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './ai-geracao-status.component.html',
  styleUrl: './ai-geracao-status.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiGeracaoStatusComponent {
  protected readonly geracao = inject(AiGeracaoAcompanhamento);
}
