import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, importProvidersFrom } from '@angular/core';
import { LucideAngularModule, AlertTriangle, Inbox, Lock, RotateCw, X } from 'lucide-angular';
import { ErrorStateComponent } from './error-state.component';

@Component({
  standalone: true,
  imports: [ErrorStateComponent],
  template: `
    <ui-error-state
      [variant]="variant"
      [title]="title"
      [description]="description"
      [showRetry]="showRetry"
      (retry)="retried = retried + 1"
    />
  `,
})
class HostComponent {
  variant: 'generic' | 'network' | 'permission' | 'notfound' | 'server' = 'generic';
  title: string | null = null;
  description: string | null = null;
  showRetry = true;
  retried = 0;
}

describe('ErrorStateComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [importProvidersFrom(LucideAngularModule.pick({ AlertTriangle, Inbox, Lock, RotateCw, X }))],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders the generic default title', () => {
    expect(fixture.nativeElement.textContent).toContain('Algo deu errado');
  });

  it('switches title/description based on variant', () => {
    fixture.componentInstance.variant = 'network';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sem conexão com o servidor');

    fixture.componentInstance.variant = 'permission';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sem permissão');

    fixture.componentInstance.variant = 'notfound';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Não encontrado');

    fixture.componentInstance.variant = 'server';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Erro no servidor');
  });

  it('overrides title and description when inputs are provided', () => {
    fixture.componentInstance.title = 'Customizado';
    fixture.componentInstance.description = 'Mensagem específica';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Customizado');
    expect(fixture.nativeElement.textContent).toContain('Mensagem específica');
  });

  it('emits retry when the retry button is clicked', () => {
    const btn = fixture.nativeElement.querySelector('button');
    btn?.click();
    expect(fixture.componentInstance.retried).toBe(1);
  });

  it('hides retry button when showRetry is false', () => {
    fixture.componentInstance.showRetry = false;
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn).toBeNull();
  });
});
