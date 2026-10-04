import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AuthService } from '@core/auth/services/auth.service';
import { BadgeComponent, ButtonComponent, ConfirmService, ToastService } from '@shared/ui';
import { mensagemErroHttp } from '@shared/utils/http-error-message';
import { Cliente } from '../../models/cliente.model';
import { ManualAcesso, ManualAcessoCriado } from '../../models/manual-acesso.model';
import { ClienteService } from '../../services/cliente.service';
import { ManualAcessoService } from '../../services/manual-acesso.service';

/**
 * Integração do manual nos sistemas do cliente (Onda D, INT-405): chaves por cliente, origens
 * liberadas no CORS e o snippet do help-bridge pronto para colar.
 */
@Component({
  selector: 'app-manual-integracao',
  standalone: true,
  imports: [ButtonComponent, BadgeComponent, DatePipe],
  templateUrl: './manual-integracao.component.html',
  styleUrl: './manual-integracao.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualIntegracaoComponent implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly acessoService = inject(ManualAcessoService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly validades = [
    { dias: 0, rotulo: 'Sem expiração' },
    { dias: 90, rotulo: '90 dias' },
    { dias: 365, rotulo: '1 ano' },
  ];

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly clienteId = signal<string>('');
  protected readonly chaves = signal<ManualAcesso[]>([]);
  protected readonly carregando = signal(false);
  protected readonly criando = signal(false);
  protected readonly nome = signal('');
  protected readonly origens = signal('');
  protected readonly dias = signal(0);
  protected readonly criada = signal<ManualAcessoCriado | null>(null);

  protected readonly podeEditar = computed(() => this.auth.tem()('PUBLICACAO:EDITAR'));
  protected readonly podeCriar = computed(
    () => !!this.clienteId() && this.nome().trim().length >= 2 && !this.criando(),
  );
  protected readonly snippet = computed(() => {
    const criada = this.criada();
    if (!criada) return '';
    return [
      `<script src="${this.acessoService.apiPublica()}/manual/help-bridge.js" data-token="${criada.token}"></script>`,
      '<script>',
      '  // No botão de ajuda de cada tela:',
      "  // NexusManual.open({ codigoTela: 'PED-001' });",
      "  // const resposta = await NexusManual.perguntar('como filtrar pedidos?');",
      '</script>',
    ].join('\n');
  });

  ngOnInit(): void {
    this.clienteService.clientes().subscribe({
      next: clientes => this.clientes.set(clientes.filter(c => c.ativo !== false)),
      error: () => this.toast.error('Erro ao carregar clientes.'),
    });
  }

  protected selecionarCliente(id: string): void {
    this.clienteId.set(id);
    this.criada.set(null);
    this.carregar();
  }

  protected criar(): void {
    if (!this.podeCriar()) return;
    this.criando.set(true);
    const origens = this.origens()
      .split(/[\n,]/)
      .map(o => o.trim())
      .filter(Boolean);
    this.acessoService
      .criar(this.clienteId(), { nome: this.nome().trim(), origens, diasValidade: this.dias() || null })
      .pipe(finalize(() => this.criando.set(false)))
      .subscribe({
        next: criada => {
          this.criada.set(criada);
          this.nome.set('');
          this.origens.set('');
          this.chaves.update(lista => [criada.acesso, ...lista]);
        },
        error: err => this.toast.error(mensagemErroHttp(err, 'Não foi possível criar a chave.')),
      });
  }

  protected async revogar(chave: ManualAcesso): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Revogar chave?',
      message: `Os sistemas que usam "${chave.nome}" deixam de abrir o manual e de perguntar a ele na hora.`,
      acceptLabel: 'Revogar',
      variant: 'danger',
      icon: 'KeyRound',
    });
    if (!ok) return;
    this.acessoService.revogar(chave.id).subscribe({
      next: () => {
        this.toast.success('Chave revogada.');
        this.carregar();
      },
      error: err => this.toast.error(mensagemErroHttp(err, 'Não foi possível revogar a chave.')),
    });
  }

  protected copiar(texto: string): void {
    navigator.clipboard
      .writeText(texto)
      .then(() => this.toast.success('Copiado.'))
      .catch(() => this.toast.error('Não foi possível copiar.'));
  }

  private carregar(): void {
    if (!this.clienteId()) return;
    this.carregando.set(true);
    this.acessoService
      .listar(this.clienteId())
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: chaves => this.chaves.set(chaves),
        error: err => this.toast.error(mensagemErroHttp(err, 'Erro ao carregar as chaves.')),
      });
  }
}
