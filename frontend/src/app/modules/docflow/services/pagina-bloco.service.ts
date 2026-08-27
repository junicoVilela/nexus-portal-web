import { Injectable, Injector, inject } from '@angular/core';
import { Observable, defer, map, shareReplay } from 'rxjs';

import { docflowPaginaBlocos as listarBlocosSdk } from '../../../api/generated/sdk.gen';
import type { PaginaBlocoResponse } from '../../../api/generated/types.gen';
import {
  BlocoPagina,
  CategoriaBlocoPagina,
  ParametrizacaoBlocoPagina,
} from '../components/pagina-block-library';

@Injectable({ providedIn: 'root' })
export class PaginaBlocoService {
  private readonly injector = inject(Injector);
  private readonly catalogo$ = defer(() => listarBlocosSdk({ injector: this.injector })).pipe(
    map(resposta => (resposta.data ?? []).map(item => this.mapear(item))),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  listar(): Observable<BlocoPagina[]> {
    return this.catalogo$;
  }

  private mapear(item: PaginaBlocoResponse): BlocoPagina {
    if (!item.id || !item.nome || !item.categoria || !item.visual || !item.html) {
      throw new Error('Contrato inválido no catálogo de blocos.');
    }
    return {
      id: item.id,
      nome: item.nome,
      descricao: item.descricao ?? '',
      categoria: item.categoria as CategoriaBlocoPagina,
      visual: item.visual,
      html: item.html,
      parametrizacao: item.parametrizacao as ParametrizacaoBlocoPagina | undefined,
      versao: item.versao,
      slots: (item.slots ?? []).map(slot => ({
        id: slot.id ?? '',
        elemento: slot.elemento ?? '',
        classeCss: slot.classeCss ?? '',
        textoPadrao: slot.textoPadrao ?? '',
      })),
    };
  }
}
