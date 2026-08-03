import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { CardComponent } from '@shared/ui';

/** Fila de propostas (Fase C / S6) — placeholder. */
@Component({
  selector: 'app-ai-propostas',
  standalone: true,
  imports: [LucideAngularModule, CardComponent],
  templateUrl: './ai-propostas.component.html',
  styleUrl: './ai-propostas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPropostasComponent {}
