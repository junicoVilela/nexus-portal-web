import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { PageResult } from '@shared/models/page-result.model';
import { Usuario, UsuarioForm } from '../models/usuario.model';
import { AuditoriaService } from './auditoria.service';
import { PoliticaSenhaService } from './politica-senha.service';
import { MockStore } from './mock/mock-store.service';
import { agora, novoId, paginar, pesquisar, simularErro, simularRequisicao } from './mock/in-memory-store';
import { alterarStatusGenerico } from './internal/alterar-status.helper';

export interface UsuarioFilter {
  q?: string;
  ativo?: boolean;
  bloqueado?: boolean;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly store = inject(MockStore);
  private readonly auditoria = inject(AuditoriaService);
  private readonly politica = inject(PoliticaSenhaService);

  listar(filter: UsuarioFilter = {}): Observable<PageResult<Usuario>> {
    const lista = pesquisar(this.store.usuarios(), filter.q, ['nome', 'email', 'login']);
    const filtrada = lista.filter(u => {
      if (filter.ativo !== undefined && u.ativo !== filter.ativo) return false;
      if (filter.bloqueado !== undefined && u.bloqueado !== filter.bloqueado) return false;
      return true;
    });
    return simularRequisicao(paginar(filtrada, { page: filter.page ?? 1, size: filter.size ?? 20 }));
  }

  buscarPorId(id: string): Observable<Usuario> {
    const u = this.store.usuarios().find(x => x.id === id);
    return u ? simularRequisicao(u) : simularErro('Usuário não encontrado', 404);
  }

  criar(form: UsuarioForm): Observable<Usuario> {
    if (this.store.usuarios().some(u => u.login === form.login)) {
      return simularErro('Login já cadastrado', 409);
    }
    if (this.store.usuarios().some(u => u.email === form.email)) {
      return simularErro('E-mail já cadastrado', 409);
    }
    if (form.senha) {
      const validacao = this.politica.validar(form.senha);
      if (!validacao.valido) {
        return simularErro(`Senha não atende à política: ${validacao.violacoes.join(' ')}`, 400);
      }
    }
    const usuario: Usuario = {
      id: novoId(),
      nome: form.nome,
      email: form.email,
      login: form.login,
      ativo: form.ativo,
      bloqueado: false,
      tentativasInvalidas: 0,
      trocarSenhaProximoLogin: false,
      ultimoLogin: null,
      criadoEm: agora(),
      atualizadoEm: null,
      grupoIds: form.grupoIds,
    };
    this.store.usuarios.update(list => [usuario, ...list]);
    this.store.persist('usuarios');
    if (form.senha) {
      this.store.senhas.update(s => ({ ...s, [usuario.id]: form.senha! }));
      this.store.persist('senhas');
      this.politica.registrarNoHistorico(usuario.id, form.senha);
    }
    // Auditoria síncrona junto com a mutação do store (finding #2):
    // tap só dispararia se houver subscribe, deixando store mutado + auditoria
    // ausente caso o caller esquecesse o subscribe.
    this.auditoria.registrar({
      acao: 'USUARIO:CRIAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'USUARIO',
      recursoTipo: 'usuario',
      recursoId: usuario.id,
      dadosNovos: { ...usuario },
    });
    return simularRequisicao(usuario);
  }

  atualizar(id: string, form: UsuarioForm): Observable<Usuario> {
    const atual = this.store.usuarios().find(u => u.id === id);
    if (!atual) return simularErro('Usuário não encontrado', 404);
    const atualizado: Usuario = {
      ...atual,
      nome: form.nome,
      email: form.email,
      login: form.login,
      ativo: form.ativo,
      grupoIds: form.grupoIds,
      atualizadoEm: agora(),
    };
    this.store.usuarios.update(list => list.map(u => (u.id === id ? atualizado : u)));
    this.store.persist('usuarios');
    this.auditoria.registrar({
      acao: 'USUARIO:EDITAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'USUARIO',
      recursoTipo: 'usuario',
      recursoId: id,
      dadosAnteriores: { ...atual },
      dadosNovos: { ...atualizado },
    });
    return simularRequisicao(atualizado);
  }

  alterarStatus(id: string, ativo: boolean): Observable<Usuario> {
    return alterarStatusGenerico<Usuario>(
      this.store,
      this.auditoria,
      { entidadeKey: 'usuarios', msgNaoEncontrado: 'Usuário não encontrado', funcionalidade: 'USUARIO', recursoTipo: 'usuario' },
      id,
      ativo,
    );
  }

  bloquear(id: string, bloqueado: boolean): Observable<Usuario> {
    const atual = this.store.usuarios().find(u => u.id === id);
    if (!atual) return simularErro('Usuário não encontrado', 404);
    const atualizado = {
      ...atual,
      bloqueado,
      tentativasInvalidas: bloqueado ? atual.tentativasInvalidas : 0,
      atualizadoEm: agora(),
    };
    this.store.usuarios.update(list => list.map(u => (u.id === id ? atualizado : u)));
    this.store.persist('usuarios');
    this.auditoria.registrar({
      acao: bloqueado ? 'USUARIO:BLOQUEAR' : 'USUARIO:DESBLOQUEAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'USUARIO',
      recursoTipo: 'usuario',
      recursoId: id,
      dadosAnteriores: { bloqueado: atual.bloqueado },
      dadosNovos: { bloqueado },
    });
    return simularRequisicao(atualizado);
  }

  resetarSenha(id: string, novaSenha: string): Observable<void> {
    const atual = this.store.usuarios().find(u => u.id === id);
    if (!atual) return simularErro('Usuário não encontrado', 404);
    const validacao = this.politica.validar(novaSenha);
    if (!validacao.valido) {
      return simularErro(`Senha não atende à política: ${validacao.violacoes.join(' ')}`, 400);
    }
    if (this.politica.reutilizada(id, novaSenha)) {
      return simularErro('Senha já usada recentemente. Escolha outra.', 400);
    }
    this.store.senhas.update(s => ({ ...s, [id]: novaSenha }));
    this.store.persist('senhas');
    this.politica.registrarNoHistorico(id, novaSenha);
    this.store.usuarios.update(list =>
      list.map(u => (u.id === id ? { ...u, trocarSenhaProximoLogin: true, atualizadoEm: agora() } : u)),
    );
    this.store.persist('usuarios');
    this.auditoria.registrar({
      acao: 'USUARIO:RESETAR_SENHA',
      dominio: 'SEGURANCA',
      funcionalidade: 'USUARIO',
      recursoTipo: 'usuario',
      recursoId: id,
      mensagem: 'Senha resetada por administrador. Usuário deverá trocá-la no próximo login.',
    });
    return simularRequisicao(undefined);
  }

  vincularGrupos(id: string, grupoIds: string[]): Observable<Usuario> {
    const atual = this.store.usuarios().find(u => u.id === id);
    if (!atual) return simularErro('Usuário não encontrado', 404);
    const atualizado = { ...atual, grupoIds, atualizadoEm: agora() };
    this.store.usuarios.update(list => list.map(u => (u.id === id ? atualizado : u)));
    this.store.persist('usuarios');
    this.auditoria.registrar({
      acao: 'USUARIO:VINCULAR_GRUPOS',
      dominio: 'SEGURANCA',
      funcionalidade: 'USUARIO',
      recursoTipo: 'usuario',
      recursoId: id,
      dadosAnteriores: { grupoIds: atual.grupoIds ?? [] },
      dadosNovos: { grupoIds },
    });
    return simularRequisicao(atualizado);
  }
}
