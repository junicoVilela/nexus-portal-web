import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  let fixture: ComponentFixture<AvatarComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AvatarComponent] }).compileComponents();
    fixture = TestBed.createComponent(AvatarComponent);
  });

  it('renders initials derived from name', () => {
    fixture.componentRef.setInput('name', 'Júnico Vilela');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('JV');
  });

  it('shows single initial when single-word name', () => {
    fixture.componentRef.setInput('name', 'Marina');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('M');
  });
});
