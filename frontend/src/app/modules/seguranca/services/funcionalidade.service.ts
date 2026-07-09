import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { Funcionalidade, FuncionalidadeForm } from '../models/funcionalidade.model';
import { AuditoriaService } from './auditoria.service';
import { MockStore } from './mock/mock-store.service';
import { agora, novoId, simularErro, simularRequisicao } from './mock/in-memory-store';
import { alterarStatusGenerico } from './internal/alterar-status.helper';

export interface FuncionalidadeFilter {
  q?: string;
  dominioId?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
}

interface BackendFuncionalidadeResponse {
  id: string;
  dominioId: string;
  dominioCodigo: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class FuncionalidadeService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(MockStore);
  private readonly auditoria = inject(AuditoriaService);
  private readonly base = `${environment.rbacApiUrl}/catalogo/funcionalidades`;

  listar(filter: FuncionalidadeFilter = {}): Observable<PageResult<Funcionalidade>> {
    return this.listarTodos().pipe(map(all => this.paginar(this.aplicarFiltros(all, filter), filter)));
  }

  listarPorDominio(dominioId: string): Observable<Funcionalidade[]> {
    return this.listarTodos().pipe(map(all => all.filter(f => f.dominioId === dominioId)));
  }

  private listarTodos(): Observable<Funcionalidade[]> {
    return this.http.get<BackendFuncionalidadeResponse[]>(this.base).pipe(
      map(list => list.map(f => this.mapear(f))),
      tap(list => {
        this.store.funcionalidades.set(list);
        this.store.persist('funcionalidades');
      }),
    );
  }

  private aplicarFiltros(lista: Funcionalidade[], filter: FuncionalidadeFilter): Funcionalidade[] {
    let out = lista;
    if (filter.q) {
      const q = filter.q.toLowerCase();
      out = out.filter(f => f.nome.toLowerCase().includes(q) || f.codigo.toLowerCase().includes(q));
    }
    if (filter.dominioId) out = out.filter(f => f.dominioId === filter.dominioId);
    if (filter.ativo !== undefined) out = out.filter(f => f.ativo === filter.ativo);
    return out;
  }

  private paginar(lista: Funcionalidade[], filter: FuncionalidadeFilter): PageResult<Funcionalidade> {
    const page = filter.page ?? 1;
    const size = filter.size ?? 100;
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
  criar(form: FuncionalidadeForm): Observable<Funcionalidade> {
    if (this.store.funcionalidades().some(f => f.codigo === form.codigo)) {
      return simularErro('Código já cadastrado', 409);
    }
    const dominio = this.store.dominios().find(d => d.id === form.dominioId);
    if (!dominio) return simularErro('Domínio inválido', 400);
    const f: Funcionalidade = {
      id: novoId(),
      dominioId: form.dominioId,
      dominioCodigo: dominio.codigo,
      nome: form.nome,
      codigo: form.codigo,
      descricao: form.descricao ?? null,
      ativo: form.ativo,
      criadoEm: agora(),
      atualizadoEm: null,
    };
    this.store.funcionalidades.update(list => [f, ...list]);
    this.store.persist('funcionalidades');
    this.auditoria.registrar({
      acao: 'FUNCIONALIDADE:CRIAR', dominio: 'SEGURANCA', funcionalidade: 'FUNCIONALIDADE',
      recursoTipo: 'funcionalidade', recursoId: f.id, dadosNovos: { ...f },
    });
    return simularRequisicao(f);
  }

  atualizar(id: string, form: FuncionalidadeForm): Observable<Funcionalidade> {
    const atual = this.store.funcionalidades().find(f => f.id === id);
    if (!atual) return simularErro('Funcionalidade não encontrada', 404);
    const dominio = this.store.dominios().find(d => d.id === form.dominioId);
    const atualizado: Funcionalidade = {
      ...atual,
      ...form,
      dominioCodigo: dominio?.codigo,
      descricao: form.descricao ?? null,
      atualizadoEm: agora(),
    };
    this.store.funcionalidades.update(list => list.map(f => (f.id === id ? atualizado : f)));
    this.store.persist('funcionalidades');
    this.auditoria.registrar({
      acao: 'FUNCIONALIDADE:EDITAR', dominio: 'SEGURANCA', funcionalidade: 'FUNCIONALIDADE',
      recursoTipo: 'funcionalidade', recursoId: id,
      dadosAnteriores: { ...atual }, dadosNovos: { ...atualizado },
    });
    return simularRequisicao(atualizado);
  }

  alterarStatus(id: string, ativo: boolean): Observable<Funcionalidade> {
    return alterarStatusGenerico<Funcionalidade>(
      this.store, this.auditoria,
      { entidadeKey: 'funcionalidades', msgNaoEncontrado: 'Funcionalidade não encontrada',
        funcionalidade: 'FUNCIONALIDADE', recursoTipo: 'funcionalidade' },
      id, ativo,
    );
  }

  private mapear(src: BackendFuncionalidadeResponse): Funcionalidade {
    return {
      id: src.id,
      dominioId: src.dominioId,
      dominioCodigo: src.dominioCodigo,
      nome: src.nome,
      codigo: src.codigo,
      descricao: src.descricao,
      ativo: src.ativo,
      criadoEm: src.createdAt,
      atualizadoEm: src.updatedAt,
    };
  }
}
