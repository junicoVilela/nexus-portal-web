import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonComponent } from '../button/button.component';

export type ErrorVariant = 'network' | 'permission' | 'notfound' | 'server' | 'generic';

interface ErrorVisual {
  icon: string;
  title: string;
  description: string;
  tone: 'warn' | 'danger' | 'neutral';
}

const VISUAL_MAP: Record<ErrorVariant, ErrorVisual> = {
  network: {
    icon: 'X',
    title: $localize`:@@ui.errorState.network.title:Sem conexão com o servidor`,
    description: $localize`:@@ui.errorState.network.desc:Verifique sua conexão e tente novamente.`,
    tone: 'warn',
  },
  permission: {
    icon: 'Lock',
    title: $localize`:@@ui.errorState.permission.title:Sem permissão`,
    description: $localize`:@@ui.errorState.permission.desc:Seu usuário não pode acessar este conteúdo. Procure um administrador.`,
    tone: 'warn',
  },
  notfound: {
    icon: 'Inbox',
    title: $localize`:@@ui.errorState.notfound.title:Não encontrado`,
    description: $localize`:@@ui.errorState.notfound.desc:O conteúdo que você procura não existe ou foi removido.`,
    tone: 'neutral',
  },
  server: {
    icon: 'AlertTriangle',
    title: $localize`:@@ui.errorState.server.title:Erro no servidor`,
    description: $localize`:@@ui.errorState.server.desc:Algo deu errado do nosso lado. Tente novamente em instantes.`,
    tone: 'danger',
  },
  generic: {
    icon: 'AlertTriangle',
    title: $localize`:@@ui.errorState.generic.title:Algo deu errado`,
    description: $localize`:@@ui.errorState.generic.desc:Não foi possível concluir a operação.`,
    tone: 'danger',
  },
};

@Component({
  selector: 'ui-error-state',
  standalone: true,
  imports: [LucideAngularModule, ButtonComponent],
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  readonly variant = input<ErrorVariant>('generic');
  readonly title = input<string | null>(null);
  readonly description = input<string | null>(null);
  readonly retryLabel = input<string>('Tentar novamente');
  readonly showRetry = input(true);

  readonly retry = output<void>();

  protected readonly visual = computed<ErrorVisual>(() => VISUAL_MAP[this.variant()]);
  protected readonly resolvedTitle = computed(() => this.title() ?? this.visual().title);
  protected readonly resolvedDescription = computed(() => this.description() ?? this.visual().description);
}
