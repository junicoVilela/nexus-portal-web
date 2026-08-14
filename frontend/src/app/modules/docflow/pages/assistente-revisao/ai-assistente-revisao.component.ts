import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Observable, catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';

import { BadgeComponent, ButtonComponent, PageHeaderComponent, ToastService } from '@shared/ui';
import { mensagemErroHttp } from '@shared/utils/http-error-message';
import { compactQueryParams } from '@shared/utils/query-state';
import {
  AiDocumentoImportacao,
  AiModuloDocumento,
  AiPaginaDocumento,
  AiPaginaPlanoStatus,
} from '../../models/ai-documento-importacao.model';
import { AiProposta } from '../../models/ai-proposta.model';
import { Pagina } from '../../models/pagina.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { PaginaService } from '../../services/pagina.service';

type FiltroRevisao = 'TODAS' | 'A_REVISAR' | 'EM_GERACAO' | 'PENDENTES' | 'SALVAS' | 'ERROS';

interface ItemRevisao {
  pagina: AiPaginaDocumento;
  modulo: AiModuloDocumento;
  ordemGlobal: number;
}

@Component({
  selector: 'app-ai-assistente-revisao',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, PageHeaderComponent, ButtonComponent, BadgeComponent],
  templateUrl: './ai-assistente-revisao.component.html',
  styleUrl: './ai-assistente-revisao.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistenteRevisaoComponent implements OnInit, OnDestroy {
  private readonly ai = inject(AiAssistenteService);
  private readonly paginaService = inject(PaginaService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly importacaoId = this.route.snapshot.paramMap.get('id') ?? '';
  private pollTimer?: number;

  protected readonly importacao = signal<AiDocumentoImportacao | null>(null);
  protected readonly selecionadaId = signal<string | null>(null);
  protected readonly filtro = signal<FiltroRevisao>('TODAS');
  protected readonly proposta = signal<AiProposta | null>(null);
  protected readonly paginaSalva = signal<Pagina | null>(null);
  protected readonly carregando = signal(true);
  protected readonly carregandoDetalhe = signal(false);
  protected readonly executando = signal(false);
  protected readonly sincronizando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly filtros: { id: FiltroRevisao; rotulo: string }[] = [
    { id: 'TODAS', rotulo: 'Todas' },
    { id: 'A_REVISAR', rotulo: 'A revisar' },
    { id: 'EM_GERACAO', rotulo: 'Gerando' },
    { id: 'PENDENTES', rotulo: 'Pendentes' },
    { id: 'SALVAS', rotulo: 'Salvas' },
    { id: 'ERROS', rotulo: 'Com erro' },
  ];

  protected readonly itens = computed<ItemRevisao[]>(() => {
    let ordemGlobal = 0;
    return (this.importacao()?.modulos ?? [])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .flatMap(modulo =>
        modulo.paginas
          .slice()
          .sort((a, b) => a.ordem - b.ordem)
          .map(pagina => ({ pagina, modulo, ordemGlobal: ++ordemGlobal })),
      );
  });

  protected readonly itensFiltrados = computed(() =>
    this.itens().filter(item => this.correspondeFiltro(item.pagina, this.filtro())),
  );

  protected readonly selecionada = computed(
    () => this.itens().find(item => item.pagina.id === this.selecionadaId()) ?? null,
  );

  protected readonly indiceFiltrado = computed(() =>
    this.itensFiltrados().findIndex(item => item.pagina.id === this.selecionadaId()),
  );

  protected readonly previewHtml = computed<SafeHtml | null>(() => {
    const html = this.proposta()?.conteudoHtml;
    return html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
  });

  protected readonly totalSalvas = computed(
    () => this.itens().filter(item => item.pagina.paginaId !== null).length,
  );

  protected readonly totalRevisadas = computed(
    () => this.itens().filter(item => item.pagina.status === 'REVISADA').length,
  );

  protected readonly progresso = computed(() => {
    const total = this.itens().length;
    return total ? Math.round((this.totalSalvas() / total) * 100) : 0;
  });

  protected readonly podeAceitar = computed(() => {
    const proposta = this.proposta();
    const pagina = this.selecionada()?.pagina;
    return (
      !!pagina && !pagina.paginaId && !!proposta && (proposta.status === 'PENDENTE' || !!proposta.paginaId)
    );
  });

  ngOnInit(): void {
    if (!this.importacaoId) {
      this.erro.set('A importação não foi informada.');
      this.carregando.set(false);
      return;
    }
    this.carregar();
  }

  ngOnDestroy(): void {
    this.cancelarPolling();
  }

  protected selecionar(item: ItemRevisao): void {
    if (item.pagina.id === this.selecionadaId()) return;
    this.selecionadaId.set(item.pagina.id);
    this.erro.set(null);
    this.atualizarPaginaNaUrl(item.pagina.id);
    this.carregarDetalhe();
  }

  protected definirFiltro(filtro: FiltroRevisao): void {
    this.filtro.set(filtro);
    const atualAindaVisivel = this.itensFiltrados().some(item => item.pagina.id === this.selecionadaId());
    if (!atualAindaVisivel) {
      const primeira = this.itensFiltrados()[0];
      this.selecionadaId.set(primeira?.pagina.id ?? null);
      this.atualizarPaginaNaUrl(primeira?.pagina.id ?? null);
      this.carregarDetalhe();
    }
  }

  protected totalFiltro(filtro: FiltroRevisao): number {
    return this.itens().filter(item => this.correspondeFiltro(item.pagina, filtro)).length;
  }

  protected mover(delta: -1 | 1): void {
    const indice = this.indiceFiltrado();
    const destino = this.itensFiltrados()[indice + delta];
    if (destino) this.selecionar(destino);
  }

  protected gerarOuRegenerar(): void {
    const doc = this.importacao();
    const pagina = this.selecionada()?.pagina;
    if (!doc || !pagina || pagina.paginaId || this.executando()) return;

    this.executando.set(true);
    this.erro.set(null);
    let operacao: Observable<AiDocumentoImportacao | null>;
    if (pagina.sessaoId && (pagina.status === 'GERADA' || pagina.status === 'ERRO')) {
      operacao = this.ai.gerar(pagina.sessaoId).pipe(map(() => null));
    } else {
      operacao = this.ai.gerarLoteImportacao(doc.id, [pagina.id]);
    }
    operacao.pipe(finalize(() => this.executando.set(false))).subscribe({
      next: atualizada => {
        this.proposta.set(null);
        this.paginaSalva.set(null);
        if (atualizada) this.definirImportacao(atualizada, true);
        else this.sincronizarAgora(true);
        this.toast.success('Geração iniciada. Você pode acompanhar o progresso nesta tela.');
      },
      error: err => this.erro.set(mensagemErroHttp(err, 'Não foi possível iniciar a geração desta página.')),
    });
  }

  protected aceitarComoRascunho(): void {
    const doc = this.importacao();
    const pagina = this.selecionada()?.pagina;
    if (!doc || !pagina || !this.podeAceitar() || this.executando()) return;
    this.executando.set(true);
    this.erro.set(null);
    this.ai
      .aceitarPaginaImportada(doc.id, pagina.id)
      .pipe(finalize(() => this.executando.set(false)))
      .subscribe({
        next: atualizada => {
          this.definirImportacao(atualizada, true);
          this.toast.success('Proposta aceita e página criada como rascunho.');
        },
        error: err => this.erro.set(mensagemErroHttp(err, 'Não foi possível criar o rascunho desta página.')),
      });
  }

  protected editar(): void {
    const doc = this.importacao();
    const item = this.selecionada();
    if (!doc || !item || this.executando()) return;
    if (item.pagina.paginaId) {
      void this.router.navigate(['/doc-flow/paginas', item.pagina.paginaId, 'editar']);
      return;
    }
    if (!item.pagina.sessaoId || !this.proposta()) return;

    this.executando.set(true);
    this.erro.set(null);
    this.ai
      .aplicar(item.pagina.sessaoId, { modo: 'FORM', moduloId: item.modulo.moduloId })
      .pipe(finalize(() => this.executando.set(false)))
      .subscribe({
        next: aplicacao => {
          void this.router.navigate(['/doc-flow/paginas/novo'], {
            queryParams: compactQueryParams({
              projetoId: doc.projetoId,
              moduloId: aplicacao.moduloId ?? item.modulo.moduloId,
              importacaoId: doc.id,
              paginaPlanoId: item.pagina.id,
            }),
            state: {
              origem: 'ai',
              proposta: {
                titulo: aplicacao.titulo,
                slug: aplicacao.slug,
                codigoTela: aplicacao.codigoTela,
                resumo: aplicacao.resumo,
                conteudoHtml: aplicacao.conteudoHtml,
                templateOrigemId: aplicacao.templateOrigemId,
                templateOrigemVersao: aplicacao.templateOrigemVersao,
                moduloId: aplicacao.moduloId,
                importacaoId: doc.id,
                paginaPlanoId: item.pagina.id,
              },
            },
          });
        },
        error: err => this.erro.set(mensagemErroHttp(err, 'Não foi possível abrir a proposta no editor.')),
      });
  }

  protected enviarParaRevisao(): void {
    const pagina = this.paginaSalva();
    if (!pagina || pagina.status !== 'RASCUNHO' || this.executando()) return;
    this.executando.set(true);
    this.erro.set(null);
    this.paginaService
      .enviarRevisaoPagina(pagina.id)
      .pipe(finalize(() => this.executando.set(false)))
      .subscribe({
        next: atualizada => {
          this.paginaSalva.set(atualizada);
          this.toast.success('Página enviada para a fila editorial.');
        },
        error: err => this.erro.set(mensagemErroHttp(err, 'Não foi possível enviar a página para revisão.')),
      });
  }

  protected sincronizarAgora(forcarDetalhe = false): void {
    const doc = this.importacao();
    if (!doc || this.sincronizando()) return;
    this.sincronizando.set(true);
    this.ai
      .sincronizarImportacao(doc.id)
      .pipe(finalize(() => this.sincronizando.set(false)))
      .subscribe({
        next: atualizada => this.definirImportacao(atualizada, forcarDetalhe),
        error: err => this.erro.set(mensagemErroHttp(err, 'Não foi possível atualizar o progresso agora.')),
      });
  }

  protected rotuloStatus(status: AiPaginaPlanoStatus): string {
    const rotulos: Record<AiPaginaPlanoStatus, string> = {
      PENDENTE: 'Pendente',
      EM_EDICAO: 'Briefing preparado',
      EM_GERACAO: 'Gerando',
      GERADA: 'Proposta pronta',
      REVISADA: 'Revisada',
      ERRO: 'Requer atenção',
    };
    return rotulos[status];
  }

  protected tomStatus(status: AiPaginaPlanoStatus): 'neutral' | 'success' | 'warn' | 'danger' | 'info' {
    if (status === 'REVISADA') return 'success';
    if (status === 'ERRO') return 'danger';
    if (status === 'EM_GERACAO') return 'info';
    if (status === 'GERADA') return 'warn';
    return 'neutral';
  }

  protected rotuloStatusEditorial(status: Pagina['status']): string {
    const rotulos: Record<Pagina['status'], string> = {
      RASCUNHO: 'Rascunho salvo',
      EM_REVISAO: 'Na fila editorial',
      APROVADO: 'Aprovada',
      PUBLICADO: 'Publicada',
      ARQUIVADO: 'Arquivada',
    };
    return rotulos[status];
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.ai
      .buscarImportacao(this.importacaoId)
      .pipe(
        switchMap(importacao =>
          importacao.estruturaConfirmada
            ? this.ai.sincronizarImportacao(importacao.id).pipe(catchError(() => of(importacao)))
            : of(importacao),
        ),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe({
        next: importacao => this.definirImportacao(importacao, true),
        error: err => this.erro.set(mensagemErroHttp(err, 'Não foi possível abrir a revisão deste manual.')),
      });
  }

  private definirImportacao(importacao: AiDocumentoImportacao, forcarDetalhe = false): void {
    const anterior = this.selecionada();
    this.importacao.set(importacao);
    let selecionadaId = this.selecionadaId();
    if (!selecionadaId || !this.itens().some(item => item.pagina.id === selecionadaId)) {
      const paginaUrl = this.route.snapshot.queryParamMap.get('pagina');
      selecionadaId = this.itens().some(item => item.pagina.id === paginaUrl)
        ? paginaUrl
        : (this.primeiraPaginaPrioritaria()?.pagina.id ?? null);
      this.selecionadaId.set(selecionadaId);
      this.atualizarPaginaNaUrl(selecionadaId);
    }
    const atual = this.selecionada();
    const detalheMudou =
      anterior?.pagina.id !== atual?.pagina.id ||
      anterior?.pagina.status !== atual?.pagina.status ||
      anterior?.pagina.sessaoId !== atual?.pagina.sessaoId ||
      anterior?.pagina.paginaId !== atual?.pagina.paginaId;
    if (forcarDetalhe || detalheMudou) this.carregarDetalhe();
    this.configurarPolling();
  }

  private primeiraPaginaPrioritaria(): ItemRevisao | null {
    return (
      this.itens().find(item => item.pagina.status === 'GERADA' && !item.pagina.paginaId) ??
      this.itens().find(item => item.pagina.status === 'ERRO') ??
      this.itens().find(item => item.pagina.status === 'EM_GERACAO') ??
      this.itens().find(item => item.pagina.status !== 'REVISADA') ??
      this.itens()[0] ??
      null
    );
  }

  private carregarDetalhe(): void {
    const pagina = this.selecionada()?.pagina;
    this.proposta.set(null);
    this.paginaSalva.set(null);
    if (!pagina) return;

    this.carregandoDetalhe.set(true);
    forkJoin({
      proposta: pagina.sessaoId
        ? this.ai.proposta(pagina.sessaoId).pipe(catchError(() => of(null)))
        : of(null),
      paginaSalva: pagina.paginaId
        ? this.paginaService.pagina(pagina.paginaId).pipe(catchError(() => of(null)))
        : of(null),
    })
      .pipe(finalize(() => this.carregandoDetalhe.set(false)))
      .subscribe(({ proposta, paginaSalva }) => {
        this.proposta.set(proposta);
        this.paginaSalva.set(paginaSalva);
      });
  }

  private correspondeFiltro(pagina: AiPaginaDocumento, filtro: FiltroRevisao): boolean {
    if (filtro === 'TODAS') return true;
    if (filtro === 'A_REVISAR') return pagina.status === 'GERADA' && !pagina.paginaId;
    if (filtro === 'EM_GERACAO') return pagina.status === 'EM_GERACAO';
    if (filtro === 'PENDENTES') return pagina.status === 'PENDENTE' || pagina.status === 'EM_EDICAO';
    if (filtro === 'SALVAS') return pagina.paginaId !== null;
    return pagina.status === 'ERRO';
  }

  private configurarPolling(): void {
    this.cancelarPolling();
    if (!this.itens().some(item => item.pagina.status === 'EM_GERACAO')) return;
    this.pollTimer = window.setTimeout(() => {
      const doc = this.importacao();
      if (!doc) return;
      this.ai.sincronizarImportacao(doc.id).subscribe({
        next: atualizada => this.definirImportacao(atualizada),
        error: () => {
          this.erro.set(
            'O acompanhamento automático foi interrompido. Use “Atualizar” para tentar novamente.',
          );
          this.cancelarPolling();
        },
      });
    }, 2_000);
  }

  private cancelarPolling(): void {
    if (this.pollTimer !== undefined) window.clearTimeout(this.pollTimer);
    this.pollTimer = undefined;
  }

  private atualizarPaginaNaUrl(paginaId: string | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { pagina: paginaId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
