import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap, tap, throwError } from 'rxjs';

import { AuthService } from '@core/auth/services/auth.service';
import { PreviewToken } from '../models/cliente.model';
import { ClienteService } from './cliente.service';

/** Folga mínima de validade para reaproveitar um link de prévia. */
const MARGEM_MS = 60 * 60 * 1000;

/**
 * Link de prévia do cliente (token de leitura do manual): copiar link de tela, perguntar como
 * leitor e conectar agentes via MCP. Reaproveita um token válido; cria um (72 h) só para quem pode
 * editar publicações.
 */
@Injectable({ providedIn: 'root' })
export class ClientePreviewLinkService {
  private readonly clienteService = inject(ClienteService);
  private readonly auth = inject(AuthService);
  private readonly porCliente = new Map<string, PreviewToken>();

  tokenValido(clienteId: string): Observable<PreviewToken> {
    const emCache = this.porCliente.get(clienteId);
    if (emCache && new Date(emCache.expiresAt).getTime() > Date.now() + MARGEM_MS) return of(emCache);
    return this.clienteService.listarPreviewTokens(clienteId).pipe(
      map(tokens =>
        tokens
          .filter(t => new Date(t.expiresAt).getTime() > Date.now() + MARGEM_MS)
          .sort((a, b) => b.expiresAt.localeCompare(a.expiresAt))
          .at(0),
      ),
      switchMap(valido => {
        if (valido) return of(valido);
        if (!this.auth.tem()('PUBLICACAO:EDITAR')) {
          return throwError(
            () => new Error('Não há link de prévia ativo para este cliente. Peça a quem edita publicações.'),
          );
        }
        return this.clienteService.gerarPreviewToken(clienteId);
      }),
      tap(token => this.porCliente.set(clienteId, token)),
    );
  }

  urlPrevia(token: PreviewToken, codigoTela?: string): string {
    const base = this.clienteService.previewPublicoUrl(token.token);
    return codigoTela ? `${base}?tela=${encodeURIComponent(codigoTela)}` : base;
  }
}
