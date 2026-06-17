import { Component, importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronDown } from 'lucide-angular';
import { SelectComponent, SelectOption } from './select.component';

@Component({
  standalone: true,
  imports: [SelectComponent, ReactiveFormsModule],
  template: `<ui-select label="Função" [options]="opts" [formControl]="ctrl" />`,
})
class HostComponent {
  ctrl = new FormControl('EDITOR');
  opts: SelectOption[] = [
    { value: 'EDITOR', label: 'Editor' },
    { value: 'ADMIN', label: 'Administrador' },
  ];
}

describe('SelectComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [importProvidersFrom(LucideAngularModule.pick({ ChevronDown }))],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders label and option list', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Função');
    expect(text).toContain('Editor');
    expect(text).toContain('Administrador');
  });

  it('two-way binds with FormControl', () => {
    const sel: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    sel.value = 'ADMIN';
    sel.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.ctrl.value).toBe('ADMIN');
  });
});
