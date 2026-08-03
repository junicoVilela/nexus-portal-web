import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { Usuario, UsuarioForm } from '../models/usuario.model';

export interface UsuarioFilter {
  q?: string;
  ativo?: boolean;
  bloqueado?: boolean;
  page?: number;
  size?: number;
}

/** Resposta bruta do backend /api/v1/rbac/usuarios. */
interface BackendUsuarioResponse {
  id: string;
  username: string;
  nome: string | null;
  email: string | null;
  ativo: boolean;
  bloqueado: boolean;
  tentativasInvalidas: number;
  trocarSenhaProximoLogin: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.rbacApiUrl}/usuarios`;

  listar(filter: UsuarioFilter = {}): Observable<PageResult<Usuario>> {
    const params = new HttpParams()
      .set('page', String(filter.page ?? 1))
      .set('size', String(filter.size ?? 20));
    return this.http.get<PageResult<BackendUsuarioResponse>>(this.base, { params }).pipe(
      map(res => ({
        ...res,
        items: this.aplicarFiltrosClient(
          res.items.map(u => this.mapear(u)),
          filter,
        ),
      })),
    );
  }

  buscarPorId(id: string): Observable<Usuario> {
    return forkJoin({
      usuario: this.http.get<BackendUsuarioResponse>(`${this.base}/${id}`),
      grupoIds: this.http.get<string[]>(`${this.base}/${id}/grupos`),
    }).pipe(map(({ usuario, grupoIds }) => this.mapear(usuario, grupoIds)));
  }

  criar(form: UsuarioForm): Observable<Usuario> {
    if (!form.senha) {
      return throwError(() => ({ status: 400, message: 'Senha obrigatória ao criar usuário.' }));
    }
    return this.http
      .post<BackendUsuarioResponse>(this.base, {
        username: form.login,
        password: form.senha,
        nome: form.nome,
        email: form.email,
      })
      .pipe(map(u => this.mapear(u)));
  }

  atualizar(id: string, form: UsuarioForm): Observable<Usuario> {
    return this.http
      .put<BackendUsuarioResponse>(`${this.base}/${id}`, {
        nome: form.nome,
        email: form.email,
        ativo: form.ativo,
      })
      .pipe(map(u => this.mapear(u)));
  }

  alterarStatus(id: string, ativo: boolean): Observable<Usuario> {
    // Backend não tem PATCH dedicado; reaproveita o PUT com o payload atual.
    return this.buscarPorId(id).pipe(
      switchMap(atual =>
        this.http
          .put<BackendUsuarioResponse>(`${this.base}/${id}`, {
            nome: atual.nome,
            email: atual.email,
            ativo,
          })
          .pipe(map(u => this.mapear(u, atual.grupoIds))),
      ),
    );
  }

  resetarSenha(id: string, novaSenha: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/alterar-senha`, { novaSenha });
  }

  bloquear(id: string, bloqueado: boolean): Observable<Usuario> {
    return this.http
      .post<BackendUsuarioResponse>(`${this.base}/${id}/bloqueio`, { bloqueado })
      .pipe(map(u => this.mapear(u)));
  }

  vincularGrupos(id: string, grupoIds: string[]): Observable<Usuario> {
    return this.http.put<string[]>(`${this.base}/${id}/grupos`, { grupoIds }).pipe(
      switchMap(savedIds =>
        this.http
          .get<BackendUsuarioResponse>(`${this.base}/${id}`)
          .pipe(map(u => this.mapear(u, savedIds))),
      ),
    );
  }

  private aplicarFiltrosClient(lista: Usuario[], filter: UsuarioFilter): Usuario[] {
    let out = lista;
    if (filter.q) {
      const q = filter.q.toLowerCase();
      out = out.filter(
        u =>
          u.nome.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.login.toLowerCase().includes(q),
      );
    }
    if (filter.ativo !== undefined) out = out.filter(u => u.ativo === filter.ativo);
    if (filter.bloqueado !== undefined) out = out.filter(u => u.bloqueado === filter.bloqueado);
    return out;
  }

  /** Adapta UsuarioResponse do backend para o modelo rico do frontend. */
  private mapear(src: BackendUsuarioResponse, grupoIds: string[] = []): Usuario {
    return {
      id: src.id,
      nome: src.nome ?? src.username,
      email: src.email ?? '',
      login: src.username,
      ativo: src.ativo,
      bloqueado: src.bloqueado,
      tentativasInvalidas: src.tentativasInvalidas,
      trocarSenhaProximoLogin: src.trocarSenhaProximoLogin,
      ultimoLogin: null,
      criadoEm: src.createdAt,
      atualizadoEm: src.updatedAt,
      grupoIds,
    };
  }
}
