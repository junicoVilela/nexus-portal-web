import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { AuthService } from '@core/auth/services/auth.service';
import { Pagina, PaginaQualidade, PaginaRevisao } from '@modules/docflow/models/pagina.model';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { DiffLinha, diffLinhasPalavras } from '@modules/docflow/utils/diff.util';
import type { DiffModo } from '@modules/docflow/components/pagina-revisoes/pagina-revisoes.component';
import { TablePaginationComponent } from '@shared/components/table-pagination/table-pagination.component';
import { ListPageComponent } from '@shared/layouts';
import { BadgeComponent, ButtonComponent, ToastService } from '@shared/ui';

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
  ],
  templateUrl: './revisoes.component.html',
  styleUrl: './revisoes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevisoesComponent implements OnInit {
  private readonly paginaService = inject(PaginaService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

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

  protected readonly comentarios = computed(() => this.revisoes().filter(item => item.tipo === 'COMENTARIO'));
  protected readonly responsavel = computed(
    () =>
      this.comentarios().find(item => item.descricao?.startsWith('Revisão assumida por '))?.createdBy ?? null,
  );

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.loading.set(true);
    this.paginaService
      .listarPaginas({
        status: 'EM_REVISAO',
        page: this.page(),
        size: this.pageSize(),
        sort: 'updatedAt',
        dir: 'ASC',
      })
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

  protected assumir(): void {
    this.comentar(`Revisão assumida por ${this.auth.currentUser() || 'revisor'}.`);
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
