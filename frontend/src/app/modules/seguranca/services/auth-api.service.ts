import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';
import { LoginResponse, UsuarioAutenticado } from '../models/auth.model';
import { environment } from '@env/environment';
import { AuditoriaService } from './auditoria.service';
import { PoliticaSenhaService } from './politica-senha.service';
import { SessaoService } from './sessao.service';
import { MockStore } from './mock/mock-store.service';
import { agora, novoId, simularRequisicao } from './mock/in-memory-store';
import { lerSid, lerSub } from '@core/auth/utils/jwt-claims';

const TOKEN_TTL_SEC = 60 * 60; // 1h

/**
 * Implementação mock do contrato `/api/auth/*` da spec.
 * Quando backend chegar, troca-se HttpClient real preservando assinatura.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly store = inject(MockStore);
  private readonly politica = inject(PoliticaSenhaService);
  private readonly auditoria = inject(AuditoriaService);
  private readonly sessoes = inject(SessaoService);

  login(loginOuEmail: string, senha: string): Observable<LoginResponse> {
    const usuario = this.store.usuarios().find(u => u.login === loginOuEmail || u.email === loginOuEmail);

    if (!usuario || !usuario.ativo) {
      this.registrarHistorico(usuario?.id ?? null, loginOuEmail, false, 'Credenciais inválidas');
      return this.erroAtraso('Credenciais inválidas', 401);
    }
    if (usuario.bloqueado) {
      this.registrarHistorico(usuario.id, loginOuEmail, false, 'Usuário bloqueado');
      return this.erroAtraso('Usuário bloqueado', 401);
    }
    const senhaCorreta = this.store.senhas()[usuario.id];
    if (senhaCorreta !== senha) {
      this.incrementarTentativas(usuario.id);
      this.registrarHistorico(usuario.id, loginOuEmail, false, 'Credenciais inválidas');
      return this.erroAtraso('Credenciais inválidas', 401);
    }

    this.resetarTentativas(usuario.id);
    this.registrarHistorico(usuario.id, loginOuEmail, true, null);

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : null;
    const sessao = this.sessoes.abrir(usuario.id, ua);

    const token = this.gerarTokenJwt(usuario.id, sessao.id);
    const response: LoginResponse = {
      token,
      refreshToken: novoId(),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        login: usuario.login,
      },
    };
    return simularRequisicao(response);
  }

  /** Encerra a sessão atual (logout). Chamado por AuthService.logout(). */
  encerrarSessaoAtual(): void {
    const token = localStorage.getItem('doc-flow-jwt');
    if (!token) return;
    const sid = this.extrairSessaoId(token);
    if (sid) this.sessoes.encerrarPorLogout(sid);
  }

  me(): Observable<UsuarioAutenticado> {
    const token = localStorage.getItem('doc-flow-jwt');
    if (!token) return this.erroAtraso('Não autenticado', 401);
    const id = this.extrairUserId(token);
    if (!id) return this.erroAtraso('Token inválido', 401);
    const usuario = this.store.usuarios().find(u => u.id === id);
    if (!usuario) return this.erroAtraso('Usuário não encontrado', 404);

    const grupoIds = usuario.grupoIds ?? [];
    const grupos = this.store.grupos().filter(g => grupoIds.includes(g.id) && g.ativo);
    const permissaoIds = new Set<string>(grupos.flatMap(g => g.permissaoIds ?? []));
    const permissoes = this.store
      .permissoes()
      .filter(p => permissaoIds.has(p.id) && p.ativo)
      .map(p => p.codigo);

    return simularRequisicao({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      login: usuario.login,
      grupos: grupos.map(g => ({ id: g.id, codigo: g.codigo, nome: g.nome })),
      permissoes,
    });
  }

  alterarSenhaPropria(senhaAtual: string, novaSenha: string): Observable<void> {
    const token = localStorage.getItem('doc-flow-jwt');
    const id = token ? this.extrairUserId(token) : null;
    if (!id) return this.erroAtraso('Não autenticado', 401);
    if (this.store.senhas()[id] !== senhaAtual) {
      return this.erroAtraso('Senha atual incorreta', 400);
    }
    const validacao = this.politica.validar(novaSenha);
    if (!validacao.valido) {
      return this.erroAtraso(`Senha não atende à política: ${validacao.violacoes.join(' ')}`, 400);
    }
    if (this.politica.reutilizada(id, novaSenha)) {
      return this.erroAtraso('Senha já usada recentemente. Escolha outra.', 400);
    }
    this.store.senhas.update(s => ({ ...s, [id]: novaSenha }));
    this.store.persist('senhas');
    this.politica.registrarNoHistorico(id, novaSenha);
    // Limpa o flag trocarSenhaProximoLogin quando o usuário troca a própria senha.
    this.store.usuarios.update(list =>
      list.map(u => (u.id === id ? { ...u, trocarSenhaProximoLogin: false, atualizadoEm: agora() } : u)),
    );
    this.store.persist('usuarios');
    this.auditoria.registrar({
      acao: 'USUARIO:TROCAR_SENHA_PROPRIA',
      dominio: 'SEGURANCA',
      funcionalidade: 'USUARIO',
      recursoTipo: 'usuario',
      recursoId: id,
      mensagem: 'Usuário trocou a própria senha.',
    });
    return simularRequisicao(undefined);
  }

  refresh(refreshToken: string): Observable<LoginResponse> {
    return of(refreshToken).pipe(
      delay(80),
      mergeMap(() => {
        const tokenAtual = localStorage.getItem('doc-flow-jwt') ?? '';
        const userId = this.extrairUserId(tokenAtual);
        const sid = this.extrairSessaoId(tokenAtual);
        const usuario = userId ? this.store.usuarios().find(u => u.id === userId) : null;
        if (!usuario) return throwError(() => ({ status: 401, message: 'Refresh inválido' }));
        // Token sem sid não tem sessão associada — recusa refresh em vez de
        // perpetuar token órfão que faria logout subsequente falhar (finding #1).
        if (!sid) return throwError(() => ({ status: 401, message: 'Sessão inválida' }));
        if (!this.sessoes.obterAtiva(sid)) {
          return throwError(() => ({ status: 401, message: 'Sessão encerrada ou revogada' }));
        }
        return of<LoginResponse>({
          token: this.gerarTokenJwt(usuario.id, sid),
          refreshToken: novoId(),
          usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            login: usuario.login,
          },
        });
      }),
    );
  }

  /** Gera um "JWT" mock com payload base64 contendo sub + exp + sid (sessão). */
  private gerarTokenJwt(userId: string, sessaoId = ''): string {
    const header = btoa(JSON.stringify({ alg: 'mock', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: userId,
        sid: sessaoId,
        exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC,
      }),
    );
    return `${header}.${payload}.mock-signature`;
  }

  private extrairUserId(token: string): string | null {
    return lerSub(token);
  }

  private extrairSessaoId(token: string): string | null {
    return lerSid(token);
  }

  private incrementarTentativas(id: string): void {
    this.store.usuarios.update(list =>
      list.map(u =>
        u.id === id ? { ...u, tentativasInvalidas: u.tentativasInvalidas + 1, atualizadoEm: agora() } : u,
      ),
    );
    this.store.persist('usuarios');
  }
  private resetarTentativas(id: string): void {
    this.store.usuarios.update(list =>
      list.map(u =>
        u.id === id ? { ...u, tentativasInvalidas: 0, ultimoLogin: agora(), atualizadoEm: agora() } : u,
      ),
    );
    this.store.persist('usuarios');
  }
  private registrarHistorico(
    usuarioId: string | null,
    loginInformado: string,
    sucesso: boolean,
    motivoFalha: string | null,
  ): void {
    this.store.historicoLogin.update(list =>
      [
        {
          id: novoId(),
          usuarioId,
          loginInformado,
          ipOrigem: null,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          sucesso,
          motivoFalha,
          criadoEm: agora(),
        },
        ...list,
      ].slice(0, environment.mockHistoryCap),
    );
    this.store.persist('historicoLogin');
  }

  private erroAtraso<T = never>(message: string, status: number): Observable<T> {
    return new Observable<T>(s => {
      const delay = environment.mockDelayMs;
      if (delay > 0) setTimeout(() => s.error({ status, message }), delay);
      else s.error({ status, message });
    });
  }
}
