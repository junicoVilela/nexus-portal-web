import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { InputComponent } from './input.component';

@Component({
  standalone: true,
  imports: [InputComponent, ReactiveFormsModule],
  template: `<ui-input label="Email" [formControl]="ctrl" />`,
})
class HostComponent {
  ctrl = new FormControl('');
}

describe('InputComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the label', () => {
    expect(fixture.nativeElement.querySelector('label').textContent).toContain('Email');
  });

  it('two-way binds with FormControl', () => {
    const inp: HTMLInputElement = fixture.nativeElement.querySelector('input');
    inp.value = 'a@b.com';
    inp.dispatchEvent(new Event('input'));
    expect(host.ctrl.value).toBe('a@b.com');
  });
});
