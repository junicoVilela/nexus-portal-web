import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AiAssistenteService } from '../../services/ai-assistente.service';
import { AiFeatureService } from '../../services/ai-feature.service';
import { PaginaBlueprintService } from '../../services/pagina-blueprint.service';
import { PaginaBlocoService } from '../../services/pagina-bloco.service';
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
      'importacoesEmAndamento',
      'importarDocumento',
      'buscarImportacao',
      'selecionarPaginaImportada',
    ]);
    ai.eventosAi.and.returnValue(of());
    ai.recomendarTemplate.and.returnValue(of(recomendacaoVazia()));
    ai.importacoesEmAndamento.and.returnValue(of([]));

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
          provide: PaginaBlueprintService,
          useValue: {
            listar: () =>
              of([
                {
                  id: 'funcionalidade-geral',
                  nome: 'Funcionalidade geral',
                  descricao: 'Estrutura para funcionalidade.',
                  tipoConteudo: 'FUNCIONALIDADE',
                  versao: 1,
                  status: 'PUBLICADO',
                  minimoComponentes: 3,
                  maximoComponentes: 7,
                  templatesCompativeis: ['FUNCIONALIDADE'],
                  secoes: [
                    {
                      slot: 'abertura',
                      componenteId: 'introducao',
                      necessidade: 'OBRIGATORIA',
                      repetivel: false,
                      maximoInstancias: 1,
                      alternativas: [],
                    },
                  ],
                },
              ]),
          },
        },
        {
          provide: PaginaBlocoService,
          useValue: { listar: () => of([]) },
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
      componentesSelecionados: [],
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
      jobAtual: null,
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
        componentesSelecionados: [],
        briefing: 'x'.repeat(50),
        mensagens: [],
        jobAtual: null,
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

  it('habilita o botão Analisar página quando o briefing se torna válido', () => {
    const cmp = fixture.componentInstance;
    const botaoContinuar = (): HTMLButtonElement =>
      fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(botaoContinuar().disabled).toBeTrue();

    cmp['form'].controls.briefing.setValue('x'.repeat(50));
    fixture.detectChanges();

    expect(cmp['briefingValido']()).toBeTrue();
    expect(botaoContinuar().disabled).toBeFalse();
  });

  it('preenche briefing e modelo com a página escolhida no documento', () => {
    const cmp = fixture.componentInstance;
    const briefing = '# Projeto\n## Módulo\n### Página\nTexto específico da página selecionada.';

    cmp['usarPaginaImportada']({
      importacaoId: 'importacao-1',
      moduloNome: 'Cadastros',
      moduloId: 'modulo-1',
      projetoId: 'projeto-1',
      clienteId: null,
      id: 'pagina-1',
      titulo: 'Inclusão',
      ordem: 1,
      briefing,
      templateId: 't1',
      templateCodigo: 'FUNCIONALIDADE',
      templateNome: 'Funcionalidade',
      confiancaTemplate: 0.9,
      motivoTemplate: 'Conteúdo compatível.',
      origem: 'DOCUMENTO',
      ajustadaManualmente: false,
      status: 'EM_EDICAO',
      paginaId: null,
      sessaoId: null,
      erroMensagem: null,
      componentesSelecionados: ['introducao', 'resultado-esperado', 'visao-tela'],
      componentesObrigatorios: ['introducao'],
      blueprintId: 'funcionalidade-geral',
      blueprintNome: 'Funcionalidade geral',
      composicaoAjustadaManualmente: true,
    });

    cmp['recomendacao'].aplicar({
      recomendado: null,
      candidatos: [],
      exigeConfirmacao: false,
      blueprintId: 'funcionalidade-geral',
      blueprintNome: 'Funcionalidade geral',
      totalBiblioteca: 45,
      componentes: [
        componenteCandidato('introducao', true),
        componenteCandidato('visao-tela', false),
        componenteCandidato('resultado-esperado', false),
      ],
    });

    expect(cmp['form'].controls.briefing.value).toBe(briefing);
    expect(cmp['form'].controls.templateId.value).toBe('t1');
    expect(cmp['componentesSelecionados']()).toEqual(['introducao', 'resultado-esperado', 'visao-tela']);
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
        componentesSelecionados: [],
        briefing: 'x'.repeat(50),
        mensagens: [],
        jobAtual: null,
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
        componentesSelecionados: [],
        briefing: 'x'.repeat(50),
        mensagens: [],
        jobAtual: null,
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

  it('envia somente os componentes aprovados pelo usuário', () => {
    ai.criarSessao.and.returnValue(of(criarSessaoTeste('PRONTA_PARA_GERAR')));
    const cmp = fixture.componentInstance;
    cmp['form'].patchValue({ briefing: 'x'.repeat(50) });
    cmp['recomendacao'].aplicar({
      recomendado: null,
      candidatos: [],
      exigeConfirmacao: false,
      blueprintId: 'consulta-operacional',
      blueprintNome: 'Consulta operacional',
      totalBiblioteca: 45,
      componentes: [
        componenteCandidato('introducao', true),
        componenteCandidato('visao-tela', true),
        componenteCandidato('filtros-resultado', false),
        componenteCandidato('mensagens-sistema', false),
      ],
    });
    cmp['atualizarComponentesSelecionados'](['introducao', 'visao-tela', 'filtros-resultado']);

    cmp['iniciar']();

    const payload = ai.criarSessao.calls.mostRecent().args[0];
    expect(payload.componentesSelecionados).toEqual(['introducao', 'visao-tela', 'filtros-resultado']);
  });

  it('explica o blueprint associado ao modelo escolhido', () => {
    const cmp = fixture.componentInstance;

    cmp['form'].patchValue({ templateId: 't1' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Funcionalidade geral');
    expect(fixture.nativeElement.textContent).toContain('componente-base');
  });

  it('continua acompanhando uma geração que ultrapassa trinta segundos', fakeAsync(() => {
    const cmp = fixture.componentInstance;
    const sessao = criarSessaoTeste('PRONTA_PARA_GERAR');
    cmp['sessao'].set(sessao);
    ai.gerar.and.returnValue(of(criarJobTeste(sessao.id)));
    ai.buscarSessao.and.returnValue(of({ ...sessao, status: 'GERANDO' }));
    ai.proposta.and.returnValue(of(criarPropostaTeste(sessao.id)));

    cmp['gerarRascunho']();
    tick(31_000);

    expect(cmp['erro']()).toBeNull();
    expect(cmp['gerando']()).toBeTrue();

    ai.buscarSessao.and.returnValue(of({ ...sessao, status: 'PRONTA' }));
    tick(1_000);

    expect(cmp['proposta']()?.id).toBe('p1');
    expect(cmp['gerando']()).toBeFalse();
  }));

  it('continua acompanhando sem impor timeout de cinco minutos no navegador', fakeAsync(() => {
    const cmp = fixture.componentInstance;
    const sessao = criarSessaoTeste('PRONTA_PARA_GERAR');
    cmp['sessao'].set(sessao);
    ai.gerar.and.returnValue(of(criarJobTeste(sessao.id)));
    ai.buscarSessao.and.returnValue(of({ ...sessao, status: 'GERANDO' }));

    cmp['gerarRascunho']();
    tick(301_000);

    expect(cmp['erro']()).toBeNull();
    expect(cmp['gerando']()).toBeTrue();
    expect(cmp['geracao'].demorada()).toBeTrue();
    cmp.ngOnDestroy();
  }));

  it('mantém o acompanhamento após falha transitória do polling', fakeAsync(() => {
    const cmp = fixture.componentInstance;
    const sessao = criarSessaoTeste('PRONTA_PARA_GERAR');
    cmp['sessao'].set(sessao);
    ai.gerar.and.returnValue(of(criarJobTeste(sessao.id)));
    ai.buscarSessao.and.returnValues(
      throwError(() => new Error('rede temporariamente indisponível')),
      of({ ...sessao, status: 'PRONTA' }),
      of({ ...sessao, status: 'PRONTA' }),
    );
    ai.proposta.and.returnValue(of(criarPropostaTeste(sessao.id)));

    cmp['gerarRascunho']();
    tick(3_000);

    expect(cmp['erro']()).toBeNull();
    expect(cmp['proposta']()?.id).toBe('p1');
  }));

  it('retoma uma geração em andamento com etapa e progresso persistidos', fakeAsync(() => {
    const cmp = fixture.componentInstance;
    const job = {
      ...criarJobTeste('s-geracao'),
      status: 'PROCESSANDO' as const,
      etapa: 'GERANDO_CONTEUDO' as const,
      progresso: 50,
      startedAt: new Date(Date.now() - 10_000).toISOString(),
    };
    const sessao = {
      ...criarSessaoTeste('GERANDO'),
      jobAtual: job,
    };
    ai.buscarSessao.and.returnValue(of(sessao));

    cmp['retomarSessao'](sessao.id);
    fixture.detectChanges();

    expect(cmp['gerando']()).toBeTrue();
    expect(cmp['geracao'].progresso()).toBe(50);
    expect(cmp['geracao'].etapa()).toContain('Gerando o conteúdo');
    expect(fixture.nativeElement.textContent).toContain('50%');
    cmp.ngOnDestroy();
  }));

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
        blueprintId: 'funcionalidade-geral',
        blueprintNome: 'Funcionalidade geral',
        totalBiblioteca: 45,
        componentes: [],
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

function criarSessaoTeste(status: 'PRONTA_PARA_GERAR' | 'GERANDO' | 'PRONTA') {
  return {
    id: 's-geracao',
    objetivo: 'CRIAR_PAGINA' as const,
    status,
    projetoId: null,
    moduloId: null,
    clienteId: null,
    paginaId: null,
    templateId: null,
    componentesSelecionados: [],
    briefing: 'Briefing suficientemente detalhado para gerar uma página.',
    mensagens: [],
    jobAtual: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function recomendacaoVazia() {
  return {
    recomendado: null,
    candidatos: [],
    exigeConfirmacao: false,
    blueprintId: null,
    blueprintNome: null,
    totalBiblioteca: 0,
    componentes: [],
  };
}

function componenteCandidato(id: string, obrigatorio: boolean) {
  return {
    id,
    nome: id,
    descricao: id,
    categoria: 'Estrutura',
    visual: 'intro',
    necessidade: obrigatorio ? ('OBRIGATORIA' as const) : ('CONTEXTUAL' as const),
    obrigatorio,
    motivo: 'Componente de teste.',
  };
}

function criarJobTeste(sessaoId: string) {
  return {
    id: 'j1',
    sessaoId,
    tipo: 'GERAR_RASCUNHO',
    status: 'PENDENTE' as const,
    etapa: 'AGUARDANDO' as const,
    progresso: 0,
    tentativa: 1,
    erroMensagem: null,
    diagnosticoId: null,
    modelo: null,
    tokensEntrada: null,
    tokensSaida: null,
    duracaoMs: 0,
    startedAt: null,
    finishedAt: null,
    heartbeatAt: null,
    cancelRequestedAt: null,
  };
}

function criarPropostaTeste(sessaoId: string) {
  return {
    id: 'p1',
    sessaoId,
    jobId: 'j1',
    tipo: 'NOVA' as const,
    titulo: 'Consulta de pedidos',
    slug: 'consulta-de-pedidos',
    codigoTela: 'PED-001',
    resumo: 'Consulte pedidos.',
    conteudoHtml: '<section>Consulta</section>',
    templateId: null,
    templateVersao: null,
    aptoParaRevisao: true,
    qualidade: [],
    status: 'PENDENTE' as const,
    paginaId: null,
    createdAt: new Date().toISOString(),
  };
}
