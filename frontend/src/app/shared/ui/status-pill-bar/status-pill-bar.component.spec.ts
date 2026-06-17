import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { StatusPillBarComponent, StatusPillItem } from './status-pill-bar.component';

type Status = 'A' | 'B' | 'C';

@Component({
  standalone: true,
  imports: [StatusPillBarComponent],
  template: `<ui-status-pill-bar
    [items]="items"
    [value]="value"
    [todosLabel]="todosLabel"
    [todosCount]="todosCount"
    (selecionar)="selecionado = $event"
  />`,
})
class HostComponent {
  items: StatusPillItem<Status>[] = [
    { value: 'A', label: 'Aberto', count: 5 },
    { value: 'B', label: 'Em andamento', count: 3 },
    { value: 'C', label: 'Fechado', count: 12 },
  ];
  value: Status | '' = '';
  todosLabel = 'Todos';
  todosCount: number | null = 20;
  selecionado: Status | '' | null = null;
}

describe('StatusPillBarComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renderiza pills para todos os items + botão "Todos"', () => {
    const pills = fixture.nativeElement.querySelectorAll('.ui-spb__pill');
    expect(pills.length).toBe(4);
  });

  it('mostra label e count', () => {
    const txt = fixture.nativeElement.textContent;
    expect(txt).toContain('Aberto');
    expect(txt).toContain('5');
    expect(txt).toContain('Todos');
    expect(txt).toContain('20');
  });

  it('marca "Todos" ativo quando value = ""', () => {
    const ativo = fixture.nativeElement.querySelector('.ui-spb__pill--active');
    expect(ativo.textContent).toContain('Todos');
  });

  it('marca pill ativo conforme value', () => {
    fixture.componentInstance.value = 'B';
    fixture.detectChanges();
    const ativo = fixture.nativeElement.querySelector('.ui-spb__pill--active');
    expect(ativo.textContent).toContain('Em andamento');
  });

  it('emite selecionar ao clicar em pill', () => {
    const pills = fixture.nativeElement.querySelectorAll('.ui-spb__pill');
    (pills[0] as HTMLButtonElement).click();
    expect(fixture.componentInstance.selecionado).toBe('A');
  });

  it('emite "" ao clicar em "Todos"', () => {
    const pills = fixture.nativeElement.querySelectorAll('.ui-spb__pill');
    (pills[3] as HTMLButtonElement).click();
    expect(fixture.componentInstance.selecionado).toBe('');
  });

  it('oculta count quando undefined no item', () => {
    fixture.componentInstance.items = [{ value: 'A', label: 'Sem' }];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('span').length).toBe(1); // só do "Todos"
  });
});
