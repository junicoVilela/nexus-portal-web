import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin, Subscription } from 'rxjs';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { AuthService } from '@core/auth/services/auth.service';
import { Pagina, PaginaQualidade, PaginaRevisao } from '@modules/docflow/models/pagina.model';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { DiffLinha, diffLinhasPalavras } from '@modules/docflow/utils/diff.util';
import type { DiffModo } from '@modules/docflow/components/pagina-revisoes/pagina-revisoes.component';
import { TablePaginationComponent } from '@shared/components/table-pagination/table-pagination.component';
import { ListPageComponent } from '@shared/layouts';
import { BadgeComponent, ButtonComponent, NotificationService, ToastService } from '@shared/ui';
import { PermissaoDirective } from '@modules/identity-access/directives';

@Component({
  selector: 'app-revisoes',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ListPageComponent,
    BadgeComponent,
    ButtonComponent,
    TablePaginationComponent,
    PermissaoDirective,
  ],
  templateUrl: './revisoes.component.html',
  styleUrl: './revisoes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevisoesComponent implements OnInit, OnDestroy {
  private readonly paginaService = inject(PaginaService);
  private readonly toast = inject(ToastService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private eventosSubscription?: Subscription;

  protected readonly paginas = signal<Pagina[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(12);
  protected readonly loading = signal(false);
  protected readonly carregandoDetalhe = signal(false);
  protected readonly executandoAcao = signal(false);
  protected readonly selecionada = signal<Pagina | null>(null);
  protected readonly qualidade = signal<PaginaQualidade | null>(null);
  protected readonly revisoes = signal<PaginaRevisao[]>([]);
  protected readonly diff = signal<DiffLinha[]>([]);
  protected readonly diffConteudoAnterior = signal('');
  protected readonly diffConteudoAtual = signal('');
  protected readonly modoDiff = signal<DiffModo>('unificado');
  protected comentario = '';
  /** Prazo opcional (input date) aplicado ao assumir a revisão. */
  protected prazo = '';

  protected readonly comentarios = computed(() => this.revisoes().filter(item => item.tipo === 'COMENTARIO'));
  /** Vem do campo da página; antes era inferido do texto de um comentário. */
  protected readonly responsavel = computed(() => this.selecionada()?.revisorUsername ?? null);
  protected readonly souOResponsavel = computed(() => {
    const revisor = this.responsavel();
    return !!revisor && revisor.toLowerCase() === (this.auth.currentUser() ?? '').toLowerCase();
  });
  protected readonly podeAprovar = computed(() => !this.responsavel() || this.souOResponsavel());
  /** Aprovar/devolver/assumir exigem PAGINA:APROVAR — quem edita também revisa. */
  protected readonly podeDecidir = computed(() => {
    const tem = this.auth.tem();
    return tem('PAGINA:APROVAR') || tem('PAGINA:EDITAR');
  });
  protected readonly somenteMinhas = signal(false);

  ngOnInit(): void {
    this.carregar();
    this.eventosSubscription = this.paginaService.eventosPagina().subscribe({
      next: evento => {
        if (!evento.id || !evento.titulo || !evento.acao) {
          this.carregar();
          return;
        }
        this.tratarEventoPagina({
          id: evento.id,
          titulo: evento.titulo,
          acao: evento.acao,
          usuario: evento.usuario,
        });
      },
      error: () => undefined,
    });
  }

  ngOnDestroy(): void {
    this.eventosSubscription?.unsubscribe();
  }

  private tratarEventoPagina(evento: {
    id: string;
    titulo: string;
    acao: 'ENVIAR_REVISAO' | 'APROVAR' | 'PUBLICAR' | 'ARQUIVAR' | 'DEVOLVER' | 'ATRIBUIR_REVISOR';
    usuario?: string;
  }): void {
    this.carregar();
    const usuarioAtual = this.auth.currentUser();
    if (evento.usuario && usuarioAtual && evento.usuario === usuarioAtual) return;
    const mensagens: Record<typeof evento.acao, string> = {
      ENVIAR_REVISAO: `Nova página na fila: "${evento.titulo}"`,
      APROVAR: `Página "${evento.titulo}" aprovada`,
      PUBLICAR: `Página "${evento.titulo}" publicada`,
      ARQUIVAR: `Página "${evento.titulo}" arquivada`,
      DEVOLVER: `Página "${evento.titulo}" devolvida para rascunho`,
      ATRIBUIR_REVISOR: `Revisão de "${evento.titulo}" atribuída`,
    };
    this.notifications.add('info', mensagens[evento.acao], {
      href: docFlowRouterCommands(['paginas', evento.id, 'editar']).join('/'),
    });
  }

  protected carregar(): void {
    this.loading.set(true);
    const consulta = this.somenteMinhas()
      ? this.paginaService.minhasRevisoes({ page: this.page(), size: this.pageSize() })
      : this.paginaService.listarPaginas({
          status: 'EM_REVISAO',
          page: this.page(),
          size: this.pageSize(),
          sort: 'updatedAt',
          dir: 'ASC',
        });
    consulta
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: response => {
          this.paginas.set(response.items);
          this.total.set(response.totalItems);
          if (this.selecionada()) {
            const atualizada = response.items.find(item => item.id === this.selecionada()?.id);
            if (atualizada) this.selecionar(atualizada);
          }
        },
        error: () => this.toast.error('Não foi possível carregar a fila de revisão.'),
      });
  }

  protected selecionar(pagina: Pagina): void {
    this.selecionada.set(pagina);
    this.qualidade.set(null);
    this.revisoes.set([]);
    this.diff.set([]);
    this.diffConteudoAnterior.set('');
    this.diffConteudoAtual.set('');
    this.modoDiff.set('unificado');
    this.carregandoDetalhe.set(true);
    forkJoin({
      qualidade: this.paginaService.qualidadePagina(pagina.id),
      revisoes: this.paginaService.listarRevisoesPagina(pagina.id, 1, 50, 'numero', 'DESC'),
    })
      .pipe(finalize(() => this.carregandoDetalhe.set(false)))
      .subscribe({
        next: async ({ qualidade, revisoes }) => {
          this.qualidade.set(qualidade);
          this.revisoes.set(revisoes.items);
          const atual = revisoes.items[0];
          const anterior = revisoes.items[1];
          if (atual && anterior) {
            const htmlAnterior = anterior.conteudoHtml ?? '';
            const htmlAtual = atual.conteudoHtml ?? '';
            this.diffConteudoAnterior.set(htmlAnterior);
            this.diffConteudoAtual.set(htmlAtual);
            this.diff.set(await diffLinhasPalavras(htmlAnterior, htmlAtual));
          }
        },
        error: () => this.toast.error('Não foi possível carregar os dados editoriais da página.'),
      });
  }

  protected definirModoDiff(modo: DiffModo): void {
    this.modoDiff.set(modo);
  }

  protected aprovar(): void {
    this.executarAcao('aprovar', 'Página aprovada e removida da fila.');
  }

  protected devolver(): void {
    this.executarAcao('devolver', 'Página devolvida para rascunho.');
  }

  protected comentar(texto = this.comentario): void {
    const pagina = this.selecionada();
    const comentario = texto.trim();
    if (!pagina || !comentario || this.executandoAcao()) return;
    this.executandoAcao.set(true);
    this.paginaService
      .comentarRevisaoPagina(pagina.id, comentario)
      .pipe(finalize(() => this.executandoAcao.set(false)))
      .subscribe({
        next: revisao => {
          this.revisoes.update(items => [revisao, ...items]);
          this.comentario = '';
          this.toast.success('Comentário registrado na revisão.');
        },
        error: () => this.toast.error('Não foi possível registrar o comentário.'),
      });
  }

  /** Assume a revisão de verdade: a página passa a exigir este usuário para aprovar. */
  protected assumir(): void {
    const pagina = this.selecionada();
    const usuario = this.auth.currentUser();
    if (!pagina || !usuario || this.executandoAcao()) return;
    this.executandoAcao.set(true);
    this.paginaService
      .atribuirRevisorPagina(pagina.id, { revisorUsername: usuario, prazoRevisao: this.prazo || null })
      .pipe(finalize(() => this.executandoAcao.set(false)))
      .subscribe({
        next: atualizada => {
          this.selecionada.set(atualizada);
          this.paginas.update(items => items.map(item => (item.id === atualizada.id ? atualizada : item)));
          this.toast.success('Revisão atribuída a você.');
        },
        error: (erro: { error?: { message?: string } }) =>
          this.toast.error(erro?.error?.message ?? 'Não foi possível assumir a revisão.'),
      });
  }

  protected alternarSomenteMinhas(): void {
    this.somenteMinhas.update(valor => !valor);
    this.page.set(1);
    this.carregar();
  }

  protected editar(): void {
    const pagina = this.selecionada();
    if (pagina) void this.router.navigate(docFlowRouterCommands(['paginas', pagina.id, 'editar']));
  }

  protected alterarPagina(page: number): void {
    this.page.set(page);
    this.carregar();
  }

  protected alterarTamanhoPagina(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
    this.carregar();
  }

  protected diasNaFila(pagina: Pagina): number {
    const data = pagina.updatedAt ?? pagina.createdAt;
    if (!data) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(data).getTime()) / 86_400_000));
  }

  private executarAcao(acao: 'aprovar' | 'devolver', mensagem: string): void {
    const pagina = this.selecionada();
    if (!pagina || this.executandoAcao()) return;
    this.executandoAcao.set(true);
    const request =
      acao === 'aprovar'
        ? this.paginaService.aprovarPagina(pagina.id)
        : this.paginaService.salvarRascunho(pagina.id);
    request.pipe(finalize(() => this.executandoAcao.set(false))).subscribe({
      next: () => {
        this.toast.success(mensagem);
        this.selecionada.set(null);
        this.qualidade.set(null);
        this.revisoes.set([]);
        this.carregar();
      },
      error: () => this.toast.error('Não foi possível concluir a ação editorial.'),
    });
  }
}
