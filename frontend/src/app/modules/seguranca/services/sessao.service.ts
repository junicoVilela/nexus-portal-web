import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResult } from '@shared/models/page-result.model';
import { SessaoUsuario } from '../models/sessao.model';
import { AuditoriaService } from './auditoria.service';
import { MockStore } from './mock/mock-store.service';
import { agora, novoId, paginar, simularErro, simularRequisicao } from './mock/in-memory-store';

export interface SessaoFilter {
  usuarioId?: string;
  /** true = apenas ativas; false = apenas encerradas; undefined = todas. */
  ativa?: boolean;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class SessaoService {
  private readonly store = inject(MockStore);
  private readonly auditoria = inject(AuditoriaService);

  /** Cria uma sessão nova (chamado pelo AuthApiService no login). */
  abrir(usuarioId: string, userAgent: string | null): SessaoUsuario {
    const sessao: SessaoUsuario = {
      id: novoId(),
      usuarioId,
      ipOrigem: null,
      userAgent,
      ativa: true,
      revogada: false,
      iniciadaEm: agora(),
      encerradaEm: null,
      motivoEncerramento: null,
    };
    this.store.sessoes.update(list => [sessao, ...list]);
    this.store.persist('sessoes');
    return sessao;
  }

  /** Encerra a sessão por logout. Não conta como revogação administrativa. */
  encerrarPorLogout(sessaoId: string): void {
    this.store.sessoes.update(list =>
      list.map(s =>
        s.id === sessaoId && s.ativa
          ? { ...s, ativa: false, encerradaEm: agora(), motivoEncerramento: 'Logout' }
          : s,
      ),
    );
    this.store.persist('sessoes');
  }

  /** Sessão ativa pelo id (usado pelo refresh). */
  obterAtiva(sessaoId: string): SessaoUsuario | undefined {
    return this.store.sessoes().find(s => s.id === sessaoId && s.ativa);
  }

  listar(filter: SessaoFilter = {}): Observable<PageResult<SessaoUsuario>> {
    let lista = this.store.sessoes();
    if (filter.usuarioId) lista = lista.filter(s => s.usuarioId === filter.usuarioId);
    if (filter.ativa !== undefined) lista = lista.filter(s => s.ativa === filter.ativa);
    return simularRequisicao(paginar(lista, { page: filter.page ?? 1, size: filter.size ?? 20 }));
  }

  revogar(sessaoId: string, motivo = 'Revogada manualmente'): Observable<SessaoUsuario> {
    const atual = this.store.sessoes().find(s => s.id === sessaoId);
    if (!atual) return simularErro('Sessão não encontrada', 404);
    if (!atual.ativa) return simularErro('Sessão já está encerrada', 400);
    const revogada: SessaoUsuario = {
      ...atual,
      ativa: false,
      revogada: true,
      encerradaEm: agora(),
      motivoEncerramento: motivo,
    };
    this.store.sessoes.update(list => list.map(s => (s.id === sessaoId ? revogada : s)));
    this.store.persist('sessoes');
    this.auditoria.registrar({
      acao: 'SESSAO:REVOGAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'SESSAO',
      recursoTipo: 'sessao',
      recursoId: sessaoId,
      dadosAnteriores: { ativa: true },
      dadosNovos: { ativa: false, revogada: true, motivo },
    });
    return simularRequisicao(revogada);
  }
}
