import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { PageHeaderComponent } from '@shared/ui';
import { AjudaService } from '../../services/ajuda.service';
import { AuthService } from '@core/auth/services/auth.service';

const STORAGE_KEY = 'docflow:ajuda:etapas-concluidas';

@Component({
  selector: 'app-ajuda',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, PageHeaderComponent],
  templateUrl: './ajuda.component.html',
  styleUrl: './ajuda.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AjudaComponent implements OnDestroy {
  private readonly ajuda = inject(AjudaService);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);

  protected readonly busca = signal('');
  protected readonly jornadaSelecionada = signal('jornada_estrutura');
  protected readonly concluidas = signal<Set<string>>(this.carregarProgresso());
  protected readonly faqAberto = signal<string | null>(null);
  protected readonly faqs = this.ajuda.faqs;
  private buscaTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly jornadas = computed(() => {
    const termo = normalizar(this.busca());
    const jornadas = this.ajuda.jornadas();
    if (!termo) return jornadas;
    return jornadas.filter(jornada =>
      normalizar(
        `${jornada.titulo} ${jornada.descricao} ${jornada.etapas
          .map(etapa => `${etapa.titulo} ${etapa.descricao}`)
          .join(' ')}`,
      ).includes(termo),
    );
  });

  protected readonly jornadaAtiva = computed(
    () =>
      this.jornadas().find(jornada => jornada.id === this.jornadaSelecionada()) ?? this.jornadas()[0] ?? null,
  );

  protected readonly progresso = computed(() => {
    const jornada = this.jornadaAtiva();
    if (!jornada?.etapas.length) return 0;
    const concluidas = jornada.etapas.filter(etapa => this.concluidas().has(etapa.id)).length;
    return Math.round((concluidas / jornada.etapas.length) * 100);
  });

  constructor() {
    this.busca.set(this.route.snapshot.queryParamMap.get('q') ?? '');
    this.ajuda.carregar();
  }

  ngOnDestroy(): void {
    clearTimeout(this.buscaTimer);
  }

  protected atualizarBusca(event: Event): void {
    const termo = (event.target as HTMLInputElement).value;
    this.busca.set(termo);
    clearTimeout(this.buscaTimer);
    if (termo.trim().length < 3) return;
    this.buscaTimer = setTimeout(() => {
      const quantidade = this.ajuda.pesquisar(termo).length;
      this.ajuda.registrarEvento({
        tipo: quantidade ? 'BUSCA' : 'BUSCA_SEM_RESULTADO',
        termo,
        rota: '/doc-flow/ajuda',
        resultadoQuantidade: quantidade,
      });
    }, 500);
  }

  protected selecionarJornada(id: string): void {
    this.jornadaSelecionada.set(id);
    const jornada = this.ajuda.jornadas().find(item => item.id === id);
    if (jornada) {
      this.ajuda.registrarEvento({
        tipo: 'CONTEUDO_ABERTO',
        conteudoCodigo: jornada.codigo,
        rota: '/doc-flow/ajuda',
      });
    }
  }

  protected alternarEtapa(id: string, codigo?: string): void {
    const atualizadas = new Set(this.concluidas());
    const concluindo = !atualizadas.has(id);
    if (concluindo) atualizadas.add(id);
    else atualizadas.delete(id);
    this.concluidas.set(atualizadas);
    this.salvarProgresso(atualizadas);
    if (concluindo) {
      this.ajuda.registrarEvento({
        tipo: 'ETAPA_CONCLUIDA',
        conteudoCodigo: codigo,
        rota: '/doc-flow/ajuda',
      });
    }
  }

  protected etapaConcluida(id: string): boolean {
    return this.concluidas().has(id);
  }

  protected reiniciarJornada(): void {
    const ids = new Set(this.jornadaAtiva()?.etapas.map(etapa => etapa.id) ?? []);
    const atualizadas = new Set([...this.concluidas()].filter(id => !ids.has(id)));
    this.concluidas.set(atualizadas);
    this.salvarProgresso(atualizadas);
  }

  protected alternarFaq(id: string, codigo?: string): void {
    const abrindo = this.faqAberto() !== id;
    this.faqAberto.set(abrindo ? id : null);
    if (abrindo) {
      this.ajuda.registrarEvento({
        tipo: 'CONTEUDO_ABERTO',
        conteudoCodigo: codigo,
        rota: '/doc-flow/ajuda',
      });
    }
  }

  private carregarProgresso(): Set<string> {
    try {
      const ids = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown;
      return new Set(Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : []);
    } catch {
      return new Set();
    }
  }

  private salvarProgresso(ids: Set<string>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
      // O guia continua funcional quando o armazenamento local estiver indisponível.
    }
  }
}

function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
