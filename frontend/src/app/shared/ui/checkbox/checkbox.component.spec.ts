import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CheckboxComponent } from './checkbox.component';

@Component({
  standalone: true,
  imports: [CheckboxComponent, ReactiveFormsModule],
  template: `<ui-checkbox label="Aceitar" [formControl]="ctrl" />`,
})
class HostComponent {
  ctrl = new FormControl(false);
}

describe('CheckboxComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });
  it('renders label', () => {
    expect(fixture.nativeElement.textContent).toContain('Aceitar');
  });
  it('toggles FormControl on click', () => {
    const cb: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    cb.click();
    expect(fixture.componentInstance.ctrl.value).toBe(true);
  });
});
