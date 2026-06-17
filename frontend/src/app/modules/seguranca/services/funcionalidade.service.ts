import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResult } from '@shared/models/page-result.model';
import { Funcionalidade, FuncionalidadeForm } from '../models/funcionalidade.model';
import { AuditoriaService } from './auditoria.service';
import { MockStore } from './mock/mock-store.service';
import { agora, novoId, paginar, pesquisar, simularErro, simularRequisicao } from './mock/in-memory-store';
import { alterarStatusGenerico } from './internal/alterar-status.helper';

export interface FuncionalidadeFilter {
  q?: string;
  dominioId?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class FuncionalidadeService {
  private readonly store = inject(MockStore);
  private readonly auditoria = inject(AuditoriaService);

  listar(filter: FuncionalidadeFilter = {}): Observable<PageResult<Funcionalidade>> {
    const lista = pesquisar(this.store.funcionalidades(), filter.q, ['nome', 'codigo']);
    const filtrada = lista.filter(f => {
      if (filter.dominioId && f.dominioId !== filter.dominioId) return false;
      if (filter.ativo !== undefined && f.ativo !== filter.ativo) return false;
      return true;
    });
    return simularRequisicao(paginar(filtrada, { page: filter.page ?? 1, size: filter.size ?? 100 }));
  }

  listarPorDominio(dominioId: string): Observable<Funcionalidade[]> {
    return simularRequisicao(this.store.funcionalidades().filter(f => f.dominioId === dominioId));
  }

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
      acao: 'FUNCIONALIDADE:CRIAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'FUNCIONALIDADE',
      recursoTipo: 'funcionalidade',
      recursoId: f.id,
      dadosNovos: { ...f },
    });
    return simularRequisicao(f);
  }

  atualizar(id: string, form: FuncionalidadeForm): Observable<Funcionalidade> {
    const atual = this.store.funcionalidades().find(f => f.id === id);
    if (!atual) return simularErro('Funcionalidade não encontrada', 404);
    const dominio = this.store.dominios().find(d => d.id === form.dominioId);
    const atualizado = {
      ...atual,
      ...form,
      dominioCodigo: dominio?.codigo,
      descricao: form.descricao ?? null,
      atualizadoEm: agora(),
    };
    this.store.funcionalidades.update(list => list.map(f => (f.id === id ? atualizado : f)));
    this.store.persist('funcionalidades');
    this.auditoria.registrar({
      acao: 'FUNCIONALIDADE:EDITAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'FUNCIONALIDADE',
      recursoTipo: 'funcionalidade',
      recursoId: id,
      dadosAnteriores: { ...atual },
      dadosNovos: { ...atualizado },
    });
    return simularRequisicao(atualizado);
  }

  alterarStatus(id: string, ativo: boolean): Observable<Funcionalidade> {
    return alterarStatusGenerico<Funcionalidade>(
      this.store,
      this.auditoria,
      { entidadeKey: 'funcionalidades', msgNaoEncontrado: 'Funcionalidade não encontrada', funcionalidade: 'FUNCIONALIDADE', recursoTipo: 'funcionalidade' },
      id,
      ativo,
    );
  }
}
