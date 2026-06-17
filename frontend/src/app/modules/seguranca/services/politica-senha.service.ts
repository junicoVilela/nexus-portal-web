import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PoliticaSenha, PoliticaSenhaForm, ResultadoValidacaoSenha } from '../models/politica-senha.model';
import { AuditoriaService } from './auditoria.service';
import { MockStore } from './mock/mock-store.service';
import { agora, simularRequisicao } from './mock/in-memory-store';

const REGEX_MAIUSCULA = /[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/;
const REGEX_MINUSCULA = /[a-záàâãéêíóôõúç]/;
const REGEX_NUMERO = /\d/;
const REGEX_ESPECIAL = /[!@#$%^&*(),.?":{}|<>[\]\\/_\-+=`~';]/;

@Injectable({ providedIn: 'root' })
export class PoliticaSenhaService {
  private readonly store = inject(MockStore);
  private readonly auditoria = inject(AuditoriaService);

  atual(): Observable<PoliticaSenha> {
    return simularRequisicao(this.store.politicaSenha());
  }

  /** Acesso síncrono à política atual (útil para validators de form). */
  atualSync(): PoliticaSenha {
    return this.store.politicaSenha();
  }

  atualizar(form: PoliticaSenhaForm): Observable<PoliticaSenha> {
    const anterior = this.store.politicaSenha();
    const atualizada: PoliticaSenha = {
      ...anterior,
      ...form,
      atualizadoEm: agora(),
    };
    this.store.politicaSenha.set(atualizada);
    this.store.persist('politicaSenha');
    this.auditoria.registrar({
      acao: 'POLITICA_SENHA:EDITAR',
      dominio: 'SEGURANCA',
      funcionalidade: 'POLITICA_SENHA',
      recursoTipo: 'politica-senha',
      recursoId: atualizada.id,
      dadosAnteriores: { ...anterior },
      dadosNovos: { ...atualizada },
    });
    return simularRequisicao(atualizada);
  }

  /** Valida uma senha contra a política. Síncrono — útil para form validators. */
  validar(senha: string, politica: PoliticaSenha = this.atualSync()): ResultadoValidacaoSenha {
    const violacoes: string[] = [];
    if (senha.length < politica.tamanhoMinimo) {
      violacoes.push(`Mínimo de ${politica.tamanhoMinimo} caracteres.`);
    }
    if (politica.exigirMaiuscula && !REGEX_MAIUSCULA.test(senha)) {
      violacoes.push('Deve conter ao menos uma letra maiúscula.');
    }
    if (politica.exigirMinuscula && !REGEX_MINUSCULA.test(senha)) {
      violacoes.push('Deve conter ao menos uma letra minúscula.');
    }
    if (politica.exigirNumero && !REGEX_NUMERO.test(senha)) {
      violacoes.push('Deve conter ao menos um número.');
    }
    if (politica.exigirEspecial && !REGEX_ESPECIAL.test(senha)) {
      violacoes.push('Deve conter ao menos um caractere especial.');
    }
    return { valido: violacoes.length === 0, violacoes };
  }

  /** Verifica se a nova senha viola o histórico configurado. */
  reutilizada(usuarioId: string, novaSenha: string): boolean {
    const politica = this.atualSync();
    const historico = this.store.historicoSenhas()[usuarioId] ?? [];
    return historico.slice(0, politica.quantidadeHistorico).includes(novaSenha);
  }

  /** Contagem do histórico de senhas de um usuário (sem expor os hashes). */
  contagemHistorico(usuarioId: string): { atual: number; limite: number } {
    const politica = this.atualSync();
    const atual = this.store.historicoSenhas()[usuarioId]?.length ?? 0;
    return { atual: Math.min(atual, politica.quantidadeHistorico), limite: politica.quantidadeHistorico };
  }

  /** Registra a senha no histórico do usuário (chamado pelos services ao trocar senha). */
  registrarNoHistorico(usuarioId: string, senha: string): void {
    const politica = this.atualSync();
    this.store.historicoSenhas.update(h => {
      const atual = h[usuarioId] ?? [];
      const proxima = [senha, ...atual].slice(0, Math.max(politica.quantidadeHistorico, 1));
      return { ...h, [usuarioId]: proxima };
    });
    this.store.persist('historicoSenhas');
  }
}
