import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject, of } from 'rxjs';

import { AiJobEvento } from '../../models/ai-evento.model';
import { AiJob, AiProposta } from '../../models/ai-proposta.model';
import { AiSessao } from '../../models/ai-sessao.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { AiGeracaoAcompanhamento, AiGeracaoCallbacks } from './ai-geracao-acompanhamento';

describe('AiGeracaoAcompanhamento', () => {
  let ai: jasmine.SpyObj<AiAssistenteService>;
  let eventos: Subject<AiJobEvento>;
  let acompanhamento: AiGeracaoAcompanhamento;
  let callbacks: jasmine.SpyObj<AiGeracaoCallbacks>;

  const job = { id: 'j1', sessaoId: 's1', status: 'PENDENTE', etapa: 'AGUARDANDO', progresso: 0 } as AiJob;
  const sessao = (status: AiSessao['status'], jobAtual: Partial<AiJob> | null = job) =>
    ({ id: 's1', status, mensagens: [], jobAtual }) as unknown as AiSessao;
  const evento = (status: AiJobEvento['status'], extra: Partial<AiJobEvento> = {}) =>
    ({
      jobId: 'j1',
      sessaoId: 's1',
      status,
      etapa: 'GERANDO_CONTEUDO',
      progresso: 50,
      tentativa: 1,
      ...extra,
    }) as AiJobEvento;

  beforeEach(() => {
    eventos = new Subject<AiJobEvento>();
    ai = jasmine.createSpyObj<AiAssistenteService>('AiAssistenteService', [
      'gerar',
      'eventosAi',
      'buscarSessao',
      'proposta',
    ]);
    ai.gerar.and.returnValue(of(job));
    ai.eventosAi.and.returnValue(eventos);
    ai.buscarSessao.and.returnValue(of(sessao('GERANDO')));
    ai.proposta.and.returnValue(of({ id: 'p1' } as AiProposta));
    callbacks = jasmine.createSpyObj<AiGeracaoCallbacks>('callbacks', [
      'sessaoAtualizada',
      'concluida',
      'falhou',
    ]);
    TestBed.configureTestingModule({
      providers: [AiGeracaoAcompanhamento, { provide: AiAssistenteService, useValue: ai }],
    });
    acompanhamento = TestBed.inject(AiGeracaoAcompanhamento);
  });

  afterEach(() => acompanhamento.ngOnDestroy());

  it('atualiza etapa e progresso pelo SSE e conclui com a proposta', fakeAsync(() => {
    acompanhamento.gerar('s1', 'mais curto', callbacks);
    expect(ai.gerar).toHaveBeenCalledWith('s1', 'mais curto');
    expect(acompanhamento.gerando()).toBeTrue();

    eventos.next(evento('PROCESSANDO'));
    expect(acompanhamento.progresso()).toBe(50);
    expect(acompanhamento.etapa()).toContain('Gerando o conteúdo');

    eventos.next(evento('SUCESSO', { progresso: 100 }));
    expect(callbacks.concluida).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'p1' }));
    expect(acompanhamento.gerando()).toBeFalse();
    tick(10_000);
    expect(ai.proposta).toHaveBeenCalledTimes(1);
  }));

  it('SSE e polling juntos resolvem uma vez só', fakeAsync(() => {
    ai.buscarSessao.and.returnValue(of(sessao('PRONTA')));
    acompanhamento.gerar('s1', null, callbacks);
    eventos.next(evento('SUCESSO'));
    tick(5_000);
    expect(callbacks.concluida).toHaveBeenCalledTimes(1);
  }));

  it('falha do job informa a mensagem com o diagnóstico', fakeAsync(() => {
    ai.buscarSessao.and.returnValue(
      of(sessao('ERRO', { ...job, erroMensagem: 'Resposta da IA inválida.', diagnosticoId: 'd-42' })),
    );
    acompanhamento.gerar('s1', null, callbacks);
    tick();
    expect(callbacks.falhou).toHaveBeenCalledWith('Resposta da IA inválida. Diagnóstico: d-42.');
    expect(acompanhamento.gerando()).toBeFalse();
  }));

  it('cancelamento pelo SSE encerra sem concluir nem falhar', fakeAsync(() => {
    acompanhamento.gerar('s1', null, callbacks);
    eventos.next(evento('CANCELADO'));
    tick(10_000);
    expect(acompanhamento.gerando()).toBeFalse();
    expect(callbacks.concluida).not.toHaveBeenCalled();
    expect(callbacks.falhou).not.toHaveBeenCalled();
  }));

  it('ignora eventos de outras sessões', fakeAsync(() => {
    acompanhamento.gerar('s1', null, callbacks);
    eventos.next(evento('SUCESSO', { sessaoId: 'outra' }));
    expect(callbacks.concluida).not.toHaveBeenCalled();
    acompanhamento.resetar();
  }));

  it('resetar para o polling', fakeAsync(() => {
    acompanhamento.gerar('s1', null, callbacks);
    const chamadas = ai.buscarSessao.calls.count();
    acompanhamento.resetar();
    tick(30_000);
    expect(ai.buscarSessao.calls.count()).toBe(chamadas);
    expect(acompanhamento.job()).toBeNull();
  }));
});
