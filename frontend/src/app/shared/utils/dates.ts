/** Utilitários de data — formatação e parsing. */

const PT_BR = 'pt-BR';

/** Formata data como `dd/MM/yyyy`. */
export function formatarDataCurta(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(PT_BR);
}

/** Formata data + hora como `dd/MM/yyyy HH:mm`. */
export function formatarDataHora(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(PT_BR, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formata hora como `HH:mm`. */
export function formatarHora(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(PT_BR, { hour: '2-digit', minute: '2-digit' });
}

/** Converte Date para string ISO `YYYY-MM-DD`. */
export function paraIsoData(d: Date | null | undefined): string | null {
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Idade em dias entre um timestamp e agora. */
export function idadeEmDias(timestampMs: number): number {
  return (Date.now() - timestampMs) / 86_400_000;
}
