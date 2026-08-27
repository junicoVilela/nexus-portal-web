import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

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
import { ClienteProduto } from '../../models/cliente-produto.model';
import { ModuloProduto } from '../../models/modulo-produto.model';
import { Produto } from '../../models/produto.model';
import { ClienteProdutoService } from '../../services/cliente-produto.service';
import { ClienteService } from '../../services/cliente.service';
import { ContatoService } from '../../services/contato.service';
import { ModuloProdutoService } from '../../services/modulo-produto.service';
import { ProdutoService } from '../../services/produto.service';
import {
  chaveModuloCliente,
  diffContratosCliente,
  moduloIdDaChave,
  produtoIdDaChave,
} from './contratos-cliente.util';

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
  private readonly produtoService = inject(ProdutoService);
  private readonly moduloProdutoService = inject(ModuloProdutoService);
  private readonly clienteProdutoService = inject(ClienteProdutoService);
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
  protected readonly produtosCatalogo = signal<Produto[]>([]);
  protected readonly modulosPorProduto = signal<Record<string, ModuloProduto[]>>({});
  protected readonly produtosMarcados = signal<Set<string>>(new Set());
  protected readonly modulosMarcados = signal<Set<string>>(new Set());
  private contratosOriginais: ClienteProduto[] = [];
  private modulosOriginais = new Set<string>();

  ngOnInit(): void {
    this.buildForm();
    this.carregarCatalogoProdutos();
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
        papel: [c?.papel ?? ('TECNICO' as PapelContato), Validators.required],
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
        this.carregarContratos(id);
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

    persistirCliente$.pipe(switchMap(cliente => this.sincronizarProdutos(cliente).pipe(
      switchMap(c => this.sincronizarContatos(c)),
    ))).subscribe({
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
    const formValues = this.contatosArray.getRawValue() as {
      id: string | null;
      nome: string;
      papel: PapelContato;
      email: string;
      telefone: string;
    }[];
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

  private carregarCatalogoProdutos(): void {
    this.produtoService.listar(1, 200, undefined, true).pipe(
      switchMap(r => {
        const items = r.items ?? [];
        this.produtosCatalogo.set(items);
        if (items.length === 0) {
          return of({} as Record<string, ModuloProduto[]>);
        }
        return forkJoin(
          items.map(p =>
            this.moduloProdutoService.listar(p.id).pipe(
              catchError(() => of([] as ModuloProduto[])),
              map(mods => [p.id, mods.filter(m => m.ativo)] as const),
            ),
          ),
        ).pipe(map(pares => Object.fromEntries(pares)));
      }),
    ).subscribe({
      next: mapa => this.modulosPorProduto.set(mapa),
      error: () => this.toast.error('Não foi possível listar os produtos para contratar.'),
    });
  }

  protected produtoMarcado(id: string): boolean {
    return this.produtosMarcados().has(id);
  }

  protected moduloMarcado(produtoId: string, moduloId: string): boolean {
    return this.modulosMarcados().has(chaveModuloCliente(produtoId, moduloId));
  }

  protected modulosDoProduto(produtoId: string): ModuloProduto[] {
    return this.modulosPorProduto()[produtoId] ?? [];
  }

  protected onProdutoCheck(produtoId: string, event: Event): void {
    const marcado = !!(event.target as HTMLInputElement | null)?.checked;
    const produtos = new Set(this.produtosMarcados());
    const modulos = new Set(this.modulosMarcados());
    if (marcado) {
      produtos.add(produtoId);
      for (const m of this.modulosDoProduto(produtoId)) {
        modulos.add(chaveModuloCliente(produtoId, m.id));
      }
    } else {
      produtos.delete(produtoId);
      for (const chave of [...modulos]) {
        if (chave.startsWith(`${produtoId}:`)) {
          modulos.delete(chave);
        }
      }
    }
    this.produtosMarcados.set(produtos);
    this.modulosMarcados.set(modulos);
    this.form.markAsDirty();
  }

  protected onModuloCheck(produtoId: string, moduloId: string, event: Event): void {
    const marcado = !!(event.target as HTMLInputElement | null)?.checked;
    const produtos = new Set(this.produtosMarcados());
    const modulos = new Set(this.modulosMarcados());
    const chave = chaveModuloCliente(produtoId, moduloId);
    if (marcado) {
      produtos.add(produtoId);
      modulos.add(chave);
    } else {
      modulos.delete(chave);
    }
    this.produtosMarcados.set(produtos);
    this.modulosMarcados.set(modulos);
    this.form.markAsDirty();
  }

  private carregarContratos(clienteId: string): void {
    this.clienteProdutoService.listar(clienteId).pipe(
      switchMap(contratos => {
        this.contratosOriginais = contratos.filter(c => c.ativo);
        const produtos = new Set(this.contratosOriginais.map(c => c.produtoId));
        this.produtosMarcados.set(produtos);
        if (this.contratosOriginais.length === 0) {
          return of([] as { produtoId: string; moduloId: string }[]);
        }
        return forkJoin(
          this.contratosOriginais.map(c =>
            this.clienteProdutoService.listarModulos(clienteId, c.id).pipe(
              catchError(() => of([])),
              map(mods =>
                mods.filter(m => m.ativo).map(m => ({
                  produtoId: c.produtoId,
                  moduloId: m.moduloProdutoId,
                })),
              ),
            ),
          ),
        ).pipe(map(listas => listas.flat()));
      }),
    ).subscribe({
      next: mods => {
        const chaves = new Set(mods.map(m => chaveModuloCliente(m.produtoId, m.moduloId)));
        this.modulosOriginais = chaves;
        this.modulosMarcados.set(chaves);
      },
      error: () => this.toast.error('Não foi possível carregar os produtos contratados.'),
    });
  }

  private sincronizarProdutos(cliente: Cliente) {
    const ambiente = this.form.get('ambientePadrao')?.value as AmbientePadrao;
    const diff = diffContratosCliente(this.produtosMarcados(), this.contratosOriginais);
    const ops$ = [
      ...diff.rescindir.map(c => this.clienteProdutoService.rescindir(cliente.id, c.id)),
      ...diff.contratar.map(produtoId =>
        this.clienteProdutoService.contratar(cliente.id, { produtoId, ambiente }).pipe(
          switchMap(cp => this.sincronizarModulosDoContrato(cliente.id, cp.produtoId, cp.id)),
        ),
      ),
      ...diff.manter.map(c => this.sincronizarModulosDoContrato(cliente.id, c.produtoId, c.id)),
    ];
    if (ops$.length === 0) {
      return of(cliente);
    }
    return forkJoin(ops$).pipe(switchMap(() => of(cliente)));
  }

  private sincronizarModulosDoContrato(clienteId: string, produtoId: string, contratoId: string) {
    const desejados = [...this.modulosMarcados()]
      .filter(c => produtoIdDaChave(c) === produtoId)
      .map(moduloIdDaChave);
    const originais = [...this.modulosOriginais]
      .filter(c => produtoIdDaChave(c) === produtoId)
      .map(moduloIdDaChave);
    const incluir = desejados.filter(id => !originais.includes(id));
    const remover = originais.filter(id => !desejados.includes(id));
    const ops$ = [
      ...incluir.map(id => this.clienteProdutoService.salvarModulo(clienteId, contratoId, id, { ativo: true })),
      ...remover.map(id => this.clienteProdutoService.removerModulo(clienteId, contratoId, id)),
    ];
    if (ops$.length === 0) {
      return of(null);
    }
    return forkJoin(ops$);
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
