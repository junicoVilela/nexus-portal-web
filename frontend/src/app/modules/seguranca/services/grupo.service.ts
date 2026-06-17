import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResult } from '@shared/models/page-result.model';
import { GrupoAcesso, GrupoAcessoForm } from '../models/grupo-acesso.model';
import { AuditoriaService } from './auditoria.service';
import { MockStore } from './mock/mock-store.service';
import { agora, novoId, paginar, pesquisar, simularErro, simularRequisicao } from './mock/in-memory-store';
import { alterarStatusGenerico } from './internal/alterar-status.helper';

export interface GrupoFilter {
  q?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class GrupoService {
  private readonly store = inject(MockStore);
  private readonly auditoria = inject(AuditoriaService);

  private comTotalUsuarios(g: GrupoAcesso): GrupoAcesso {
    const total = this.store.usuarios().filter(u => u.grupoIds?.includes(g.id)).length;
    return { ...g, totalUsuarios: total };
  }

  listar(filter: GrupoFilter = {}): Observable<PageResult<GrupoAcesso>> {
    const lista = pesquisar(this.store.grupos(), filter.q, ['nome', 'codigo']);
    const filtrada = lista.filter(g => filter.ativo === undefined || g.ativo === filter.ativo);
    const result = paginar(filtrada, { page: filter.page ?? 1, size: filter.size ?? 20 });
    return simularRequisicao({
      ...result,
      items: result.items.map(g => this.comTotalUsuarios(g)),
    });
  }

  listarTodos(): Observable<GrupoAcesso[]> {
    return simularRequisicao(this.store.grupos().map(g => this.comTotalUsuarios(g)));
  }

  buscarPorId(id: string): Observable<GrupoAcesso> {
    const g = this.store.grupos().find(x => x.id === id);
    return g ? simularRequisicao(this.comTotalUsuarios(g)) : simularErro('Grupo não encontrado', 404);
  }

  criar(form: GrupoAcessoForm): Observable<GrupoAcesso> {
    if (this.store.grupos().some(g => g.codigo === form.codigo)) {
      return simularErro('Código já cadastrado', 409);
    }
    if (this.store.grupos().some(g => g.nome === form.nome)) {
      return simularErro('Nome já cadastrado', 409);
    }
    const grupo: GrupoAcesso = {
      id: novoId(),
      nome: form.nome,
      codigo: form.codigo,
      descricao: form.descricao ?? null,
      ativo: form.ativo,
      criadoEm: agora(),
      atualizadoEm: null,
      permissaoIds: [],
    };
    this.store.grupos.update(list => [grupo, ...list]);
    this.store.persist('grupos');
    this.auditoria.registrar({
      acao: 'GRUPO_ACESSO:CRIAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'GRUPO_ACESSO',
      recursoTipo: 'grupo-acesso',
      recursoId: grupo.id,
      dadosNovos: { ...grupo },
    });
    return simularRequisicao(grupo);
  }

  atualizar(id: string, form: GrupoAcessoForm): Observable<GrupoAcesso> {
    const atual = this.store.grupos().find(g => g.id === id);
    if (!atual) return simularErro('Grupo não encontrado', 404);
    const atualizado = {
      ...atual,
      nome: form.nome,
      codigo: form.codigo,
      descricao: form.descricao ?? null,
      ativo: form.ativo,
      atualizadoEm: agora(),
    };
    this.store.grupos.update(list => list.map(g => (g.id === id ? atualizado : g)));
    this.store.persist('grupos');
    this.auditoria.registrar({
      acao: 'GRUPO_ACESSO:EDITAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'GRUPO_ACESSO',
      recursoTipo: 'grupo-acesso',
      recursoId: id,
      dadosAnteriores: { ...atual },
      dadosNovos: { ...atualizado },
    });
    return simularRequisicao(atualizado);
  }

  alterarStatus(id: string, ativo: boolean): Observable<GrupoAcesso> {
    return alterarStatusGenerico<GrupoAcesso>(
      this.store,
      this.auditoria,
      { entidadeKey: 'grupos', msgNaoEncontrado: 'Grupo não encontrado', funcionalidade: 'GRUPO_ACESSO', recursoTipo: 'grupo-acesso' },
      id,
      ativo,
    );
  }

  vincularPermissoes(grupoId: string, permissaoIds: string[]): Observable<void> {
    if (grupoId === this.store.ADMIN_GROUP_ID) {
      // ADMIN sempre tem todas as permissões.
      return simularRequisicao(undefined);
    }
    const atual = this.store.grupos().find(g => g.id === grupoId);
    this.store.grupos.update(list =>
      list.map(g => (g.id === grupoId ? { ...g, permissaoIds, atualizadoEm: agora() } : g)),
    );
    this.store.persist('grupos');
    this.auditoria.registrar({
      acao: 'GRUPO_ACESSO:VINCULAR_PERMISSAO',
      dominio: 'SEGURANCA',
      funcionalidade: 'GRUPO_ACESSO',
      recursoTipo: 'grupo-acesso',
      recursoId: grupoId,
      dadosAnteriores: { permissaoIds: atual?.permissaoIds ?? [] },
      dadosNovos: { permissaoIds },
    });
    return simularRequisicao(undefined);
  }

  listarMembros(grupoId: string): Observable<string[]> {
    return simularRequisicao(
      this.store
        .usuarios()
        .filter(u => u.grupoIds?.includes(grupoId))
        .map(u => u.id),
    );
  }
}
