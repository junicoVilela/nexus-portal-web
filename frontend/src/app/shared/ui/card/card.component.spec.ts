import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let fixture: ComponentFixture<CardComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CardComponent] }).compileComponents();
    fixture = TestBed.createComponent(CardComponent);
  });

  it('renders a non-interactive card by default', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('div.ui-card');
    expect(el).toBeTruthy();
    expect(el.classList.contains('ui-card--interactive')).toBeFalse();
  });

  it('adds interactive class when interactive=true', () => {
    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('div.ui-card').classList.contains('ui-card--interactive'),
    ).toBeTrue();
  });
});
