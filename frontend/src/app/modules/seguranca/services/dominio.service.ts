import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { Dominio, DominioForm } from '../models/dominio.model';
import { AuditoriaService } from './auditoria.service';
import { MockStore } from './mock/mock-store.service';
import { agora, novoId, simularErro, simularRequisicao } from './mock/in-memory-store';
import { alterarStatusGenerico } from './internal/alterar-status.helper';

export interface DominioFilter {
  q?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
}

interface BackendDominioResponse {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class DominioService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(MockStore);
  private readonly auditoria = inject(AuditoriaService);
  private readonly base = `${environment.rbacApiUrl}/catalogo/dominios`;

  listar(filter: DominioFilter = {}): Observable<PageResult<Dominio>> {
    return this.listarTodos().pipe(map(all => this.paginar(this.aplicarFiltros(all, filter), filter)));
  }

  listarTodos(): Observable<Dominio[]> {
    return this.http.get<BackendDominioResponse[]>(this.base).pipe(
      map(list => list.map(d => this.mapear(d))),
      tap(list => {
        this.store.dominios.set(list);
        this.store.persist('dominios');
      }),
    );
  }

  private aplicarFiltros(lista: Dominio[], filter: DominioFilter): Dominio[] {
    let out = lista;
    if (filter.q) {
      const q = filter.q.toLowerCase();
      out = out.filter(d => d.nome.toLowerCase().includes(q) || d.codigo.toLowerCase().includes(q));
    }
    if (filter.ativo !== undefined) out = out.filter(d => d.ativo === filter.ativo);
    return out;
  }

  private paginar(lista: Dominio[], filter: DominioFilter): PageResult<Dominio> {
    const page = filter.page ?? 1;
    const size = filter.size ?? 50;
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
  // a tela de matriz continua alterando o catálogo apenas em memória.
  criar(form: DominioForm): Observable<Dominio> {
    if (this.store.dominios().some(d => d.codigo === form.codigo)) {
      return simularErro('Código já cadastrado', 409);
    }
    const d: Dominio = {
      id: novoId(),
      nome: form.nome,
      codigo: form.codigo,
      descricao: form.descricao ?? null,
      ativo: form.ativo,
      criadoEm: agora(),
      atualizadoEm: null,
    };
    this.store.dominios.update(list => [d, ...list]);
    this.store.persist('dominios');
    this.auditoria.registrar({
      acao: 'DOMINIO:CRIAR', dominio: 'SEGURANCA', funcionalidade: 'DOMINIO',
      recursoTipo: 'dominio', recursoId: d.id, dadosNovos: { ...d },
    });
    return simularRequisicao(d);
  }

  atualizar(id: string, form: DominioForm): Observable<Dominio> {
    const atual = this.store.dominios().find(d => d.id === id);
    if (!atual) return simularErro('Domínio não encontrado', 404);
    const atualizado: Dominio = {
      ...atual,
      ...form,
      descricao: form.descricao ?? null,
      atualizadoEm: agora(),
    };
    this.store.dominios.update(list => list.map(d => (d.id === id ? atualizado : d)));
    this.store.persist('dominios');
    this.auditoria.registrar({
      acao: 'DOMINIO:EDITAR', dominio: 'SEGURANCA', funcionalidade: 'DOMINIO',
      recursoTipo: 'dominio', recursoId: id,
      dadosAnteriores: { ...atual }, dadosNovos: { ...atualizado },
    });
    return simularRequisicao(atualizado);
  }

  alterarStatus(id: string, ativo: boolean): Observable<Dominio> {
    return alterarStatusGenerico<Dominio>(
      this.store, this.auditoria,
      { entidadeKey: 'dominios', msgNaoEncontrado: 'Domínio não encontrado',
        funcionalidade: 'DOMINIO', recursoTipo: 'dominio' },
      id, ativo,
    );
  }

  private mapear(src: BackendDominioResponse): Dominio {
    return {
      id: src.id,
      nome: src.nome,
      codigo: src.codigo,
      descricao: src.descricao,
      ativo: src.ativo,
      criadoEm: src.createdAt,
      atualizadoEm: src.updatedAt,
    };
  }
}
