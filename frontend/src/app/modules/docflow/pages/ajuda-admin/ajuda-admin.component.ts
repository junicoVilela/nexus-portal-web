import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs';
import { ConfirmService, PageHeaderComponent, ToastService } from '@shared/ui';
import {
  AjudaConteudo,
  AjudaConteudoRequest,
  AjudaMetricas,
  TipoAjudaConteudo,
  TipoAjudaMedia,
} from '../../models/ajuda.model';
import { AjudaService } from '../../services/ajuda.service';

const TIPOS: TipoAjudaConteudo[] = ['JORNADA', 'ETAPA', 'FAQ', 'ARTIGO', 'TOUR_PASSO', 'ONBOARDING'];
const MIDIAS: TipoAjudaMedia[] = ['NENHUMA', 'IMAGEM', 'GIF', 'VIDEO', 'GALERIA'];

@Component({
  selector: 'app-ajuda-admin',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule, PageHeaderComponent],
  templateUrl: './ajuda-admin.component.html',
  styleUrl: './ajuda-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AjudaAdminComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ajuda = inject(AjudaService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly tipos = TIPOS;
  protected readonly midias = MIDIAS;
  protected readonly conteudos = signal<AjudaConteudo[]>([]);
  protected readonly jornadas = computed(() =>
    this.conteudos().filter(item => item.tipo === 'JORNADA' && item.ativo),
  );
  protected readonly metricas = signal<AjudaMetricas | null>(null);
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly editandoId = signal<string | null>(null);
  protected readonly editorAberto = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
    tipo: ['ARTIGO' as TipoAjudaConteudo, Validators.required],
    jornadaCodigo: [''],
    titulo: ['', Validators.required],
    resumo: [''],
    conteudo: [''],
    rotaContexto: ['/doc-flow'],
    rotaAcao: [''],
    rotuloAcao: [''],
    icone: ['BookOpen'],
    seletorAlvo: [''],
    mediaTipo: ['NENHUMA' as TipoAjudaMedia],
    mediaUrls: [''],
    mediaAlt: [''],
    ordem: [0],
    ativo: [true],
  });

  constructor() {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.ajuda
      .listarAdministracao()
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: conteudos => this.conteudos.set(conteudos),
        error: () => this.toast.error('Não foi possível carregar os conteúdos de ajuda.'),
      });
    this.ajuda.metricas().subscribe({
      next: metricas => this.metricas.set(metricas),
      error: () => this.metricas.set(null),
    });
  }

  protected novo(): void {
    this.editandoId.set(null);
    this.form.reset({
      codigo: '',
      tipo: 'ARTIGO',
      jornadaCodigo: '',
      titulo: '',
      resumo: '',
      conteudo: '',
      rotaContexto: '/doc-flow',
      rotaAcao: '',
      rotuloAcao: '',
      icone: 'BookOpen',
      seletorAlvo: '',
      mediaTipo: 'NENHUMA',
      mediaUrls: '',
      mediaAlt: '',
      ordem: this.conteudos().length + 1,
      ativo: true,
    });
    this.form.controls.codigo.enable();
    this.editorAberto.set(true);
  }

  protected editar(item: AjudaConteudo): void {
    this.editandoId.set(item.id ?? null);
    this.form.reset({
      codigo: item.codigo,
      tipo: item.tipo,
      jornadaCodigo: item.jornadaCodigo ?? '',
      titulo: item.titulo,
      resumo: item.resumo ?? '',
      conteudo: item.conteudo ?? '',
      rotaContexto: item.rotaContexto ?? '',
      rotaAcao: item.rotaAcao ?? '',
      rotuloAcao: item.rotuloAcao ?? '',
      icone: item.icone ?? '',
      seletorAlvo: item.seletorAlvo ?? '',
      mediaTipo: item.mediaTipo,
      mediaUrls: item.mediaUrls.join('\n'),
      mediaAlt: item.mediaAlt ?? '',
      ordem: item.ordem,
      ativo: item.ativo,
    });
    this.form.controls.codigo.disable();
    this.editorAberto.set(true);
  }

  protected cancelar(): void {
    this.editorAberto.set(false);
    this.editandoId.set(null);
  }

  protected salvar(): void {
    if (this.form.invalid || this.salvando()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    if (raw.tipo === 'ETAPA' && !raw.jornadaCodigo.trim()) {
      this.form.controls.jornadaCodigo.setErrors({ required: true });
      this.toast.error('Selecione a jornada à qual esta etapa pertence.');
      return;
    }
    const request: AjudaConteudoRequest = {
      ...raw,
      jornadaCodigo: raw.tipo === 'ETAPA' ? vazioParaNull(raw.jornadaCodigo) : null,
      resumo: vazioParaNull(raw.resumo),
      conteudo: vazioParaNull(raw.conteudo),
      rotaContexto: vazioParaNull(raw.rotaContexto),
      rotaAcao: vazioParaNull(raw.rotaAcao),
      rotuloAcao: vazioParaNull(raw.rotuloAcao),
      icone: vazioParaNull(raw.icone),
      seletorAlvo: vazioParaNull(raw.seletorAlvo),
      mediaUrls: raw.mediaUrls
        .split(/\r?\n/)
        .map(url => url.trim())
        .filter(Boolean),
      mediaAlt: vazioParaNull(raw.mediaAlt),
    };
    this.salvando.set(true);
    const id = this.editandoId();
    const operacao = id ? this.ajuda.atualizar(id, request) : this.ajuda.criar(request);
    operacao.pipe(finalize(() => this.salvando.set(false))).subscribe({
      next: () => {
        this.toast.success(id ? 'Conteúdo atualizado.' : 'Conteúdo criado.');
        this.cancelar();
        this.carregar();
      },
      error: error => this.toast.error(this.mensagemErro(error, 'Não foi possível salvar o conteúdo.')),
    });
  }

  protected async excluir(item: AjudaConteudo): Promise<void> {
    if (!item.id) return;
    const confirmado = await this.confirm.confirm({
      title: 'Excluir conteúdo de ajuda?',
      message: `“${item.titulo}” deixará de aparecer na ajuda, busca e tours.`,
      acceptLabel: 'Excluir conteúdo',
      variant: 'danger',
      icon: 'Trash2',
    });
    if (!confirmado) return;
    this.ajuda.excluir(item.id).subscribe({
      next: () => {
        this.toast.success('Conteúdo excluído.');
        this.carregar();
      },
      error: error => this.toast.error(this.mensagemErro(error, 'Não foi possível excluir o conteúdo.')),
    });
  }

  private mensagemErro(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    if (typeof error.error?.message === 'string') return error.error.message;
    if (Array.isArray(error.error?.errors) && error.error.errors.length) {
      return error.error.errors.join(' ');
    }
    return fallback;
  }
}

function vazioParaNull(valor: string): string | null {
  return valor.trim() || null;
}
