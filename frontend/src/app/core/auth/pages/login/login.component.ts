import { ChangeDetectionStrategy, Component, inject, isDevMode, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../../services/auth.service';
import { ButtonComponent, InputComponent } from '@shared/ui';

export interface LoginProduct {
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  readonly icon: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, ButtonComponent, InputComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly ambienteLocal = isDevMode();

  protected readonly form = this.fb.nonNullable.group({
    login: ['', [Validators.required, Validators.minLength(1)]],
    senha: ['', [Validators.required, Validators.minLength(1)]],
  });

  protected readonly year = new Date().getFullYear();

  protected readonly products: readonly LoginProduct[] = [
    {
      id: 'docflow',
      name: 'DocFlow',
      blurb: 'Manuais versionados por cliente',
      icon: 'FileText',
    },
    {
      id: 'orchestrator',
      name: 'Release Orchestrator',
      blurb: 'Releases, entregas e pacotes',
      icon: 'Tag',
    },
    {
      id: 'seguranca',
      name: 'Segurança',
      blurb: 'Usuários, grupos e auditoria',
      icon: 'Shield',
    },
  ];

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.serverError.set(null);

    const { login, senha } = this.form.getRawValue();
    try {
      await this.auth.login(login.trim(), senha);
      // auth.login navigates internally
    } catch (e: unknown) {
      this.serverError.set(this.messageFor(e));
    } finally {
      this.loading.set(false);
    }
  }

  protected loginError(): string | null {
    const c = this.form.controls.login;
    if (!c.touched || !c.invalid) return null;
    if (c.errors?.['required']) return 'Informe seu usuário.';
    return null;
  }

  protected senhaError(): string | null {
    const c = this.form.controls.senha;
    if (!c.touched || !c.invalid) return null;
    if (c.errors?.['required']) return 'Informe sua senha.';
    return null;
  }

  private messageFor(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      if (e.status === 0 || e.status === 502 || e.status === 503 || e.status === 504) {
        return 'API indisponível. Verifique se o backend está ativo.';
      }
      const apiMsg = this.mensagemDaApi(e);
      if (apiMsg) return apiMsg;
      if (e.status === 401 || e.status === 403) {
        return 'Usuário ou senha inválidos.';
      }
      if (e.status >= 500) {
        return 'Falha no servidor. Tente novamente em instantes.';
      }
      return 'Usuário ou senha inválidos.';
    }
    return 'Erro inesperado. Tente novamente.';
  }

  private mensagemDaApi(e: HttpErrorResponse): string | null {
    const body = e.error;
    if (body && typeof body === 'object' && typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }
    return null;
  }
}
