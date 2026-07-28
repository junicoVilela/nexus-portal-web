import { Injectable } from '@angular/core';

export interface PaginaDraftSnapshot<T> {
  value: T;
  savedAt: Date;
}

interface PaginaDraftStorage<T> {
  value: T;
  at: number;
}

@Injectable({ providedIn: 'root' })
export class PaginaDraftService {
  salvar<T>(key: string, value: T): Date | null {
    try {
      const at = Date.now();
      const snapshot: PaginaDraftStorage<T> = { value, at };
      localStorage.setItem(key, JSON.stringify(snapshot));
      return new Date(at);
    } catch {
      return null;
    }
  }

  carregar<T>(
    key: string,
    opcoes: { maxAgeDays: number; servidorAtualizadoEm?: string | null },
  ): PaginaDraftSnapshot<T> | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const snapshot = JSON.parse(raw) as Partial<PaginaDraftStorage<T>>;
      if (!snapshot.value || typeof snapshot.value !== 'object' || !Number.isFinite(snapshot.at)) {
        this.remover(key);
        return null;
      }

      const maxAgeMs = opcoes.maxAgeDays * 86_400_000;
      if (Date.now() - snapshot.at! > maxAgeMs) {
        this.remover(key);
        return null;
      }

      const servidorAtualizadoEm = opcoes.servidorAtualizadoEm
        ? new Date(opcoes.servidorAtualizadoEm).getTime()
        : null;
      if (servidorAtualizadoEm && snapshot.at! <= servidorAtualizadoEm) {
        this.remover(key);
        return null;
      }

      return { value: snapshot.value as T, savedAt: new Date(snapshot.at!) };
    } catch {
      this.remover(key);
      return null;
    }
  }

  remover(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // O armazenamento pode estar indisponível em navegação privada ou sem permissão.
    }
  }
}
