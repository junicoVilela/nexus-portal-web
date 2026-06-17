import { Injectable, signal } from '@angular/core';
import { AcessoTemporario } from '../../models/acesso-temporario.model';
import { Auditoria } from '../../models/auditoria.model';
import { Dominio } from '../../models/dominio.model';
import { EscopoAcesso } from '../../models/escopo-acesso.model';
import { Funcionalidade } from '../../models/funcionalidade.model';
import { GrupoAcesso } from '../../models/grupo-acesso.model';
import { HistoricoLogin } from '../../models/historico-login.model';
import { Permissao } from '../../models/permissao.model';
import { PoliticaSenha } from '../../models/politica-senha.model';
import { SessaoUsuario } from '../../models/sessao.model';
import { Usuario } from '../../models/usuario.model';
import { carregar, persistir } from './in-memory-store';
import { SEED } from './seed';

const NS = 'seguranca-mock:';

/**
 * Singleton com o estado global do mock. Cada service injeta este store e
 * lê/escreve diretamente nele. Mantemos `signal()` para refletir mudanças em
 * componentes que leem sem subscribe.
 */
@Injectable({ providedIn: 'root' })
export class MockStore {
  readonly usuarios = signal<Usuario[]>(carregar(NS + 'usuarios', SEED.usuarios));
  readonly grupos = signal<GrupoAcesso[]>(carregar(NS + 'grupos', SEED.gruposAcesso));
  readonly dominios = signal<Dominio[]>(carregar(NS + 'dominios', SEED.dominios));
  readonly funcionalidades = signal<Funcionalidade[]>(carregar(NS + 'funcionalidades', SEED.funcionalidades));
  readonly permissoes = signal<Permissao[]>(carregar(NS + 'permissoes', SEED.permissoes));
  readonly escopos = signal<EscopoAcesso[]>(carregar(NS + 'escopos', []));
  readonly historicoLogin = signal<HistoricoLogin[]>(carregar(NS + 'historico-login', []));
  readonly auditoria = signal<Auditoria[]>(carregar(NS + 'auditoria', []));
  readonly politicaSenha = signal<PoliticaSenha>(carregar(NS + 'politica-senha', SEED.politicaSenha));
  /** Histórico de senhas (hash mockado = própria senha em texto) por usuário. */
  readonly historicoSenhas = signal<Record<string, string[]>>(carregar(NS + 'historico-senhas', {}));
  readonly sessoes = signal<SessaoUsuario[]>(carregar(NS + 'sessoes', []));
  readonly acessosTemporarios = signal<AcessoTemporario[]>(carregar(NS + 'acessos-temporarios', []));
  readonly senhas = signal<Record<string, string>>(carregar(NS + 'senhas', SEED.senhas));

  private readonly pendingPersists = new Set<string>();
  private persistAgendado = false;

  /**
   * Salva o snapshot atual de uma entidade no localStorage.
   * Coalesce múltiplas chamadas sequenciais via microtask — um CRUD que dispara
   * 2-6 persists em sequência acaba serializando cada entidade no máximo uma vez
   * por tick. Use `flushPersist()` quando precisar sincronia explícita (ex: reset).
   */
  persist(entidade: keyof MockStore): void {
    this.pendingPersists.add(entidade as string);
    if (this.persistAgendado) return;
    this.persistAgendado = true;
    queueMicrotask(() => this.flushPersist());
  }

  /** Força gravação imediata de todas as entidades agendadas. */
  flushPersist(): void {
    this.persistAgendado = false;
    const entidades = [...this.pendingPersists];
    this.pendingPersists.clear();
    for (const e of entidades) {
      const sig = this[e as keyof MockStore] as () => unknown;
      if (typeof sig === 'function') persistir(NS + e, sig());
    }
  }

  /** Reseta o mock para o seed inicial (útil para QA). */
  reset(): void {
    this.usuarios.set([...SEED.usuarios]);
    this.grupos.set([...SEED.gruposAcesso]);
    this.dominios.set([...SEED.dominios]);
    this.funcionalidades.set([...SEED.funcionalidades]);
    this.permissoes.set([...SEED.permissoes]);
    this.escopos.set([]);
    this.historicoLogin.set([]);
    this.auditoria.set([]);
    this.politicaSenha.set({ ...SEED.politicaSenha });
    this.historicoSenhas.set({});
    this.sessoes.set([]);
    this.acessosTemporarios.set([]);
    this.senhas.set({ ...SEED.senhas });
    (
      [
        'usuarios',
        'grupos',
        'dominios',
        'funcionalidades',
        'permissoes',
        'escopos',
        'historicoLogin',
        'auditoria',
        'politicaSenha',
        'historicoSenhas',
        'sessoes',
        'acessosTemporarios',
        'senhas',
      ] as const
    ).forEach(k => this.persist(k));
    this.flushPersist();
  }

  /** IDs derivados convenientes. */
  readonly ADMIN_USER_ID = SEED.ADMIN_USER_ID;
  readonly ADMIN_GROUP_ID = SEED.ADMIN_GROUP_ID;
}
