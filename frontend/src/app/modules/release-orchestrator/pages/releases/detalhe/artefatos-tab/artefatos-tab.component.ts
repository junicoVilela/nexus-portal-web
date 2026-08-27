import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { forkJoin, of } from 'rxjs';

import {
  BadgeComponent,
  ButtonComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  ErrorVariant,
  SkeletonComponent,
  ToastService,
} from '@shared/ui';
import { classificarErro } from '@shared/utils/error-classifier';

import { ArtefatoReleaseModulo } from '../../../../models/artefato-release-modulo.model';
import {
  ModuloProduto,
  TIPO_MODULO_EXTENSOES,
  TipoModulo,
  tipoModuloAceitaUpload,
} from '../../../../models/modulo-produto.model';
import { ArtefatoReleaseModuloService } from '../../../../services/artefato-release-modulo.service';
import { ModuloProdutoService } from '../../../../services/modulo-produto.service';
import { ReleaseModuloVersaoService } from '../../../../services/release-modulo-versao.service';
import {
  FontesBuild,
  OrigemBuild,
  ReleaseService,
  versaoPortalDaTag,
} from '../../../../services/release.service';
import { AuthService } from '@core/auth/services/auth.service';

interface ModuloComArtefatos {
  modulo: ModuloProduto;
  artefatos: ArtefatoReleaseModulo[];
  versaoAtual: string;
  versaoEditando: string;
  versaoSaving: boolean;
  uploadingFile: boolean;
  uploadError: string | null;
}

@Component({
  selector: 'app-artefatos-tab',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    LucideAngularModule,
    ButtonComponent,
    BadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonComponent,
  ],
  templateUrl: './artefatos-tab.component.html',
  styleUrl: './artefatos-tab.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtefatosTabComponent implements OnChanges {
  readonly releaseId = input.required<string>();
  readonly produtoId = input.required<string>();
  readonly releaseStatus = input<string>('');
  readonly buildDisparado = output<void>();

  private readonly moduloService = inject(ModuloProdutoService);
  private readonly artefatoService = inject(ArtefatoReleaseModuloService);
  private readonly versaoService = inject(ReleaseModuloVersaoService);
  private readonly releaseService = inject(ReleaseService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroVariant = signal<ErrorVariant>('generic');
  protected readonly grupos = signal<ModuloComArtefatos[]>([]);

  protected readonly fontes = signal<FontesBuild | null>(null);
  protected readonly fontesErro = signal<string | null>(null);
  protected readonly origem = signal<OrigemBuild>('RELEASE_ATUAL');
  protected readonly tagEscolhida = signal('');
  protected readonly tagDigitada = signal('');
  protected readonly disparando = signal(false);

  protected readonly podeDisparar = computed(() => {
    return this.auth.tem()('RELEASE:EDITAR') && this.releaseStatus() !== 'CANCELADA';
  });

  protected readonly tagEfetiva = computed(() => {
    const f = this.fontes();
    if (!f) return '';
    const origem = this.origem();
    if (origem === 'RELEASE_ATUAL') return f.releaseAtual?.tag ?? '';
    if (origem === 'ULTIMA_GERADA') return f.ultimaGerada?.tag ?? '';
    return (this.tagDigitada().trim() || this.tagEscolhida()).trim();
  });

  protected readonly versaoEfetiva = computed(() => versaoPortalDaTag(this.tagEfetiva()));

  protected readonly avisoVersaoDiferente = computed(() => {
    const f = this.fontes();
    const versao = this.versaoEfetiva();
    if (!f || !versao) return false;
    return versao !== f.versaoRelease.replace(/^v/i, '');
  });

  protected readonly imutavel = computed(() => {
    const s = this.releaseStatus();
    return s === 'PUBLICADA' || s === 'CANCELADA';
  });

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['releaseId'] || changes['produtoId']) && this.releaseId() && this.produtoId()) {
      this.carregar();
      this.carregarFontes();
    }
  }

  protected selecionarOrigem(origem: OrigemBuild): void {
    this.origem.set(origem);
  }

  protected carregarFontes(): void {
    this.fontesErro.set(null);
    this.releaseService.listarFontesBuild(this.releaseId()).subscribe({
      next: f => {
        this.fontes.set(f);
        if (!this.tagEscolhida() && f.tags?.length) {
          this.tagEscolhida.set(f.tags[0].tag);
        }
      },
      error: () => {
        this.fontesErro.set('Não foi possível carregar as opções de tag/Jenkins.');
      },
    });
  }

  protected dispararBuild(): void {
    if (!this.podeDisparar() || this.disparando()) return;
    const origem = this.origem();
    const tag = origem === 'TAG_ESPECIFICA' ? this.tagEfetiva() : undefined;
    if (origem === 'TAG_ESPECIFICA' && !tag) {
      this.toast.error('Escolha ou digite a tag Git.');
      return;
    }
    this.disparando.set(true);
    this.releaseService.dispararBuild(this.releaseId(), { origem, tag }).subscribe({
      next: r => {
        this.disparando.set(false);
        this.toast.success(`Build enfileirado no Jenkins (${r.tag}).`);
        if (r.aviso) this.toast.info(r.aviso);
        this.buildDisparado.emit();
      },
      error: () => this.disparando.set(false),
    });
  }

  protected carregar(): void {
    this.loading.set(true);
    this.erro.set(null);

    forkJoin({
      modulos: this.moduloService.listar(this.produtoId()),
      versoes: this.versaoService.listar(this.releaseId()),
    }).subscribe({
      next: ({ modulos, versoes }) => {
        const ativos = modulos.filter(m => m.ativo);
        const versaoPorModulo = new Map(versoes.map(v => [v.moduloProdutoId, v.versao]));
        if (ativos.length === 0) {
          this.grupos.set([]);
          this.loading.set(false);
          return;
        }
        const calls = ativos.map(m =>
          tipoModuloAceitaUpload(m.tipo)
            ? this.artefatoService.listar(this.releaseId(), m.id)
            : of([]),
        );
        forkJoin(calls).subscribe({
          next: listas => {
            const grupos: ModuloComArtefatos[] = ativos.map((m, i) => {
              const versaoAtual = versaoPorModulo.get(m.id) ?? '';
              return {
                modulo: m,
                artefatos: listas[i],
                versaoAtual,
                versaoEditando: versaoAtual,
                versaoSaving: false,
                uploadingFile: false,
                uploadError: null,
              };
            });
            this.grupos.set(grupos);
            this.loading.set(false);
          },
          error: err => this.tratarErro(err),
        });
      },
      error: err => this.tratarErro(err),
    });
  }

  protected salvarVersao(grupo: ModuloComArtefatos): void {
    const nova = (grupo.versaoEditando ?? '').trim();
    if (nova === grupo.versaoAtual) return;

    if (!nova) {
      if (!grupo.versaoAtual) {
        // nada a remover
        return;
      }
      this.atualizarGrupo(grupo, { versaoSaving: true });
      this.versaoService.remover(this.releaseId(), grupo.modulo.id).subscribe({
        next: () => this.atualizarGrupo(grupo, {
          versaoAtual: '', versaoEditando: '', versaoSaving: false,
        }),
        error: () => this.atualizarGrupo(grupo, {
          versaoSaving: false, versaoEditando: grupo.versaoAtual,
        }),
      });
      return;
    }

    this.atualizarGrupo(grupo, { versaoSaving: true });
    this.versaoService.salvar(this.releaseId(), grupo.modulo.id, nova).subscribe({
      next: v => this.atualizarGrupo(grupo, {
        versaoAtual: v.versao, versaoEditando: v.versao, versaoSaving: false,
      }),
      error: () => this.atualizarGrupo(grupo, {
        versaoSaving: false, versaoEditando: grupo.versaoAtual,
      }),
    });
  }

  protected onFileSelected(event: Event, grupo: ModuloComArtefatos): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';
    this.uploadFile(file, grupo);
  }

  private uploadFile(file: File, grupo: ModuloComArtefatos): void {
    if (!this.validarExtensao(file, grupo.modulo.tipo)) {
      this.atualizarGrupo(grupo, {
        uploadError: `Extensão não aceita para ${grupo.modulo.tipo}. Aceitas: ${TIPO_MODULO_EXTENSOES[grupo.modulo.tipo].join(', ')}`,
      });
      return;
    }

    this.atualizarGrupo(grupo, { uploadingFile: true, uploadError: null });

    this.artefatoService.upload(this.releaseId(), grupo.modulo.id, file).subscribe({
      next: artefato => {
        this.atualizarGrupo(grupo, {
          uploadingFile: false,
          artefatos: [artefato, ...grupo.artefatos],
        });
      },
      error: err => {
        this.atualizarGrupo(grupo, {
          uploadingFile: false,
          uploadError: err?.error?.message ?? 'Falha no upload.',
        });
      },
    });
  }

  protected baixar(grupo: ModuloComArtefatos, artefato: ArtefatoReleaseModulo): void {
    this.artefatoService.baixar(this.releaseId(), grupo.modulo.id, artefato.id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = artefato.nomeArquivo;
        a.click();
        window.URL.revokeObjectURL(url);
      },
    });
  }

  protected excluir(grupo: ModuloComArtefatos, artefato: ArtefatoReleaseModulo): void {
    if (this.imutavel()) return;
    this.artefatoService.excluir(this.releaseId(), grupo.modulo.id, artefato.id).subscribe({
      next: () => {
        this.atualizarGrupo(grupo, {
          artefatos: grupo.artefatos.filter(a => a.id !== artefato.id),
        });
      },
    });
  }

  protected extensoesAceitas(tipo: TipoModulo): string {
    return TIPO_MODULO_EXTENSOES[tipo].join(',');
  }

  protected formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  protected sha256Curto(sha: string): string {
    return sha.length > 12 ? sha.substring(0, 12) + '…' : sha;
  }

  protected aceitaUpload(tipo: TipoModulo): boolean {
    return tipoModuloAceitaUpload(tipo);
  }

  private validarExtensao(file: File, tipo: TipoModulo): boolean {
    const extensoes = TIPO_MODULO_EXTENSOES[tipo];
    if (extensoes.length === 0) return false;
    const nome = file.name.toLowerCase();
    return extensoes.some(ext => nome.endsWith(ext));
  }

  private atualizarGrupo(grupo: ModuloComArtefatos, patch: Partial<ModuloComArtefatos>): void {
    this.grupos.update(list => list.map(g => (g === grupo ? { ...g, ...patch } : g)));
  }

  private tratarErro(err: unknown): void {
    this.erroVariant.set(classificarErro(err));
    this.erro.set('Não foi possível carregar os artefatos.');
    this.loading.set(false);
  }
}
