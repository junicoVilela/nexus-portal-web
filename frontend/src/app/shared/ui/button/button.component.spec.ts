import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let fixture: ComponentFixture<ButtonComponent>;
  let component: ButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ButtonComponent] }).compileComponents();
    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
  });

  it('renders a button with primary variant by default', () => {
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
    expect(btn.classList.contains('ui-btn--primary')).toBeTrue();
    expect(btn.classList.contains('ui-btn--md')).toBeTrue();
  });

  it('applies the requested variant and size', () => {
    fixture.componentRef.setInput('variant', 'danger');
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.classList.contains('ui-btn--danger')).toBeTrue();
    expect(btn.classList.contains('ui-btn--sm')).toBeTrue();
  });

  it('applies menu, danger-soft and neutral variants', () => {
    fixture.componentRef.setInput('variant', 'menu');
    fixture.detectChanges();
    let btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.classList.contains('ui-btn--menu')).toBeTrue();

    fixture.componentRef.setInput('variant', 'danger-soft');
    fixture.detectChanges();
    btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList.contains('ui-btn--danger-soft')).toBeTrue();

    fixture.componentRef.setInput('variant', 'amber');
    fixture.detectChanges();
    btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList.contains('ui-btn--amber')).toBeTrue();

    fixture.componentRef.setInput('variant', 'neutral');
    fixture.detectChanges();
    btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList.contains('ui-btn--neutral')).toBeTrue();
  });

  it('disables button and suppresses click when loading', () => {
    let clicks = 0;
    component.clicked.subscribe(() => clicks++);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBeTrue();
    btn.click();
    expect(clicks).toBe(0);
  });

  it('emits clicked when enabled', () => {
    let clicks = 0;
    component.clicked.subscribe(() => clicks++);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    btn.click();
    expect(clicks).toBe(1);
  });
});
