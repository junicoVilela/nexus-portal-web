import { Component, importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LucideAngularModule, Inbox, AlertTriangle, Lock, RotateCw, X } from 'lucide-angular';
import { ListPageComponent } from './list-page.component';

@Component({
  standalone: true,
  imports: [ListPageComponent],
  template: `
    <ui-list-page title="Usuários" [loading]="loading" [isEmpty]="isEmpty" [error]="error">
      <span actions>Ação</span>
      <span filters>Filtros</span>
      <span>Conteúdo</span>
    </ui-list-page>
  `,
})
class HostComponent {
  loading = false;
  isEmpty = false;
  error: string | null = null;
}

describe('ListPageComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [importProvidersFrom(LucideAngularModule.pick({ Inbox, AlertTriangle, Lock, RotateCw, X }))],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders title and content slot in default state', () => {
    const t = fixture.nativeElement.textContent;
    expect(t).toContain('Usuários');
    expect(t).toContain('Conteúdo');
    expect(t).toContain('Filtros');
    expect(t).toContain('Ação');
  });

  it('hides content and shows loading skeleton when loading', () => {
    fixture.componentInstance.loading = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ui-list__loading')).toBeTruthy();
  });

  it('shows empty state when isEmpty', () => {
    fixture.componentInstance.isEmpty = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ui-empty-state')).toBeTruthy();
  });

  it('shows error message when error is set', () => {
    fixture.componentInstance.error = 'Falha ao carregar.';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Falha ao carregar.');
  });
});
