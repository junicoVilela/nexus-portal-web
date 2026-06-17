import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { BulkActionBarComponent } from './bulk-action-bar.component';

@Component({
  standalone: true,
  imports: [BulkActionBarComponent],
  template: `<ui-bulk-action-bar
    [count]="count"
    [labelSingular]="singular"
    [labelPlural]="plural"
    (limpar)="limpou = limpou + 1"
  >
    <button class="custom-action">Ação</button>
  </ui-bulk-action-bar>`,
})
class HostComponent {
  count = 3;
  singular = 'item';
  plural = 'itens';
  limpou = 0;
}

describe('BulkActionBarComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('não renderiza quando count = 0', () => {
    fixture.componentInstance.count = 0;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ui-bulk')).toBeNull();
  });

  it('renderiza quando count > 0', () => {
    expect(fixture.nativeElement.querySelector('.ui-bulk')).toBeTruthy();
  });

  it('usa label plural quando count > 1', () => {
    expect(fixture.nativeElement.textContent).toContain('3 itens');
  });

  it('usa label singular quando count = 1', () => {
    fixture.componentInstance.count = 1;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1 item');
    expect(fixture.nativeElement.textContent).not.toContain('1 itens');
  });

  it('projeta ações via ng-content', () => {
    expect(fixture.nativeElement.querySelector('.custom-action')).toBeTruthy();
  });

  it('emite limpar ao clicar no botão', () => {
    const botaoLimpar = fixture.nativeElement.querySelector('ui-button:last-child button');
    botaoLimpar.click();
    expect(fixture.componentInstance.limpou).toBe(1);
  });
});
