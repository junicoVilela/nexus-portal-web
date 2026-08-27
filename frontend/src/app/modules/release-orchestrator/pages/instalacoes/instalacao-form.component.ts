import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { catchError, EMPTY, forkJoin, Observable, of, skip, switchMap, tap } from 'rxjs';

import { AuthService } from '@core/auth/services/auth.service';
import { CanDeactivateComponent } from '@shared/guards';
import { BadgeComponent, ButtonComponent, PageHeaderComponent, TabItem, TabsComponent, ToastService } from '@shared/ui';

import { AmbientePadrao, Cliente, ClienteForm, TIPO_BANCO_LABELS, TipoBanco } from '../../models/cliente.model';
import { Host, HostForm, SISTEMA_OPERACIONAL_LABELS, TIPO_CONEXAO_LABELS } from '../../models/host.model';
import {
  AMBIENTE_INSTALACAO_LABELS,
  AmbienteInstalacao,
  HEALTH_INSTALACAO_LABELS,
  HealthInstalacao,
  InstalacaoClienteForm,
  PAPEL_PORTA_LABELS,
  PapelPorta,
  PROTOCOLO_PORTA_LABELS,
  ProtocoloPorta,
  PortasSugeridas,
  ReservaPorta,
  STATUS_INSTALACAO_LABELS,
  STATUS_RESERVA_PORTA_LABELS,
  StatusInstalacao,
  StatusReservaPorta,
  TIPO_IMPLANTACAO_LABELS,
  TIPO_PORTA_LABELS,
  TipoImplantacao,
  TipoPorta,
  InstalacaoCliente,
} from '../../models/instalacao-cliente.model';
import { DeployInstalacao, ManifestoImplantacao, ModoDeploy, OPERACAO_DEPLOY_LABELS, STATUS_DEPLOY_LABELS, STATUS_DEPLOY_TONES } from '../../models/deploy-instalacao.model';
import { Produto } from '../../models/produto.model';
import { ClienteProduto } from '../../models/cliente-produto.model';
import { ClienteService } from '../../services/cliente.service';
import { ClienteProdutoService } from '../../services/cliente-produto.service';
import { DeployInstalacaoService } from '../../services/deploy-instalacao.service';
import { HostService } from '../../services/host.service';
import {
  FontesVersaoInstalacao,
  InstalacaoClienteService,
  OpcaoVersaoInstalacao,
} from '../../services/instalacao-cliente.service';
import { ProdutoService } from '../../services/produto.service';
import { OrigemBuild, versaoPortalDaTag } from '../../services/release.service';
import {
  abaAposToggleProduto,
  codigoInstalacaoProduto,
  nomeInstalacaoProduto,
  rotuloAbaProduto,
  rotuloAcaoProdutoAba,
  toggleProdutoHabilitado,
} from './instalacao-produto-aba.util';

const CODIGO_REGEX = /^[A-Za-z0-9][A-Za-z0-9-]*$/;
const CLIENTE_NOVO = '__NOVO__';
const BANCOS_LINUX: TipoBanco[] = ['ORACLE', 'SQLSERVER'];

type DestinoInstalacao = 'LOCAL' | 'CADASTRADO';

function ehHostLocal(host: Host | undefined | null): boolean {
  const n = (host?.hostname ?? '').trim().toLowerCase();
  return n === 'localhost' || n === '127.0.0.1' || n === '::1';
}

@Component({
  selector: 'app-instalacao-form',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    ButtonComponent,
    BadgeComponent,
    TabsComponent,
  ],
  templateUrl: './instalacao-form.component.html',
  styleUrl: './instalacao-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstalacaoFormComponent implements OnInit, OnDestroy, CanDeactivateComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(InstalacaoClienteService);
  private readonly clienteService = inject(ClienteService);
  private readonly clienteProdutoService = inject(ClienteProdutoService);
  private readonly hostService = inject(HostService);
  private readonly produtoService = inject(ProdutoService);
  private readonly deployService = inject(DeployInstalacaoService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  protected readonly editId = signal<string | null>(null);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly registrandoHealth = signal(false);
  protected readonly sugerindo = signal(false);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly hosts = signal<Host[]>([]);
  protected readonly produtos = signal<Produto[]>([]);
  protected readonly tipoAtual = signal<TipoImplantacao>('DOCKER_PULL');
  protected readonly destino = signal<DestinoInstalacao>('LOCAL');
  protected readonly hostLocal = computed(() => this.hosts().find(ehHostLocal) ?? null);
  protected readonly hostsCadastrados = computed(() => {
    const tipo = this.tipoAtual();
    return this.hosts().filter(h => {
      if (ehHostLocal(h)) {
        return false;
      }
      if (tipo === 'LINUX_MANUAL') {
        return h.sistemaOperacional === 'LINUX';
      }
      if (tipo === 'WINDOWS_MANUAL') {
        return h.sistemaOperacional === 'WINDOWS';
      }
      return true;
    });
  });
  protected readonly destinoLocal = computed(() => this.destino() === 'LOCAL');
  protected readonly exemploUrlBackend = computed(() =>
    this.destinoLocal() ? 'http://localhost:8010' : 'http://srv-hom.empresa.local:8010',
  );
  protected readonly exemploUrlFrontend = computed(() =>
    this.destinoLocal() ? 'http://localhost:4209' : 'http://srv-hom.empresa.local:4209',
  );
  protected readonly soLabels = SISTEMA_OPERACIONAL_LABELS;
  protected readonly conexaoLabels = TIPO_CONEXAO_LABELS;

  protected readonly tipos = Object.keys(TIPO_IMPLANTACAO_LABELS) as TipoImplantacao[];
  protected readonly statuses = Object.keys(STATUS_INSTALACAO_LABELS) as StatusInstalacao[];
  protected readonly ambientes = Object.keys(AMBIENTE_INSTALACAO_LABELS) as AmbienteInstalacao[];
  protected readonly bancos = Object.keys(TIPO_BANCO_LABELS) as TipoBanco[];
  protected readonly clienteNovoId = CLIENTE_NOVO;
  protected readonly bancosDisponiveis = computed(() =>
    this.tipoAtual() === 'LINUX_MANUAL' ? BANCOS_LINUX : this.bancos,
  );
  protected readonly tiposPorta = Object.keys(TIPO_PORTA_LABELS) as TipoPorta[];
  protected readonly papeisPorta = Object.keys(PAPEL_PORTA_LABELS) as PapelPorta[];
  protected readonly protocolos = Object.keys(PROTOCOLO_PORTA_LABELS) as ProtocoloPorta[];
  protected readonly statusPorta = Object.keys(STATUS_RESERVA_PORTA_LABELS) as StatusReservaPorta[];
  protected readonly tipoLabels = TIPO_IMPLANTACAO_LABELS;
  protected readonly statusLabels = STATUS_INSTALACAO_LABELS;
  protected readonly ambienteLabels = AMBIENTE_INSTALACAO_LABELS;
  protected readonly bancoLabels = TIPO_BANCO_LABELS;
  protected readonly tipoPortaLabels = TIPO_PORTA_LABELS;
  protected readonly papelPortaLabels = PAPEL_PORTA_LABELS;
  protected readonly protocoloLabels = PROTOCOLO_PORTA_LABELS;
  protected readonly statusPortaLabels = STATUS_RESERVA_PORTA_LABELS;

  protected form!: FormGroup;
  protected readonly editando = computed(() => this.editId() !== null);
  protected readonly clienteIdAtual = signal('');
  protected readonly criandoCliente = computed(() => this.clienteIdAtual() === CLIENTE_NOVO);
  protected readonly healthAtual = signal<HealthInstalacao>('DESCONHECIDO');
  protected readonly ultimaVerificacao = signal<string | null>(null);
  protected readonly ultimoErro = signal<string | null>(null);
  protected healthDraft: HealthInstalacao = 'DESCONHECIDO';
  protected healthErroDraft = '';
  protected readonly healths = Object.keys(HEALTH_INSTALACAO_LABELS) as HealthInstalacao[];
  protected readonly healthLabels = HEALTH_INSTALACAO_LABELS;
  protected readonly fontesVersao = signal<FontesVersaoInstalacao | null>(null);
  protected readonly carregandoFontesVersao = signal(false);
  protected readonly fontesVersaoErro = signal<string | null>(null);
  protected readonly origemVersao = signal<OrigemBuild>('RELEASE_ATUAL');
  protected readonly tagEscolhida = signal('');
  protected readonly tagDigitada = signal('');
  protected readonly disparandoBuild = signal(false);
  protected readonly alvosSelecionados = signal<Set<string>>(new Set());
  protected readonly alvosBuild = computed(() => this.fontesVersao()?.alvos ?? []);
  protected readonly buildsArtefato = computed(() => this.fontesVersao()?.buildsRecentes ?? []);
  protected readonly temAlvoSelecionado = computed(() => this.alvosSelecionados().size > 0);
  protected readonly produtosContratados = signal<ClienteProduto[]>([]);
  protected readonly instalacoesIrmas = signal<InstalacaoCliente[]>([]);
  protected readonly abaProdutoId = signal('');
  protected readonly produtoIdAtual = signal('');
  protected readonly produtosHabilitados = signal<Set<string>>(new Set());
  protected readonly criandoIrmao = signal(false);
  protected readonly abasProduto = computed(() => {
    const irmas = this.instalacoesIrmas();
    const contratos = this.produtosContratados();
    const fonte = contratos.length > 0
      ? contratos.map(c => ({ id: c.produtoId, sigla: c.produtoSigla, nome: c.produtoNome }))
      : this.produtos().map(p => ({ id: p.id, sigla: p.sigla, nome: p.nome }));
    return fonte.map(p => ({
      id: p.id,
      sigla: p.sigla,
      label: rotuloAbaProduto(p.sigla, p.nome),
      instalacaoId: irmas.find(i => i.produtoId === p.id)?.id ?? null,
    }));
  });
  protected readonly abasProdutoTabs = computed<TabItem[]>(() =>
    this.abasProduto().map(a => ({
      id: a.id,
      label: a.label,
      disabled: !this.produtosHabilitados().has(a.id),
    })),
  );
  protected readonly produtosDoCadastro = computed(() => {
    const contratos = this.produtosContratados();
    const catalogo = this.produtos();
    if (contratos.length === 0) {
      return catalogo;
    }
    const ids = new Set(contratos.map(c => c.produtoId));
    const atual = this.form?.get('produtoId')?.value as string | undefined;
    if (atual) {
      ids.add(atual);
    }
    return catalogo.filter(p => ids.has(p.id));
  });
  protected readonly abaAtual = computed(() => this.abasProduto().find(a => a.id === this.abaProdutoId()) ?? null);
  protected readonly abaHabilitada = computed(() => {
    const id = this.abaProdutoId();
    return !!id && this.produtosHabilitados().has(id);
  });
  protected readonly implantarDestaAba = computed(
    () => this.editando() && this.abaHabilitada()
      && !!this.abaProdutoId() && this.abaProdutoId() === this.produtoIdAtual(),
  );
  protected readonly cadastrarIrmaoDestaAba = computed(
    () => this.editando() && this.abaHabilitada()
      && !!this.abaProdutoId() && this.abaProdutoId() !== this.produtoIdAtual()
      && !this.abaAtual()?.instalacaoId,
  );
  protected readonly rotuloAcaoAba = rotuloAcaoProdutoAba;
  private pollBuilds: ReturnType<typeof setInterval> | null = null;
  protected readonly deploys = signal<DeployInstalacao[]>([]);
  protected readonly deploysRecentes = computed(() => this.deploys().slice(0, 5));
  protected readonly manifestoPreview = signal<ManifestoImplantacao | null>(null);
  protected readonly releaseDeployId = signal<string>('');
  protected readonly carregandoPreview = signal(false);
  protected readonly executandoDeploy = signal(false);
  protected readonly executandoModo = signal<ModoDeploy | null>(null);
  protected readonly podeModoReal = computed(
    () => this.tipoAtual() === 'DOCKER_PULL' || this.tipoAtual() === 'LINUX_MANUAL',
  );
  protected readonly statusForm = signal<StatusInstalacao>('INEXISTENTE');
  protected readonly executandoCiclo = signal<'INICIAR' | 'PARAR' | null>(null);
  protected readonly ocupadoOperacao = computed(
    () => this.executandoDeploy() || this.executandoCiclo() !== null || this.disparandoBuild(),
  );
  protected readonly mostraCicloVida = computed(
    () => this.editando() && this.podeDeployar() && this.podeModoReal(),
  );
  protected readonly cicloVidaHabilitado = computed(() => this.statusForm() !== 'INEXISTENTE');
  protected readonly statusDeployLabels = STATUS_DEPLOY_LABELS;
  protected readonly statusDeployTones = STATUS_DEPLOY_TONES;
  protected readonly operacaoDeployLabels = OPERACAO_DEPLOY_LABELS;
  protected readonly podeDeployar = computed(() => this.auth.tem()('INSTALACAO:EDITAR'));

  protected readonly tagEfetiva = computed(() => {
    const f = this.fontesVersao();
    const origem = this.origemVersao();
    if (origem === 'RELEASE_ATUAL') return f?.versaoAtual?.tag ?? '';
    if (origem === 'ULTIMA_GERADA') return f?.ultimaGerada?.tag ?? '';
    return (this.tagDigitada().trim() || this.tagEscolhida()).trim();
  });

  protected readonly versaoEfetiva = computed(() => versaoPortalDaTag(this.tagEfetiva()));

  protected readonly origemValida = computed(() => {
    const f = this.fontesVersao();
    const origem = this.origemVersao();
    if (origem === 'RELEASE_ATUAL') return !!f?.versaoAtual?.selecionavel && !!this.tagEfetiva();
    if (origem === 'ULTIMA_GERADA') return !!f?.ultimaGerada?.tag;
    return !!this.tagEfetiva();
  });

  ngOnInit(): void {
    this.buildForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId.set(id);
      this.carregando.set(true);
    }
    this.carregarLookups(id);
    this.route.paramMap.pipe(skip(1)).subscribe(params => {
      const next = params.get('id');
      if (next && next !== this.editId()) {
        this.editId.set(next);
        this.carregar(next);
      }
    });
  }

  ngOnDestroy(): void {
    this.pararPollBuilds();
  }

  hasUnsavedChanges(): boolean {
    return this.form?.dirty === true && !this.salvando();
  }

  unsavedChangesDescription(): string {
    return 'cadastro da instalação';
  }

  protected get portasArray(): FormArray<FormGroup> {
    return this.form.get('portas') as FormArray<FormGroup>;
  }

  private buildForm(): void {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(40), Validators.pattern(CODIGO_REGEX)]],
      nome: ['', [Validators.required, Validators.maxLength(200)]],
      clienteId: ['', Validators.required],
      hostId: [''],
      produtoId: ['', Validators.required],
      tipoImplantacao: ['DOCKER_PULL' as TipoImplantacao, Validators.required],
      status: ['INEXISTENTE' as StatusInstalacao, Validators.required],
      ambiente: ['PROD' as AmbienteInstalacao, Validators.required],
      imagemRef: [''],
      arquivoImagemRef: [''],
      diretorioInstalacao: [''],
      observacoes: [''],
      versaoAtual: [''],
      novoClienteSigla: ['', [Validators.maxLength(20)]],
      novoClienteNome: ['', [Validators.maxLength(200)]],
      configuracao: this.fb.group({
        tipoBanco: [null as TipoBanco | null],
        bancoHost: [''],
        bancoPorta: [null as number | null],
        bancoNome: [''],
        bancoUsuario: [''],
        bancoCredencialRef: [''],
        urlBackend: [''],
        urlFrontend: [''],
        parametros: [''],
      }),
      portas: this.fb.array([] as FormGroup[]),
    });
    this.form.get('tipoImplantacao')?.valueChanges.subscribe((t: TipoImplantacao) => {
      this.tipoAtual.set(t);
      this.aplicarPadroesLinux(t);
      this.filtrarHostSeIncompativel();
    });
    this.form.get('clienteId')?.valueChanges.subscribe((id: string) => {
      this.clienteIdAtual.set(id ?? '');
      this.aplicarValidadoresNovoCliente(id === CLIENTE_NOVO);
      this.preencherBancoDoCliente(id);
      this.carregarContratosEIrmas();
    });
    this.form.get('configuracao.tipoBanco')?.valueChanges.subscribe((b: TipoBanco | null) => {
      this.aplicarPortaBancoPadrao(b);
    });
    this.form.get('codigo')?.valueChanges.subscribe(() => this.garantirDiretorioLinux());
    this.form.get('hostId')?.valueChanges.subscribe(() => {
      this.preencherPortasLivres();
      this.carregarContratosEIrmas();
    });
    this.form.get('status')?.valueChanges.subscribe((s: StatusInstalacao) => this.statusForm.set(s));
  }

  protected selecionarDestino(destino: DestinoInstalacao): void {
    this.destino.set(destino);
    const hostId = this.form.get('hostId');
    if (destino === 'LOCAL') {
      hostId?.setValue(this.hostLocal()?.id ?? '', { emitEvent: false });
      hostId?.clearValidators();
    } else {
      const atual = this.hosts().find(h => h.id === hostId?.value);
      if (ehHostLocal(atual)) {
        hostId?.setValue('');
      }
      hostId?.setValidators([Validators.required]);
    }
    hostId?.updateValueAndValidity({ emitEvent: false });
    this.garantirDiretorioLinux();
    this.preencherPortasLivres();
    this.form.markAsDirty();
  }

  private filtrarHostSeIncompativel(): void {
    if (this.destino() !== 'CADASTRADO') {
      return;
    }
    const hostId = this.form.get('hostId')?.value as string;
    if (hostId && !this.hostsCadastrados().some(h => h.id === hostId)) {
      this.form.get('hostId')?.setValue('');
    }
  }

  private sincronizarDestinoDoHost(hostId: string): void {
    const host = this.hosts().find(h => h.id === hostId);
    const destino: DestinoInstalacao = ehHostLocal(host) ? 'LOCAL' : 'CADASTRADO';
    this.destino.set(destino);
    const ctrl = this.form.get('hostId');
    if (destino === 'LOCAL') {
      ctrl?.clearValidators();
    } else {
      ctrl?.setValidators([Validators.required]);
    }
    ctrl?.updateValueAndValidity({ emitEvent: false });
  }

  private garantirHostLocal$() {
    const existente = this.hostLocal();
    if (existente) {
      return of(existente);
    }
    const docker = this.tipoAtual() === 'DOCKER_PULL' || this.tipoAtual() === 'DOCKER_TAR';
    const form: HostForm = {
      codigo: 'LOCAL',
      nome: 'Esta máquina',
      hostname: 'localhost',
      sistemaOperacional: 'LINUX',
      dockerDisponivel: docker,
      tipoConexao: docker ? 'DOCKER' : 'SSH',
      portaConexao: docker ? 2375 : 22,
      observacoes: 'Criado automaticamente para instalação local.',
      ativo: true,
    };
    return this.hostService.criar(form).pipe(
      catchError(() =>
        this.hostService.listar(1, 200, undefined, true).pipe(
          switchMap(r => {
            this.hosts.set(r.items);
            const local = r.items.find(ehHostLocal);
            return local ? of(local) : this.hostService.criar({ ...form, codigo: 'LAB-LOCAL' });
          }),
        ),
      ),
    );
  }

  private aplicarPadroesLinux(tipo: TipoImplantacao): void {
    this.aplicarValidadoresLinux(tipo);
    if (tipo !== 'LINUX_MANUAL') {
      return;
    }
    const banco = this.form.get('configuracao.tipoBanco')?.value as TipoBanco | null;
    if (banco === 'POSTGRES') {
      this.form.get('configuracao.tipoBanco')?.setValue(null);
    }
    this.preencherPortasLivres();
    this.garantirDiretorioLinux();
  }

  private aplicarValidadoresLinux(tipo: TipoImplantacao): void {
    const required = tipo === 'LINUX_MANUAL';
    const campos = ['tipoBanco', 'bancoHost', 'bancoNome', 'bancoUsuario'] as const;
    for (const campo of campos) {
      const ctrl = this.form.get('configuracao.' + campo);
      ctrl?.setValidators(required ? [Validators.required] : []);
      ctrl?.updateValueAndValidity({ emitEvent: false });
    }
    const dir = this.form.get('diretorioInstalacao');
    dir?.setValidators(required ? [Validators.required] : []);
    dir?.updateValueAndValidity({ emitEvent: false });
  }

  private aplicarValidadoresNovoCliente(novo: boolean): void {
    const sigla = this.form.get('novoClienteSigla');
    const nome = this.form.get('novoClienteNome');
    sigla?.setValidators(novo ? [Validators.required, Validators.maxLength(20), Validators.pattern(CODIGO_REGEX)] : [Validators.maxLength(20)]);
    nome?.setValidators(novo ? [Validators.required, Validators.maxLength(200)] : [Validators.maxLength(200)]);
    sigla?.updateValueAndValidity({ emitEvent: false });
    nome?.updateValueAndValidity({ emitEvent: false });
  }

  private preencherBancoDoCliente(clienteId: string): void {
    if (!clienteId || clienteId === CLIENTE_NOVO) {
      return;
    }
    const cfgBanco = this.form.get('configuracao.tipoBanco');
    if (cfgBanco?.value) {
      return;
    }
    const cliente = this.clientes().find(c => c.id === clienteId);
    if (cliente?.tipoBanco && cliente.tipoBanco !== 'POSTGRES') {
      cfgBanco?.setValue(cliente.tipoBanco);
    }
  }

  private aplicarPortaBancoPadrao(banco: TipoBanco | null): void {
    const porta = this.form.get('configuracao.bancoPorta');
    const atual = porta?.value as number | null;
    if (banco === 'ORACLE' && (atual == null || atual === 1433)) {
      porta?.setValue(1521);
    } else if (banco === 'SQLSERVER' && (atual == null || atual === 1521)) {
      porta?.setValue(1433);
    }
  }

  private portasIncompletas(): boolean {
    if (this.portasArray.length === 0) {
      return true;
    }
    return this.portasArray.controls.some(c => !c.get('porta')?.value);
  }

  private preencherPortasLivres(): void {
    if (!this.portasIncompletas() || this.sugerindo()) {
      return;
    }
    if (this.destino() === 'CADASTRADO' && !this.form.get('hostId')?.value) {
      return;
    }
    this.buscarPortasLivres(1).subscribe({
      next: s => {
        if (s) {
          this.aplicarSugestao(s);
        }
      },
      error: () => {
        this.sugerindo.set(false);
      },
    });
  }

  private buscarPortasLivres(quantidade: number): Observable<PortasSugeridas | null> {
    const linux = this.tipoAtual() === 'LINUX_MANUAL';
    const hostId = (this.form.get('hostId')?.value as string) || this.hostLocal()?.id;
    if (this.destino() === 'CADASTRADO' && !hostId) {
      this.toast.warn('Selecione o ambiente cadastrado antes de consultar portas.');
      return of(null);
    }
    this.sugerindo.set(true);
    return this.service
      .sugerirPortas(hostId, this.editId() ?? undefined, {
        quantidade,
        backendInicio: linux ? 8010 : 8081,
        frontendInicio: linux ? 4209 : 4000,
      })
      .pipe(
        tap(() => this.sugerindo.set(false)),
        catchError(err => {
          this.sugerindo.set(false);
          const msg = err?.error?.message ?? 'Não foi possível consultar portas livres no host.';
          this.toast.error(typeof msg === 'string' ? msg : 'Não foi possível consultar portas livres.');
          return of(null);
        }),
      );
  }

  private aplicarSugestao(s: PortasSugeridas, avisar = false): void {
    this.portasArray.clear();
    s.backend.forEach(porta =>
      this.adicionarPorta({ tipo: 'HTTP', papel: 'BACKEND', porta, protocolo: 'TCP', status: 'RESERVADA' }),
    );
    s.frontend.forEach(porta =>
      this.adicionarPorta({ tipo: 'HTTP', papel: 'FRONTEND', porta, protocolo: 'TCP', status: 'RESERVADA' }),
    );
    if (avisar) {
      this.toast.info(
        s.verificouHost
          ? s.emUsoNoHost?.length
            ? `Portas livres no destino (em uso agora: ${s.emUsoNoHost.slice(0, 8).join(', ')}).`
            : 'Portas conferidas no destino — intervalo livre.'
          : 'Portas sugeridas pelo inventário.',
      );
    }
  }

  private garantirDiretorioLinux(): void {
    if (this.tipoAtual() !== 'LINUX_MANUAL') {
      return;
    }
    const dirCtrl = this.form.get('diretorioInstalacao');
    const codigo = String(this.form.get('codigo')?.value ?? '')
      .trim()
      .toLowerCase();
    if (!codigo) {
      return;
    }
    const local = `/tmp/nexus-lab/${codigo}`;
    const remoto = `/opt/nexus/${codigo}`;
    const atual = String(dirCtrl?.value ?? '').trim();
    const sugerido = this.destino() === 'LOCAL' ? local : remoto;
    if (!atual || atual === local || atual === remoto) {
      dirCtrl?.setValue(sugerido, { emitEvent: false });
    }
  }

  private carregarLookups(editId: string | null): void {
    forkJoin({
      clientes: this.clienteService.listar(1, 200, undefined, true),
      hosts: this.hostService.listar(1, 200, undefined, true),
      produtos: this.produtoService.listar(1, 200, undefined, true),
    }).subscribe({
      next: r => {
        this.clientes.set(r.clientes.items);
        this.hosts.set(r.hosts.items);
        this.produtos.set(r.produtos.items);
        if (editId) {
          this.carregar(editId);
        } else {
          this.selecionarDestino('LOCAL');
          const primeiro = this.produtos()[0];
          if (primeiro && !this.form.get('produtoId')?.value) {
            this.form.get('produtoId')?.setValue(primeiro.id, { emitEvent: false });
            this.abaProdutoId.set(primeiro.id);
            this.produtoIdAtual.set(primeiro.id);
            this.produtosHabilitados.set(new Set([primeiro.id]));
          }
          this.form.markAsPristine();
        }
      },
      error: () => {
        this.carregando.set(false);
        this.toast.error('Não foi possível carregar clientes, hosts ou produtos.');
      },
    });
  }

  private carregar(id: string): void {
    this.carregando.set(true);
    this.service.buscar(id).subscribe({
      next: inst => {
        this.tipoAtual.set(inst.tipoImplantacao);
        this.clienteIdAtual.set(inst.clienteId);
        this.form.patchValue(
          {
            codigo: inst.codigo,
            nome: inst.nome,
            clienteId: inst.clienteId,
            hostId: inst.hostId,
            produtoId: inst.produtoId,
            tipoImplantacao: inst.tipoImplantacao,
            status: inst.status,
            ambiente: inst.ambiente,
            imagemRef: inst.imagemRef ?? '',
            arquivoImagemRef: inst.arquivoImagemRef ?? '',
            diretorioInstalacao: inst.diretorioInstalacao ?? '',
            observacoes: inst.observacoes ?? '',
            versaoAtual: inst.versaoAtual ?? '',
            configuracao: {
              tipoBanco: inst.configuracao?.tipoBanco ?? null,
              bancoHost: inst.configuracao?.bancoHost ?? '',
              bancoPorta: inst.configuracao?.bancoPorta ?? null,
              bancoNome: inst.configuracao?.bancoNome ?? '',
              bancoUsuario: inst.configuracao?.bancoUsuario ?? '',
              bancoCredencialRef: inst.configuracao?.bancoCredencialRef ?? '',
              urlBackend: inst.configuracao?.urlBackend ?? '',
              urlFrontend: inst.configuracao?.urlFrontend ?? '',
              parametros: inst.configuracao?.parametros ?? '',
            },
          },
          { emitEvent: false },
        );
        this.statusForm.set(inst.status);
        this.portasArray.clear();
        (inst.portas ?? []).forEach(p => this.adicionarPorta(p));
        this.healthAtual.set(inst.health ?? 'DESCONHECIDO');
        this.healthDraft = inst.health ?? 'DESCONHECIDO';
        this.ultimaVerificacao.set(inst.ultimaVerificacao ?? null);
        this.ultimoErro.set(inst.ultimoErro ?? null);
        this.healthErroDraft = inst.ultimoErro ?? '';
        this.form.markAsPristine();
        this.sincronizarDestinoDoHost(inst.hostId);
        this.carregando.set(false);
        this.carregarDeploys(id);
        this.carregarFontesVersao(id);
        this.produtoIdAtual.set(inst.produtoId);
        this.abaProdutoId.set(inst.produtoId);
        this.produtosHabilitados.set(new Set([inst.produtoId]));
        this.alvosSelecionados.set(new Set());
        this.fontesVersao.set(null);
        this.carregarContratosEIrmas(inst.clienteId, inst.hostId, inst.ambiente);
      },
      error: () => {
        this.toast.error('Não foi possível carregar a instalação.');
        this.carregando.set(false);
        this.router.navigate(['/release-orchestrator/instalacoes']);
      },
    });
  }

  protected adicionarPorta(p?: Partial<ReservaPorta>): void {
    this.portasArray.push(
      this.fb.group({
        tipo: [p?.tipo ?? ('HTTP' as TipoPorta), Validators.required],
        papel: [p?.papel ?? ('BACKEND' as PapelPorta), Validators.required],
        porta: [p?.porta ?? null, [Validators.required, Validators.min(1), Validators.max(65535)]],
        protocolo: [p?.protocolo ?? ('TCP' as ProtocoloPorta), Validators.required],
        status: [p?.status ?? ('RESERVADA' as StatusReservaPorta), Validators.required],
      }),
    );
    this.portasArray.markAsDirty();
  }

  protected removerPorta(idx: number): void {
    this.portasArray.removeAt(idx);
    this.portasArray.markAsDirty();
  }

  protected sugerirPortas(): void {
    this.buscarPortasLivres(3).subscribe({
      next: s => {
        if (s) {
          this.aplicarSugestao(s, true);
        }
      },
    });
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warn('Corrija os campos destacados antes de salvar.');
      return;
    }
    if (this.destino() === 'CADASTRADO' && !this.form.get('hostId')?.value) {
      this.form.get('hostId')?.markAsTouched();
      this.toast.warn('Selecione o ambiente cadastrado onde a instalação vai rodar.');
      return;
    }
    this.salvando.set(true);
    const raw = this.form.getRawValue();
    const cfg = raw.configuracao;
    const novoCliente = raw.clienteId === CLIENTE_NOVO;
    const cliente$: Observable<Cliente | null> = novoCliente
      ? this.clienteService.criar({
          nome: String(raw.novoClienteNome).trim(),
          sigla: String(raw.novoClienteSigla).trim().toUpperCase(),
          ambientePadrao: raw.ambiente as AmbientePadrao,
          tipoBanco: cfg.tipoBanco || undefined,
        } as ClienteForm)
      : of(null);
    cliente$
      .pipe(
        switchMap(criado => {
          if (criado) {
            this.clientes.update(list => [criado, ...list.filter(c => c.id !== criado.id)]);
            this.form.get('clienteId')?.setValue(criado.id, { emitEvent: false });
            this.clienteIdAtual.set(criado.id);
          }
          const host$ =
            this.destino() === 'LOCAL'
              ? this.garantirHostLocal$()
              : of(this.hosts().find(h => h.id === raw.hostId) ?? null);
          return host$.pipe(
            switchMap(host => {
              if (!host) {
                this.salvando.set(false);
                this.toast.warn('Selecione o host de destino.');
                return EMPTY;
              }
              this.hosts.update(list => (list.some(h => h.id === host.id) ? list : [host, ...list]));
              this.form.get('hostId')?.setValue(host.id, { emitEvent: false });
              const portas$ = this.portasIncompletas()
                ? this.buscarPortasLivres(1).pipe(
                    tap(s => {
                      if (s) {
                        this.aplicarSugestao(s);
                      }
                    }),
                  )
                : of(null as PortasSugeridas | null);
              return portas$.pipe(
                switchMap(() => {
                  if (this.portasIncompletas() && this.tipoAtual() === 'LINUX_MANUAL') {
                    this.salvando.set(false);
                    this.toast.warn('Não foi possível achar porta livre no destino. Informe as portas manualmente.');
                    return EMPTY;
                  }
                  const payload: InstalacaoClienteForm = {
                    codigo: raw.codigo,
                    nome: raw.nome,
                    clienteId: criado?.id ?? raw.clienteId,
                    hostId: host.id,
                    produtoId: raw.produtoId,
                    tipoImplantacao: raw.tipoImplantacao,
                    status: raw.status,
                    ambiente: raw.ambiente,
                    imagemRef: raw.imagemRef || undefined,
                    arquivoImagemRef: raw.arquivoImagemRef || undefined,
                    diretorioInstalacao: raw.diretorioInstalacao || undefined,
                    observacoes: raw.observacoes || undefined,
                    versaoAtual: raw.versaoAtual || undefined,
                    configuracao: {
                      tipoBanco: cfg.tipoBanco || undefined,
                      bancoHost: cfg.bancoHost || undefined,
                      bancoPorta: cfg.bancoPorta || undefined,
                      bancoNome: cfg.bancoNome || undefined,
                      bancoUsuario: cfg.bancoUsuario || undefined,
                      bancoCredencialRef: cfg.bancoCredencialRef || undefined,
                      urlBackend: cfg.urlBackend || undefined,
                      urlFrontend: cfg.urlFrontend || undefined,
                      parametros: cfg.parametros || undefined,
                    },
                    portas: this.portasArray.getRawValue() as ReservaPorta[],
                  };
                  const id = this.editId();
                  return id ? this.service.atualizar(id, payload) : this.service.criar(payload);
                }),
              );
            }),
          );
        }),
      )
      .subscribe({
        next: inst => {
          this.salvando.set(false);
          this.form.markAsPristine();
          if (this.editId()) {
            this.toast.success(novoCliente ? 'Cliente criado e instalação atualizada.' : 'Instalação atualizada.');
            return;
          }
          this.toast.success(
            novoCliente
              ? 'Cliente e instalação cadastrados. Escolha a release para instalar — o portal baixa JDK e Tomcat.'
              : 'Instalação cadastrada. Escolha a release para criar no alvo — sem pacote de entrega.',
          );
          this.router.navigate(['/release-orchestrator/instalacoes', inst.id, 'editar']);
        },
        error: err => {
          this.salvando.set(false);
          const msg =
            err?.error?.message ??
            (novoCliente
              ? 'Erro ao criar cliente ou instalação. Verifique sigla única, tipo, host, código e portas.'
              : 'Erro ao salvar instalação. Verifique tipo, host, código e portas.');
          this.toast.error(typeof msg === 'string' ? msg : 'Erro ao salvar instalação.');
        },
      });
  }

  protected registrarHealth(): void {
    const id = this.editId();
    if (!id) return;
    this.registrandoHealth.set(true);
    const versao = (this.form.get('versaoAtual')?.value as string) || undefined;
    this.service
      .registrarHealth(id, {
        health: this.healthDraft,
        versaoAtual: versao,
        ultimoErro: this.healthErroDraft || undefined,
      })
      .subscribe({
        next: inst => {
          this.healthAtual.set(inst.health ?? 'DESCONHECIDO');
          this.ultimaVerificacao.set(inst.ultimaVerificacao ?? null);
          this.ultimoErro.set(inst.ultimoErro ?? null);
          this.registrandoHealth.set(false);
          this.toast.success('Verificação registrada.');
        },
        error: () => {
          this.registrandoHealth.set(false);
          this.toast.error('Não foi possível registrar o health.');
        },
      });
  }

  protected rotuloTag(t: OpcaoVersaoInstalacao): string {
    const partes = [t.tag || t.versao || ''];
    if (t.titulo && t.titulo !== t.tag) {
      partes.push(t.titulo);
    }
    if (t.releaseId) {
      partes.push('portal');
    }
    if (t.totalAssets != null) {
      partes.push(`${t.totalAssets} asset(s)`);
    }
    return partes.filter(Boolean).join(' · ');
  }

  protected selecionarOrigemVersao(origem: OrigemBuild): void {
    this.origemVersao.set(origem);
    this.atualizarPreviewDaOrigem();
  }

  protected onTagEspecificaChange(tag: string): void {
    this.tagEscolhida.set(tag);
    this.atualizarPreviewDaOrigem();
  }

  protected executarDeploy(modo: ModoDeploy, forcar = false): void {
    const instalacaoId = this.editId();
    if (!instalacaoId || !this.origemValida()) {
      this.toast.error('Escolha a versão atual, a última gerada ou uma tag específica.');
      return;
    }
    this.executandoDeploy.set(true);
    this.executandoModo.set(modo);
    this.service
      .resolverVersao(instalacaoId, this.payloadOrigem())
      .pipe(
        switchMap(resolvida => {
          this.releaseDeployId.set(resolvida.releaseId);
          if (resolvida.aviso) {
            this.toast.info(resolvida.aviso);
          }
          return this.deployService.executar({
            releaseId: resolvida.releaseId,
            instalacaoId,
            forcar,
            modo,
          });
        }),
      )
      .subscribe({
        next: d => {
          this.executandoDeploy.set(false);
          this.executandoModo.set(null);
          if (d.status === 'IGNORADO') {
            this.toast.info(d.mensagem ?? 'Manifesto já aplicado para esta instalação.');
          } else if (d.status === 'FALHA') {
            this.toast.error(d.erro ?? 'Falha na implantação.');
          } else if (modo === 'REAL') {
            this.toast.success(d.mensagem ?? 'Instalação aplicada no host.');
            this.carregar(instalacaoId);
          } else {
            this.toast.success(d.mensagem ?? 'Dry-run concluído. O host não foi alterado.');
          }
          this.carregarDeploys(instalacaoId);
        },
        error: err => {
          this.executandoDeploy.set(false);
          this.executandoModo.set(null);
          const msg = err?.error?.message ?? 'Não foi possível implantar.';
          this.toast.error(typeof msg === 'string' ? msg : 'Não foi possível implantar.');
        },
      });
  }

  protected dispararBuildVersao(): void {
    const instalacaoId = this.editId();
    if (!instalacaoId || !this.origemValida() || this.disparandoBuild()) {
      return;
    }
    const alvos = this.alvosBuild();
    if (alvos.length > 0 && !this.temAlvoSelecionado()) {
      this.toast.error('Selecione ao menos um job para gerar artefatos.');
      return;
    }
    if (!this.fontesVersao()?.jenkinsConfigurado && alvos.length === 0) {
      this.toast.error('Configure Jenkins no cadastro do produto para gerar o artefato.');
      return;
    }
    this.disparandoBuild.set(true);
    this.service.dispararBuild(instalacaoId, this.payloadOrigem()).subscribe({
      next: r => {
        this.disparandoBuild.set(false);
        const qtd = r.jobs?.length || 1;
        this.toast.success(
          qtd > 1
            ? `${qtd} jobs enfileirados no Jenkins (${r.tag}).`
            : `Build enfileirado no Jenkins (${r.tag}).`,
        );
        if (r.aviso) {
          this.toast.info(r.aviso);
        }
        this.iniciarPollBuilds();
      },
      error: () => this.disparandoBuild.set(false),
    });
  }

  protected executarCicloVida(operacao: 'INICIAR' | 'PARAR'): void {
    const instalacaoId = this.editId();
    if (!instalacaoId) {
      return;
    }
    this.executandoCiclo.set(operacao);
    const req$ = operacao === 'INICIAR'
      ? this.service.iniciar(instalacaoId, 'REAL')
      : this.service.parar(instalacaoId, 'REAL');
    req$.subscribe({
      next: d => {
        this.executandoCiclo.set(null);
        if (d.status === 'FALHA') {
          this.toast.error(d.erro ?? (operacao === 'INICIAR' ? 'Falha ao iniciar.' : 'Falha ao parar.'));
        } else {
          this.toast.success(d.mensagem ?? (operacao === 'INICIAR' ? 'Ambiente iniciado.' : 'Ambiente parado.'));
          this.carregar(instalacaoId);
        }
        this.carregarDeploys(instalacaoId);
      },
      error: err => {
        this.executandoCiclo.set(null);
        const msg = err?.error?.message ?? (operacao === 'INICIAR' ? 'Não foi possível iniciar.' : 'Não foi possível parar.');
        this.toast.error(typeof msg === 'string' ? msg : 'Não foi possível executar start/stop.');
      },
    });
  }

  private carregarDeploys(instalacaoId: string): void {
    this.deployService.listar(1, 5, { instalacaoId }).subscribe({
      next: r => this.deploys.set(r.items),
      error: () => this.deploys.set([]),
    });
  }

  private carregarFontesVersao(instalacaoId: string): void {
    this.carregandoFontesVersao.set(true);
    this.fontesVersaoErro.set(null);
    this.service.listarFontesVersao(instalacaoId).subscribe({
      next: f => {
        this.fontesVersao.set(f);
        this.carregandoFontesVersao.set(false);
        if (f.versaoAtual?.selecionavel) {
          this.origemVersao.set('RELEASE_ATUAL');
        } else if (f.ultimaGerada?.tag) {
          this.origemVersao.set('ULTIMA_GERADA');
        } else {
          this.origemVersao.set('TAG_ESPECIFICA');
        }
        if (!this.tagEscolhida() && f.tags?.length) {
          this.tagEscolhida.set(f.tags[0].tag ?? '');
        }
        if (this.alvosSelecionados().size === 0 && f.alvos?.length) {
          this.alvosSelecionados.set(new Set(f.alvos.filter(a => a.selecionadoPadrao).map(a => a.id)));
        }
        this.atualizarPreviewDaOrigem();
      },
      error: () => {
        this.fontesVersao.set(null);
        this.carregandoFontesVersao.set(false);
        this.fontesVersaoErro.set(
          'Não foi possível listar as versões do Git. Recarregue a página; se persistir, a API precisa ser reiniciada.',
        );
      },
    });
  }

  private payloadOrigem(): { origem: OrigemBuild; tag?: string; alvoIds?: string[] } {
    const origem = this.origemVersao();
    const alvoIds = [...this.alvosSelecionados()];
    const base = origem === 'TAG_ESPECIFICA'
      ? { origem, tag: this.tagEfetiva() }
      : { origem };
    return alvoIds.length ? { ...base, alvoIds } : base;
  }

  protected alvoMarcado(id: string): boolean {
    return this.alvosSelecionados().has(id);
  }

  protected onAlvoChange(id: string, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.toggleAlvo(id, !!input?.checked);
  }

  protected toggleAlvo(id: string, marcado: boolean): void {
    const next = new Set(this.alvosSelecionados());
    if (marcado) {
      next.add(id);
    } else {
      next.delete(id);
    }
    this.alvosSelecionados.set(next);
  }

  protected produtoHabilitado(produtoId: string): boolean {
    return this.produtosHabilitados().has(produtoId);
  }

  protected onProdutoHabilitar(produtoId: string, event: Event): void {
    const marcado = !!(event.target as HTMLInputElement | null)?.checked;
    const next = toggleProdutoHabilitado(this.produtosHabilitados(), produtoId, marcado);
    this.produtosHabilitados.set(next);
    const novaAba = abaAposToggleProduto(
      next,
      produtoId,
      marcado,
      this.abaProdutoId(),
      this.produtoIdAtual(),
    );
    if (novaAba) {
      this.selecionarAbaProduto(novaAba);
    } else {
      this.abaProdutoId.set('');
    }
  }

  protected selecionarAbaProduto(produtoId: string): void {
    if (!produtoId || produtoId === this.abaProdutoId()) {
      return;
    }
    if (!this.produtosHabilitados().has(produtoId)) {
      return;
    }
    const aba = this.abasProduto().find(a => a.id === produtoId);
    if (aba?.instalacaoId && aba.instalacaoId !== this.editId()) {
      if (this.form.dirty) {
        this.toast.warn('Salve as alterações do cadastro antes de trocar de produto.');
        return;
      }
      this.router.navigate(['/release-orchestrator/instalacoes', aba.instalacaoId, 'editar']);
      return;
    }
    this.abaProdutoId.set(produtoId);
    if (!this.editando()) {
      this.form.get('produtoId')?.setValue(produtoId);
      this.produtoIdAtual.set(produtoId);
    }
  }

  protected criarInstalacaoDaAba(): void {
    const produtoId = this.abaProdutoId();
    const aba = this.abasProduto().find(a => a.id === produtoId);
    if (!produtoId || !this.editando() || aba?.instalacaoId || !this.produtoHabilitado(produtoId)) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warn('Salve ou corrija o cadastro desta instalação antes de criar a aba.');
      return;
    }
    const raw = this.form.getRawValue();
    const hostId = String(raw.hostId || this.hostLocal()?.id || '');
    if (!hostId) {
      this.toast.warn('Informe o host desta instalação.');
      return;
    }
    const sigla = aba?.sigla ?? this.produtos().find(p => p.id === produtoId)?.sigla ?? 'PROD';
    const payload: InstalacaoClienteForm = {
      codigo: codigoInstalacaoProduto(String(raw.codigo), sigla),
      nome: nomeInstalacaoProduto(String(raw.nome), sigla),
      clienteId: raw.clienteId,
      hostId,
      produtoId,
      tipoImplantacao: raw.tipoImplantacao,
      status: 'INEXISTENTE',
      ambiente: raw.ambiente,
      imagemRef: raw.imagemRef || undefined,
      arquivoImagemRef: raw.arquivoImagemRef || undefined,
      diretorioInstalacao: raw.diretorioInstalacao || undefined,
      observacoes: raw.observacoes || undefined,
      configuracao: {
        tipoBanco: raw.configuracao.tipoBanco || undefined,
        bancoHost: raw.configuracao.bancoHost || undefined,
        bancoPorta: raw.configuracao.bancoPorta || undefined,
        bancoNome: raw.configuracao.bancoNome || undefined,
        bancoUsuario: raw.configuracao.bancoUsuario || undefined,
        bancoCredencialRef: raw.configuracao.bancoCredencialRef || undefined,
        urlBackend: raw.configuracao.urlBackend || undefined,
        urlFrontend: raw.configuracao.urlFrontend || undefined,
        parametros: raw.configuracao.parametros || undefined,
      },
      portas: this.portasArray.getRawValue() as ReservaPorta[],
    };
    this.criandoIrmao.set(true);
    this.service.criar(payload).subscribe({
      next: inst => {
        this.criandoIrmao.set(false);
        this.toast.success(`Instalação ${sigla} cadastrada. Escolha a versão só desta aba.`);
        this.router.navigate(['/release-orchestrator/instalacoes', inst.id, 'editar']);
      },
      error: err => {
        this.criandoIrmao.set(false);
        const msg = err?.error?.message ?? 'Não foi possível cadastrar este produto neste host.';
        this.toast.error(typeof msg === 'string' ? msg : 'Não foi possível cadastrar este produto.');
      },
    });
  }

  private carregarContratosEIrmas(clienteId?: string, hostId?: string, ambiente?: AmbienteInstalacao): void {
    const cid = clienteId ?? (this.form?.get('clienteId')?.value as string);
    if (!cid || cid === CLIENTE_NOVO) {
      this.produtosContratados.set([]);
      this.instalacoesIrmas.set([]);
      return;
    }
    this.clienteProdutoService.listar(cid).subscribe({
      next: list => this.produtosContratados.set((list ?? []).filter(c => c.ativo)),
      error: () => this.produtosContratados.set([]),
    });
    const hid = hostId ?? (this.form?.get('hostId')?.value as string) ?? this.hostLocal()?.id;
    const amb = ambiente ?? (this.form?.get('ambiente')?.value as AmbienteInstalacao);
    if (!hid) {
      this.instalacoesIrmas.set([]);
      return;
    }
    this.service.listar(1, 50, undefined, cid, hid, undefined, undefined, undefined, amb).subscribe({
      next: r => this.instalacoesIrmas.set(r.items ?? []),
      error: () => this.instalacoesIrmas.set([]),
    });
  }

  private iniciarPollBuilds(): void {
    this.pararPollBuilds();
    const instalacaoId = this.editId();
    if (!instalacaoId) {
      return;
    }
    let n = 0;
    this.pollBuilds = setInterval(() => {
      n += 1;
      if (n > 75) {
        this.pararPollBuilds();
        return;
      }
      this.service.listarFontesVersao(instalacaoId).subscribe({
        next: f => {
          this.fontesVersao.set(f);
          const pendente = (f.buildsRecentes ?? []).some(b => b.status === 'ENFILEIRADO');
          if (!pendente) {
            this.pararPollBuilds();
          }
        },
        error: () => this.pararPollBuilds(),
      });
    }, 4000);
  }

  private pararPollBuilds(): void {
    if (this.pollBuilds) {
      clearInterval(this.pollBuilds);
      this.pollBuilds = null;
    }
  }

  protected atualizarPreviewDaOrigem(): void {
    const f = this.fontesVersao();
    const origem = this.origemVersao();
    let releaseId = '';
    if (origem === 'RELEASE_ATUAL') {
      releaseId = f?.versaoAtual?.releaseId ?? '';
    } else if (origem === 'ULTIMA_GERADA') {
      releaseId = f?.ultimaGerada?.releaseId ?? '';
    } else {
      const tag = this.tagEfetiva();
      releaseId = f?.tags?.find(t => t.tag === tag)?.releaseId ?? '';
    }
    this.releaseDeployId.set(releaseId);
    this.carregarPreview();
  }

  private carregarPreview(): void {
    const instalacaoId = this.editId();
    const releaseId = this.releaseDeployId();
    if (!instalacaoId || !releaseId) {
      this.manifestoPreview.set(null);
      return;
    }
    this.carregandoPreview.set(true);
    this.deployService.preview(releaseId, instalacaoId).subscribe({
      next: m => {
        this.manifestoPreview.set(m);
        this.carregandoPreview.set(false);
      },
      error: () => {
        this.manifestoPreview.set(null);
        this.carregandoPreview.set(false);
      },
    });
  }

  protected fieldError(path: string): boolean {
    const c = this.form.get(path);
    return !!(c?.invalid && c?.touched);
  }
}
