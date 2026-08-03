import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { Auditoria, AuditoriaResultado } from '../models/auditoria.model';

export interface AuditoriaFilter {
  /** Login do usuário (createdBy no backend). */
  usuario?: string;
  usuarioId?: string;
  /** Busca textual em acao/mensagem (client-side na página retornada). */
  q?: string;
  acao?: string;
  recursoTipo?: string;
  resultado?: AuditoriaResultado;
  inicio?: string;
  fim?: string;
  page?: number;
  size?: number;
}

export interface RegistrarEvento {
  usuarioId?: string | null;
  usuarioLogin?: string | null;
  acao: string;
  dominio?: string | null;
  funcionalidade?: string | null;
  recursoTipo?: string | null;
  recursoId?: string | null;
  dadosAnteriores?: Record<string, unknown> | null;
  dadosNovos?: Record<string, unknown> | null;
  resultado?: AuditoriaResultado;
  mensagem?: string | null;
}

const CAMPOS_SENSIVEIS = new Set(['senha', 'senhaHash', 'password', 'passwordHash', 'token', 'refreshToken']);

const ACOES_COMUNS = [
  'CRIAR',
  'EDITAR',
  'ATIVAR',
  'INATIVAR',
  'EXCLUIR',
  'VISUALIZAR',
  'LOGIN',
  'LOGOUT',
];

/** Resposta bruta do endpoint /api/v1/rbac/auditoria (backend). */
interface BackendAuditoriaResponse {
  id: string;
  entidade: string;
  entidadeId: string | null;
  acao: string;
  descricao: string | null;
  createdAt: string;
  createdBy: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.rbacApiUrl;
  private readonly ultimasAcoes = signal<string[]>([]);

  /** Remove campos sensíveis recursivamente (não muta o original). */
  sanitizar<T>(obj: T): T | null {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) return obj.map(v => this.sanitizar(v)) as unknown as T;
    if (typeof obj !== 'object') return obj;
    const limpo: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (CAMPOS_SENSIVEIS.has(k)) continue;
      limpo[k] = typeof v === 'object' ? this.sanitizar(v) : v;
    }
    return limpo as T;
  }

  /**
   * @deprecated Auditoria é registrada pelo backend. Mantido como no-op para
   * compatibilidade com callers legados.
   */
  registrar(_ev: RegistrarEvento): void {
    // no-op
  }

  listar(filter: AuditoriaFilter = {}): Observable<PageResult<Auditoria>> {
    const page = filter.page ?? 1;
    const size = filter.size ?? 20;
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (filter.usuario) params = params.set('usuario', filter.usuario);
    if (filter.acao) params = params.set('acao', filter.acao);
    if (filter.recursoTipo) params = params.set('entidade', filter.recursoTipo);
    if (filter.inicio) params = params.set('inicio', `${filter.inicio}T00:00:00Z`);
    if (filter.fim) params = params.set('fim', `${filter.fim}T23:59:59Z`);

    return this.http.get<PageResult<BackendAuditoriaResponse>>(`${this.base}/auditoria`, { params }).pipe(
      map(res => this.aplicarFiltrosLocais(res, filter)),
      tap(res => {
        const acoes = [...new Set(res.items.map(a => a.acao))];
        if (acoes.length > 0) {
          this.ultimasAcoes.update(prev => [...new Set([...prev, ...acoes])]);
        }
      }),
    );
  }

  /** Lista de ações para filtros de UI (comuns + observadas na última consulta). */
  acoes(): string[] {
    return [...new Set([...ACOES_COMUNS, ...this.ultimasAcoes()])].sort();
  }

  private aplicarFiltrosLocais(
    res: PageResult<BackendAuditoriaResponse>,
    filter: AuditoriaFilter,
  ): PageResult<Auditoria> {
    let items = res.items.map(item => this.mapear(item));
    if (filter.q) {
      const q = filter.q.toLowerCase();
      items = items.filter(a => a.acao.toLowerCase().includes(q) || (a.mensagem ?? '').toLowerCase().includes(q));
    }
    if (filter.resultado) {
      items = items.filter(a => a.resultado === filter.resultado);
    }
    return {
      ...res,
      items,
      totalItems: filter.q || filter.resultado ? items.length : res.totalItems,
    };
  }

  /** Adapta o AuditoriaResponse mais simples do backend para o modelo rico do frontend. */
  private mapear(src: BackendAuditoriaResponse): Auditoria {
    const [dominio, funcionalidadeParteAcao] = this.decompor(src.acao);
    return {
      id: src.id,
      usuarioId: null,
      usuarioLogin: src.createdBy,
      acao: src.acao,
      dominio,
      funcionalidade: funcionalidadeParteAcao,
      recursoTipo: src.entidade ? src.entidade.toLowerCase() : null,
      recursoId: src.entidadeId,
      ipOrigem: null,
      dadosAnteriores: null,
      dadosNovos: null,
      resultado: 'SUCESSO',
      mensagem: src.descricao,
      criadoEm: src.createdAt,
    };
  }

  private decompor(acao: string): [string | null, string | null] {
    if (!acao || !acao.includes(':')) return [null, null];
    const [funcionalidade] = acao.split(':');
    return [null, funcionalidade];
  }
}
