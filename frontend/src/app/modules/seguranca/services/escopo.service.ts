import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EscopoAcesso, EscopoAcessoForm } from '../models/escopo-acesso.model';
import { AuditoriaService } from './auditoria.service';
import { MockStore } from './mock/mock-store.service';
import { agora, novoId, simularErro, simularRequisicao } from './mock/in-memory-store';
import { alterarStatusGenerico } from './internal/alterar-status.helper';

@Injectable({ providedIn: 'root' })
export class EscopoService {
  private readonly store = inject(MockStore);
  private readonly auditoria = inject(AuditoriaService);

  listarPorUsuario(usuarioId: string): Observable<EscopoAcesso[]> {
    return simularRequisicao(this.store.escopos().filter(e => e.usuarioId === usuarioId));
  }

  listarPorGrupo(grupoAcessoId: string): Observable<EscopoAcesso[]> {
    return simularRequisicao(this.store.escopos().filter(e => e.grupoAcessoId === grupoAcessoId));
  }

  listarTodos(): Observable<EscopoAcesso[]> {
    return simularRequisicao(this.store.escopos());
  }

  criar(form: EscopoAcessoForm): Observable<EscopoAcesso> {
    if (!form.usuarioId && !form.grupoAcessoId) {
      return simularErro('Informe usuário ou grupo', 400);
    }
    const escopo: EscopoAcesso = {
      id: novoId(),
      usuarioId: form.usuarioId ?? null,
      grupoAcessoId: form.grupoAcessoId ?? null,
      clienteId: form.clienteId ?? null,
      ambienteId: form.ambienteId ?? null,
      produtoId: form.produtoId ?? null,
      tipoAmbiente: form.tipoAmbiente ?? null,
      somenteLeitura: form.somenteLeitura,
      ativo: form.ativo,
      criadoEm: agora(),
      atualizadoEm: null,
    };
    this.store.escopos.update(list => [escopo, ...list]);
    this.store.persist('escopos');
    this.auditoria.registrar({
      acao: 'ESCOPO:CRIAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'ESCOPO',
      recursoTipo: 'escopo',
      recursoId: escopo.id,
      dadosNovos: { ...escopo },
    });
    return simularRequisicao(escopo);
  }

  atualizar(id: string, form: EscopoAcessoForm): Observable<EscopoAcesso> {
    const atual = this.store.escopos().find(e => e.id === id);
    if (!atual) return simularErro('Escopo não encontrado', 404);
    const atualizado: EscopoAcesso = {
      ...atual,
      clienteId: form.clienteId ?? null,
      ambienteId: form.ambienteId ?? null,
      produtoId: form.produtoId ?? null,
      tipoAmbiente: form.tipoAmbiente ?? null,
      somenteLeitura: form.somenteLeitura,
      ativo: form.ativo,
      atualizadoEm: agora(),
    };
    this.store.escopos.update(list => list.map(e => (e.id === id ? atualizado : e)));
    this.store.persist('escopos');
    this.auditoria.registrar({
      acao: 'ESCOPO:EDITAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'ESCOPO',
      recursoTipo: 'escopo',
      recursoId: id,
      dadosAnteriores: { ...atual },
      dadosNovos: { ...atualizado },
    });
    return simularRequisicao(atualizado);
  }

  alterarStatus(id: string, ativo: boolean): Observable<EscopoAcesso> {
    return alterarStatusGenerico<EscopoAcesso>(
      this.store,
      this.auditoria,
      { entidadeKey: 'escopos', msgNaoEncontrado: 'Escopo não encontrado', funcionalidade: 'ESCOPO', recursoTipo: 'escopo' },
      id,
      ativo,
    );
  }

  remover(id: string): Observable<void> {
    const atual = this.store.escopos().find(e => e.id === id);
    if (!atual) {
      return simularErro('Escopo não encontrado', 404);
    }
    this.store.escopos.update(list => list.filter(e => e.id !== id));
    this.store.persist('escopos');
    this.auditoria.registrar({
      acao: 'ESCOPO:EXCLUIR',
      dominio: 'SEGURANCA',
      funcionalidade: 'ESCOPO',
      recursoTipo: 'escopo',
      recursoId: id,
      dadosAnteriores: { ...atual },
    });
    return simularRequisicao(undefined);
  }
}
