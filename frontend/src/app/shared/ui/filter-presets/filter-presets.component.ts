import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { FilterPreset, listarPresets, removerPreset, salvarPreset } from '@shared/utils/filter-presets';

@Component({
  selector: 'ui-filter-presets',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './filter-presets.component.html',
  styleUrl: './filter-presets.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPresetsComponent {
  /** Escopo lógico (ex: "release-orchestrator:releases"). */
  readonly escopo = input.required<string>();
  /** Snapshot atual dos filtros — usado quando o usuário clica "Salvar". */
  readonly filtrosAtuais = input.required<Record<string, unknown>>();
  /** Quantos filtros estão atualmente ativos — habilita o botão "Salvar". */
  readonly filtrosAtivos = input<number>(0);

  readonly presetSelecionado = output<FilterPreset<Record<string, unknown>>>();

  protected readonly mostrarLista = signal(false);
  protected readonly tick = signal(0);
  protected readonly presets = computed<FilterPreset<Record<string, unknown>>[]>(() => {
    this.tick();
    return listarPresets(this.escopo());
  });

  protected toggle(): void {
    this.mostrarLista.update(v => !v);
  }

  protected aplicar(p: FilterPreset<Record<string, unknown>>): void {
    this.presetSelecionado.emit(p);
    this.mostrarLista.set(false);
  }

  protected excluir(id: string, evt: MouseEvent): void {
    evt.stopPropagation();
    removerPreset(this.escopo(), id);
    this.tick.update(v => v + 1);
  }

  protected salvar(): void {
    const nome = prompt('Nome do preset:')?.trim() ?? '';
    if (!nome) return;
    salvarPreset(this.escopo(), nome, this.filtrosAtuais());
    this.tick.update(v => v + 1);
    this.mostrarLista.set(true);
  }
}
