import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LucideAngularModule, Search } from 'lucide-angular';
import { CommandPaletteComponent } from './command-palette.component';
import { CommandPaletteService } from './command-palette.service';

describe('CommandPaletteComponent', () => {
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let svc: CommandPaletteService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandPaletteComponent],
      providers: [provideRouter([]), importProvidersFrom(LucideAngularModule.pick({ Search }))],
    }).compileComponents();
    fixture = TestBed.createComponent(CommandPaletteComponent);
    svc = TestBed.inject(CommandPaletteService);
    fixture.detectChanges();
  });

  it('does not render the modal when closed', () => {
    expect(fixture.nativeElement.querySelector('.ui-palette')).toBeNull();
  });

  it('renders commands when open', () => {
    svc.register([{ id: 'home', label: 'Início', group: 'Navegação', route: '/' }]);
    svc.open();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ui-palette')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Início');
  });

  it('closes on Escape key', () => {
    svc.open();
    fixture.detectChanges();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(svc.isOpen()).toBeFalse();
  });
});
