import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { ConfiguracaoService } from '@modules/docflow/services/configuracao.service';
import { ButtonComponent, CardComponent, PageHeaderComponent, ToastService } from '@shared/ui';

import { PermissaoDirective } from '@modules/identity-access/directives';
import { ManualIntegracaoComponent } from '../../components/manual-integracao/manual-integracao.component';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [
    LucideAngularModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent,
    PermissaoDirective,
    ManualIntegracaoComponent,
  ],
  templateUrl: './configuracoes.component.html',
  styleUrl: './configuracoes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracoesComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly configuracaoService = inject(ConfiguracaoService);

  protected readonly logoEmpresaUrl = signal<string>('');
  protected readonly uploadingLogo = signal(false);
  protected readonly removingLogo = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly isError = signal(false);

  ngOnInit(): void {
    this.verificarLogoEmpresa();
  }

  private verificarLogoEmpresa(): void {
    this.configuracaoService.logoEmpresaExiste().subscribe(existe => {
      this.logoEmpresaUrl.set(existe ? this.configuracaoService.logoEmpresaUrl() : '');
    });
  }

  protected onLogoEmpresaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingLogo.set(true);
    this.configuracaoService.uploadLogoEmpresa(file).subscribe({
      next: () => {
        this.logoEmpresaUrl.set(this.configuracaoService.logoEmpresaUrl());
        this.uploadingLogo.set(false);
        this.toast.success('Logo da empresa atualizado com sucesso.');
      },
      error: () => {
        this.uploadingLogo.set(false);
        this.toast.error('Erro ao enviar logo.');
      },
    });
    input.value = '';
  }

  protected removerLogoEmpresa(): void {
    this.removingLogo.set(true);
    this.configuracaoService.removerLogoEmpresa().subscribe({
      next: () => {
        this.logoEmpresaUrl.set('');
        this.removingLogo.set(false);
        this.toast.success('Logo removido.');
      },
      error: () => {
        this.removingLogo.set(false);
        this.toast.error('Erro ao remover logo.');
      },
    });
  }
}
