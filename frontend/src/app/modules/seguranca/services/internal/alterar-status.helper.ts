import { WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditoriaService } from '../auditoria.service';
import { MockStore } from '../mock/mock-store.service';
import { agora, simularErro, simularRequisicao } from '../mock/in-memory-store';

/**
 * Padrão repetido por 6 services CRUD: ativar/desativar entidade + registrar auditoria.
 * Mantemos um único helper para não copiar 17 linhas idênticas por domínio.
 */
export interface AlterarStatusConfig {
  /** Nome do signal no MockStore (`usuarios`, `grupos`, ...). */
  entidadeKey: keyof MockStore;
  /** Mensagem 404 (varia por gênero/concordância). */
  msgNaoEncontrado: string;
  /** Código da funcionalidade — usado como prefixo da ação (`USUARIO:ATIVAR`) e em `funcionalidade`. */
  funcionalidade: string;
  /** Slug do recurso (`usuario`, `grupo-acesso`, ...). */
  recursoTipo: string;
}

interface EntidadeComStatus {
  id: string;
  ativo: boolean;
  atualizadoEm: string | null;
}

export function alterarStatusGenerico<T extends EntidadeComStatus>(
  store: MockStore,
  auditoria: AuditoriaService,
  cfg: AlterarStatusConfig,
  id: string,
  ativo: boolean,
): Observable<T> {
  const sig = store[cfg.entidadeKey] as unknown as WritableSignal<T[]>;
  const atual = sig().find(x => x.id === id);
  if (!atual) return simularErro(cfg.msgNaoEncontrado, 404);
  const atualizado = { ...atual, ativo, atualizadoEm: agora() } as T;
  sig.update(list => list.map(x => (x.id === id ? atualizado : x)));
  store.persist(cfg.entidadeKey);
  auditoria.registrar({
    acao: `${cfg.funcionalidade}:${ativo ? 'ATIVAR' : 'INATIVAR'}`,
    dominio: 'SEGURANCA',
    funcionalidade: cfg.funcionalidade,
    recursoTipo: cfg.recursoTipo,
    recursoId: id,
    dadosAnteriores: { ativo: atual.ativo },
    dadosNovos: { ativo },
  });
  return simularRequisicao(atualizado);
}
