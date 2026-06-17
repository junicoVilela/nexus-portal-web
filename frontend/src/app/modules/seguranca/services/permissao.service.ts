import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResult } from '@shared/models/page-result.model';
import { Permissao, PermissaoForm } from '../models/permissao.model';
import { AuditoriaService } from './auditoria.service';
import { MockStore } from './mock/mock-store.service';
import { agora, novoId, paginar, pesquisar, simularErro, simularRequisicao } from './mock/in-memory-store';
import { alterarStatusGenerico } from './internal/alterar-status.helper';

export interface PermissaoFilter {
  q?: string;
  funcionalidadeId?: string;
  dominioId?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class PermissaoService {
  private readonly store = inject(MockStore);
  private readonly auditoria = inject(AuditoriaService);

  listar(filter: PermissaoFilter = {}): Observable<PageResult<Permissao>> {
    let lista = pesquisar(this.store.permissoes(), filter.q, ['codigo', 'acao']);
    if (filter.funcionalidadeId) {
      lista = lista.filter(p => p.funcionalidadeId === filter.funcionalidadeId);
    }
    if (filter.dominioId) {
      const funcIds = this.store
        .funcionalidades()
        .filter(f => f.dominioId === filter.dominioId)
        .map(f => f.id);
      lista = lista.filter(p => funcIds.includes(p.funcionalidadeId));
    }
    if (filter.ativo !== undefined) {
      lista = lista.filter(p => p.ativo === filter.ativo);
    }
    return simularRequisicao(paginar(lista, { page: filter.page ?? 1, size: filter.size ?? 200 }));
  }

  listarTodos(): Observable<Permissao[]> {
    return simularRequisicao(this.store.permissoes());
  }

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
      acao: 'PERMISSAO:CRIAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'PERMISSAO',
      recursoTipo: 'permissao',
      recursoId: p.id,
      dadosNovos: { ...p },
    });
    return simularRequisicao(p);
  }

  atualizar(id: string, form: PermissaoForm): Observable<Permissao> {
    const atual = this.store.permissoes().find(p => p.id === id);
    if (!atual) return simularErro('Permissão não encontrada', 404);
    const func = this.store.funcionalidades().find(f => f.id === form.funcionalidadeId);
    const atualizado = {
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
      acao: 'PERMISSAO:EDITAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'PERMISSAO',
      recursoTipo: 'permissao',
      recursoId: id,
      dadosAnteriores: { ...atual },
      dadosNovos: { ...atualizado },
    });
    return simularRequisicao(atualizado);
  }

  alterarStatus(id: string, ativo: boolean): Observable<Permissao> {
    return alterarStatusGenerico<Permissao>(
      this.store,
      this.auditoria,
      { entidadeKey: 'permissoes', msgNaoEncontrado: 'Permissão não encontrada', funcionalidade: 'PERMISSAO', recursoTipo: 'permissao' },
      id,
      ativo,
    );
  }
}
