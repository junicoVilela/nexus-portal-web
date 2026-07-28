import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '@env/environment';
import { AJUDA_CONTEUDOS_PADRAO } from '../data/ajuda-defaults';
import {
  AjudaConteudo,
  AjudaConteudoRequest,
  AjudaEventoRequest,
  AjudaFaqView,
  AjudaJornadaView,
  AjudaMetricas,
} from '../models/ajuda.model';

const SESSION_KEY = 'docflow:ajuda:sessao';

@Injectable({ providedIn: 'root' })
export class AjudaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ajuda`;
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
    this.http
      .get<AjudaConteudo[]>(`${this.base}/conteudos`, { headers: this.silencioso() })
      .pipe(catchError(() => of(AJUDA_CONTEUDOS_PADRAO)))
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
    return this.http.get<AjudaConteudo[]>(`${this.base}/conteudos/admin`);
  }

  criar(request: AjudaConteudoRequest): Observable<AjudaConteudo> {
    return this.http
      .post<AjudaConteudo>(`${this.base}/conteudos`, request)
      .pipe(tap(() => this.carregar(true)));
  }

  atualizar(id: string, request: AjudaConteudoRequest): Observable<AjudaConteudo> {
    return this.http
      .put<AjudaConteudo>(`${this.base}/conteudos/${id}`, request)
      .pipe(tap(() => this.carregar(true)));
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/conteudos/${id}`).pipe(tap(() => this.carregar(true)));
  }

  metricas(): Observable<AjudaMetricas> {
    return this.http.get<AjudaMetricas>(`${this.base}/metricas`);
  }

  registrarEvento(evento: AjudaEventoRequest): void {
    this.http
      .post<void>(
        `${this.base}/eventos`,
        { ...evento, sessaoId: evento.sessaoId ?? this.sessaoId() },
        { headers: this.silencioso() },
      )
      .pipe(catchError(() => of(undefined)))
      .subscribe();
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

  private silencioso(): HttpHeaders {
    return new HttpHeaders({ 'X-Silent-Error': 'true' });
  }
}

function normalizar(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
