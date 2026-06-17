import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, ChevronRight } from 'lucide-angular';
import { BreadcrumbComponent, BreadcrumbItem } from './breadcrumb.component';

describe('BreadcrumbComponent', () => {
  let fixture: ComponentFixture<BreadcrumbComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent],
      providers: [provideRouter([]), importProvidersFrom(LucideAngularModule.pick({ ChevronRight }))],
    }).compileComponents();
    fixture = TestBed.createComponent(BreadcrumbComponent);
  });
  it('renders each item label', () => {
    const items: BreadcrumbItem[] = [{ label: 'Segurança', route: '/seguranca' }, { label: 'Usuários' }];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Segurança');
    expect(text).toContain('Usuários');
  });
});
