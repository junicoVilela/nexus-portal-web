import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { TIMINGS } from '@core/config/timings';
import { Pagina } from '@modules/docflow/models/pagina.model';
import { PaginaDraftService } from '@modules/docflow/services/pagina-draft.service';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { ConfirmService, ToastService } from '@shared/ui';

export type SalvarDestino = 'lista' | 'continuar' | 'nova';
export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'conflict' | 'error';

/** O que a persistência precisa do editor. O que fazer com a página gravada fica no componente. */
export interface PaginaFormPersistenciaContexto {
  form: FormGroup;
  paginaId(): string | undefined;
  paginaAtual(): Pagina | undefined;
  /** Corpo enviado à API (inclui a `version` para o controle otimista). */
  payload(): Partial<Pagina>;
  /** Autosave ou prévia gravaram: atualiza versão/slug (e o id, se a página era nova). */
  persistida(pagina: Pagina): void;
  /** A página passa a ser a editada (id na URL, histórico, vínculo com a IA). */
  ativada(pagina: Pagina): void;
  /** "Carregar servidor" no conflito: substitui o formulário pela versão do servidor. */
  recarregada(pagina: Pagina): void;
  /** Salvar explícito concluído: segue para lista / continuar / próxima página. */
  salva(pagina: Pagina, destino: SalvarDestino): void;
}

/**
 * Salvamento do editor de páginas, em três camadas:
 *
 * 1. **Backup local** — cada alteração (com debounce) vai para o `localStorage`; sobrevive a F5 e
 *    queda de rede, e é restaurado ao abrir o editor.
 * 2. **Autosave no servidor** — só para rascunhos; um por vez (o que chega durante um envio
 *    fica pendente e roda em seguida).
 * 3. **Salvar explícito** — gera revisão e decide o destino.
 *
 * HTTP 409 (outro usuário salvou antes) para o autosave e abre o aviso de conflito: o autor escolhe
 * carregar a versão do servidor ou sobrescrevê-la. Escopo do `pagina-form` (`providers`).
 */
@Injectable()
export class PaginaFormPersistencia {
  private readonly paginaService = inject(PaginaService);
  private readonly draft = inject(PaginaDraftService);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);
  private contexto?: PaginaFormPersistenciaContexto;

  /** Há alterações ainda não gravadas no servidor. */
  private dirty = false;
  /** Acabou de salvar e vai sair da tela: não pergunta "sair sem salvar?". */
  private justSaved = false;
  private autosavePendente = false;

  readonly saving = signal(false);
  readonly autosaveStatus = signal<AutosaveStatus>('idle');
  readonly autosaveServidorEm = signal<Date | null>(null);
  readonly conflitoMensagem = signal<string | null>(null);
  readonly rascunhoSalvoEm = signal<Date | null>(null);

  readonly autosaveLabel = computed(() => {
    switch (this.autosaveStatus()) {
      case 'saving':
        return 'Salvando no servidor…';
      case 'saved': {
        const em = this.autosaveServidorEm();
        return em
          ? `Salvo no servidor às ${em.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
          : 'Salvo no servidor';
      }
      case 'offline':
        return 'Sem conexão · backup local ativo';
      case 'conflict':
        return 'Conflito de edição';
      case 'error':
        return 'Falha ao salvar · backup local ativo';
      default:
        return 'Autosave pronto';
    }
  });

  configurar(contexto: PaginaFormPersistenciaContexto): void {
    this.contexto = contexto;
  }

  hasUnsavedChanges(): boolean {
    return this.dirty && !this.justSaved;
  }

  /** Alteração feita fora do `valueChanges` com debounce (IA, tabela, proposta). */
  marcarAlterado(): void {
    this.dirty = true;
    this.justSaved = false;
  }

  /** O formulário agora reflete a página gravada. */
  marcarSincronizado(): void {
    this.dirty = false;
    this.justSaved = false;
    this.conflitoMensagem.set(null);
  }

  /** Página nova ("salvar e criar próxima"): zera o estado de salvamento. */
  reiniciar(): void {
    this.marcarSincronizado();
    this.rascunhoSalvoEm.set(null);
    this.autosaveStatus.set('idle');
    this.autosaveServidorEm.set(null);
  }

  /** Liga backup local + autosave às alterações do formulário. */
  iniciarAutosave(): void {
    const ctx = this.ctx();
    ctx.form.valueChanges
      .pipe(debounceTime(TIMINGS.autosaveDebounceMs), takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.marcarAlterado();
        this.rascunhoSalvoEm.set(this.draft.salvar(this.draftKey(), value));
        this.autosalvarServidor();
      });
    // Backup restaurado de uma sessão anterior: tenta levar ao servidor logo.
    if (this.rascunhoSalvoEm()) this.autosalvarServidor();
  }

  restaurarRascunho(): void {
    const snapshot = this.draft.carregar<Record<string, unknown>>(this.draftKey(), {
      maxAgeDays: TIMINGS.draftMaxAgeDays,
      servidorAtualizadoEm: this.ctx().paginaAtual()?.updatedAt,
    });
    if (!snapshot) return;

    this.ctx().form.patchValue(snapshot.value);
    this.rascunhoSalvoEm.set(snapshot.savedAt);
    this.toast.success('Rascunho local restaurado.');
  }

  autosalvarServidor(): void {
    const ctx = this.ctx();
    if (ctx.form.invalid || this.saving() || this.autosaveStatus() === 'conflict') return;
    const atual = ctx.paginaAtual();
    if (atual && atual.status !== 'RASCUNHO') return;
    if (this.autosaveStatus() === 'saving') {
      this.autosavePendente = true;
      return;
    }
    const id = ctx.paginaId();
    const draftKey = this.draftKey();
    this.autosaveStatus.set('saving');
    const request = id
      ? this.paginaService.autosavePagina(id, ctx.payload())
      : this.paginaService.salvarPagina(ctx.payload());
    request.subscribe({
      next: pagina => {
        this.limparRascunho(draftKey);
        ctx.persistida(pagina);
        this.marcarSalvoNoServidor();
        this.executarAutosavePendente();
      },
      error: error => {
        this.tratarErro(error, true);
        this.executarAutosavePendente();
      },
    });
  }

  salvar(destino: SalvarDestino): void {
    const ctx = this.ctx();
    if (this.saving()) return;
    if (ctx.form.invalid) {
      ctx.form.markAllAsTouched();
      this.toast.error('Preencha título, código da tela, projeto e módulo.');
      return;
    }
    const draftKey = this.draftKey();
    this.saving.set(true);
    this.paginaService.salvarPagina(ctx.payload(), ctx.paginaId()).subscribe({
      next: pagina => {
        this.justSaved = true;
        this.limparRascunho(draftKey);
        this.saving.set(false);
        this.marcarSalvoNoServidor();
        this.conflitoMensagem.set(null);
        ctx.salva(pagina, destino);
      },
      error: error => {
        this.saving.set(false);
        this.tratarErro(error, false);
      },
    });
  }

  /**
   * Página nova precisa de id para receber anexos: cria o rascunho na hora.
   * @returns o id, ou `undefined` se o formulário está incompleto ou a API falhou.
   */
  async garantirRascunho(motivo: string): Promise<string | undefined> {
    const ctx = this.ctx();
    const existente = ctx.paginaId();
    if (existente) return existente;
    if (ctx.form.invalid) {
      ctx.form.markAllAsTouched();
      this.toast.error(`Preencha título, código da tela, projeto e módulo antes de ${motivo}.`);
      return undefined;
    }
    const draftKey = this.draftKey();
    this.saving.set(true);
    try {
      const pagina = await firstValueFrom(this.paginaService.salvarPagina(ctx.payload()));
      this.limparRascunho(draftKey);
      ctx.ativada(pagina);
      this.toast.success('Rascunho criado para armazenar as imagens.');
      return pagina.id;
    } catch (error) {
      this.toast.error(mensagemErro(error, 'Não foi possível criar o rascunho.'));
      return undefined;
    } finally {
      this.saving.set(false);
    }
  }

  /** A prévia fiel é gerada no servidor: grava o que estiver pendente antes. */
  async sincronizarParaPreview(): Promise<Pagina | undefined> {
    const ctx = this.ctx();
    if (this.autosaveStatus() === 'saving') {
      this.toast.error('Aguarde o salvamento automático terminar antes de abrir a prévia.');
      return undefined;
    }
    const id = ctx.paginaId();
    const atual = ctx.paginaAtual();
    if (id && atual && !this.dirty) return atual;
    const request = id
      ? atual?.status === 'RASCUNHO'
        ? this.paginaService.autosavePagina(id, ctx.payload())
        : this.paginaService.salvarPagina(ctx.payload(), id)
      : this.paginaService.salvarPagina(ctx.payload());
    const draftKey = this.draftKey();
    const pagina = await firstValueFrom(request);
    this.limparRascunho(draftKey);
    ctx.persistida(pagina);
    this.marcarSalvoNoServidor();
    return pagina;
  }

  /** Conflito: descarta as alterações locais e carrega a versão do servidor. */
  async usarVersaoServidor(): Promise<void> {
    const id = this.ctx().paginaId();
    if (!id) return;
    const confirmar = await this.confirmService.confirm({
      title: 'Carregar versão do servidor?',
      message: 'As alterações locais em conflito serão descartadas.',
      acceptLabel: 'Carregar servidor',
      variant: 'danger',
      icon: 'AlertTriangle',
    });
    if (!confirmar) return;
    try {
      const pagina = await firstValueFrom(this.paginaService.pagina(id));
      this.limparRascunho();
      this.ctx().recarregada(pagina);
      this.conflitoMensagem.set(null);
      this.autosaveStatus.set('idle');
      this.toast.success('Versão mais recente carregada.');
    } catch (error) {
      this.toast.error(mensagemErro(error, 'Erro ao recarregar a página.'));
    }
  }

  /** Conflito: grava as alterações locais por cima da versão atual do servidor. */
  async sobrescreverConflito(): Promise<void> {
    const ctx = this.ctx();
    const id = ctx.paginaId();
    if (!id || this.saving()) return;
    const confirmar = await this.confirmService.confirm({
      title: 'Sobrescrever a versão do servidor?',
      message: 'Suas alterações locais serão mantidas e substituirão a edição feita por outra pessoa.',
      acceptLabel: 'Sobrescrever',
      variant: 'danger',
      icon: 'AlertTriangle',
    });
    if (!confirmar) return;
    this.saving.set(true);
    try {
      const servidor = await firstValueFrom(this.paginaService.pagina(id));
      const payload = { ...ctx.payload(), version: servidor.version };
      const pagina = await firstValueFrom(this.paginaService.salvarPagina(payload, id));
      this.limparRascunho();
      ctx.ativada(pagina);
      this.marcarSalvoNoServidor();
      this.toast.success('Sua versão foi salva no servidor.');
    } catch (error) {
      this.tratarErro(error, false);
    } finally {
      this.saving.set(false);
    }
  }

  /** 409 vira conflito; sem rede no autosave fica "offline" (o backup local segue valendo). */
  tratarErro(error: unknown, autosave: boolean): void {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      const mensagem = mensagemErro(error, 'Esta página foi alterada por outro usuário.');
      this.conflitoMensagem.set(mensagem);
      this.autosaveStatus.set('conflict');
      if (!autosave) this.toast.error(mensagem);
      return;
    }
    if (autosave && error instanceof HttpErrorResponse && error.status === 0) {
      this.autosaveStatus.set('offline');
      return;
    }
    this.autosaveStatus.set('error');
    if (!autosave) this.toast.error(mensagemErro(error, 'Erro ao salvar página.'));
  }

  /** Chave do backup local; a de uma página nova muda quando ela ganha id. */
  private draftKey(): string {
    return `docflow:pagina-form:${this.ctx().paginaId() ?? 'novo'}`;
  }

  private limparRascunho(key = this.draftKey()): void {
    this.draft.remover(key);
    this.dirty = false;
    this.rascunhoSalvoEm.set(null);
  }

  private marcarSalvoNoServidor(): void {
    this.autosaveStatus.set('saved');
    this.autosaveServidorEm.set(new Date());
  }

  private executarAutosavePendente(): void {
    if (!this.autosavePendente) return;
    this.autosavePendente = false;
    queueMicrotask(() => this.autosalvarServidor());
  }

  private ctx(): PaginaFormPersistenciaContexto {
    if (!this.contexto) throw new Error('PaginaFormPersistencia: chame configurar() antes de usar.');
    return this.contexto;
  }
}

function mensagemErro(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (typeof error.error?.message === 'string') return error.error.message;
  return fallback;
}
