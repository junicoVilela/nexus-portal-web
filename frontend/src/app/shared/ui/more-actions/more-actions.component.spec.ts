import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoreActionsComponent } from './more-actions.component';

@Component({
  standalone: true,
  imports: [MoreActionsComponent],
  template: `
    <ui-more-actions>
      <button type="button">Ação</button>
    </ui-more-actions>
  `,
})
class HostComponent {}

@Component({
  standalone: true,
  imports: [MoreActionsComponent],
  template: `
    <ui-more-actions [compact]="true" label="Mais ações">
      <button type="button">Ação</button>
    </ui-more-actions>
  `,
})
class CompactHostComponent {}

describe('MoreActionsComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('abre o menu e define aria-expanded', () => {
    const trigger = fixture.nativeElement.querySelector('.ui-more-actions__trigger') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const menu = fixture.nativeElement.querySelector('.ui-more-actions__menu') as HTMLElement;
    expect(menu.classList.contains('ui-more-actions__menu--open')).toBeTrue();
    expect(getComputedStyle(menu).position).toBe('fixed');
    expect(getComputedStyle(menu).display).toBe('grid');
  });

  it('posiciona o menu junto ao trigger ao abrir', () => {
    const host = fixture.nativeElement.querySelector('.ui-more-actions') as HTMLElement;
    host.style.position = 'fixed';
    host.style.top = '120px';
    host.style.left = '240px';
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.ui-more-actions__trigger') as HTMLButtonElement;
    const triggerRect = trigger.getBoundingClientRect();
    trigger.click();
    fixture.detectChanges();

    const menu = fixture.nativeElement.querySelector('.ui-more-actions__menu') as HTMLElement;
    const top = Number.parseFloat(menu.style.top);
    const left = Number.parseFloat(menu.style.left);
    expect(top).toBeCloseTo(triggerRect.bottom + 6, 0);
    expect(left + menu.offsetWidth).toBeCloseTo(triggerRect.right, 0);
    expect(menu.offsetWidth).toBeGreaterThanOrEqual(220);
  });

  it('fecha com Escape', () => {
    const trigger = fixture.nativeElement.querySelector('.ui-more-actions__trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('MoreActionsComponent compact', () => {
  it('renderiza trigger compacto com aria-label', async () => {
    await TestBed.configureTestingModule({ imports: [CompactHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CompactHostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.ui-more-actions__trigger') as HTMLButtonElement;
    expect(trigger.classList.contains('ui-more-actions__trigger--compact')).toBeTrue();
    expect(trigger.getAttribute('aria-label')).toBe('Mais ações');
    expect(fixture.nativeElement.querySelector('.ui-more-actions__dots')).toBeTruthy();
  });
});
