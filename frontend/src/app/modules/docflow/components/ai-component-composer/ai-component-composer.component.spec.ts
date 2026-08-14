import { ComponentFixture, TestBed } from '@angular/core/testing';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AiTemplateRecomendacao } from '../../models/ai-template-recomendacao.model';
import { AiComponentComposerComponent } from './ai-component-composer.component';

describe('AiComponentComposerComponent', () => {
  let fixture: ComponentFixture<AiComponentComposerComponent>;

  const plano: AiTemplateRecomendacao = {
    recomendado: null,
    candidatos: [],
    exigeConfirmacao: false,
    blueprintId: 'consulta-operacional',
    blueprintNome: 'Consulta operacional',
    totalBiblioteca: 45,
    componentes: [
      componente('introducao', 'Introdução', true),
      componente('visao-tela', 'Visão da tela', true),
      componente('filtros-resultado', 'Filtros e resultados', false),
      componente('mensagens-sistema', 'Mensagens do sistema', false),
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiComponentComposerComponent],
      providers: [lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(AiComponentComposerComponent);
    fixture.componentRef.setInput('plano', plano);
    fixture.componentRef.setInput(
      'selecionados',
      plano.componentes.map(componente => componente.id),
    );
    fixture.detectChanges();
  });

  it('mostra apenas o plano curado dentro da biblioteca completa', () => {
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('4 blocos');
    expect(el.textContent).toContain('45 disponíveis');
    expect(el.querySelectorAll('.component-composer__item').length).toBe(4);
  });

  it('protege essencial e permite retirar componente contextual', () => {
    const emit = jasmine.createSpy('selecionadosChange');
    fixture.componentInstance.selecionadosChange.subscribe(emit);
    const botoes = fixture.nativeElement.querySelectorAll(
      '.component-composer__remove',
    ) as NodeListOf<HTMLButtonElement>;

    expect(botoes[0].disabled).toBeTrue();
    botoes[3].click();

    expect(emit).toHaveBeenCalledWith(['introducao', 'visao-tela', 'filtros-resultado']);
  });

  it('abre a biblioteca e adiciona somente o bloco escolhido', () => {
    fixture.componentRef.setInput('catalogo', [
      ...plano.componentes.map(item => bloco(item.id, item.nome)),
      bloco('resultado-esperado', 'Resultado esperado'),
    ]);
    fixture.detectChanges();
    const emit = jasmine.createSpy('selecionadosChange');
    fixture.componentInstance.selecionadosChange.subscribe(emit);

    (
      fixture.nativeElement.querySelector('.component-composer__explorer-toggle') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.component-composer__add') as HTMLButtonElement).click();

    expect(emit).toHaveBeenCalledWith([
      'introducao',
      'visao-tela',
      'filtros-resultado',
      'mensagens-sistema',
      'resultado-esperado',
    ]);
  });

  it('persiste a nova ordem ao arrastar um componente', () => {
    const emit = jasmine.createSpy('selecionadosChange');
    fixture.componentInstance.selecionadosChange.subscribe(emit);

    const reordenar = fixture.componentInstance['reordenar'] as unknown as (event: {
      previousIndex: number;
      currentIndex: number;
    }) => void;
    reordenar.call(fixture.componentInstance, {
      previousIndex: 3,
      currentIndex: 1,
    });

    expect(emit).toHaveBeenCalledWith(['introducao', 'mensagens-sistema', 'visao-tela', 'filtros-resultado']);
  });
});

function componente(id: string, nome: string, obrigatorio: boolean) {
  return {
    id,
    nome,
    descricao: nome,
    categoria: 'Estrutura',
    visual: 'intro',
    necessidade: obrigatorio ? ('OBRIGATORIA' as const) : ('CONTEXTUAL' as const),
    obrigatorio,
    motivo: obrigatorio ? 'Essencial para a página.' : 'Identificado no texto.',
  };
}

function bloco(id: string, nome: string) {
  return {
    id,
    nome,
    descricao: nome,
    categoria: 'Estrutura' as const,
    visual: 'intro',
    html: `<section>${nome}</section>`,
  };
}
