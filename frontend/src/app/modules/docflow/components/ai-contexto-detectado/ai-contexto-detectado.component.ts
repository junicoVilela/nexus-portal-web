import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { ButtonComponent } from '@shared/ui';

/** Campos que a triagem extrai do briefing e que o autor pode corrigir antes de gerar. */
const CAMPOS = [
  { id: 'titulo', label: 'Título' },
  { id: 'codigoTela', label: 'Código da tela' },
  { id: 'publico', label: 'Público' },
] as const;

/**
 * Mostra o que a triagem entendeu do briefing ("Detectei: …") e deixa o autor corrigir.
 * A correção vira respostas da sessão, que prevalecem sobre o que foi extraído do texto.
 */
@Component({
  selector: 'app-ai-contexto-detectado',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './ai-contexto-detectado.component.html',
  styleUrl: './ai-contexto-detectado.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiContextoDetectadoComponent {
  readonly contexto = input.required<Record<string, string>>();
  readonly loading = input(false);
  readonly disabled = input(false);

  readonly corrigir = output<Record<string, string>>();

  protected readonly editando = signal(false);
  protected readonly rascunho = signal<Partial<Record<string, string>>>({});

  protected readonly itens = computed(() =>
    CAMPOS.map(campo => ({ ...campo, valor: this.contexto()[campo.id]?.trim() ?? '' })),
  );

  protected readonly temAlgo = computed(() => this.itens().some(item => item.valor));

  protected iniciarEdicao(): void {
    this.rascunho.set(Object.fromEntries(this.itens().map(item => [item.id, item.valor])));
    this.editando.set(true);
  }

  protected setValor(id: string, valor: string): void {
    this.rascunho.update(atual => ({ ...atual, [id]: valor }));
  }

  protected salvar(): void {
    const alterados = Object.fromEntries(
      Object.entries(this.rascunho())
        .map(([id, valor]) => [id, (valor ?? '').trim()] as const)
        .filter(([id, valor]) => valor && valor !== (this.contexto()[id]?.trim() ?? '')),
    );
    this.editando.set(false);
    if (Object.keys(alterados).length) this.corrigir.emit(alterados);
  }

  protected cancelar(): void {
    this.editando.set(false);
  }
}
