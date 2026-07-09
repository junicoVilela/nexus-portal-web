import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';
import { environment } from '@env/environment';
import { PoliticaSenha, PoliticaSenhaForm, ResultadoValidacaoSenha } from '../models/politica-senha.model';
import { MockStore } from './mock/mock-store.service';

const REGEX_MAIUSCULA = /[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/;
const REGEX_MINUSCULA = /[a-záàâãéêíóôõúç]/;
const REGEX_NUMERO = /\d/;
const REGEX_ESPECIAL = /[!@#$%^&*(),.?":{}|<>[\]\\/_\-+=`~';]/;

interface BackendPoliticaSenhaResponse {
  id: string;
  tamanhoMinimo: number;
  exigirMaiuscula: boolean;
  exigirMinuscula: boolean;
  exigirNumero: boolean;
  exigirEspecial: boolean;
  expiraSenhaDias: number | null;
  quantidadeHistorico: number;
  maxTentativasInvalidas: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class PoliticaSenhaService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(MockStore);
  private readonly base = `${environment.rbacApiUrl}/politica-senha`;

  atual(): Observable<PoliticaSenha> {
    return this.http.get<BackendPoliticaSenhaResponse>(this.base).pipe(
      map(p => this.mapear(p)),
      // Popula MockStore como cache para atualSync() (usado por validators
      // de form síncronos que não podem esperar HTTP).
      tap(p => {
        this.store.politicaSenha.set(p);
        this.store.persist('politicaSenha');
      }),
    );
  }

  /** Acesso síncrono à última política conhecida (do MockStore/cache). */
  atualSync(): PoliticaSenha {
    return this.store.politicaSenha();
  }

  atualizar(form: PoliticaSenhaForm): Observable<PoliticaSenha> {
    return this.http.put<BackendPoliticaSenhaResponse>(this.base, form).pipe(
      map(p => this.mapear(p)),
      tap(p => {
        this.store.politicaSenha.set(p);
        this.store.persist('politicaSenha');
      }),
    );
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

  /**
   * Reutilização é enforced no backend (alterarSenha). O frontend não tem
   * como saber sem POST — retorna false localmente pra manter compat com
   * chamadas de UI.
   */
  reutilizada(_usuarioId: string, _novaSenha: string): boolean {
    return false;
  }

  /** No-op: registro de histórico agora é responsabilidade do backend. */
  registrarNoHistorico(_usuarioId: string, _senha: string): void {
    // no-op
  }

  contagemHistorico(usuarioId: string): { atual: number; limite: number } {
    const politica = this.atualSync();
    const atual = this.store.historicoSenhas()[usuarioId]?.length ?? 0;
    return { atual: Math.min(atual, politica.quantidadeHistorico), limite: politica.quantidadeHistorico };
  }

  private mapear(src: BackendPoliticaSenhaResponse): PoliticaSenha {
    return {
      id: src.id,
      tamanhoMinimo: src.tamanhoMinimo,
      exigirMaiuscula: src.exigirMaiuscula,
      exigirMinuscula: src.exigirMinuscula,
      exigirNumero: src.exigirNumero,
      exigirEspecial: src.exigirEspecial,
      expiraSenhaDias: src.expiraSenhaDias,
      quantidadeHistorico: src.quantidadeHistorico,
      maxTentativasInvalidas: src.maxTentativasInvalidas,
      ativo: src.ativo,
      criadoEm: src.createdAt,
      atualizadoEm: src.updatedAt,
    };
  }
}
