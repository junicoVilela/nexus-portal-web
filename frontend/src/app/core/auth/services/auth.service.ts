import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthApiService } from '@modules/seguranca/services/auth-api.service';
import type { UsuarioAutenticado } from '@modules/seguranca/models/auth.model';
import { tokenValido } from '../utils/jwt-claims';

const AUTH_CHANGED_EVENT = 'softon-hub-auth-changed';
const TOKEN_KEY = 'doc-flow-jwt';
const REFRESH_KEY = 'doc-flow-refresh';
const USERNAME_KEY = 'doc-flow-username';
const ME_CACHE_KEY = 'doc-flow-me';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  readonly authenticated = signal<boolean>(this.isTokenValid());
  readonly currentUser = signal<string>(this.getUsername() ?? '');
  readonly me = signal<UsuarioAutenticado | null>(this.cachedMe());

  /** Códigos de permissão (`DOMINIO:ACAO`) do usuário atual. */
  readonly permissoes = computed<readonly string[]>(() => this.me()?.permissoes ?? []);
  /** Códigos de grupos ativos (`ADMIN`, `LEITOR`, ...). */
  readonly grupos = computed<readonly string[]>(() => (this.me()?.grupos ?? []).map(g => g.codigo));
  /** Helper rápido para checagem de permissão pontual. */
  readonly tem = computed(() => {
    const codigos = new Set(this.permissoes());
    return (codigo: string): boolean => codigos.has(codigo);
  });

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener(AUTH_CHANGED_EVENT, () => this.refreshFromStorage());
    }
  }

  async login(loginOuEmail: string, senha: string): Promise<void> {
    const res = await firstValueFrom(this.authApi.login(loginOuEmail, senha));
    if (res.refreshToken) {
      localStorage.setItem(REFRESH_KEY, res.refreshToken);
    } else {
      localStorage.removeItem(REFRESH_KEY);
    }
    this.applySession(res.token, res.usuario.login);
    await this.carregarMe();
    await this.router.navigateByUrl('/');
  }

  /** Carrega `/me` e atualiza signals. Idempotente. */
  async carregarMe(): Promise<UsuarioAutenticado | null> {
    if (!this.isTokenValid()) return null;
    try {
      const me = await firstValueFrom(this.authApi.me());
      this.me.set(me);
      try {
        localStorage.setItem(ME_CACHE_KEY, JSON.stringify(me));
      } catch {
        /* storage cheio */
      }
      return me;
    } catch {
      this.me.set(null);
      return null;
    }
  }

  applySession(token: string, username: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USERNAME_KEY, username);
    this.refreshFromStorage();
    this.dispatchAuthChanged();
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(ME_CACHE_KEY);
    this.me.set(null);
    this.refreshFromStorage();
    this.dispatchAuthChanged();
  }

  logout(): void {
    this.authApi.encerrarSessaoAtual();
    this.clearSession();
    void this.router.navigateByUrl('/login');
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUsername(): string | null {
    return localStorage.getItem(USERNAME_KEY);
  }

  header(): string | null {
    const token = this.getToken();
    return token ? `Bearer ${token}` : null;
  }

  isTokenValid(): boolean {
    return tokenValido(this.getToken());
  }

  private cachedMe(): UsuarioAutenticado | null {
    try {
      const raw = localStorage.getItem(ME_CACHE_KEY);
      return raw ? (JSON.parse(raw) as UsuarioAutenticado) : null;
    } catch {
      return null;
    }
  }

  private refreshFromStorage(): void {
    this.authenticated.set(this.isTokenValid());
    this.currentUser.set(this.getUsername() ?? '');
  }

  private dispatchAuthChanged(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
    }
  }
}
