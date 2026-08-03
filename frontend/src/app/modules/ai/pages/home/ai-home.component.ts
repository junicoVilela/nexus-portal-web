import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { BadgeComponent, ButtonComponent, CardComponent } from '@shared/ui';
import { AiFeatureService } from '../../services/ai-feature.service';

@Component({
  selector: 'app-ai-home',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, CardComponent, BadgeComponent, ButtonComponent],
  templateUrl: './ai-home.component.html',
  styleUrl: './ai-home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiHomeComponent implements OnInit {
  private readonly feature = inject(AiFeatureService);

  protected readonly erro = signal<string | null>(null);
  protected readonly carregando = signal(true);
  protected readonly status = this.feature.status;
  protected readonly aiDisponivel = this.feature.disponivel;

  ngOnInit(): void {
    this.feature.refresh().subscribe({
      next: s => {
        this.carregando.set(false);
        if (!s) this.erro.set('Não foi possível consultar o status do módulo AI.');
      },
      error: () => {
        this.erro.set('Não foi possível consultar o status do módulo AI.');
        this.carregando.set(false);
      },
    });
  }
}
