import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '@core/auth/services/auth.service';
import { AiFeatureService } from '../services/ai-feature.service';

interface AiNavItem {
  label: string;
  icon: string;
  route: string[];
  exact?: boolean;
  permissao?: string;
  requerAiEnabled?: boolean;
}

@Component({
  selector: 'app-ai-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './ai-shell.component.html',
  styleUrl: './ai-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiShellComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly aiFeature = inject(AiFeatureService);

  private readonly navItemsTodos: AiNavItem[] = [
    { label: 'Visão geral', icon: 'Sparkles', route: ['/ai'], exact: true },
    {
      label: 'Assistente',
      icon: 'MessageSquare',
      route: ['/ai', 'assistente'],
      permissao: 'PAGINA:CRIAR',
      requerAiEnabled: true,
    },
    {
      label: 'Propostas',
      icon: 'Inbox',
      route: ['/ai', 'propostas'],
      permissao: 'PAGINA:LER',
      requerAiEnabled: true,
    },
  ];

  protected readonly navItems = computed(() => {
    const tem = this.auth.tem();
    const aiOn = this.aiFeature.disponivel();
    return this.navItemsTodos.filter(
      item =>
        (!item.permissao || tem(item.permissao)) &&
        (!item.requerAiEnabled || aiOn || !this.aiFeature.ready()),
    );
  });

  ngOnInit(): void {
    this.aiFeature.ensureLoaded();
  }
}
