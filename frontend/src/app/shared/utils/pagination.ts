export function resolvePage(page: number, totalItems: number, pageSize: number): number {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalItems) / safePageSize));
  return Math.min(Math.max(1, page), totalPages);
}
