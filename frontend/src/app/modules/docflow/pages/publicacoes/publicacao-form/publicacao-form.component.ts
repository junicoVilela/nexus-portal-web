import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';
import { ClienteService } from '@modules/docflow/services/cliente.service';
import { PublicacaoService } from '@modules/docflow/services/publicacao.service';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { Cliente } from '@modules/docflow/models/cliente.model';
import { Pagina } from '@modules/docflow/models/pagina.model';
import {
  PageHeaderComponent,
  ButtonComponent,
  CardComponent,
  BadgeComponent,
  NotificationService,
  ToastService,
} from '@shared/ui';

interface Diagnostico {
  severidade: string;
  mensagem: string;
  paginaId?: string;
  paginaTitulo?: string;
}

@Component({
  selector: 'app-publicacao-form',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent, ButtonComponent, CardComponent, BadgeComponent],
  templateUrl: './publicacao-form.component.html',
  styleUrl: './publicacao-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicacaoFormComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly notifications = inject(NotificationService);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly paginasPreview = signal<Pagina[]>([]);
  protected readonly diagnosticos = signal<Diagnostico[]>([]);
  protected readonly selectedPaginaId = signal<string>('');
  protected readonly loadingPreview = signal(false);
  protected readonly generating = signal(false);

  protected readonly paginaSelecionada = computed<Pagina | undefined>(() => {
    const lista = this.paginasPreview();
    const selectedId = this.selectedPaginaId();
    return lista.find(pagina => pagina.id === selectedId) ?? lista[0];
  });

  readonly form = this.fb.nonNullable.group({
    clienteId: ['', Validators.required],
    versao: ['', Validators.required],
    observacao: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly clienteService: ClienteService,
    private readonly publicacaoService: PublicacaoService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.clienteService.clientes().subscribe({
      next: clientes => this.clientes.set([...clientes].sort((a, b) => a.nome.localeCompare(b.nome))),
      error: error => this.toast.error(this.errorMessage(error, 'Erro ao carregar clientes.')),
    });
  }

  preview(abrirNovaPagina = false): void {
    const clienteId = this.form.controls.clienteId.value;
    if (!clienteId || this.loadingPreview()) return;
    const previewWindow = abrirNovaPagina ? window.open('', '_blank') : null;
    if (abrirNovaPagina && !previewWindow) {
      this.toast.error('O navegador bloqueou a nova página de prévia.');
      return;
    }
    if (previewWindow) {
      previewWindow.document.write(this.previewLoadingHtml());
      previewWindow.document.close();
    }

    this.loadingPreview.set(true);
    this.paginasPreview.set([]);
    const versao = this.form.controls.versao.value.trim() || undefined;
    forkJoin({
      paginas: this.publicacaoService.previewPublicacao(clienteId),
      html: abrirNovaPagina ? this.publicacaoService.previewPublicacaoHtml(clienteId, versao) : of(''),
      diagnosticos: this.publicacaoService.diagnosticoPublicacao(clienteId),
    })
      .pipe(finalize(() => this.loadingPreview.set(false)))
      .subscribe({
        next: result => {
          this.paginasPreview.set(result.paginas);
          this.diagnosticos.set(result.diagnosticos);
          this.selectedPaginaId.set(result.paginas[0]?.id ?? '');
          if (previewWindow) {
            previewWindow.document.open();
            previewWindow.document.write(result.html);
            previewWindow.document.close();
          }
        },
        error: error => {
          const message = this.errorMessage(error, 'Erro ao visualizar páginas elegíveis.');
          if (previewWindow) this.escreverErroPreview(previewWindow, message);
          this.toast.error(message);
        },
      });
  }

  gerar(): void {
    if (this.form.invalid || this.generating()) {
      this.toast.error('Selecione o cliente e informe a versão antes de gerar.');
      return;
    }
    const raw = this.form.getRawValue();
    const payload = {
      clienteId: raw.clienteId,
      versao: raw.versao.trim(),
      observacao: raw.observacao.trim() || undefined,
    };
    if (!payload.versao) {
      this.toast.error('Informe a versão do pacote.');
      return;
    }
    this.generating.set(true);
    this.publicacaoService
      .gerarPublicacao(payload)
      .pipe(finalize(() => this.generating.set(false)))
      .subscribe({
        next: pub => {
          const cliente = this.clientes().find(c => c.id === payload.clienteId);
          this.notifications.add('success', `Pacote ${payload.versao} gerado`, {
            description: cliente ? `Cliente: ${cliente.nome}` : undefined,
            href: pub?.id ? `/doc-flow/publicacoes/${pub.id}` : undefined,
          });
          this.router.navigate(docFlowRouterCommands(['publicacoes']));
        },
        error: error =>
          this.toast.error(
            this.errorMessage(error, 'Erro ao gerar pacote. Verifique se há páginas publicadas elegíveis.'),
          ),
      });
  }

  voltar(): void {
    this.router.navigate(docFlowRouterCommands(['publicacoes']));
  }

  selecionarPagina(pagina: Pagina): void {
    this.selectedPaginaId.set(pagina.id);
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    if (error.status === 403) return 'Seu usuário não tem permissão para executar esta ação.';
    if (typeof error.error?.message === 'string') return error.error.message;
    if (Array.isArray(error.error?.errors) && error.error.errors.length > 0) {
      return error.error.errors.join(' ');
    }
    return fallback;
  }

  private escreverErroPreview(previewWindow: Window, message: string): void {
    previewWindow.document.open();
    previewWindow.document.write(`
      <!doctype html>
      <html lang="pt-BR">
      <head><meta charset="utf-8"><title>Erro na prévia</title></head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <h1>Não foi possível carregar a prévia</h1>
        <p>${this.escapeHtml(message)}</p>
      </body>
      </html>
    `);
    previewWindow.document.close();
  }

  private previewLoadingHtml(): string {
    return `
      <!doctype html>
      <html lang="pt-BR">
      <head><meta charset="utf-8"><title>Carregando prévia</title></head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <h1>Carregando prévia...</h1>
      </body>
      </html>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
