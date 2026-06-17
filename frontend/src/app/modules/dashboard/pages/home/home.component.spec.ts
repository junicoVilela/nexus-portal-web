import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, FileText, Tag, ArrowRight, Shield, User, Settings } from 'lucide-angular';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        importProvidersFrom(LucideAngularModule.pick({ FileText, Tag, ArrowRight, Shield, User, Settings })),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });

  it('renders the time-of-day greeting', () => {
    const text = fixture.nativeElement.textContent;
    expect(/Bom dia|Boa tarde|Boa noite|Boa madrugada/.test(text)).toBeTrue();
  });

  it('renders all registered modules', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Doc Flow');
    expect(text).toContain('Release Orchestrator');
  });

  it('renders the KPI strip with all 4 labels', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Releases / mês');
    expect(text).toContain('Manuais ativos');
    expect(text).toContain('Usuários ativos');
    expect(text).toContain('Incidentes 24h');
  });
});
