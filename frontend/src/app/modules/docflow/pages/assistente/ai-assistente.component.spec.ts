import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AiAssistenteService } from '../../services/ai-assistente.service';
import { AiFeatureService } from '../../services/ai-feature.service';
import { PaginaService } from '../../services/pagina.service';
import { AiAssistenteComponent } from './ai-assistente.component';

describe('AiAssistenteComponent', () => {
  let fixture: ComponentFixture<AiAssistenteComponent>;
  let ai: jasmine.SpyObj<AiAssistenteService>;

  beforeEach(async () => {
    ai = jasmine.createSpyObj<AiAssistenteService>('AiAssistenteService', [
      'criarSessao',
      'enviarMensagem',
      'gerar',
      'proposta',
      'aplicar',
      'cancelarSessao',
      'buscarSessao',
      'eventosAi',
      'recomendarTemplate',
    ]);
    ai.eventosAi.and.returnValue(of());
    ai.recomendarTemplate.and.returnValue(of({ recomendado: null, candidatos: [], exigeConfirmacao: false }));

    await TestBed.configureTestingModule({
      imports: [AiAssistenteComponent],
      providers: [
        provideRouter([]),
        lucideTestIcons,
        { provide: AiAssistenteService, useValue: ai },
        {
          provide: AiFeatureService,
          useValue: {
            disponivel: signal(true),
            ready: signal(true),
            ensureLoaded: () => undefined,
          },
        },
        {
          provide: PaginaService,
          useValue: {
            templatesPagina: () =>
              of([
                {
                  id: 't1',
                  codigo: 'FUNCIONALIDADE',
                  nome: 'Funcionalidade',
                  conteudoHtml: '<p/>',
                  ordem: 1,
                  ativo: true,
                },
              ]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiAssistenteComponent);
    fixture.detectChanges();
  });

  it('bloqueia avanço sem respostas obrigatórias', () => {
    const cmp = fixture.componentInstance;
    (cmp as unknown as { sessao: { set: (v: unknown) => void } }).sessao.set({
      id: 's1',
      objetivo: 'CRIAR_PAGINA',
      status: 'AGUARDANDO_USUARIO',
      projetoId: null,
      moduloId: null,
      clienteId: null,
      paginaId: null,
      templateId: null,
      briefing: 'x'.repeat(50),
      mensagens: [
        {
          id: 'm1',
          papel: 'ASSISTENTE',
          conteudo: 'Perguntas',
          perguntas: [{ id: 'q1', texto: 'Público?', opcoes: [], obrigatoria: true }],
          ordem: 1,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    fixture.detectChanges();

    cmp['enviarRespostas']();
    expect(cmp['erro']()).toContain('Responda');
    expect(ai.enviarMensagem).not.toHaveBeenCalled();
  });

  it('inicia sessão com briefing válido', () => {
    ai.criarSessao.and.returnValue(
      of({
        id: 's1',
        objetivo: 'CRIAR_PAGINA',
        status: 'PRONTA_PARA_GERAR',
        projetoId: null,
        moduloId: null,
        clienteId: null,
        paginaId: null,
        templateId: null,
        briefing: 'x'.repeat(50),
        mensagens: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );

    const cmp = fixture.componentInstance;
    cmp['form'].patchValue({ briefing: 'x'.repeat(50) });
    cmp['iniciar']();

    expect(ai.criarSessao).toHaveBeenCalled();
    expect(cmp['passoAtual']()).toBe('chat');
  });

  it('habilita o botão Continuar quando o briefing se torna válido', () => {
    const cmp = fixture.componentInstance;
    const botaoContinuar = (): HTMLButtonElement =>
      fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(botaoContinuar().disabled).toBeTrue();

    cmp['form'].controls.briefing.setValue('x'.repeat(50));
    fixture.detectChanges();

    expect(cmp['briefingValido']()).toBeTrue();
    expect(botaoContinuar().disabled).toBeFalse();
  });

  it('inclui nomes das imagens no briefing enviado', () => {
    ai.criarSessao.and.returnValue(
      of({
        id: 's1',
        objetivo: 'CRIAR_PAGINA',
        status: 'PRONTA_PARA_GERAR',
        projetoId: null,
        moduloId: null,
        clienteId: null,
        paginaId: null,
        templateId: null,
        briefing: 'x'.repeat(50),
        mensagens: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );

    const cmp = fixture.componentInstance;
    cmp['form'].patchValue({ briefing: 'x'.repeat(50) });
    const file = new File(['img'], 'captura-pedidos.png', { type: 'image/png' });
    cmp['setImagens']([
      {
        id: 'i1',
        file,
        nome: 'captura-pedidos.png',
        previewUrl: 'blob:test',
        tamanhoBytes: 3,
      },
    ]);
    cmp['iniciar']();

    const payload = ai.criarSessao.calls.mostRecent().args[0] as { briefing: string };
    expect(payload.briefing).toContain('captura-pedidos.png');
    expect(payload.briefing).toContain('Imagens anexadas');
  });

  it('envia templateId escolhido da biblioteca', () => {
    ai.criarSessao.and.returnValue(
      of({
        id: 's1',
        objetivo: 'CRIAR_PAGINA',
        status: 'PRONTA_PARA_GERAR',
        projetoId: null,
        moduloId: null,
        clienteId: null,
        paginaId: null,
        templateId: 't1',
        briefing: 'x'.repeat(50),
        mensagens: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );

    const cmp = fixture.componentInstance;
    cmp['form'].patchValue({ briefing: 'x'.repeat(50), templateId: 't1' });
    cmp['iniciar']();

    const payload = ai.criarSessao.calls.mostRecent().args[0] as { templateId?: string };
    expect(payload.templateId).toBe('t1');
  });

  it('pede confirmação quando a recomendação tem baixa confiança', fakeAsync(() => {
    ai.recomendarTemplate.and.returnValue(
      of({
        recomendado: {
          templateId: 't1',
          codigo: 'FUNCIONALIDADE',
          nome: 'Funcionalidade',
          descricao: null,
          confianca: 0.55,
          motivo: 'Texto ainda ambíguo.',
        },
        candidatos: [],
        exigeConfirmacao: true,
      }),
    );
    const cmp = fixture.componentInstance;
    cmp['form'].patchValue({ briefing: 'x'.repeat(50) });
    tick(450);

    expect(cmp['exigeConfirmacaoTemplate']()).toBeTrue();
    cmp['iniciar']();
    expect(ai.criarSessao).not.toHaveBeenCalled();
    expect(cmp['erro']()).toContain('Confirme');

    cmp['selecionarTemplateRecomendado']('t1');
    expect(cmp['exigeConfirmacaoTemplate']()).toBeFalse();
  }));
});
