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
    expect(fixture.nativeElement.querySelector('.ui-more-actions__menu')).toBeTruthy();
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
