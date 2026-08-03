import { ComponentFixture, TestBed } from '@angular/core/testing';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AiProposta } from '../../models/ai-proposta.model';
import { AiPropostaPreviewComponent } from './ai-proposta-preview.component';

describe('AiPropostaPreviewComponent', () => {
  let fixture: ComponentFixture<AiPropostaPreviewComponent>;

  const proposta: AiProposta = {
    id: 'p1',
    sessaoId: 's1',
    jobId: 'j1',
    tipo: 'NOVA',
    titulo: 'Consulta',
    slug: 'consulta',
    codigoTela: 'PED-001',
    resumo: 'Resumo',
    conteudoHtml: '<div class="df-doc-content"><h1>Consulta</h1></div>',
    templateId: null,
    templateVersao: null,
    aptoParaRevisao: false,
    qualidade: [
      {
        codigo: 'TITULO',
        titulo: 'Título',
        descricao: 'ok',
        ok: true,
        severidade: 'INFO',
      },
      {
        codigo: 'RESUMO',
        titulo: 'Resumo',
        descricao: 'curto',
        ok: false,
        severidade: 'WARN',
      },
    ],
    status: 'PENDENTE',
    paginaId: null,
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiPropostaPreviewComponent],
      providers: [lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(AiPropostaPreviewComponent);
    fixture.componentRef.setInput('proposta', proposta);
    fixture.detectChanges();
  });

  it('renderiza preview e checklist', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Consulta');
    expect(el.textContent).toContain('PED-001');
    expect(el.querySelectorAll('.ai-proposta__checklist li').length).toBe(2);
    expect(el.querySelector('.df-doc-content')).toBeTruthy();
  });

  it('emite aplicar', () => {
    const spy = jasmine.createSpy('aplicar');
    fixture.componentInstance.aplicar.subscribe(spy);
    const btn = Array.from(fixture.nativeElement.querySelectorAll('button')).find(b =>
      (b as HTMLElement).textContent?.includes('Aplicar'),
    ) as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalled();
  });
});
