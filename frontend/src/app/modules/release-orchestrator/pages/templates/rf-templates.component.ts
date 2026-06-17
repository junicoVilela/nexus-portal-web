import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ReleaseTemplate, ReleaseTemplateForm } from '../../models/release-template.model';
import { RELEASE_TIPO_LABELS, TipoRelease } from '../../models/release.model';
import { ReleaseTemplateService } from '../../services/release-template.service';

import { LucideAngularModule } from 'lucide-angular';
import {
  PageHeaderComponent,
  ButtonComponent,
  BadgeComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  ErrorVariant,
  SkeletonComponent,
} from '@shared/ui';
import { classificarErro } from '@shared/utils/error-classifier';

interface MarkdownToolbarBtn {
  label: string;
  before: string;
  after: string;
  placeholder?: string;
}

@Component({
  selector: 'app-rf-templates',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    LucideAngularModule,
    PageHeaderComponent,
    ButtonComponent,
    BadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonComponent,
  ],
  templateUrl: './rf-templates.component.html',
  styleUrl: './rf-templates.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfTemplatesComponent implements OnInit {
  @ViewChild('estruturaTextarea') estruturaTextarea?: ElementRef<HTMLTextAreaElement>;
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly loading = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroVariant = signal<ErrorVariant>('generic');
  protected readonly templates = signal<ReleaseTemplate[]>([]);
  protected readonly page = signal(1);
  protected readonly totalItems = signal(0);
  protected readonly pageSize = 20;

  protected readonly showForm = signal(false);
  protected readonly editId = signal<string | null>(null);
  protected readonly excluindoId = signal<string | null>(null);
  protected readonly showPreview = signal(true);
  protected form!: FormGroup;

  protected readonly mdToolbar: MarkdownToolbarBtn[] = [
    { label: 'H1', before: '# ', after: '', placeholder: 'Título' },
    { label: 'H2', before: '## ', after: '', placeholder: 'Seção' },
    { label: 'H3', before: '### ', after: '', placeholder: 'Subseção' },
    { label: 'Bold', before: '**', after: '**', placeholder: 'texto' },
    { label: 'Itálico', before: '*', after: '*', placeholder: 'texto' },
    { label: 'Código', before: '`', after: '`', placeholder: 'código' },
    { label: 'Lista', before: '- ', after: '', placeholder: 'item' },
    { label: 'Link', before: '[', after: '](url)', placeholder: 'texto' },
  ];

  protected readonly tipoLabels = RELEASE_TIPO_LABELS;
  protected readonly tipos = Object.keys(RELEASE_TIPO_LABELS) as TipoRelease[];

  constructor(
    private readonly fb: FormBuilder,
    private readonly templateService: ReleaseTemplateService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.carregar();
    this.form.get('estrutura')?.valueChanges.subscribe(() => this.atualizarPreview());
  }

  protected carregar(): void {
    this.loading.set(true);
    this.erro.set(null);
    this.templateService.listar(this.page(), this.pageSize).subscribe({
      next: res => {
        this.templates.set(res.items);
        this.totalItems.set(res.totalItems);
        this.loading.set(false);
      },
      error: err => {
        this.erroVariant.set(classificarErro(err));
        this.erro.set('Não foi possível carregar a lista de templates.');
        this.loading.set(false);
      },
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(100)]],
      descricao: [''],
      tipoRelease: [''],
      produtoId: [''],
      estrutura: ['', Validators.required],
      ativo: [true],
    });
  }

  protected abrirNovo(): void {
    this.editId.set(null);
    this.form.reset({ ativo: true, estrutura: '' });
    this.showForm.set(true);
  }

  protected editar(t: ReleaseTemplate): void {
    this.editId.set(t.id!);
    this.form.patchValue(t);
    this.showForm.set(true);
  }

  protected fecharForm(): void {
    this.showForm.set(false);
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    const data: ReleaseTemplateForm = this.form.value;
    const id = this.editId();
    const op$ = id ? this.templateService.atualizar(id, data) : this.templateService.criar(data);

    op$.subscribe({
      next: () => {
        this.showForm.set(false);
        this.salvando.set(false);
        this.carregar();
      },
      error: () => this.salvando.set(false),
    });
  }

  protected excluir(t: ReleaseTemplate): void {
    if (!t.id) return;
    this.templateService.excluir(t.id).subscribe({
      next: () => {
        this.templates.update(list => list.filter(x => x.id !== t.id));
        this.totalItems.update(n => Math.max(0, n - 1));
        this.excluindoId.set(null);
      },
      error: () => {
        this.excluindoId.set(null);
        this.erro.set('Não foi possível excluir o template.');
      },
    });
  }

  protected toggleAtivo(t: ReleaseTemplate): void {
    this.templateService.alterarStatus(t.id!, !t.ativo).subscribe({
      next: updated => this.templates.update(list => list.map(x => (x.id === updated.id ? updated : x))),
    });
  }

  protected fieldError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  private markedRef?: typeof import('marked').marked;
  protected readonly estruturaPreviewHtml = signal<SafeHtml>(
    this.sanitizer.bypassSecurityTrustHtml(
      '<em style="color:var(--text-muted)">Comece a escrever o template…</em>',
    ),
  );

  protected async atualizarPreview(): Promise<void> {
    const md = (this.form.get('estrutura')?.value as string | null)?.trim() ?? '';
    if (!md) {
      this.estruturaPreviewHtml.set(
        this.sanitizer.bypassSecurityTrustHtml(
          '<em style="color:var(--text-muted)">Comece a escrever o template…</em>',
        ),
      );
      return;
    }
    if (!this.markedRef) {
      const mod = await import('marked');
      this.markedRef = mod.marked;
    }
    const html = this.markedRef.parse(md, { async: false }) as string;
    this.estruturaPreviewHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
  }

  protected aplicarMd(btn: MarkdownToolbarBtn): void {
    const ta = this.estruturaTextarea?.nativeElement;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const value = ta.value;
    const selected = value.substring(start, end);
    const insercao = selected || btn.placeholder || '';
    const novoValor = value.substring(0, start) + btn.before + insercao + btn.after + value.substring(end);
    this.form.get('estrutura')?.setValue(novoValor);
    requestAnimationFrame(() => {
      ta.focus();
      const newPos = start + btn.before.length + insercao.length;
      ta.setSelectionRange(newPos, newPos);
    });
  }

  protected togglePreview(): void {
    this.showPreview.update(v => !v);
  }
}
