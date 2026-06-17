/**
 * Helpers para extrair claims do JWT mock (formato `header.payload.signature`,
 * payload em base64 com `sub` / `sid` / `exp`).
 *
 * Centralizado aqui para não duplicar try/catch + split + atob em auth.service,
 * auth-api.service e auditoria.service.
 */

export interface JwtClaims {
  sub?: string;
  sid?: string;
  exp?: number;
}

export function lerClaims(token: string | null | undefined): JwtClaims | null {
  if (!token) return null;
  try {
    const partes = token.split('.');
    if (partes.length !== 3) return null;
    // Base64URL → base64 padronizado (substitui caracteres + completa padding).
    let b64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

export function lerSub(token: string | null | undefined): string | null {
  const claims = lerClaims(token);
  return typeof claims?.sub === 'string' ? claims.sub : null;
}

export function lerSid(token: string | null | undefined): string | null {
  const claims = lerClaims(token);
  return typeof claims?.sid === 'string' && claims.sid ? claims.sid : null;
}

export function tokenValido(token: string | null | undefined): boolean {
  const claims = lerClaims(token);
  if (!claims) return false;
  if (typeof claims.exp !== 'number') return false;
  return claims.exp * 1000 > Date.now();
}
