/**
 * Persistência de presets de filtro nomeados em localStorage.
 * Cada preset é uma combinação rotulada de um conjunto de filtros (tipos genéricos).
 */
const STORAGE_PREFIX = 'filter-presets:';

export interface FilterPreset<T> {
  id: string;
  nome: string;
  filtros: T;
  criadoEm: number;
}

function chave(escopo: string): string {
  return STORAGE_PREFIX + escopo;
}

export function listarPresets<T>(escopo: string): FilterPreset<T>[] {
  try {
    const raw = localStorage.getItem(chave(escopo));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FilterPreset<T>[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function salvarPreset<T>(escopo: string, nome: string, filtros: T): FilterPreset<T> {
  const lista = listarPresets<T>(escopo);
  const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const novo: FilterPreset<T> = { id, nome, filtros, criadoEm: Date.now() };
  lista.unshift(novo);
  persist(escopo, lista);
  return novo;
}

export function removerPreset(escopo: string, id: string): void {
  const lista = listarPresets(escopo).filter(p => p.id !== id);
  persist(escopo, lista);
}

export function renomearPreset(escopo: string, id: string, novoNome: string): void {
  const lista = listarPresets(escopo).map(p => (p.id === id ? { ...p, nome: novoNome } : p));
  persist(escopo, lista);
}

function persist<T>(escopo: string, lista: FilterPreset<T>[]): void {
  try {
    localStorage.setItem(chave(escopo), JSON.stringify(lista));
  } catch {
    /* storage indisponível */
  }
}
