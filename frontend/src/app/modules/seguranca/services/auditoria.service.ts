import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { Auditoria, AuditoriaResultado } from '../models/auditoria.model';
import { MockStore } from './mock/mock-store.service';
import { agora, novoId, paginar, simularRequisicao } from './mock/in-memory-store';
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

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly store = inject(MockStore);

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

  /** Lê o id do usuário logado a partir do JWT mockado em localStorage. */
  private usuarioAtual(): { id: string | null; login: string | null } {
    const sub = lerSub(localStorage.getItem(TOKEN_KEY));
    if (!sub) return { id: null, login: null };
    const u = this.store.usuarios().find(x => x.id === sub);
    return { id: sub, login: u?.login ?? null };
  }

  /** Registra um evento. Chamado pelos services após operação sensível. */
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

  listar(filter: AuditoriaFilter = {}): Observable<PageResult<Auditoria>> {
    let lista = this.store.auditoria();
    if (filter.usuarioId) lista = lista.filter(a => a.usuarioId === filter.usuarioId);
    if (filter.acao) lista = lista.filter(a => a.acao === filter.acao);
    if (filter.recursoTipo) lista = lista.filter(a => a.recursoTipo === filter.recursoTipo);
    if (filter.resultado) lista = lista.filter(a => a.resultado === filter.resultado);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      lista = lista.filter(
        a => a.acao.toLowerCase().includes(q) || (a.mensagem ?? '').toLowerCase().includes(q),
      );
    }
    if (filter.inicio) {
      const inicio = new Date(filter.inicio + 'T00:00:00').getTime();
      lista = lista.filter(a => new Date(a.criadoEm).getTime() >= inicio);
    }
    if (filter.fim) {
      const fim = new Date(filter.fim + 'T23:59:59').getTime();
      lista = lista.filter(a => new Date(a.criadoEm).getTime() <= fim);
    }
    return simularRequisicao(paginar(lista, { page: filter.page ?? 1, size: filter.size ?? 20 }));
  }

  /** Lista distinta de ações registradas (para filtro de UI). */
  acoes(): string[] {
    return [...new Set(this.store.auditoria().map(a => a.acao))].sort();
  }
}
