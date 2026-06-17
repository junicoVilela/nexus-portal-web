import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '@core/auth/services/auth.service';
import { PORTAL_MODULES, type PortalModule } from '@core/config/portal-modules.registry';
import { BadgeComponent, CardComponent } from '@shared/ui';

interface Kpi {
  label: string;
  value: string;
  trend?: { dir: 'up' | 'down' | 'flat'; text: string };
}

const PRIME_TO_LUCIDE: Record<string, string> = {
  'pi-book': 'FileText',
  'pi-tag': 'Tag',
  'pi-shield': 'Shield',
  'pi-users': 'User',
  'pi-cog': 'Settings',
};

function toLucide(primeIcon: string): string {
  return PRIME_TO_LUCIDE[primeIcon] ?? 'FileText';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [LucideAngularModule, CardComponent, BadgeComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly modules = PORTAL_MODULES;
  protected readonly userName = computed(() => this.auth.currentUser() || 'Usuário');
  protected readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 5) return 'Boa madrugada';
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  });

  protected readonly kpis: Kpi[] = [
    { label: 'Releases / mês', value: '—', trend: { dir: 'flat', text: 'sem dados' } },
    { label: 'Manuais ativos', value: '—', trend: { dir: 'flat', text: 'sem dados' } },
    { label: 'Usuários ativos', value: '—', trend: { dir: 'flat', text: 'sem dados' } },
    { label: 'Incidentes 24h', value: '0', trend: { dir: 'flat', text: 'estável' } },
  ];

  protected lucideFor(m: PortalModule): string {
    return toLucide(m.icon);
  }

  protected onModule(m: PortalModule): void {
    if (!m.available) return;
    void this.router.navigateByUrl(m.route);
  }
}
