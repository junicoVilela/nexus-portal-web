import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '@env/environment';
import {
  BackendLoginResponse,
  BackendMeResponse,
  LoginResponse,
  UsuarioAutenticado,
} from '../models/auth.model';

/**
 * Cliente HTTP de autenticação contra `POST/GET /api/v1/auth/*`.
 * Permissões vêm do catálogo RBAC via `/auth/me`.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly authBase = environment.authApiUrl;

  login(loginOuEmail: string, senha: string): Observable<LoginResponse> {
    return this.http
      .post<BackendLoginResponse>(`${this.authBase}/login`, {
        username: loginOuEmail,
        password: senha,
      })
      .pipe(
        map(res => ({
          token: res.token,
          usuario: {
            id: '',
            nome: res.username,
            email: '',
            login: res.username,
          },
        })),
      );
  }

  me(): Observable<UsuarioAutenticado> {
    const token = localStorage.getItem('doc-flow-jwt');
    if (!token) {
      return throwError(() => ({ status: 401, message: 'Não autenticado' }));
    }

    return this.http.get<BackendMeResponse>(`${this.authBase}/me`).pipe(
      map(res => this.mapMe(res)),
      catchError(() => throwError(() => ({ status: 401, message: 'Não autenticado' }))),
    );
  }

  encerrarSessaoAtual(): void {
    /* no-op */
  }

  alterarSenhaPropria(_senhaAtual: string, _novaSenha: string): Observable<void> {
    return throwError(() => ({
      status: 501,
      message: 'Alteração de senha ainda não disponível via API.',
    }));
  }

  refresh(_refreshToken: string): Observable<LoginResponse> {
    return throwError(() => ({
      status: 501,
      message: 'Refresh token não disponível no backend.',
    }));
  }

  private mapMe(res: BackendMeResponse): UsuarioAutenticado {
    return {
      id: res.id,
      nome: res.nome ?? res.username,
      email: res.email ?? '',
      login: res.username,
      grupos: (res.grupos ?? []).map(g => ({
        id: g.id,
        codigo: g.codigo,
        nome: g.nome,
      })),
      permissoes: res.permissoes ?? [],
    };
  }
}
