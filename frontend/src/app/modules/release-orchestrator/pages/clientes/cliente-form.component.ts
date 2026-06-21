import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { forkJoin, from, of, switchMap } from 'rxjs';

import { CanDeactivateComponent } from '@shared/guards';
import { BadgeComponent, ButtonComponent, PageHeaderComponent, ToastService } from '@shared/ui';

import {
  AMBIENTE_LABELS,
  AmbientePadrao,
  Cliente,
  ClienteForm,
  Contato,
  ContatoForm,
  PAPEL_CONTATO_LABELS,
  PapelContato,
  TIPO_BANCO_LABELS,
  TipoBanco,
} from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente.service';
import { ContatoService } from '../../services/contato.service';

const CNPJ_REGEX = /^\d{14}$/;

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    ButtonComponent,
    BadgeComponent,
  ],
  templateUrl: './cliente-form.component.html',
  styleUrl: './cliente-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteFormComponent implements OnInit, CanDeactivateComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clienteService = inject(ClienteService);
  private readonly contatoService = inject(ContatoService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  protected readonly editId = signal<string | null>(null);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly contatosOriginais = signal<Contato[]>([]);

  protected readonly ambientes = Object.keys(AMBIENTE_LABELS) as AmbientePadrao[];
  protected readonly tiposBanco = Object.keys(TIPO_BANCO_LABELS) as TipoBanco[];
  protected readonly papeis = Object.keys(PAPEL_CONTATO_LABELS) as PapelContato[];
  protected readonly ambienteLabels = AMBIENTE_LABELS;
  protected readonly bancoLabels = TIPO_BANCO_LABELS;
  protected readonly papelLabels = PAPEL_CONTATO_LABELS;

  protected form!: FormGroup;

  protected readonly editando = computed(() => this.editId() !== null);

  ngOnInit(): void {
    this.buildForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId.set(id);
      this.carregar(id);
    }
  }

  hasUnsavedChanges(): boolean {
    return this.form?.dirty === true && !this.salvando();
  }

  unsavedChangesDescription(): string {
    return 'cadastro do cliente';
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(200)]],
      razaoSocial: ['', [Validators.maxLength(300)]],
      cnpj: ['', [Validators.pattern(CNPJ_REGEX)]],
      sigla: ['', [Validators.required, Validators.maxLength(20)]],
      ambientePadrao: ['PROD' as AmbientePadrao, Validators.required],
      tipoBanco: [null as TipoBanco | null],
      codificacao: ['UTF-8', [Validators.maxLength(30)]],
      fusoHorario: ['America/Sao_Paulo', [Validators.maxLength(60)]],
      observacoes: ['', [Validators.maxLength(4000)]],
      ativo: [true],
      contatos: this.fb.array([] as FormGroup[]),
    });
  }

  protected get contatosArray(): FormArray<FormGroup> {
    return this.form.get('contatos') as FormArray<FormGroup>;
  }

  protected adicionarContato(c?: Partial<Contato>): void {
    this.contatosArray.push(
      this.fb.group({
        id: [c?.id ?? null],
        nome: [c?.nome ?? '', [Validators.required, Validators.maxLength(200)]],
        papel: [c?.papel ?? 'TECNICO' as PapelContato, Validators.required],
        email: [c?.email ?? '', [Validators.required, Validators.email, Validators.maxLength(200)]],
        telefone: [c?.telefone ?? '', [Validators.maxLength(40)]],
      }),
    );
  }

  protected removerContato(idx: number): void {
    this.contatosArray.removeAt(idx);
    this.contatosArray.markAsDirty();
  }

  protected onCnpjInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const apenasDigitos = input.value.replace(/\D/g, '').slice(0, 14);
    if (apenasDigitos !== input.value) {
      this.form.get('cnpj')?.setValue(apenasDigitos);
    }
  }

  private carregar(id: string): void {
    this.carregando.set(true);
    forkJoin({
      cliente: this.clienteService.buscar(id),
      contatos: this.contatoService.listar(id),
    }).subscribe({
      next: ({ cliente, contatos }) => {
        this.form.patchValue({
          nome: cliente.nome,
          razaoSocial: cliente.razaoSocial ?? '',
          cnpj: cliente.cnpj ?? '',
          sigla: cliente.sigla,
          ambientePadrao: cliente.ambientePadrao,
          tipoBanco: cliente.tipoBanco ?? null,
          codificacao: cliente.codificacao ?? '',
          fusoHorario: cliente.fusoHorario ?? '',
          observacoes: cliente.observacoes ?? '',
          ativo: cliente.ativo,
        });
        this.contatosArray.clear();
        contatos.forEach(c => this.adicionarContato(c));
        this.contatosOriginais.set(contatos);
        this.form.markAsPristine();
        this.carregando.set(false);
      },
      error: () => {
        this.toast.error('Não foi possível carregar o cliente.');
        this.carregando.set(false);
        this.router.navigate(['/release-orchestrator/clientes']);
      },
    });
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warn('Corrija os campos destacados antes de salvar.');
      return;
    }
    this.salvando.set(true);
    const raw = this.form.getRawValue();
    const clienteForm: ClienteForm = {
      nome: raw.nome,
      razaoSocial: raw.razaoSocial || undefined,
      cnpj: raw.cnpj || undefined,
      sigla: raw.sigla,
      ambientePadrao: raw.ambientePadrao,
      tipoBanco: raw.tipoBanco || undefined,
      codificacao: raw.codificacao || undefined,
      fusoHorario: raw.fusoHorario || undefined,
      observacoes: raw.observacoes || undefined,
      ativo: raw.ativo,
    };

    const id = this.editId();
    const persistirCliente$ = id
      ? this.clienteService.atualizar(id, clienteForm)
      : this.clienteService.criar(clienteForm);

    persistirCliente$
      .pipe(switchMap(cliente => this.sincronizarContatos(cliente)))
      .subscribe({
        next: cliente => {
          this.salvando.set(false);
          this.toast.success(id ? 'Cliente atualizado.' : 'Cliente cadastrado.');
          this.form.markAsPristine();
          this.router.navigate(['/release-orchestrator/clientes', cliente.id]);
        },
        error: () => {
          this.salvando.set(false);
          this.toast.error('Erro ao salvar cliente. Verifique sigla e CNPJ únicos.');
        },
      });
  }

  /**
   * Após criar/atualizar o cliente: aplica diff dos contatos.
   * - Removidos (id existia, sumiu do form) → DELETE
   * - Novos (sem id no form) → POST
   * - Editados (id existia, dados mudaram) → PUT
   * Retorna o cliente atualizado pra navegação.
   */
  private sincronizarContatos(cliente: Cliente) {
    const formValues = this.contatosArray.getRawValue() as Array<{
      id: string | null;
      nome: string;
      papel: PapelContato;
      email: string;
      telefone: string;
    }>;
    const originais = this.contatosOriginais();
    const idsAtuais = new Set(formValues.filter(c => c.id).map(c => c.id!));
    const removidos = originais.filter(o => !idsAtuais.has(o.id));

    const ops$ = [
      ...removidos.map(c => this.contatoService.excluir(cliente.id, c.id)),
      ...formValues.map(c => {
        const form: ContatoForm = {
          nome: c.nome,
          papel: c.papel,
          email: c.email,
          telefone: c.telefone || undefined,
        };
        return c.id
          ? this.contatoService.atualizar(cliente.id, c.id, form)
          : this.contatoService.criar(cliente.id, form);
      }),
    ];

    if (ops$.length === 0) return of(cliente);
    return forkJoin(ops$).pipe(switchMap(() => of(cliente)));
  }

  protected fieldError(path: string): boolean {
    const c = this.form.get(path);
    return !!(c?.invalid && c?.touched);
  }

  protected contatoFieldError(idx: number, field: string): boolean {
    const c = this.contatosArray.at(idx)?.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
