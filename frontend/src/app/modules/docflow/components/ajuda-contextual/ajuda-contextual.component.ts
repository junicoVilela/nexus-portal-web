import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  DestroyRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { filter } from 'rxjs';
import { AjudaService } from '../../services/ajuda.service';

interface OnboardingItem {
  id: string;
  titulo: string;
  descricao: string;
  rota: string;
}

const ONBOARDING_KEY = 'docflow:onboarding:v1';
const ONBOARDING_SEEN_KEY = 'docflow:onboarding:v1:visualizado';

const ONBOARDING: OnboardingItem[] = [
  {
    id: 'cliente',
    titulo: 'Cadastrar um cliente',
    descricao: 'Defina quem receberá o manual.',
    rota: '/doc-flow/clientes/novo',
  },
  {
    id: 'projeto',
    titulo: 'Criar um projeto',
    descricao: 'Represente o sistema documentado.',
    rota: '/doc-flow/projetos/novo',
  },
  {
    id: 'modulo',
    titulo: 'Organizar um módulo',
    descricao: 'Agrupe funcionalidades relacionadas.',
    rota: '/doc-flow/modulos/novo',
  },
  {
    id: 'pagina',
    titulo: 'Criar a primeira página',
    descricao: 'Use um modelo visual como ponto de partida.',
    rota: '/doc-flow/paginas/novo',
  },
  {
    id: 'revisao',
    titulo: 'Conhecer a revisão',
    descricao: 'Veja como validar e aprovar conteúdo.',
    rota: '/doc-flow/revisoes',
  },
  {
    id: 'publicacao',
    titulo: 'Gerar uma publicação',
    descricao: 'Entenda diagnóstico, pacote e distribuição.',
    rota: '/doc-flow/publicacoes/novo',
  },
];

@Component({
  selector: 'app-ajuda-contextual',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './ajuda-contextual.component.html',
  styleUrl: './ajuda-contextual.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AjudaContextualComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  protected readonly ajuda = inject(AjudaService);

  @ViewChild('contextTrigger') private contextTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('contextDrawer') private contextDrawer?: ElementRef<HTMLElement>;
  @ViewChild('tourDialog') private tourDialog?: ElementRef<HTMLElement>;

  protected readonly aberto = signal(false);
  protected readonly aba = signal<'contexto' | 'onboarding'>('contexto');
  protected readonly rota = signal(this.router.url);
  protected readonly onboarding = ONBOARDING;
  protected readonly onboardingConcluido = signal<Set<string>>(this.carregarOnboarding());
  protected readonly mostrarBoasVindas = signal(!this.storagePossui(ONBOARDING_SEEN_KEY));
  protected readonly tourIndex = signal<number | null>(null);

  protected readonly contextuais = computed(() => this.ajuda.contextuais(this.rota()));
  protected readonly progressoOnboarding = computed(() =>
    Math.round((this.onboardingConcluido().size / ONBOARDING.length) * 100),
  );
  protected readonly passoTour = computed(() => {
    const index = this.tourIndex();
    return index === null ? null : (this.ajuda.passosTour()[index] ?? null);
  });

  private alvoDestacado: HTMLElement | null = null;
  private estilosOriginais: Partial<CSSStyleDeclaration> = {};
  private focoAnterior: HTMLElement | null = null;

  ngOnInit(): void {
    this.ajuda.carregar();
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(event => this.rota.set((event as NavigationEnd).urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.limparDestaque();
  }

  protected abrir(aba: 'contexto' | 'onboarding' = 'contexto'): void {
    this.focoAnterior = this.elementoAtivo();
    this.aba.set(aba);
    this.aberto.set(true);
    this.mostrarBoasVindas.set(false);
    this.salvarVisualizado();
    setTimeout(() => this.contextDrawer?.nativeElement.focus());
  }

  protected fechar(): void {
    this.aberto.set(false);
    this.mostrarBoasVindas.set(false);
    this.salvarVisualizado();
    this.restaurarFoco();
  }

  protected concluirOnboarding(item: OnboardingItem): void {
    const atualizados = new Set(this.onboardingConcluido());
    if (atualizados.has(item.id)) return;
    atualizados.add(item.id);
    this.onboardingConcluido.set(atualizados);
    this.salvarOnboarding(atualizados);
    if (atualizados.size === ONBOARDING.length) {
      this.ajuda.registrarEvento({ tipo: 'ONBOARDING_CONCLUIDO', rota: this.rota() });
    }
  }

  protected itemOnboardingConcluido(id: string): boolean {
    return this.onboardingConcluido().has(id);
  }

  protected abrirConteudo(codigo: string): void {
    this.ajuda.registrarEvento({ tipo: 'CONTEUDO_ABERTO', conteudoCodigo: codigo, rota: this.rota() });
  }

  protected iniciarTour(): void {
    if (!this.ajuda.passosTour().length) return;
    this.aberto.set(false);
    this.mostrarBoasVindas.set(false);
    this.tourIndex.set(0);
    this.ajuda.registrarEvento({ tipo: 'TOUR_INICIADO', rota: this.rota() });
    setTimeout(() => {
      this.destacarPasso();
      this.tourDialog?.nativeElement.focus();
    });
  }

  protected avancarTour(): void {
    const index = this.tourIndex();
    if (index === null) return;
    if (index >= this.ajuda.passosTour().length - 1) {
      this.ajuda.registrarEvento({ tipo: 'TOUR_CONCLUIDO', rota: this.rota() });
      this.encerrarTour(false);
      return;
    }
    this.tourIndex.set(index + 1);
    setTimeout(() => this.destacarPasso());
  }

  protected voltarTour(): void {
    const index = this.tourIndex();
    if (index === null || index === 0) return;
    this.tourIndex.set(index - 1);
    setTimeout(() => this.destacarPasso());
  }

  protected encerrarTour(registrarAbandono = true): void {
    if (registrarAbandono && this.tourIndex() !== null) {
      this.ajuda.registrarEvento({ tipo: 'TOUR_ABANDONADO', rota: this.rota() });
    }
    this.tourIndex.set(null);
    this.limparDestaque();
    this.restaurarFoco();
  }

  @HostListener('document:keydown', ['$event'])
  protected tratarTeclado(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.tourIndex() !== null) {
        event.preventDefault();
        this.encerrarTour();
      } else if (this.aberto()) {
        event.preventDefault();
        this.fechar();
      }
      return;
    }
    if (event.key === 'Tab') {
      const container =
        this.tourIndex() !== null
          ? this.tourDialog?.nativeElement
          : this.aberto()
            ? this.contextDrawer?.nativeElement
            : undefined;
      if (container) this.conterFoco(event, container);
    }
  }

  private destacarPasso(): void {
    this.limparDestaque();
    const seletor = this.passoTour()?.seletorAlvo;
    if (!seletor || typeof document === 'undefined') return;
    try {
      const alvo = document.querySelector<HTMLElement>(seletor);
      if (!alvo) return;
      this.alvoDestacado = alvo;
      this.estilosOriginais = {
        outline: alvo.style.outline,
        outlineOffset: alvo.style.outlineOffset,
        position: alvo.style.position,
        zIndex: alvo.style.zIndex,
      };
      alvo.style.outline = '3px solid var(--accent)';
      alvo.style.outlineOffset = '4px';
      alvo.style.position = 'relative';
      alvo.style.zIndex = '1002';
      alvo.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch {
      // Um seletor administrável inválido não interrompe o tour.
    }
  }

  private conterFoco(event: KeyboardEvent, container: HTMLElement): void {
    const elementos = [
      ...container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ].filter(elemento => elemento.getClientRects().length > 0);
    if (!elementos.length) {
      event.preventDefault();
      container.focus();
      return;
    }
    const primeiro = elementos[0];
    const ultimo = elementos[elementos.length - 1];
    const ativo = this.elementoAtivo();
    if (event.shiftKey && (ativo === primeiro || !container.contains(ativo))) {
      event.preventDefault();
      ultimo.focus();
    } else if (!event.shiftKey && (ativo === ultimo || !container.contains(ativo))) {
      event.preventDefault();
      primeiro.focus();
    }
  }

  private elementoAtivo(): HTMLElement | null {
    return this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
  }

  private restaurarFoco(): void {
    const destino = this.focoAnterior?.isConnected ? this.focoAnterior : this.contextTrigger?.nativeElement;
    this.focoAnterior = null;
    setTimeout(() => destino?.focus());
  }

  private limparDestaque(): void {
    if (!this.alvoDestacado) return;
    Object.assign(this.alvoDestacado.style, this.estilosOriginais);
    this.alvoDestacado = null;
    this.estilosOriginais = {};
  }

  private carregarOnboarding(): Set<string> {
    try {
      const valor = JSON.parse(localStorage.getItem(ONBOARDING_KEY) ?? '[]') as unknown;
      return new Set(Array.isArray(valor) ? valor.filter(item => typeof item === 'string') : []);
    } catch {
      return new Set();
    }
  }

  private salvarOnboarding(ids: Set<string>): void {
    try {
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify([...ids]));
    } catch {
      // A orientação continua disponível sem persistência.
    }
  }

  private salvarVisualizado(): void {
    try {
      localStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
    } catch {
      // Sem impacto no uso da aplicação.
    }
  }

  private storagePossui(chave: string): boolean {
    try {
      return localStorage.getItem(chave) !== null;
    } catch {
      return true;
    }
  }
}
