import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ButtonComponent } from '@shared/ui';
import { AiPergunta } from '../../models/ai-sessao.model';

@Component({
  selector: 'app-ai-perguntas',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './ai-perguntas.component.html',
  styleUrl: './ai-perguntas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPerguntasComponent {
  readonly perguntas = input.required<AiPergunta[]>();
  readonly respostas = input<Record<string, string>>({});
  readonly loading = input(false);
  readonly disabled = input(false);

  readonly respostaChange = output<{ id: string; valor: string }>();
  readonly enviar = output<void>();

  protected setResposta(id: string, valor: string): void {
    this.respostaChange.emit({ id, valor });
  }
}
