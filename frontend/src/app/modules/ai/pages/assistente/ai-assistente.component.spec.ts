import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AiAssistenteService } from '../../services/ai-assistente.service';
import { AiFeatureService } from '../../services/ai-feature.service';
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
    ]);
    ai.eventosAi.and.returnValue(of());

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
          perguntas: [
            { id: 'q1', texto: 'Público?', opcoes: [], obrigatoria: true },
          ],
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
    cmp['form'].setValue({ briefing: 'x'.repeat(50) });
    cmp['iniciar']();

    expect(ai.criarSessao).toHaveBeenCalled();
    expect(cmp['passoAtual']()).toBe('chat');
  });
});
