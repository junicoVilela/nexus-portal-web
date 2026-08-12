import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { catchError, forkJoin, of } from 'rxjs';

import { BadgeComponent, ButtonComponent } from '@shared/ui';
import { mensagemErroHttp } from '@shared/utils/http-error-message';
import {
  AiDocumentoImportacao,
  AiDocumentoClienteModo,
  AiDocumentoProjetoModo,
  AiModuloDocumento,
  AiPaginaDocumento,
  AiPaginaDocumentoSelecionada,
} from '../../models/ai-documento-importacao.model';
import { Cliente } from '../../models/cliente.model';
import { Projeto } from '../../models/projeto.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { ClienteService } from '../../services/cliente.service';
import { ModuloService } from '../../services/modulo.service';
import { ProjetoService } from '../../services/projeto.service';

@Component({
  selector: 'app-ai-documento-importacao',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, ButtonComponent, BadgeComponent],
  templateUrl: './ai-documento-importacao.component.html',
  styleUrl: './ai-documento-importacao.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiDocumentoImportacaoComponent implements OnInit {
  private readonly ai = inject(AiAssistenteService);
  private readonly clienteService = inject(ClienteService);
  private readonly projetoService = inject(ProjetoService);
  private readonly moduloService = inject(ModuloService);
  private readonly fb = inject(FormBuilder);
  private carregouImportacaoInicial = false;
  private catalogosCarregados = false;

  readonly importacaoIdInicial = input<string | null>(null);
  readonly projetoId = input<string | null>(null);
  readonly clienteId = input<string | null>(null);
  readonly disabled = input(false);
  readonly paginaSelecionada = output<AiPaginaDocumentoSelecionada>();
  readonly importacaoChange = output<string>();

  protected readonly importacao = signal<AiDocumentoImportacao | null>(null);
  protected readonly importando = signal(false);
  protected readonly confirmando = signal(false);
  protected readonly carregandoCatalogos = signal(false);
  protected readonly arrastando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroCatalogos = signal<string | null>(null);
  protected readonly paginaAtivaId = signal<string | null>(null);
  protected readonly modoProjeto = signal<AiDocumentoProjetoModo>('NOVO_PROJETO');
  protected readonly modoCliente = signal<AiDocumentoClienteModo>('SEM_CLIENTE');
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly projetos = signal<Projeto[]>([]);
  protected readonly modulosForm = this.fb.array<FormControl<string>>([]);
  protected readonly estruturaForm = this.fb.nonNullable.group({
    projetoId: [''],
    clienteId: [''],
    clienteNome: ['', Validators.maxLength(150)],
    projetoNome: ['', [Validators.required, Validators.maxLength(150)]],
    projetoDescricao: ['', Validators.maxLength(1_000)],
  });

  ngOnInit(): void {
    const id = this.importacaoIdInicial();
    if (id && !this.carregouImportacaoInicial) {
      this.carregouImportacaoInicial = true;
      this.carregar(id);
    }
  }

  protected selecionarArquivo(event: Event): void {
    const inputArquivo = event.target as HTMLInputElement;
    const arquivo = inputArquivo.files?.[0];
    inputArquivo.value = '';
    if (arquivo) this.importar(arquivo);
  }

  protected soltar(event: DragEvent): void {
    event.preventDefault();
    this.arrastando.set(false);
    const arquivo = event.dataTransfer?.files?.[0];
    if (arquivo) this.importar(arquivo);
  }

  protected permitirSoltar(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled()) this.arrastando.set(true);
  }

  protected sairDropzone(): void {
    this.arrastando.set(false);
  }

  protected usarPagina(pagina: AiPaginaDocumento, modulo: AiModuloDocumento): void {
    const importacao = this.importacao();
    if (!importacao || this.importando()) return;
    if (!importacao.estruturaConfirmada) {
      this.erro.set('Confirme o projeto e os módulos antes de gerar uma página.');
      return;
    }
    this.importando.set(true);
    this.erro.set(null);
    this.ai.selecionarPaginaImportada(importacao.id, pagina.id).subscribe({
      next: atualizada => {
        this.definirImportacao(atualizada);
        this.importando.set(false);
        const moduloSelecionado = atualizada.modulos.find(item =>
          item.paginas.some(paginaPlano => paginaPlano.id === pagina.id),
        );
        const selecionada = moduloSelecionado?.paginas.find(item => item.id === pagina.id);
        if (selecionada && moduloSelecionado?.moduloId && atualizada.projetoId) {
          this.paginaSelecionada.emit({
            ...selecionada,
            importacaoId: atualizada.id,
            moduloNome: moduloSelecionado.nome,
            moduloId: moduloSelecionado.moduloId,
            projetoId: atualizada.projetoId,
            clienteId: atualizada.clienteId,
          });
        }
      },
      error: err => {
        this.erro.set(mensagemErroHttp(err, 'Não foi possível selecionar a página importada.'));
        this.importando.set(false);
      },
    });
  }

  protected totalPaginas(importacao: AiDocumentoImportacao): number {
    return importacao.modulos.reduce((total, modulo) => total + modulo.paginas.length, 0);
  }

  protected tamanhoLegivel(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected definirModoProjeto(modo: AiDocumentoProjetoModo): void {
    this.modoProjeto.set(modo);
    this.erro.set(null);
    if (modo === 'NOVO_PROJETO') {
      this.estruturaForm.controls.projetoId.setValue('');
      this.estruturaForm.controls.projetoNome.setValidators([Validators.required, Validators.maxLength(150)]);
    } else {
      const importacao = this.importacao();
      this.estruturaForm.controls.projetoId.setValue(importacao?.projetoId ?? this.projetoId() ?? '');
      this.estruturaForm.controls.projetoNome.clearValidators();
    }
    this.estruturaForm.controls.projetoNome.updateValueAndValidity();
  }

  protected confirmarEstrutura(): void {
    const importacao = this.importacao();
    if (!importacao || importacao.estruturaConfirmada || this.confirmando()) return;
    this.estruturaForm.markAllAsTouched();
    this.modulosForm.controls.forEach(controle => controle.markAsTouched());
    const nomesModulos = this.modulosForm.controls.map(controle => controle.value.trim());
    const projetoId = this.estruturaForm.controls.projetoId.value || null;
    if (
      this.estruturaForm.invalid ||
      nomesModulos.some(nome => !nome) ||
      (this.modoProjeto() === 'PROJETO_EXISTENTE' && !projetoId) ||
      (this.modoCliente() === 'CLIENTE_EXISTENTE' && !this.estruturaForm.controls.clienteId.value) ||
      (this.modoCliente() === 'NOVO_CLIENTE' && !this.estruturaForm.controls.clienteNome.value.trim())
    ) {
      this.erro.set('Revise o projeto e informe um nome para todos os módulos.');
      return;
    }

    this.confirmando.set(true);
    this.erro.set(null);
    this.ai
      .confirmarEstruturaImportada(importacao.id, {
        modoProjeto: this.modoProjeto(),
        modoCliente: this.modoCliente(),
        projetoId,
        clienteId:
          this.modoCliente() === 'CLIENTE_EXISTENTE'
            ? this.estruturaForm.controls.clienteId.value || null
            : null,
        clienteNome:
          this.modoCliente() === 'NOVO_CLIENTE' ? this.estruturaForm.controls.clienteNome.value.trim() : null,
        projetoNome:
          this.modoProjeto() === 'NOVO_PROJETO' ? this.estruturaForm.controls.projetoNome.value.trim() : null,
        projetoDescricao: this.estruturaForm.controls.projetoDescricao.value.trim() || null,
        modulos: importacao.modulos.map((modulo, indice) => ({
          planoId: modulo.id,
          nome: nomesModulos[indice],
        })),
      })
      .subscribe({
        next: atualizada => {
          this.definirImportacao(atualizada);
          this.projetoService.invalidarCache();
          this.moduloService.invalidarCache();
          this.catalogosCarregados = false;
          this.confirmando.set(false);
        },
        error: err => {
          this.erro.set(mensagemErroHttp(err, 'Não foi possível criar a estrutura do documento.'));
          this.confirmando.set(false);
        },
      });
  }

  protected definirModoCliente(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.modoCliente.set(select.value as AiDocumentoClienteModo);
    this.erro.set(null);
    if (this.modoCliente() !== 'CLIENTE_EXISTENTE') {
      this.estruturaForm.controls.clienteId.setValue('');
    }
    if (this.modoCliente() !== 'NOVO_CLIENTE') {
      this.estruturaForm.controls.clienteNome.setValue('');
    }
  }

  private importar(arquivo: File): void {
    if (this.disabled() || this.importando()) return;
    const extensao = arquivo.name.split('.').pop()?.toLowerCase();
    if (!extensao || !['doc', 'docx', 'pdf', 'txt'].includes(extensao)) {
      this.erro.set('Use um arquivo DOC, DOCX, PDF pesquisável ou TXT em UTF-8.');
      return;
    }
    if (arquivo.size > 15 * 1024 * 1024) {
      this.erro.set('O arquivo excede o limite de 15 MB.');
      return;
    }
    this.importando.set(true);
    this.erro.set(null);
    this.paginaAtivaId.set(null);
    this.ai
      .importarDocumento(arquivo, { projetoId: this.projetoId(), clienteId: this.clienteId() })
      .subscribe({
        next: importacao => {
          this.definirImportacao(importacao);
          this.prepararEstrutura(importacao);
          this.importando.set(false);
          this.importacaoChange.emit(importacao.id);
        },
        error: err => {
          this.erro.set(mensagemErroHttp(err, 'Não foi possível interpretar o documento.'));
          this.importando.set(false);
        },
      });
  }

  private carregar(id: string): void {
    this.importando.set(true);
    this.erro.set(null);
    this.ai.buscarImportacao(id).subscribe({
      next: importacao => {
        this.definirImportacao(importacao);
        this.prepararEstrutura(importacao);
        this.importando.set(false);
      },
      error: err => {
        this.erro.set(mensagemErroHttp(err, 'Não foi possível retomar a importação.'));
        this.importando.set(false);
      },
    });
  }

  private definirImportacao(importacao: AiDocumentoImportacao): void {
    this.importacao.set(importacao);
    const paginaAtiva = importacao.modulos
      .flatMap(modulo => modulo.paginas)
      .find(pagina => pagina.status === 'EM_EDICAO');
    this.paginaAtivaId.set(paginaAtiva?.id ?? null);
  }

  private prepararEstrutura(importacao: AiDocumentoImportacao): void {
    if (importacao.estruturaConfirmada) return;
    this.estruturaForm.patchValue({
      projetoId: importacao.projetoId ?? this.projetoId() ?? '',
      clienteId: importacao.clienteId ?? this.clienteId() ?? '',
      clienteNome: '',
      projetoNome: importacao.projetoNome,
      projetoDescricao: importacao.projetoDescricao ?? '',
    });
    this.modulosForm.clear();
    this.modoCliente.set(importacao.clienteId || this.clienteId() ? 'CLIENTE_EXISTENTE' : 'SEM_CLIENTE');
    importacao.modulos.forEach(modulo =>
      this.modulosForm.push(
        this.fb.nonNullable.control(modulo.nome, [Validators.required, Validators.maxLength(150)]),
      ),
    );
    this.definirModoProjeto(importacao.projetoId || this.projetoId() ? 'PROJETO_EXISTENTE' : 'NOVO_PROJETO');
    this.carregarCatalogos();
  }

  private carregarCatalogos(): void {
    if (this.catalogosCarregados || this.carregandoCatalogos()) return;
    this.carregandoCatalogos.set(true);
    this.erroCatalogos.set(null);
    let falhaClientes = false;
    let falhaProjetos = false;
    forkJoin({
      clientes: this.clienteService.clientes().pipe(
        catchError(() => {
          falhaClientes = true;
          return of([] as Cliente[]);
        }),
      ),
      projetos: this.projetoService.projetos().pipe(
        catchError(() => {
          falhaProjetos = true;
          return of([] as Projeto[]);
        }),
      ),
    }).subscribe(({ clientes, projetos }) => {
      this.clientes.set(clientes.filter(cliente => cliente.ativo));
      this.projetos.set(projetos.filter(projeto => projeto.ativo));
      this.catalogosCarregados = true;
      this.carregandoCatalogos.set(false);
      if (falhaClientes && falhaProjetos) {
        this.erroCatalogos.set('Não foi possível carregar clientes e projetos existentes.');
      } else if (falhaClientes) {
        this.erroCatalogos.set('Não foi possível carregar os clientes existentes.');
      } else if (falhaProjetos) {
        this.erroCatalogos.set('Não foi possível carregar os projetos existentes.');
      }
    });
  }
}
