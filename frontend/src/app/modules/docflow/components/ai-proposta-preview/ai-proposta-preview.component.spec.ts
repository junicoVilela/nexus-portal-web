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
    pageSpecJson: JSON.stringify({
      schemaVersion: 1,
      blueprintId: 'consulta-operacional',
      blocos: [{ componenteId: 'introducao' }, { componenteId: 'filtros-resultado' }],
    }),
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
    fixture.componentRef.setInput('componentesCatalogo', [
      {
        id: 'introducao',
        nome: 'Introdução',
        descricao: 'Abertura',
        categoria: 'Estrutura',
        visual: 'intro',
        html: '<section></section>',
      },
      {
        id: 'filtros-resultado',
        nome: 'Filtros e resultados',
        descricao: 'Consulta',
        categoria: 'Referência',
        visual: 'table',
        html: '<section></section>',
      },
    ]);
    fixture.detectChanges();
  });

  it('renderiza preview e checklist', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Consulta');
    expect(el.textContent).toContain('PED-001');
    expect(el.querySelectorAll('.ai-proposta__checklist li').length).toBe(2);
    expect(el.querySelector('.df-doc-content')).toBeTruthy();
    expect(el.querySelectorAll('.ai-proposta__composition li').length).toBe(2);
    expect(el.textContent).toContain('Filtros e resultados');
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

  function botao(texto: string): HTMLButtonElement {
    return Array.from(fixture.nativeElement.querySelectorAll('button')).find(b =>
      (b as HTMLElement).textContent?.includes(texto),
    ) as HTMLButtonElement;
  }

  it('regenera com a instrução digitada pelo autor', () => {
    const spy = jasmine.createSpy('regenerar');
    fixture.componentInstance.regenerar.subscribe(spy);
    const textarea = fixture.nativeElement.querySelector('#ai-proposta-instrucao') as HTMLTextAreaElement;
    textarea.value = '  Deixe mais curto  ';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    botao('Regenerar com ajuste').click();

    expect(spy).toHaveBeenCalledWith('Deixe mais curto');
  });

  it('regenerar sem instrução emite null', () => {
    const spy = jasmine.createSpy('regenerar');
    fixture.componentInstance.regenerar.subscribe(spy);
    botao('Regenerar').click();
    expect(spy).toHaveBeenCalledWith(null);
  });

  it('rejeita com categoria e motivo após confirmação', () => {
    const spy = jasmine.createSpy('rejeitar');
    fixture.componentInstance.rejeitar.subscribe(spy);
    botao('Rejeitar').click();
    fixture.detectChanges();
    const categoria = Array.from(fixture.nativeElement.querySelectorAll('.ai-proposta__categoria')).find(b =>
      (b as HTMLElement).textContent?.includes('Faltou informação'),
    ) as HTMLButtonElement;
    categoria.click();
    fixture.detectChanges();
    expect(categoria.getAttribute('aria-checked')).toBe('true');
    const motivo = fixture.nativeElement.querySelector('#ai-proposta-motivo') as HTMLTextAreaElement;
    motivo.value = 'Texto genérico';
    motivo.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    botao('Confirmar rejeição').click();

    expect(spy).toHaveBeenCalledWith({ categoria: 'FALTOU_INFORMACAO', motivo: 'Texto genérico' });
  });

  it('proposta rejeitada não pode ser aplicada e mostra o motivo', () => {
    fixture.componentRef.setInput('proposta', {
      ...proposta,
      status: 'REJEITADA',
      motivoRejeicao: 'Genérico',
      categoriaRejeicao: 'LINGUAGEM',
    });
    fixture.detectChanges();
    expect(botao('Aplicar no editor').disabled).toBeTrue();
    const aviso = fixture.nativeElement.querySelector('.ai-proposta__rejeitada')?.textContent;
    expect(aviso).toContain('Tom ou linguagem — Genérico');
    expect(botao('Rejeitar')?.textContent).not.toContain('Rejeitar proposta');
  });

  it('não mostra avisos quando a geração saiu completa', () => {
    expect(fixture.nativeElement.querySelector('.ai-proposta__avisos')).toBeNull();
  });

  it('destaca avisos quando a geração caiu em fallback', () => {
    fixture.componentRef.setInput('proposta', {
      ...proposta,
      avisosGeracao: ['A IA devolveu uma resposta inválida; os blocos usam textos padrão do modelo.'],
    });
    fixture.detectChanges();
    const avisos = fixture.nativeElement.querySelector('.ai-proposta__avisos') as HTMLElement;
    expect(avisos).toBeTruthy();
    expect(avisos.querySelectorAll('li').length).toBe(1);
    expect(avisos.textContent).toContain('resposta inválida');
  });
});
