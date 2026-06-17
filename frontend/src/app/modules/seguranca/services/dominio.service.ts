import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResult } from '@shared/models/page-result.model';
import { Dominio, DominioForm } from '../models/dominio.model';
import { AuditoriaService } from './auditoria.service';
import { MockStore } from './mock/mock-store.service';
import { agora, novoId, paginar, pesquisar, simularErro, simularRequisicao } from './mock/in-memory-store';
import { alterarStatusGenerico } from './internal/alterar-status.helper';

export interface DominioFilter {
  q?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class DominioService {
  private readonly store = inject(MockStore);
  private readonly auditoria = inject(AuditoriaService);

  listar(filter: DominioFilter = {}): Observable<PageResult<Dominio>> {
    const lista = pesquisar(this.store.dominios(), filter.q, ['nome', 'codigo']);
    const filtrada = lista.filter(d => filter.ativo === undefined || d.ativo === filter.ativo);
    return simularRequisicao(paginar(filtrada, { page: filter.page ?? 1, size: filter.size ?? 50 }));
  }

  listarTodos(): Observable<Dominio[]> {
    return simularRequisicao(this.store.dominios());
  }

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
      acao: 'DOMINIO:CRIAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'DOMINIO',
      recursoTipo: 'dominio',
      recursoId: d.id,
      dadosNovos: { ...d },
    });
    return simularRequisicao(d);
  }

  atualizar(id: string, form: DominioForm): Observable<Dominio> {
    const atual = this.store.dominios().find(d => d.id === id);
    if (!atual) return simularErro('Domínio não encontrado', 404);
    const atualizado = {
      ...atual,
      ...form,
      descricao: form.descricao ?? null,
      atualizadoEm: agora(),
    };
    this.store.dominios.update(list => list.map(d => (d.id === id ? atualizado : d)));
    this.store.persist('dominios');
    this.auditoria.registrar({
      acao: 'DOMINIO:EDITAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'DOMINIO',
      recursoTipo: 'dominio',
      recursoId: id,
      dadosAnteriores: { ...atual },
      dadosNovos: { ...atualizado },
    });
    return simularRequisicao(atualizado);
  }

  alterarStatus(id: string, ativo: boolean): Observable<Dominio> {
    return alterarStatusGenerico<Dominio>(
      this.store,
      this.auditoria,
      { entidadeKey: 'dominios', msgNaoEncontrado: 'Domínio não encontrado', funcionalidade: 'DOMINIO', recursoTipo: 'dominio' },
      id,
      ativo,
    );
  }
}
