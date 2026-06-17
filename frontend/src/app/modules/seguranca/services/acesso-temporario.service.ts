import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResult } from '@shared/models/page-result.model';
import {
  AcessoTemporario,
  AcessoTemporarioForm,
  AcessoTemporarioStatus,
} from '../models/acesso-temporario.model';
import { AuditoriaService } from './auditoria.service';
import { MockStore } from './mock/mock-store.service';
import { agora, novoId, paginar, simularErro, simularRequisicao } from './mock/in-memory-store';

export interface AcessoTemporarioFilter {
  usuarioId?: string;
  status?: AcessoTemporarioStatus;
  page?: number;
  size?: number;
}

/** Debounce do job de expiração: chamadas dentro dessa janela reutilizam o último resultado. */
const EXPIRAR_THROTTLE_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class AcessoTemporarioService {
  private readonly store = inject(MockStore);
  private readonly auditoria = inject(AuditoriaService);
  private ultimaExpiracao = 0;

  /** Computa o status correto considerando datas e estado atual. */
  private statusEsperado(a: AcessoTemporario, now = Date.now()): AcessoTemporarioStatus {
    if (a.status === 'REVOGADO') return 'REVOGADO';
    if (new Date(a.fimEm).getTime() < now) return 'EXPIRADO';
    if (new Date(a.inicioEm).getTime() > now) return 'AGENDADO';
    return 'ATIVO';
  }

  /**
   * "Job" mock: varre a lista e marca como EXPIRADO os que venceram.
   * Também atualiza AGENDADO → ATIVO automaticamente.
   * Auditoria registrada apenas para EXPIRAÇÃO (regra da spec 026).
   */
  expirarVencidos(force = false): void {
    const now = Date.now();
    if (!force && now - this.ultimaExpiracao < EXPIRAR_THROTTLE_MS) return;
    this.ultimaExpiracao = now;
    const lista = this.store.acessosTemporarios();
    const novos = lista.map(a => {
      const esperado = this.statusEsperado(a, now);
      if (esperado !== a.status && a.status !== 'REVOGADO') {
        if (esperado === 'EXPIRADO') {
          this.auditoria.registrar({
            acao: 'ACESSO_TEMPORARIO:EXPIRAR',
            dominio: 'SEGURANCA',
            funcionalidade: 'ACESSO_TEMPORARIO',
            recursoTipo: 'acesso-temporario',
            recursoId: a.id,
            dadosAnteriores: { status: a.status },
            dadosNovos: { status: 'EXPIRADO' },
            mensagem: 'Expiração automática por vencimento.',
          });
        }
        return { ...a, status: esperado };
      }
      return a;
    });
    if (novos.some((a, i) => a.status !== lista[i].status)) {
      this.store.acessosTemporarios.set(novos);
      this.store.persist('acessosTemporarios');
    }
  }

  listar(filter: AcessoTemporarioFilter = {}): Observable<PageResult<AcessoTemporario>> {
    this.expirarVencidos();
    let lista = this.store.acessosTemporarios();
    if (filter.usuarioId) lista = lista.filter(a => a.usuarioId === filter.usuarioId);
    if (filter.status) lista = lista.filter(a => a.status === filter.status);
    return simularRequisicao(paginar(lista, { page: filter.page ?? 1, size: filter.size ?? 20 }));
  }

  criar(form: AcessoTemporarioForm): Observable<AcessoTemporario> {
    if (!form.grupoAcessoId && !form.permissaoId) {
      return simularErro('Informe um grupo ou uma permissão temporária', 400);
    }
    const inicio = new Date(form.inicioEm).getTime();
    const fim = new Date(form.fimEm).getTime();
    if (isNaN(inicio) || isNaN(fim)) {
      return simularErro('Datas inválidas', 400);
    }
    if (fim <= inicio) {
      return simularErro('A data fim deve ser posterior à data de início', 400);
    }
    const status: AcessoTemporarioStatus = inicio > Date.now() ? 'AGENDADO' : 'ATIVO';
    const acesso: AcessoTemporario = {
      id: novoId(),
      usuarioId: form.usuarioId,
      grupoAcessoId: form.grupoAcessoId ?? null,
      permissaoId: form.permissaoId ?? null,
      escopoAcessoId: form.escopoAcessoId ?? null,
      inicioEm: form.inicioEm,
      fimEm: form.fimEm,
      status,
      justificativa: form.justificativa ?? null,
      criadoEm: agora(),
      revogadoEm: null,
    };
    this.store.acessosTemporarios.update(list => [acesso, ...list]);
    this.store.persist('acessosTemporarios');
    this.auditoria.registrar({
      acao: 'ACESSO_TEMPORARIO:CRIAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'ACESSO_TEMPORARIO',
      recursoTipo: 'acesso-temporario',
      recursoId: acesso.id,
      dadosNovos: { ...acesso },
    });
    return simularRequisicao(acesso);
  }

  revogar(id: string, motivo = 'Revogado manualmente'): Observable<AcessoTemporario> {
    const atual = this.store.acessosTemporarios().find(a => a.id === id);
    if (!atual) return simularErro('Acesso temporário não encontrado', 404);
    if (atual.status === 'REVOGADO') return simularErro('Acesso já revogado', 400);
    if (atual.status === 'EXPIRADO') return simularErro('Acesso já expirado', 400);
    const revogado: AcessoTemporario = {
      ...atual,
      status: 'REVOGADO',
      revogadoEm: agora(),
    };
    this.store.acessosTemporarios.update(list => list.map(a => (a.id === id ? revogado : a)));
    this.store.persist('acessosTemporarios');
    this.auditoria.registrar({
      acao: 'ACESSO_TEMPORARIO:REVOGAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'ACESSO_TEMPORARIO',
      recursoTipo: 'acesso-temporario',
      recursoId: id,
      dadosAnteriores: { status: atual.status },
      dadosNovos: { status: 'REVOGADO' },
      mensagem: motivo,
    });
    return simularRequisicao(revogado);
  }
}
