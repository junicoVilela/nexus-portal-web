import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, Search } from 'lucide-angular';
import { IconButtonComponent } from './icon-button.component';

describe('IconButtonComponent', () => {
  let fixture: ComponentFixture<IconButtonComponent>;
  let component: IconButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconButtonComponent],
      providers: [importProvidersFrom(LucideAngularModule.pick({ Search }))],
    }).compileComponents();
    fixture = TestBed.createComponent(IconButtonComponent);
    component = fixture.componentInstance;
  });

  it('renders a button with the requested icon and aria-label', () => {
    fixture.componentRef.setInput('icon', 'Search');
    fixture.componentRef.setInput('ariaLabel', 'Buscar');
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBe('Buscar');
  });

  it('emits clicked when not disabled', () => {
    let count = 0;
    component.clicked.subscribe(() => count++);
    fixture.componentRef.setInput('icon', 'Search');
    fixture.componentRef.setInput('ariaLabel', 'x');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(count).toBe(1);
  });
});
