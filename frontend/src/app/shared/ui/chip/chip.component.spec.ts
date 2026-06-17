import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LucideAngularModule, X } from 'lucide-angular';
import { ChipComponent } from './chip.component';

describe('ChipComponent', () => {
  let fixture: ComponentFixture<ChipComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChipComponent],
      providers: [importProvidersFrom(LucideAngularModule.pick({ X }))],
    }).compileComponents();
    fixture = TestBed.createComponent(ChipComponent);
  });
  it('renders with neutral tone by default', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ui-chip').classList.contains('ui-chip--neutral')).toBeTrue();
  });
  it('emits removed on click of remove button', () => {
    fixture.componentRef.setInput('removable', true);
    let removed = false;
    fixture.componentInstance.removed.subscribe(() => (removed = true));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.ui-chip__remove').click();
    expect(removed).toBeTrue();
  });
});
