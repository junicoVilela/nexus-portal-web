import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { catchError, forkJoin, of } from 'rxjs';

import { BadgeComponent, ButtonComponent } from '@shared/ui';
import { mensagemErroHttp } from '@shared/utils/http-error-message';
import {
  AiDocumentoImportacao,
  AiDocumentoClienteModo,
  AiDocumentoProjetoModo,
  AiEstimativaLoteDocumento,
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
import { AiDocumentoOrganizadorComponent } from '../ai-documento-organizador/ai-documento-organizador.component';
import { AiDocumentoSugestoesComponent } from '../ai-documento-sugestoes/ai-documento-sugestoes.component';

@Component({
  selector: 'app-ai-documento-importacao',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    ButtonComponent,
    BadgeComponent,
    AiDocumentoOrganizadorComponent,
    AiDocumentoSugestoesComponent,
  ],
  templateUrl: './ai-documento-importacao.component.html',
  styleUrl: './ai-documento-importacao.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiDocumentoImportacaoComponent implements OnInit, OnDestroy {
  private readonly ai = inject(AiAssistenteService);
  private readonly clienteService = inject(ClienteService);
  private readonly projetoService = inject(ProjetoService);
  private readonly moduloService = inject(ModuloService);
  private readonly fb = inject(FormBuilder);
  private carregouImportacaoInicial = false;
  private catalogosCarregados = false;
  private analiseTimer?: number;
  private loteTimer?: number;

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
  protected readonly paginasSelecionadas = signal<Set<string>>(new Set());
  protected readonly estimativaLote = signal<AiEstimativaLoteDocumento | null>(null);
  protected readonly estimandoLote = signal(false);
  protected readonly gerandoLote = signal(false);
  protected readonly organizando = signal(false);
  protected readonly revisandoSugestoes = signal(false);
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

  ngOnDestroy(): void {
    this.cancelarPollingAnalise();
    this.cancelarPollingLote();
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

  protected paginasFinalizadas(importacao: AiDocumentoImportacao): number {
    return importacao.modulos
      .flatMap(modulo => modulo.paginas)
      .filter(pagina => pagina.status === 'GERADA' || pagina.status === 'REVISADA').length;
  }

  protected progresso(importacao: AiDocumentoImportacao): number {
    const total = this.totalPaginas(importacao);
    return total ? Math.round((this.paginasFinalizadas(importacao) / total) * 100) : 0;
  }

  protected proximaPaginaId(importacao: AiDocumentoImportacao): string | null {
    return (
      importacao.modulos
        .flatMap(modulo => modulo.paginas)
        .find(pagina => pagina.status === 'PENDENTE' || pagina.status === 'ERRO')?.id ?? null
    );
  }

  protected rotuloStatusPagina(status: AiPaginaDocumento['status']): string {
    const rotulos: Record<AiPaginaDocumento['status'], string> = {
      PENDENTE: 'Pendente',
      EM_EDICAO: 'Em edição',
      EM_GERACAO: 'Gerando',
      GERADA: 'Rascunho pronto',
      REVISADA: 'Revisada',
      ERRO: 'Requer atenção',
    };
    return rotulos[status];
  }

  protected usarNomeSugerido(nome: string): void {
    this.estruturaForm.controls.projetoNome.setValue(nome);
  }

  protected atualizarSugestoes(atualizada: AiDocumentoImportacao): void {
    this.atualizarPlanoEditavel(atualizada);
  }

  protected atualizarOrganizacao(atualizada: AiDocumentoImportacao): void {
    this.atualizarPlanoEditavel(atualizada);
  }

  private atualizarPlanoEditavel(atualizada: AiDocumentoImportacao): void {
    const anterior = this.importacao();
    const valoresAtuais = new Map<string, string>();
    anterior?.modulos.forEach((modulo, indice) => {
      valoresAtuais.set(modulo.id, this.modulosForm.controls[indice]?.value ?? modulo.nome);
    });
    this.definirImportacao(atualizada);
    this.modulosForm.clear();
    atualizada.modulos.forEach(modulo => {
      const moduloAnterior = anterior?.modulos.find(item => item.id === modulo.id);
      const valorAtual = valoresAtuais.get(modulo.id);
      const nome =
        moduloAnterior && valorAtual !== undefined && valorAtual !== moduloAnterior.nome
          ? valorAtual
          : modulo.nome;
      this.modulosForm.push(
        this.fb.nonNullable.control(nome, [Validators.required, Validators.maxLength(150)]),
      );
    });
  }

  protected paginaSelecionavel(pagina: AiPaginaDocumento): boolean {
    return !pagina.paginaId && (pagina.status === 'PENDENTE' || pagina.status === 'ERRO');
  }

  protected alternarPaginaLote(pagina: AiPaginaDocumento, event: Event): void {
    const marcado = (event.target as HTMLInputElement).checked;
    this.paginasSelecionadas.update(atuais => {
      const novas = new Set(atuais);
      if (marcado && novas.size < 10) novas.add(pagina.id);
      else novas.delete(pagina.id);
      return novas;
    });
    this.estimativaLote.set(null);
  }

  protected selecionarProximas(importacao: AiDocumentoImportacao): void {
    const ids = importacao.modulos
      .flatMap(modulo => modulo.paginas)
      .filter(pagina => this.paginaSelecionavel(pagina))
      .slice(0, 5)
      .map(pagina => pagina.id);
    this.paginasSelecionadas.set(new Set(ids));
    this.estimativaLote.set(null);
  }

  protected estimarLote(): void {
    const importacao = this.importacao();
    const paginas = [...this.paginasSelecionadas()];
    if (!importacao || !paginas.length || this.estimandoLote()) return;
    this.estimandoLote.set(true);
    this.erro.set(null);
    this.ai.estimarLoteImportacao(importacao.id, paginas).subscribe({
      next: estimativa => {
        this.estimativaLote.set(estimativa);
        this.estimandoLote.set(false);
      },
      error: err => {
        this.erro.set(mensagemErroHttp(err, 'Não foi possível estimar o lote.'));
        this.estimandoLote.set(false);
      },
    });
  }

  protected gerarLote(): void {
    const importacao = this.importacao();
    const paginas = [...this.paginasSelecionadas()];
    if (!importacao || !paginas.length || !this.estimativaLote() || this.gerandoLote()) return;
    this.gerandoLote.set(true);
    this.erro.set(null);
    this.ai.gerarLoteImportacao(importacao.id, paginas).subscribe({
      next: atualizada => {
        this.paginasSelecionadas.set(new Set());
        this.estimativaLote.set(null);
        this.gerandoLote.set(false);
        this.definirImportacao(atualizada);
      },
      error: err => {
        this.erro.set(mensagemErroHttp(err, 'Não foi possível iniciar a geração em lote.'));
        this.gerandoLote.set(false);
      },
    });
  }

  protected numeroLegivel(valor: number): string {
    return valor.toLocaleString('pt-BR');
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
    if (
      !importacao ||
      importacao.estruturaConfirmada ||
      this.confirmando() ||
      this.organizando() ||
      this.revisandoSugestoes()
    )
      return;
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
    if (
      this.disabled() ||
      this.importando() ||
      this.confirmando() ||
      this.organizando() ||
      this.revisandoSugestoes()
    ) {
      return;
    }
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
    this.paginasSelecionadas.set(new Set());
    this.estimativaLote.set(null);
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
        if (importacao.estruturaConfirmada && importacao.status !== 'ANALISANDO_ESTRUTURA') {
          this.ai.sincronizarImportacao(importacao.id).subscribe({
            next: sincronizada => {
              this.definirImportacao(sincronizada);
              this.importando.set(false);
            },
            error: () => {
              this.definirImportacao(importacao);
              this.importando.set(false);
            },
          });
        } else {
          this.definirImportacao(importacao);
          this.prepararEstrutura(importacao);
          this.importando.set(false);
        }
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
    if (importacao.status === 'ANALISANDO_ESTRUTURA') this.agendarPollingAnalise(importacao.id);
    else this.cancelarPollingAnalise();
    const gerando = importacao.modulos.some(modulo =>
      modulo.paginas.some(pagina => pagina.status === 'EM_GERACAO'),
    );
    if (gerando) this.agendarPollingLote(importacao.id);
    else this.cancelarPollingLote();
  }

  private prepararEstrutura(importacao: AiDocumentoImportacao): void {
    if (importacao.estruturaConfirmada || importacao.status === 'ANALISANDO_ESTRUTURA') return;
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

  private agendarPollingAnalise(importacaoId: string): void {
    this.cancelarPollingAnalise();
    this.analiseTimer = window.setTimeout(() => {
      this.ai.buscarImportacao(importacaoId).subscribe({
        next: atualizada => {
          this.definirImportacao(atualizada);
          if (atualizada.status !== 'ANALISANDO_ESTRUTURA') this.prepararEstrutura(atualizada);
        },
        error: () => {
          this.erro.set('Não foi possível acompanhar a análise. Você pode retomar esta importação depois.');
          this.cancelarPollingAnalise();
        },
      });
    }, 1_200);
  }

  private cancelarPollingAnalise(): void {
    if (this.analiseTimer !== undefined) window.clearTimeout(this.analiseTimer);
    this.analiseTimer = undefined;
  }

  private agendarPollingLote(importacaoId: string): void {
    this.cancelarPollingLote();
    this.loteTimer = window.setTimeout(() => {
      this.ai.sincronizarImportacao(importacaoId).subscribe({
        next: atualizada => this.definirImportacao(atualizada),
        error: () => {
          this.erro.set('Não foi possível atualizar a fila agora. O processamento continua no servidor.');
          this.cancelarPollingLote();
        },
      });
    }, 2_000);
  }

  private cancelarPollingLote(): void {
    if (this.loteTimer !== undefined) window.clearTimeout(this.loteTimer);
    this.loteTimer = undefined;
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
