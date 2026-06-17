import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { FilterPresetsComponent } from './filter-presets.component';
import type { FilterPreset } from '@shared/utils/filter-presets';

const ESCOPO = 'fp-spec-scope';

@Component({
  standalone: true,
  imports: [FilterPresetsComponent],
  template: `<ui-filter-presets
    [escopo]="escopo"
    [filtrosAtuais]="filtros"
    [filtrosAtivos]="ativos"
    (presetSelecionado)="selecionado = $event"
  />`,
})
class HostComponent {
  escopo = ESCOPO;
  filtros = { status: 'ATIVO' };
  ativos = 1;
  selecionado: FilterPreset<Record<string, unknown>> | null = null;
}

describe('FilterPresetsComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  afterAll(() => localStorage.clear());

  it('renderiza trigger "Presets"', () => {
    expect(fixture.nativeElement.textContent).toContain('Presets');
  });

  it('abre o menu ao clicar no trigger', () => {
    fixture.nativeElement.querySelector('.ui-fp__trigger').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ui-fp__menu')).toBeTruthy();
  });

  it('mostra mensagem vazia quando não há presets', () => {
    fixture.nativeElement.querySelector('.ui-fp__trigger').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sem presets');
  });

  it('mostra opção de salvar quando há filtros ativos', () => {
    fixture.nativeElement.querySelector('.ui-fp__trigger').click();
    fixture.detectChanges();
    const action = fixture.nativeElement.querySelector('.ui-fp__action');
    expect(action.textContent).toContain('Salvar atual');
    expect(action.textContent).toContain('(1 filtros)');
  });

  it('lista presets já salvos em localStorage', () => {
    localStorage.setItem(
      'filter-presets:' + ESCOPO,
      JSON.stringify([{ id: 'p1', nome: 'Meu preset', filtros: { status: 'ATIVO' }, criadoEm: Date.now() }]),
    );
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.ui-fp__trigger').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Meu preset');
  });
});
