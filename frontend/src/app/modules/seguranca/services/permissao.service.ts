import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { Permissao, PermissaoForm } from '../models/permissao.model';
import { AuditoriaService } from './auditoria.service';
import { MockStore } from './mock/mock-store.service';
import { agora, novoId, simularErro, simularRequisicao } from './mock/in-memory-store';
import { alterarStatusGenerico } from './internal/alterar-status.helper';

export interface PermissaoFilter {
  q?: string;
  funcionalidadeId?: string;
  dominioId?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
}

/** Resposta bruta do backend /api/v1/rbac/catalogo/permissoes. */
interface BackendPermissaoResponse {
  id: string;
  funcionalidadeId: string;
  funcionalidadeCodigo: string;
  dominioCodigo: string;
  acao: string;
  codigo: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Catálogo RBAC é read-only no backend. O service continua expondo
 * paginação e filtros pra manter a interface das telas atuais.
 */
@Injectable({ providedIn: 'root' })
export class PermissaoService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(MockStore);
  private readonly auditoria = inject(AuditoriaService);
  private readonly base = `${environment.rbacApiUrl}/catalogo/permissoes`;

  listar(filter: PermissaoFilter = {}): Observable<PageResult<Permissao>> {
    return this.listarTodos().pipe(map(todas => this.paginar(this.aplicarFiltros(todas, filter), filter)));
  }

  listarTodos(): Observable<Permissao[]> {
    return this.http.get<BackendPermissaoResponse[]>(this.base).pipe(
      map(list => list.map(p => this.mapear(p))),
      // Popula o MockStore como cache — GrupoService ainda precisa dele
      // pra traduzir IDs → códigos até todos os consumers virarem HTTP.
      tap(list => {
        this.store.permissoes.set(list);
        this.store.persist('permissoes');
      }),
    );
  }

  private aplicarFiltros(lista: Permissao[], filter: PermissaoFilter): Permissao[] {
    let out = lista;
    if (filter.q) {
      const q = filter.q.toLowerCase();
      out = out.filter(p =>
        p.codigo.toLowerCase().includes(q) || p.acao.toLowerCase().includes(q),
      );
    }
    if (filter.funcionalidadeId) out = out.filter(p => p.funcionalidadeId === filter.funcionalidadeId);
    if (filter.dominioId) {
      const funcIds = this.store
        .funcionalidades()
        .filter(f => f.dominioId === filter.dominioId)
        .map(f => f.id);
      out = out.filter(p => funcIds.includes(p.funcionalidadeId));
    }
    if (filter.ativo !== undefined) out = out.filter(p => p.ativo === filter.ativo);
    return out;
  }

  private paginar(lista: Permissao[], filter: PermissaoFilter): PageResult<Permissao> {
    const page = filter.page ?? 1;
    const size = filter.size ?? 200;
    const start = (page - 1) * size;
    const items = lista.slice(start, start + size);
    return {
      items,
      page,
      size,
      totalItems: lista.length,
      totalPages: Math.max(1, Math.ceil(lista.length / size)),
      first: page === 1,
      last: start + size >= lista.length,
    };
  }

  // TODO(backend): expor mutações no CatalogoController — enquanto isso,
  // a matriz continua alterando o catálogo apenas em memória.
  criar(form: PermissaoForm): Observable<Permissao> {
    if (this.store.permissoes().some(p => p.codigo === form.codigo)) {
      return simularErro('Código já cadastrado', 409);
    }
    const func = this.store.funcionalidades().find(f => f.id === form.funcionalidadeId);
    if (!func) return simularErro('Funcionalidade inválida', 400);
    const p: Permissao = {
      id: novoId(),
      funcionalidadeId: form.funcionalidadeId,
      funcionalidadeCodigo: func.codigo,
      dominioCodigo: func.dominioCodigo,
      acao: form.acao,
      codigo: form.codigo,
      descricao: form.descricao ?? null,
      ativo: form.ativo,
      criadoEm: agora(),
      atualizadoEm: null,
    };
    this.store.permissoes.update(list => [p, ...list]);
    this.store.persist('permissoes');
    this.auditoria.registrar({
      acao: 'PERMISSAO:CRIAR', dominio: 'SEGURANCA', funcionalidade: 'PERMISSAO',
      recursoTipo: 'permissao', recursoId: p.id, dadosNovos: { ...p },
    });
    return simularRequisicao(p);
  }

  atualizar(id: string, form: PermissaoForm): Observable<Permissao> {
    const atual = this.store.permissoes().find(p => p.id === id);
    if (!atual) return simularErro('Permissão não encontrada', 404);
    const func = this.store.funcionalidades().find(f => f.id === form.funcionalidadeId);
    const atualizado: Permissao = {
      ...atual,
      ...form,
      funcionalidadeCodigo: func?.codigo,
      dominioCodigo: func?.dominioCodigo,
      descricao: form.descricao ?? null,
      atualizadoEm: agora(),
    };
    this.store.permissoes.update(list => list.map(p => (p.id === id ? atualizado : p)));
    this.store.persist('permissoes');
    this.auditoria.registrar({
      acao: 'PERMISSAO:EDITAR', dominio: 'SEGURANCA', funcionalidade: 'PERMISSAO',
      recursoTipo: 'permissao', recursoId: id,
      dadosAnteriores: { ...atual }, dadosNovos: { ...atualizado },
    });
    return simularRequisicao(atualizado);
  }

  alterarStatus(id: string, ativo: boolean): Observable<Permissao> {
    return alterarStatusGenerico<Permissao>(
      this.store, this.auditoria,
      { entidadeKey: 'permissoes', msgNaoEncontrado: 'Permissão não encontrada',
        funcionalidade: 'PERMISSAO', recursoTipo: 'permissao' },
      id, ativo,
    );
  }

  private mapear(src: BackendPermissaoResponse): Permissao {
    return {
      id: src.id,
      funcionalidadeId: src.funcionalidadeId,
      funcionalidadeCodigo: src.funcionalidadeCodigo,
      dominioCodigo: src.dominioCodigo,
      acao: src.acao,
      codigo: src.codigo,
      descricao: src.descricao,
      ativo: src.ativo,
      criadoEm: src.createdAt,
      atualizadoEm: src.updatedAt,
    };
  }
}
