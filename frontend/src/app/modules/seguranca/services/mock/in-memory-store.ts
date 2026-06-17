import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '@env/environment';

/**
 * Wrapper de loja in-memory persistida em localStorage, com latência simulada
 * para imitar comportamento HTTP. Quando o backend chegar, services trocam
 * estes helpers por `HttpClient` real preservando a assinatura.
 */

const SIM_DELAY_MS = environment.mockDelayMs;

export function novoId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function agora(): string {
  return new Date().toISOString();
}

export function carregar<T>(chave: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(chave);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function persistir(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* storage cheio / indisponível */
  }
}

/** Envolve um resultado com latência simulada para parecer HTTP. */
export function simularRequisicao<T>(resultado: T): Observable<T> {
  return SIM_DELAY_MS > 0 ? of(resultado).pipe(delay(SIM_DELAY_MS)) : of(resultado);
}

/** Envolve um erro com latência simulada (ex.: 404, 409). */
export function simularErro<T = never>(message: string, status = 400): Observable<T> {
  return new Observable<T>(subscriber => {
    if (SIM_DELAY_MS > 0) {
      setTimeout(() => subscriber.error({ status, message }), SIM_DELAY_MS);
    } else {
      subscriber.error({ status, message });
    }
  });
}

/** Pesquisa com filtros opcionais case-insensitive sobre múltiplos campos. */
export function pesquisar<T>(lista: T[], termo: string | undefined, campos: (keyof T)[]): T[] {
  const q = (termo ?? '').trim().toLowerCase();
  if (!q) return lista;
  return lista.filter(item =>
    campos.some(campo =>
      String(item[campo] ?? '')
        .toLowerCase()
        .includes(q),
    ),
  );
}

/** Pagina uma lista já filtrada. */
export interface Pageable {
  page: number;
  size: number;
}
import { PageResult } from '@shared/models/page-result.model';
export function paginar<T>(lista: T[], { page, size }: Pageable): PageResult<T> {
  const inicio = (page - 1) * size;
  const items = lista.slice(inicio, inicio + size);
  const totalItems = lista.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / size));
  return {
    items,
    page,
    size,
    totalItems,
    totalPages,
    first: page <= 1,
    last: page >= totalPages,
  };
}

export { throwError };
