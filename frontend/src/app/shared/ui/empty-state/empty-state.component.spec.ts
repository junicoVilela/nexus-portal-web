import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LucideAngularModule, Inbox } from 'lucide-angular';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
      providers: [importProvidersFrom(LucideAngularModule.pick({ Inbox }))],
    }).compileComponents();
    fixture = TestBed.createComponent(EmptyStateComponent);
  });
  it('renders title and description', () => {
    fixture.componentRef.setInput('title', 'Sem registros');
    fixture.componentRef.setInput('description', 'Crie o primeiro agora');
    fixture.detectChanges();
    const t = fixture.nativeElement.textContent;
    expect(t).toContain('Sem registros');
    expect(t).toContain('Crie o primeiro agora');
  });
});
