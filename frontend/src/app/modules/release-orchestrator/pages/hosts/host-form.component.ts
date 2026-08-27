import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { CanDeactivateComponent } from '@shared/guards';
import { ButtonComponent, PageHeaderComponent, ToastService } from '@shared/ui';

import {
  HostForm,
  SISTEMA_OPERACIONAL_LABELS,
  SistemaOperacionalHost,
  TIPO_CONEXAO_LABELS,
  TipoConexaoHost,
} from '../../models/host.model';
import { HostService } from '../../services/host.service';

const CODIGO_REGEX = /^[A-Za-z0-9][A-Za-z0-9-]*$/;

@Component({
  selector: 'app-host-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule, PageHeaderComponent, ButtonComponent],
  templateUrl: './host-form.component.html',
  styleUrl: './host-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HostFormComponent implements OnInit, CanDeactivateComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hostService = inject(HostService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  protected readonly editId = signal<string | null>(null);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);

  protected readonly sistemas = Object.keys(SISTEMA_OPERACIONAL_LABELS) as SistemaOperacionalHost[];
  protected readonly conexoes = Object.keys(TIPO_CONEXAO_LABELS) as TipoConexaoHost[];
  protected readonly soLabels = SISTEMA_OPERACIONAL_LABELS;
  protected readonly conexaoLabels = TIPO_CONEXAO_LABELS;

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
    return 'cadastro do host';
  }

  private buildForm(): void {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(40), Validators.pattern(CODIGO_REGEX)]],
      nome: ['', [Validators.required, Validators.maxLength(200)]],
      hostname: ['', [Validators.required, Validators.maxLength(255)]],
      enderecoIp: ['', [Validators.maxLength(45)]],
      sistemaOperacional: ['LINUX' as SistemaOperacionalHost, Validators.required],
      dockerDisponivel: [false],
      tipoConexao: ['SSH' as TipoConexaoHost, Validators.required],
      portaConexao: [22, [Validators.min(1), Validators.max(65535)]],
      usuarioConexao: ['', [Validators.maxLength(120)]],
      credencialRef: ['', [Validators.maxLength(200)]],
      observacoes: ['', [Validators.maxLength(4000)]],
      ativo: [true],
    });
  }

  protected onSistemaChange(): void {
    this.aplicarDefaultConexao(this.form.get('sistemaOperacional')?.value);
  }

  protected onTipoConexaoChange(): void {
    this.aplicarDefaultPorta(this.form.get('tipoConexao')?.value);
  }

  private aplicarDefaultConexao(so: SistemaOperacionalHost): void {
    const tipoAtual = this.form.get('tipoConexao')?.value as TipoConexaoHost;
    if (tipoAtual === 'DOCKER') return;
    const proximo: TipoConexaoHost = so === 'WINDOWS' ? 'WINRM' : 'SSH';
    this.form.get('tipoConexao')?.setValue(proximo, { emitEvent: true });
  }

  private aplicarDefaultPorta(tipo: TipoConexaoHost): void {
    const portaCtrl = this.form.get('portaConexao');
    const atual = portaCtrl?.value;
    const defaults: Record<TipoConexaoHost, number> = { SSH: 22, WINRM: 5985, DOCKER: 2376 };
    if (atual === 22 || atual === 5985 || atual === 2376 || atual == null) {
      portaCtrl?.setValue(defaults[tipo]);
    }
    if (tipo === 'DOCKER') {
      this.form.get('dockerDisponivel')?.setValue(true);
    }
  }

  private carregar(id: string): void {
    this.carregando.set(true);
    this.hostService.buscar(id).subscribe({
      next: host => {
        this.form.patchValue(
          {
            codigo: host.codigo,
            nome: host.nome,
            hostname: host.hostname,
            enderecoIp: host.enderecoIp ?? '',
            sistemaOperacional: host.sistemaOperacional,
            dockerDisponivel: host.dockerDisponivel,
            tipoConexao: host.tipoConexao,
            portaConexao: host.portaConexao ?? null,
            usuarioConexao: host.usuarioConexao ?? '',
            credencialRef: host.credencialRef ?? '',
            observacoes: host.observacoes ?? '',
            ativo: host.ativo,
          },
          { emitEvent: false },
        );
        this.form.markAsPristine();
        this.carregando.set(false);
      },
      error: () => {
        this.toast.error('Não foi possível carregar o host.');
        this.carregando.set(false);
        this.router.navigate(['/release-orchestrator/hosts']);
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
    const payload: HostForm = {
      codigo: raw.codigo,
      nome: raw.nome,
      hostname: raw.hostname,
      enderecoIp: raw.enderecoIp || undefined,
      sistemaOperacional: raw.sistemaOperacional,
      dockerDisponivel: raw.dockerDisponivel,
      tipoConexao: raw.tipoConexao,
      portaConexao: raw.portaConexao || undefined,
      usuarioConexao: raw.usuarioConexao || undefined,
      credencialRef: raw.credencialRef || undefined,
      observacoes: raw.observacoes || undefined,
      ativo: raw.ativo,
    };

    const id = this.editId();
    const persistir$ = id ? this.hostService.atualizar(id, payload) : this.hostService.criar(payload);

    persistir$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.success(id ? 'Host atualizado.' : 'Host cadastrado.');
        this.form.markAsPristine();
        this.router.navigate(['/release-orchestrator/hosts']);
      },
      error: () => {
        this.salvando.set(false);
        this.toast.error('Erro ao salvar host. Verifique código e hostname únicos.');
      },
    });
  }

  protected fieldError(path: string): boolean {
    const c = this.form.get(path);
    return !!(c?.invalid && c?.touched);
  }
}
