import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { KpiCardComponent, KpiTone } from './kpi-card.component';

@Component({
  standalone: true,
  imports: [KpiCardComponent],
  template: `<ui-kpi-card [label]="label" [valor]="valor" [icon]="icon" [tone]="tone" />`,
})
class HostComponent {
  label = 'Releases publicadas';
  valor: number | string = 42;
  icon: string | null = 'CheckCircle';
  tone: KpiTone = 'green';
}

describe('KpiCardComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renderiza label e valor', () => {
    expect(fixture.nativeElement.textContent).toContain('Releases publicadas');
    expect(fixture.nativeElement.textContent).toContain('42');
  });

  it('aplica classe de tone via CSS', () => {
    const root = fixture.nativeElement.querySelector('.ui-kpi');
    expect(root.classList.contains('ui-kpi--green')).toBe(true);
  });

  it('exibe ícone quando definido', () => {
    expect(fixture.nativeElement.querySelector('.ui-kpi__icon')).toBeTruthy();
  });

  it('oculta ícone quando null', () => {
    fixture.componentInstance.icon = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ui-kpi__icon')).toBeNull();
  });

  it('aceita valor string', () => {
    fixture.componentInstance.valor = '1.2k';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1.2k');
  });
});
