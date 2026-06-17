import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SwitchComponent } from './switch.component';

@Component({
  standalone: true,
  imports: [SwitchComponent, ReactiveFormsModule],
  template: `<ui-switch label="Ativo" [formControl]="ctrl" />`,
})
class HostComponent {
  ctrl = new FormControl(false);
}

describe('SwitchComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders label', () => {
    expect(fixture.nativeElement.textContent).toContain('Ativo');
  });

  it('toggles FormControl value on click', () => {
    const cb: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    cb.click();
    expect(fixture.componentInstance.ctrl.value).toBe(true);
    cb.click();
    expect(fixture.componentInstance.ctrl.value).toBe(false);
  });
});
