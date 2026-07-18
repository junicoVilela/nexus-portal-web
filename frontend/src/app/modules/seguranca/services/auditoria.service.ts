import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { Auditoria, AuditoriaResultado } from '../models/auditoria.model';
import { MockStore } from './mock/mock-store.service';
import { agora, novoId } from './mock/in-memory-store';
import { lerSub } from '@core/auth/utils/jwt-claims';

export interface AuditoriaFilter {
  usuarioId?: string;
  /** Busca textual em acao/mensagem. */
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
  /** Quando omitido, é resolvido pelo token JWT presente em localStorage. */
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

const TOKEN_KEY = 'doc-flow-jwt';

const CAMPOS_SENSIVEIS = new Set(['senha', 'senhaHash', 'password', 'passwordHash', 'token', 'refreshToken']);

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
  private readonly store = inject(MockStore);
  private readonly base = environment.rbacApiUrl;

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

  /** Lê o id do usuário logado a partir do JWT em localStorage. */
  private usuarioAtual(): { id: string | null; login: string | null } {
    const sub = lerSub(localStorage.getItem(TOKEN_KEY));
    if (!sub) return { id: null, login: null };
    const u = this.store.usuarios().find(x => x.id === sub);
    return { id: sub, login: u?.login ?? null };
  }

  /**
   * Registra um evento localmente. Continua alimentando o MockStore para
   * suportar os services que ainda não migraram para HTTP real (permissao,
   * dominio, funcionalidade, etc.). Serviços já migrados (grupo, usuario)
   * NÃO chamam mais este método — o backend registra a auditoria deles.
   */
  registrar(ev: RegistrarEvento): void {
    const ator = this.usuarioAtual();
    const reg: Auditoria = {
      id: novoId(),
      usuarioId: ev.usuarioId === undefined ? ator.id : ev.usuarioId,
      usuarioLogin: ev.usuarioLogin ?? ator.login,
      acao: ev.acao,
      dominio: ev.dominio ?? null,
      funcionalidade: ev.funcionalidade ?? null,
      recursoTipo: ev.recursoTipo ?? null,
      recursoId: ev.recursoId ?? null,
      ipOrigem: null,
      dadosAnteriores: this.sanitizar(ev.dadosAnteriores ?? null),
      dadosNovos: this.sanitizar(ev.dadosNovos ?? null),
      resultado: ev.resultado ?? 'SUCESSO',
      mensagem: ev.mensagem ?? null,
      criadoEm: agora(),
    };
    this.store.auditoria.update(list => [reg, ...list].slice(0, environment.mockHistoryCap));
    this.store.persist('auditoria');
  }

  /**
   * Lista eventos de auditoria. Prioriza o backend; se falhar (offline,
   * sem permissão) cai para os eventos locais do MockStore — assim a tela
   * de auditoria continua exibindo os eventos gerados pelos mocks locais
   * enquanto os demais services não são migrados.
   */
  listar(filter: AuditoriaFilter = {}): Observable<PageResult<Auditoria>> {
    const page = filter.page ?? 1;
    const size = filter.size ?? 20;
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    // Ordenação default (mais recentes primeiro) já é o comportamento do backend.
    return this.http.get<PageResult<BackendAuditoriaResponse>>(`${this.base}/auditoria`, { params }).pipe(
      map(res => this.combinarComLocal(res, filter)),
      catchError(() => of(this.paginarLocal(filter, page, size))),
    );
  }

  /** Lista distinta de ações registradas localmente (para filtro de UI). */
  acoes(): string[] {
    return [...new Set(this.store.auditoria().map(a => a.acao))].sort();
  }

  /**
   * Combina resultado do backend com filtros client-side (o endpoint ainda
   * não expõe todos os filtros; enquanto isso, filtramos aqui em cima da
   * página retornada — degrada quando os dados não cabem numa página, mas
   * viabiliza o MVP).
   */
  private combinarComLocal(
    res: PageResult<BackendAuditoriaResponse>,
    filter: AuditoriaFilter,
  ): PageResult<Auditoria> {
    const mapeados = res.items.map(item => this.mapear(item));
    const filtrados = this.aplicarFiltros(mapeados, filter);
    return { ...res, items: filtrados, totalItems: filtrados.length };
  }

  private paginarLocal(filter: AuditoriaFilter, page: number, size: number): PageResult<Auditoria> {
    const filtrados = this.aplicarFiltros(this.store.auditoria(), filter);
    const start = (page - 1) * size;
    const items = filtrados.slice(start, start + size);
    return {
      items,
      page,
      size,
      totalItems: filtrados.length,
      totalPages: Math.max(1, Math.ceil(filtrados.length / size)),
      first: page === 1,
      last: start + size >= filtrados.length,
    };
  }

  private aplicarFiltros(lista: Auditoria[], filter: AuditoriaFilter): Auditoria[] {
    let out = lista;
    if (filter.usuarioId) out = out.filter(a => a.usuarioId === filter.usuarioId);
    if (filter.acao) out = out.filter(a => a.acao === filter.acao);
    if (filter.recursoTipo) out = out.filter(a => a.recursoTipo === filter.recursoTipo);
    if (filter.resultado) out = out.filter(a => a.resultado === filter.resultado);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      out = out.filter(a => a.acao.toLowerCase().includes(q) || (a.mensagem ?? '').toLowerCase().includes(q));
    }
    if (filter.inicio) {
      const inicio = new Date(filter.inicio + 'T00:00:00').getTime();
      out = out.filter(a => new Date(a.criadoEm).getTime() >= inicio);
    }
    if (filter.fim) {
      const fim = new Date(filter.fim + 'T23:59:59').getTime();
      out = out.filter(a => new Date(a.criadoEm).getTime() <= fim);
    }
    return out;
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

  /**
   * Ações do backend hoje são livres (ex.: "CRIAR", "EDITAR"). Se algum
   * módulo passar a usar o padrão FUNCIONALIDADE:ACAO, quebramos aqui.
   */
  private decompor(acao: string): [string | null, string | null] {
    if (!acao || !acao.includes(':')) return [null, null];
    const [funcionalidade] = acao.split(':');
    return [null, funcionalidade];
  }
}
