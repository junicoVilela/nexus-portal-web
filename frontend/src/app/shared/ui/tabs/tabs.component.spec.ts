import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, importProvidersFrom } from '@angular/core';
import { LucideAngularModule, List, Settings } from 'lucide-angular';
import { TabItem, TabsComponent } from './tabs.component';

@Component({
  standalone: true,
  imports: [TabsComponent],
  template: `<ui-tabs [items]="items" [active]="active" (activeChange)="changed = $event" />`,
})
class HostComponent {
  items: TabItem<'a' | 'b' | 'c'>[] = [
    { id: 'a', label: 'Aba A', icon: 'List' },
    { id: 'b', label: 'Aba B', count: 3 },
    { id: 'c', label: 'Aba C' },
  ];
  active: 'a' | 'b' | 'c' = 'a';
  changed: 'a' | 'b' | 'c' | null = null;
}

describe('TabsComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [importProvidersFrom(LucideAngularModule.pick({ List, Settings }))],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renderiza todas as abas com labels', () => {
    const botoes = Array.from(
      fixture.nativeElement.querySelectorAll('.ui-tabs__btn') as NodeListOf<HTMLButtonElement>,
    );
    const labels = botoes.map(b => b.textContent?.trim());
    expect(labels.length).toBe(3);
    expect(labels[0]).toContain('Aba A');
    expect(labels[1]).toContain('Aba B');
  });

  it('exibe count quando definido', () => {
    expect(fixture.nativeElement.textContent).toContain('3');
  });

  it('marca aba ativa com aria-selected=true', () => {
    const ativo = fixture.nativeElement.querySelector('.ui-tabs__btn--active');
    expect(ativo).toBeTruthy();
    expect(ativo.getAttribute('aria-selected')).toBe('true');
  });

  it('emite activeChange ao clicar em outra aba', () => {
    const botoes = fixture.nativeElement.querySelectorAll('.ui-tabs__btn');
    (botoes[1] as HTMLButtonElement).click();
    expect(fixture.componentInstance.changed).toBe('b');
  });

  it('não emite ao clicar na aba já ativa', () => {
    const botoes = fixture.nativeElement.querySelectorAll('.ui-tabs__btn');
    (botoes[0] as HTMLButtonElement).click();
    expect(fixture.componentInstance.changed).toBeNull();
  });
});
