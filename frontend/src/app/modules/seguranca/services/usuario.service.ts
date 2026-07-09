import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { Usuario, UsuarioForm } from '../models/usuario.model';
import { MockStore } from './mock/mock-store.service';
import { agora, simularErro, simularRequisicao } from './mock/in-memory-store';
import { AuditoriaService } from './auditoria.service';

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
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(MockStore);
  private readonly auditoria = inject(AuditoriaService);
  private readonly base = `${environment.rbacApiUrl}/usuarios`;

  listar(filter: UsuarioFilter = {}): Observable<PageResult<Usuario>> {
    let params = new HttpParams()
      .set('page', String(filter.page ?? 1))
      .set('size', String(filter.size ?? 20));
    return this.http.get<PageResult<BackendUsuarioResponse>>(this.base, { params }).pipe(
      map(res => ({
        ...res,
        items: this.aplicarFiltrosClient(res.items.map(u => this.mapear(u)), filter),
      })),
    );
  }

  buscarPorId(id: string): Observable<Usuario> {
    return this.http.get<BackendUsuarioResponse>(`${this.base}/${id}`).pipe(map(u => this.mapear(u)));
  }

  criar(form: UsuarioForm): Observable<Usuario> {
    if (!form.senha) {
      return simularErro('Senha obrigatória ao criar usuário.', 400);
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
      switchMap(atual => this.http
        .put<BackendUsuarioResponse>(`${this.base}/${id}`, {
          nome: atual.nome,
          email: atual.email,
          ativo,
        })
        .pipe(map(u => this.mapear(u)))),
    );
  }

  resetarSenha(id: string, novaSenha: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/alterar-senha`, { novaSenha });
  }

  /**
   * Bloqueio de usuário ainda não existe no backend. Mantido em MockStore
   * até o endpoint dedicado ser criado.
   */
  bloquear(id: string, bloqueado: boolean): Observable<Usuario> {
    const atual = this.store.usuarios().find(u => u.id === id);
    if (!atual) return simularErro('Usuário não encontrado', 404);
    const atualizado = {
      ...atual,
      bloqueado,
      tentativasInvalidas: bloqueado ? atual.tentativasInvalidas : 0,
      atualizadoEm: agora(),
    };
    this.store.usuarios.update(list => list.map(u => (u.id === id ? atualizado : u)));
    this.store.persist('usuarios');
    this.auditoria.registrar({
      acao: bloqueado ? 'USUARIO:BLOQUEAR' : 'USUARIO:DESBLOQUEAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'USUARIO',
      recursoTipo: 'usuario',
      recursoId: id,
      dadosAnteriores: { bloqueado: atual.bloqueado },
      dadosNovos: { bloqueado },
    });
    return simularRequisicao(atualizado);
  }

  /**
   * Vincular usuário a grupos: hoje o backend expõe pelo lado do grupo
   * (`PUT /rbac/grupos/{id}/usuarios`). Mantido em MockStore até um
   * endpoint dedicado ao usuário existir.
   */
  vincularGrupos(id: string, grupoIds: string[]): Observable<Usuario> {
    const atual = this.store.usuarios().find(u => u.id === id);
    if (!atual) return simularErro('Usuário não encontrado', 404);
    const atualizado = { ...atual, grupoIds, atualizadoEm: agora() };
    this.store.usuarios.update(list => list.map(u => (u.id === id ? atualizado : u)));
    this.store.persist('usuarios');
    return simularRequisicao(atualizado);
  }

  private aplicarFiltrosClient(lista: Usuario[], filter: UsuarioFilter): Usuario[] {
    let out = lista;
    if (filter.q) {
      const q = filter.q.toLowerCase();
      out = out.filter(u =>
        u.nome.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.login.toLowerCase().includes(q),
      );
    }
    if (filter.ativo !== undefined) out = out.filter(u => u.ativo === filter.ativo);
    if (filter.bloqueado !== undefined) out = out.filter(u => u.bloqueado === filter.bloqueado);
    return out;
  }

  /**
   * Adapta UsuarioResponse do backend para o modelo rico do frontend.
   * Campos ausentes no backend recebem defaults; bloqueio e grupos ainda
   * são gerenciados via MockStore em rotas dedicadas.
   */
  private mapear(src: BackendUsuarioResponse): Usuario {
    return {
      id: src.id,
      nome: src.nome ?? src.username,
      email: src.email ?? '',
      login: src.username,
      ativo: src.ativo,
      bloqueado: false,
      tentativasInvalidas: 0,
      trocarSenhaProximoLogin: false,
      ultimoLogin: null,
      criadoEm: src.createdAt,
      atualizadoEm: src.updatedAt,
      grupoIds: [],
    };
  }
}
