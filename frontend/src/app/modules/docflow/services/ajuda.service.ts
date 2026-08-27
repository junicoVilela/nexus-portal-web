import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { defer, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { AJUDA_CONTEUDOS_PADRAO } from '../data/ajuda-defaults';
import {
  docflowAjudaAtualizar as atualizarAjudaSdk,
  docflowAjudaCriar as criarAjudaSdk,
  docflowAjudaExcluir as excluirAjudaSdk,
  docflowAjudaListar as listarAjudaSdk,
  docflowAjudaListarAdministracao as listarAjudaAdminSdk,
  docflowAjudaMetricas as metricasAjudaSdk,
  docflowAjudaRegistrar as registrarAjudaEventoSdk,
} from '../../../api/generated/sdk.gen';
import type {
  AjudaConteudoRequest as AjudaConteudoRequestSdk,
  AjudaConteudoResponse,
} from '../../../api/generated/types.gen';
import {
  AjudaConteudo,
  AjudaConteudoRequest,
  AjudaEventoRequest,
  AjudaFaqView,
  AjudaJornadaView,
  AjudaMetricas,
} from '../models/ajuda.model';

const SESSION_KEY = 'docflow:ajuda:sessao';
const SILENT_HEADERS = { 'X-Silent-Error': 'true' };

@Injectable({ providedIn: 'root' })
export class AjudaService {
  private readonly injector = inject(Injector);
  private carregado = false;

  readonly conteudos = signal<AjudaConteudo[]>(AJUDA_CONTEUDOS_PADRAO);
  readonly carregando = signal(false);

  readonly jornadas = computed<AjudaJornadaView[]>(() => {
    const ativos = this.conteudos().filter(item => item.ativo);
    return ativos
      .filter(item => item.tipo === 'JORNADA')
      .sort((a, b) => a.ordem - b.ordem)
      .map((jornada, index) => {
        const etapas = ativos
          .filter(item => item.tipo === 'ETAPA' && item.jornadaCodigo === jornada.codigo)
          .sort((a, b) => a.ordem - b.ordem)
          .map(item => ({
            id: item.codigo.toLowerCase(),
            codigo: item.codigo,
            titulo: item.titulo,
            descricao: item.resumo ?? item.conteudo ?? '',
            conteudo: item.conteudo ?? undefined,
            acao: item.rotuloAcao ?? 'Abrir',
            rota: item.rotaAcao ?? '/doc-flow/ajuda',
            mediaTipo: item.mediaTipo,
            mediaUrls: item.mediaUrls,
            mediaAlt: item.mediaAlt ?? undefined,
          }));
        return {
          id: jornada.codigo.toLowerCase(),
          codigo: jornada.codigo,
          ordem: String(index + 1).padStart(2, '0'),
          titulo: jornada.titulo,
          descricao: jornada.resumo ?? jornada.conteudo ?? '',
          conteudo: jornada.conteudo ?? undefined,
          icon: jornada.icone ?? 'BookOpen',
          tempo: `${Math.max(3, etapas.length * 2)} min`,
          mediaTipo: jornada.mediaTipo,
          mediaUrls: jornada.mediaUrls,
          mediaAlt: jornada.mediaAlt ?? undefined,
          etapas,
        };
      });
  });

  readonly faqs = computed<AjudaFaqView[]>(() =>
    this.conteudos()
      .filter(item => item.ativo && item.tipo === 'FAQ')
      .sort((a, b) => a.ordem - b.ordem)
      .map(item => ({
        id: item.codigo.toLowerCase(),
        codigo: item.codigo,
        pergunta: item.titulo,
        resposta: item.resumo ?? item.conteudo ?? '',
      })),
  );

  carregar(forcar = false): void {
    if ((this.carregado && !forcar) || this.carregando()) return;
    this.carregando.set(true);
    defer(() =>
      listarAjudaSdk({
        injector: this.injector,
        headers: SILENT_HEADERS,
        throwOnError: false,
      }),
    )
      .pipe(
        map(resposta => {
          if ('error' in resposta && resposta.error) return AJUDA_CONTEUDOS_PADRAO;
          return (resposta.data ?? []).map(item => this.mapearConteudo(item));
        }),
        catchError(() => of(AJUDA_CONTEUDOS_PADRAO)),
      )
      .subscribe(items => {
        this.conteudos.set(items.length ? items : AJUDA_CONTEUDOS_PADRAO);
        this.carregado = true;
        this.carregando.set(false);
      });
  }

  pesquisar(termo: string): AjudaConteudo[] {
    const busca = normalizar(termo);
    if (!busca) return [];
    return this.conteudos().filter(item =>
      normalizar(`${item.titulo} ${item.resumo ?? ''} ${item.conteudo ?? ''}`).includes(busca),
    );
  }

  contextuais(rota: string): AjudaConteudo[] {
    const caminho = rota.split(/[?#]/)[0] ?? rota;
    const correspondentes = this.conteudos().filter(
      item =>
        item.ativo &&
        item.tipo !== 'TOUR_PASSO' &&
        !!item.rotaContexto &&
        caminho.startsWith(item.rotaContexto),
    );
    const maiorContexto = Math.max(0, ...correspondentes.map(item => item.rotaContexto?.length ?? 0));
    return correspondentes
      .filter(item => (item.rotaContexto?.length ?? 0) >= maiorContexto || item.tipo === 'FAQ')
      .sort((a, b) => a.ordem - b.ordem)
      .slice(0, 6);
  }

  passosTour(): AjudaConteudo[] {
    return this.conteudos()
      .filter(item => item.ativo && item.tipo === 'TOUR_PASSO')
      .sort((a, b) => a.ordem - b.ordem);
  }

  listarAdministracao(): Observable<AjudaConteudo[]> {
    return defer(() => listarAjudaAdminSdk({ injector: this.injector })).pipe(
      map(resposta => (resposta.data ?? []).map(item => this.mapearConteudo(item))),
    );
  }

  criar(request: AjudaConteudoRequest): Observable<AjudaConteudo> {
    return defer(() =>
      criarAjudaSdk({ body: this.mapearConteudoRequest(request), injector: this.injector }),
    ).pipe(
      map(resposta => this.mapearConteudo(resposta.data)),
      tap(() => this.carregar(true)),
    );
  }

  atualizar(id: string, request: AjudaConteudoRequest): Observable<AjudaConteudo> {
    return defer(() =>
      atualizarAjudaSdk({
        path: { id },
        body: this.mapearConteudoRequest(request),
        injector: this.injector,
      }),
    ).pipe(
      map(resposta => this.mapearConteudo(resposta.data)),
      tap(() => this.carregar(true)),
    );
  }

  excluir(id: string): Observable<void> {
    return defer(() => excluirAjudaSdk({ path: { id }, injector: this.injector })).pipe(
      map(() => undefined),
      tap(() => this.carregar(true)),
    );
  }

  metricas(): Observable<AjudaMetricas> {
    return defer(() => metricasAjudaSdk({ injector: this.injector })).pipe(
      map(resposta => resposta.data as AjudaMetricas),
    );
  }

  registrarEvento(evento: AjudaEventoRequest): void {
    defer(() =>
      registrarAjudaEventoSdk({
        body: { ...evento, sessaoId: evento.sessaoId ?? this.sessaoId() },
        injector: this.injector,
        headers: SILENT_HEADERS,
        throwOnError: false,
      }),
    )
      .pipe(catchError(() => of(undefined)))
      .subscribe();
  }

  private mapearConteudoRequest(request: AjudaConteudoRequest): AjudaConteudoRequestSdk {
    return {
      codigo: request.codigo,
      tipo: request.tipo,
      jornadaCodigo: request.jornadaCodigo ?? undefined,
      titulo: request.titulo,
      resumo: request.resumo ?? undefined,
      conteudo: request.conteudo ?? undefined,
      rotaContexto: request.rotaContexto ?? undefined,
      rotaAcao: request.rotaAcao ?? undefined,
      rotuloAcao: request.rotuloAcao ?? undefined,
      icone: request.icone ?? undefined,
      seletorAlvo: request.seletorAlvo ?? undefined,
      mediaTipo: request.mediaTipo,
      mediaUrls: request.mediaUrls,
      mediaAlt: request.mediaAlt ?? undefined,
      ordem: request.ordem,
      ativo: request.ativo,
    };
  }

  private mapearConteudo(item: AjudaConteudoResponse): AjudaConteudo {
    return {
      id: item.id,
      codigo: item.codigo ?? '',
      tipo: item.tipo ?? 'FAQ',
      jornadaCodigo: item.jornadaCodigo,
      titulo: item.titulo ?? '',
      resumo: item.resumo,
      conteudo: item.conteudo,
      rotaContexto: item.rotaContexto,
      rotaAcao: item.rotaAcao,
      rotuloAcao: item.rotuloAcao,
      icone: item.icone,
      seletorAlvo: item.seletorAlvo,
      mediaTipo: item.mediaTipo ?? 'NENHUMA',
      mediaUrls: item.mediaUrls ?? [],
      mediaAlt: item.mediaAlt,
      ordem: item.ordem ?? 0,
      ativo: item.ativo ?? true,
      updatedAt: item.updatedAt,
      updatedBy: item.updatedBy,
    };
  }

  private sessaoId(): string {
    try {
      const atual = sessionStorage.getItem(SESSION_KEY);
      if (atual) return atual;
      const novo = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, novo);
      return novo;
    } catch {
      return 'sessao-indisponivel';
    }
  }
}

function normalizar(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
