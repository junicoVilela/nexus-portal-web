import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TooltipDirective } from './tooltip.directive';

@Component({
  standalone: true,
  imports: [TooltipDirective],
  template: `<button [uiTooltip]="'Salvar'">Save</button>`,
})
class HostComponent {}

describe('TooltipDirective', () => {
  it('sets title attribute on host', async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('title')).toBe('Salvar');
    expect(btn.getAttribute('aria-label')).toBe('Salvar');
  });
});
