import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AiAplicacao, AiJob, AiProposta } from '../../models/ai-proposta.model';
import { AiSessao } from '../../models/ai-sessao.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { AiAjustePainelComponent } from './ai-ajuste-painel.component';

describe('AiAjustePainelComponent', () => {
  let fixture: ComponentFixture<AiAjustePainelComponent>;
  let ai: jasmine.SpyObj<AiAssistenteService>;

  const html = '<h2>Pré-requisitos</h2><p>Perfil operador.</p><h2>Passo a passo</h2><p>Filtre.</p>';
  const job = { id: 'j1', sessaoId: 's1', status: 'PENDENTE', etapa: 'AGUARDANDO', progresso: 0 } as AiJob;
  const proposta = {
    id: 'p1',
    status: 'PENDENTE',
    conteudoHtml: '<p>novo</p>',
    resumoDaMudanca: 'Pré-requisitos revisados.',
    avisosGeracao: [],
    operacoes: [
      {
        id: 'op1',
        tipo: 'ALTERAR_TEXTO',
        unidadeId: 'u2',
        textoAntes: 'Perfil operador.',
        novoTexto: 'Perfil gestor.',
        aposSecaoId: null,
        componenteId: null,
        textos: {},
        motivo: 'pedido',
      },
      {
        id: 'op2',
        tipo: 'REMOVER_UNIDADE',
        unidadeId: 'u4',
        textoAntes: 'Filtre.',
        novoTexto: null,
        aposSecaoId: null,
        componenteId: null,
        textos: {},
        motivo: 'duplicado',
      },
    ],
  } as unknown as AiProposta;

  beforeEach(async () => {
    ai = jasmine.createSpyObj<AiAssistenteService>('AiAssistenteService', [
      'pedirAjuste',
      'eventosAi',
      'buscarSessao',
      'proposta',
      'aplicar',
      'rejeitarProposta',
      'gerar',
    ]);
    ai.pedirAjuste.and.returnValue(of({ sessaoId: 's1', job }));
    ai.eventosAi.and.returnValue(NEVER);
    ai.buscarSessao.and.returnValue(
      of({ id: 's1', status: 'PRONTA', mensagens: [], jobAtual: job } as unknown as AiSessao),
    );
    ai.proposta.and.returnValue(of(proposta));
    await TestBed.configureTestingModule({
      imports: [AiAjustePainelComponent],
      providers: [lucideTestIcons, { provide: AiAssistenteService, useValue: ai }],
    }).compileComponents();
    fixture = TestBed.createComponent(AiAjustePainelComponent);
    fixture.componentRef.setInput('paginaId', 'pag-1');
    fixture.componentRef.setInput('version', 7);
    fixture.componentRef.setInput('html', html);
    fixture.detectChanges();
  });

  function pedir(instrucao = 'Reescreva para o perfil gestor.', secao = 's1'): void {
    const cmp = fixture.componentInstance;
    cmp['instrucao'].set(instrucao);
    cmp['secaoId'].set(secao);
    cmp['pedir']();
    tick();
    fixture.detectChanges();
  }

  it('com sessão inicial (fila de PR) abre direto na revisão', () => {
    const outro = TestBed.createComponent(AiAjustePainelComponent);
    outro.componentRef.setInput('paginaId', 'pag-1');
    outro.componentRef.setInput('version', 3);
    outro.componentRef.setInput('html', html);
    outro.componentRef.setInput('sessaoInicial', 's9');
    outro.detectChanges();

    expect(ai.buscarSessao).toHaveBeenCalledWith('s9');
    expect(ai.proposta).toHaveBeenCalledWith('s9');
    expect(outro.componentInstance['etapa']()).toBe('revisao');
    expect(outro.componentInstance['selecionadas']()).toEqual(new Set(['op1']));
  });

  it('oferece as mesmas seções do editor como escopo', () => {
    const opcoes = Array.from(
      fixture.nativeElement.querySelectorAll('#ajuste-escopo option'),
    ) as HTMLOptionElement[];
    expect(opcoes.map(o => o.value)).toEqual(['', 's1', 's2']);
    expect(opcoes[1].textContent).toContain('Pré-requisitos');
  });

  it('pede o ajuste na versão aberta e deixa remoções desmarcadas', fakeAsync(() => {
    pedir();

    expect(ai.pedirAjuste).toHaveBeenCalledWith('pag-1', {
      instrucao: 'Reescreva para o perfil gestor.',
      secaoId: 's1',
      version: 7,
    });
    const cmp = fixture.componentInstance;
    expect(cmp['etapa']()).toBe('revisao');
    expect([...cmp['selecionadas']()]).toEqual(['op1']);
    expect(fixture.nativeElement.textContent).toContain('Aplicar 1 de 2 no editor');
  }));

  it('aplica só as mudanças selecionadas e entrega o resultado ao editor', fakeAsync(() => {
    const aplicacao = { conteudoHtml: '<p>novo</p>', titulo: 'T' } as AiAplicacao;
    ai.aplicar.and.returnValue(of(aplicacao));
    const emitido = jasmine.createSpy('aplicado');
    fixture.componentInstance.aplicado.subscribe(emitido);
    pedir();

    fixture.componentInstance['aplicar']();

    expect(ai.aplicar).toHaveBeenCalledWith('s1', { modo: 'FORM', operacoesAceitas: ['op1'] });
    expect(emitido).toHaveBeenCalledWith(aplicacao);
  }));

  it('página alterada desde a proposta oferece gerar de novo', fakeAsync(() => {
    ai.aplicar.and.returnValue(
      throwError(
        () => new HttpErrorResponse({ status: 409, error: { message: 'A página mudou desde a proposta.' } }),
      ),
    );
    pedir();

    fixture.componentInstance['aplicar']();
    fixture.detectChanges();

    expect(fixture.componentInstance['versaoObsoleta']()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Gerar de novo');
  }));

  it('instrução curta não habilita o pedido', () => {
    fixture.componentInstance['instrucao'].set('curto');
    expect(fixture.componentInstance['podePedir']()).toBeFalse();
  });
});
