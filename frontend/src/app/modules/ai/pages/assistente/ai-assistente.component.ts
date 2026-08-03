import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription } from 'rxjs';

import { BadgeComponent, ButtonComponent, CardComponent } from '@shared/ui';
import { mensagemErroHttp } from '@shared/utils/http-error-message';
import { compactQueryParams } from '@shared/utils/query-state';
import { AiPerguntasComponent } from '../../components/ai-perguntas/ai-perguntas.component';
import { AiPropostaPreviewComponent } from '../../components/ai-proposta-preview/ai-proposta-preview.component';
import { AiProposta } from '../../models/ai-proposta.model';
import { AiPergunta, AiSessao } from '../../models/ai-sessao.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { AiFeatureService } from '../../services/ai-feature.service';

type WizardPasso = 'brief' | 'chat' | 'revisar';

@Component({
  selector: 'app-ai-assistente',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    AiPerguntasComponent,
    AiPropostaPreviewComponent,
  ],
  templateUrl: './ai-assistente.component.html',
  styleUrl: './ai-assistente.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistenteComponent implements OnInit, OnDestroy {
  private readonly ai = inject(AiAssistenteService);
  private readonly feature = inject(AiFeatureService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private eventosSub?: Subscription;
  private pollTimer?: number;
  private geracaoResolvida = false;

  protected readonly sessao = signal<AiSessao | null>(null);
  protected readonly proposta = signal<AiProposta | null>(null);
  protected readonly carregando = signal(false);
  protected readonly gerando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly respostas = signal<Record<string, string>>({});
  protected readonly aiDisponivel = this.feature.disponivel;
  protected readonly featureReady = this.feature.ready;

  protected readonly form = this.fb.nonNullable.group({
    briefing: [
      '',
      [Validators.required, Validators.minLength(40), Validators.maxLength(50_000)],
    ],
  });

  protected readonly perguntasPendentes = computed<AiPergunta[]>(() => {
    const s = this.sessao();
    if (!s || s.status !== 'AGUARDANDO_USUARIO') return [];
    const ultima = [...s.mensagens].reverse().find(m => m.papel === 'ASSISTENTE');
    return ultima?.perguntas ?? [];
  });

  protected readonly prontaParaGerar = computed(
    () => this.sessao()?.status === 'PRONTA_PARA_GERAR' || this.sessao()?.status === 'ERRO',
  );

  protected readonly pronta = computed(() => this.sessao()?.status === 'PRONTA');

  protected readonly passoAtual = computed<WizardPasso>(() => {
    if (!this.sessao()) return 'brief';
    if (this.proposta() || this.pronta() || this.gerando()) return 'revisar';
    return 'chat';
  });

  protected readonly passos = [
    { id: 'brief' as const, label: 'Briefing', num: 1 },
    { id: 'chat' as const, label: 'Chat', num: 2 },
    { id: 'revisar' as const, label: 'Revisar', num: 3 },
  ];

  ngOnInit(): void {
    this.feature.ensureLoaded();
  }

  ngOnDestroy(): void {
    this.limparEscutaGeracao();
  }

  protected passoEstado(id: WizardPasso): 'active' | 'done' | 'todo' {
    const ordem: WizardPasso[] = ['brief', 'chat', 'revisar'];
    const atual = ordem.indexOf(this.passoAtual());
    const idx = ordem.indexOf(id);
    if (idx === atual) return 'active';
    if (idx < atual) return 'done';
    return 'todo';
  }

  protected iniciar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.carregando.set(true);
    this.erro.set(null);
    this.proposta.set(null);
    const qp = this.route.snapshot.queryParamMap;
    this.ai
      .criarSessao({
        objetivo: 'CRIAR_PAGINA',
        briefing: this.form.controls.briefing.value.trim(),
        projetoId: qp.get('projetoId'),
        moduloId: qp.get('moduloId'),
        templateId: qp.get('templateId'),
      })
      .subscribe({
        next: s => {
          this.sessao.set(s);
          this.respostas.set({});
          this.carregando.set(false);
        },
        error: err => {
          this.erro.set(this.mensagemErro(err));
          this.carregando.set(false);
        },
      });
  }

  protected setResposta(id: string, valor: string): void {
    this.respostas.update(atual => ({ ...atual, [id]: valor }));
  }

  protected enviarRespostas(): void {
    const s = this.sessao();
    if (!s) return;

    const pendentes = this.perguntasPendentes();
    const faltando = pendentes.filter(p => p.obrigatoria && !this.respostas()[p.id]?.trim());
    if (faltando.length) {
      this.erro.set(`Responda: ${faltando.map(p => p.texto).join(' · ')}`);
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);
    this.ai
      .enviarMensagem(s.id, {
        conteudo: 'Respostas do formulário de triagem.',
        respostas: this.respostas(),
      })
      .subscribe({
        next: atualizada => {
          this.sessao.set(atualizada);
          this.respostas.set({});
          this.carregando.set(false);
        },
        error: err => {
          this.erro.set(this.mensagemErro(err));
          this.carregando.set(false);
        },
      });
  }

  protected gerarRascunho(): void {
    const s = this.sessao();
    if (!s) return;
    this.limparEscutaGeracao();
    this.geracaoResolvida = false;
    this.gerando.set(true);
    this.erro.set(null);
    this.proposta.set(null);
    this.ai.gerar(s.id).subscribe({
      next: () => this.ouvirGeracao(s.id),
      error: err => {
        this.erro.set(this.mensagemErro(err));
        this.gerando.set(false);
      },
    });
  }

  protected aplicarNoEditor(): void {
    const s = this.sessao();
    if (!s) return;
    this.carregando.set(true);
    const qp = this.route.snapshot.queryParamMap;
    this.ai
      .aplicar(s.id, {
        modo: 'FORM',
        moduloId: qp.get('moduloId') || s.moduloId,
        parentId: qp.get('parentId'),
      })
      .subscribe({
        next: app => {
          this.carregando.set(false);
          void this.router.navigate(['/doc-flow/paginas/novo'], {
            queryParams: compactQueryParams({
              projetoId: qp.get('projetoId') || s.projetoId,
              moduloId: app.moduloId || qp.get('moduloId') || s.moduloId,
              parentId: qp.get('parentId'),
            }),
            state: {
              origem: 'ai',
              proposta: {
                titulo: app.titulo,
                slug: app.slug,
                codigoTela: app.codigoTela,
                resumo: app.resumo,
                conteudoHtml: app.conteudoHtml,
                templateOrigemId: app.templateOrigemId,
                templateOrigemVersao: app.templateOrigemVersao,
                moduloId: app.moduloId,
              },
            },
          });
        },
        error: err => {
          this.erro.set(this.mensagemErro(err));
          this.carregando.set(false);
        },
      });
  }

  protected cancelar(): void {
    const s = this.sessao();
    if (!s) {
      void this.router.navigate(['/doc-flow/paginas']);
      return;
    }
    this.carregando.set(true);
    this.ai.cancelarSessao(s.id).subscribe({
      next: () => {
        this.carregando.set(false);
        void this.router.navigate(['/doc-flow/paginas']);
      },
      error: err => {
        this.erro.set(this.mensagemErro(err));
        this.carregando.set(false);
      },
    });
  }

  protected reiniciar(): void {
    this.limparEscutaGeracao();
    this.sessao.set(null);
    this.proposta.set(null);
    this.respostas.set({});
    this.erro.set(null);
    this.gerando.set(false);
    this.form.reset({ briefing: '' });
  }

  private ouvirGeracao(sessaoId: string): void {
    this.eventosSub = this.ai.eventosAi().subscribe({
      next: ev => {
        if (ev.sessaoId !== sessaoId) return;
        if (ev.status === 'SUCESSO' || ev.status === 'ERRO') {
          this.resolverGeracao(sessaoId, ev.status === 'ERRO');
        }
      },
      error: () => {
        /* polling cobre o fallback */
      },
    });
    this.pollProposta(sessaoId, 0);
  }

  private pollProposta(sessaoId: string, tentativa: number): void {
    if (this.geracaoResolvida) return;
    if (tentativa > 40) {
      this.erro.set('Tempo esgotado aguardando a geração. Tente novamente.');
      this.gerando.set(false);
      this.limparEscutaGeracao();
      return;
    }
    this.ai.buscarSessao(sessaoId).subscribe({
      next: s => {
        if (this.geracaoResolvida) return;
        this.sessao.set(s);
        if (s.status === 'PRONTA') {
          this.resolverGeracao(sessaoId, false);
          return;
        }
        if (s.status === 'ERRO') {
          this.resolverGeracao(sessaoId, true);
          return;
        }
        this.pollTimer = window.setTimeout(() => this.pollProposta(sessaoId, tentativa + 1), 750);
      },
      error: err => {
        if (this.geracaoResolvida) return;
        this.erro.set(this.mensagemErro(err));
        this.gerando.set(false);
        this.limparEscutaGeracao();
      },
    });
  }

  private resolverGeracao(sessaoId: string, comErro: boolean): void {
    if (this.geracaoResolvida) return;
    this.geracaoResolvida = true;
    this.limparEscutaGeracao();
    if (comErro) {
      this.erro.set('Falha na geração do rascunho. Você pode tentar novamente.');
      this.gerando.set(false);
      this.ai.buscarSessao(sessaoId).subscribe(s => this.sessao.set(s));
      return;
    }
    this.ai.proposta(sessaoId).subscribe({
      next: p => {
        this.proposta.set(p);
        this.gerando.set(false);
        this.ai.buscarSessao(sessaoId).subscribe(s => this.sessao.set(s));
      },
      error: err => {
        this.erro.set(this.mensagemErro(err));
        this.gerando.set(false);
      },
    });
  }

  private limparEscutaGeracao(): void {
    this.eventosSub?.unsubscribe();
    this.eventosSub = undefined;
    if (this.pollTimer !== undefined) {
      window.clearTimeout(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  private mensagemErro(err: unknown): string {
    return mensagemErroHttp(err, 'Falha ao falar com o assistente.');
  }
}
