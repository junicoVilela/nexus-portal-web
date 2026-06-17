import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BadgeComponent] }).compileComponents();
    fixture = TestBed.createComponent(BadgeComponent);
  });

  it('renders with neutral tone by default', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('span');
    expect(el.classList.contains('ui-badge--neutral')).toBeTrue();
  });

  it('applies the requested tone', () => {
    fixture.componentRef.setInput('tone', 'success');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('span').classList.contains('ui-badge--success')).toBeTrue();
  });

  it('shows leading dot when dot=true', () => {
    fixture.componentRef.setInput('dot', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ui-badge__dot')).toBeTruthy();
  });
});
