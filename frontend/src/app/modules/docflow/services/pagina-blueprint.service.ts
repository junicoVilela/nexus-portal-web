import { Injectable, Injector, inject } from '@angular/core';
import { Observable, defer, map, shareReplay } from 'rxjs';

import { docflowPaginaBlueprints as listarBlueprintsSdk } from '../../../api/generated/sdk.gen';
import type { PaginaBlueprintResponse } from '../../../api/generated/types.gen';
import {
  NecessidadeSecaoBlueprint,
  PaginaBlueprint,
  PaginaBlueprintSecao,
} from '../models/pagina-blueprint.model';

@Injectable({ providedIn: 'root' })
export class PaginaBlueprintService {
  private readonly injector = inject(Injector);
  private readonly catalogo$ = defer(() => listarBlueprintsSdk({ injector: this.injector })).pipe(
    map(resposta => (resposta.data ?? []).map(item => this.mapear(item))),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  listar(): Observable<PaginaBlueprint[]> {
    return this.catalogo$;
  }

  private mapear(item: PaginaBlueprintResponse): PaginaBlueprint {
    if (!item.id || !item.nome || !item.tipoConteudo || !item.status) {
      throw new Error('Contrato inválido no catálogo de blueprints.');
    }
    return {
      id: item.id,
      nome: item.nome,
      descricao: item.descricao ?? '',
      tipoConteudo: item.tipoConteudo,
      versao: item.versao ?? 1,
      status: item.status,
      minimoComponentes: item.minimoComponentes ?? 1,
      maximoComponentes: item.maximoComponentes ?? 1,
      templatesCompativeis: item.templatesCompativeis ?? [],
      secoes: (item.secoes ?? []).map(secao => this.mapearSecao(secao)),
    };
  }

  private mapearSecao(secao: NonNullable<PaginaBlueprintResponse['secoes']>[number]): PaginaBlueprintSecao {
    return {
      slot: secao.slot ?? '',
      componenteId: secao.componenteId ?? '',
      necessidade: (secao.necessidade ?? 'OPCIONAL') as NecessidadeSecaoBlueprint,
      repetivel: secao.repetivel ?? false,
      maximoInstancias: secao.maximoInstancias ?? 1,
      alternativas: secao.alternativas ?? [],
    };
  }
}
