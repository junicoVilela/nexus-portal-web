import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AiMetricas } from '../../models/ai-metricas.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { AiQualidadeComponent } from './ai-qualidade.component';

describe('AiQualidadeComponent', () => {
  let fixture: ComponentFixture<AiQualidadeComponent>;
  let ai: jasmine.SpyObj<AiAssistenteService>;

  const metricas: AiMetricas = {
    periodoDias: 30,
    desde: '2026-09-03T00:00:00Z',
    geracao: {
      jobs: 12,
      sucesso: 10,
      erro: 2,
      cancelados: 0,
      latenciaP50Ms: 8_400,
      latenciaP90Ms: 21_000,
      tokensEntrada: 9_000,
      tokensSaida: 3_000,
    },
    porPrompt: [
      {
        promptVersao: 'gerar-page-spec@2.2',
        propostas: 6,
        aceitas: 3,
        rejeitadas: 1,
        regeneradas: 2,
        pendentes: 0,
        comAvisos: 1,
        taxaAceite: 0.5,
        textoMantido: 0.8,
        amostrasTextoMantido: 3,
        rejeicoesPorCategoria: { FALTOU_INFORMACAO: 1 },
      },
      {
        promptVersao: 'ajustar-pagina@1.1',
        propostas: 4,
        aceitas: 3,
        rejeitadas: 1,
        regeneradas: 0,
        pendentes: 0,
        comAvisos: 0,
        taxaAceite: 0.75,
        textoMantido: 0.8,
        amostrasTextoMantido: 3,
        rejeicoesPorCategoria: { FALTOU_INFORMACAO: 1 },
      },
    ],
    ajustes: {
      aplicados: 3,
      operacoesPropostas: 10,
      operacoesAceitas: 7,
      taxaAceiteOperacoes: 0.7,
      porTipo: [
        { tipo: 'ALTERAR_TEXTO', propostas: 8, aceitas: 7 },
        { tipo: 'INSERIR_BLOCO', propostas: 0, aceitas: 0 },
        { tipo: 'REMOVER_UNIDADE', propostas: 2, aceitas: 0 },
      ],
    },
    avisosFrequentes: [{ aviso: 'A IA devolveu uma resposta inválida.', ocorrencias: 3 }],
    rejeicoesRecentes: [
      {
        categoria: 'FALTOU_INFORMACAO',
        motivo: 'Texto genérico demais',
        promptVersao: 'gerar-page-spec@2.2',
        em: '2026-10-01T12:00:00Z',
      },
    ],
    rejeicoesPorCategoria: [
      { categoria: 'CONTEUDO_INCORRETO', rotulo: 'Conteúdo incorreto ou inventado', total: 0 },
      { categoria: 'FALTOU_INFORMACAO', rotulo: 'Faltou informação', total: 2 },
      { categoria: 'LINGUAGEM', rotulo: 'Tom ou linguagem', total: 1 },
    ],
    alteracoesPosAceite: {
      amostras: 4,
      tituloAlterado: 1,
      resumoAlterado: 2,
      codigoTelaAlterado: 0,
      conteudoReescrito: 1,
    },
  };

  beforeEach(async () => {
    ai = jasmine.createSpyObj<AiAssistenteService>('AiAssistenteService', ['metricas']);
    ai.metricas.and.returnValue(of(metricas));
    await TestBed.configureTestingModule({
      imports: [AiQualidadeComponent],
      providers: [lucideTestIcons, { provide: AiAssistenteService, useValue: ai }],
    }).compileComponents();
    fixture = TestBed.createComponent(AiQualidadeComponent);
    fixture.detectChanges();
  });

  it('carrega 30 dias e mostra o aceite geral pela mesma regra do back', () => {
    expect(ai.metricas).toHaveBeenCalledWith(30);
    // (3 + 3) / (3+1+2 + 3+1+0) = 6/10
    expect(fixture.componentInstance['taxaAceiteGeral']()).toBe(0.6);
    expect(fixture.nativeElement.textContent).toContain('60%');
  });

  it('lista cada versão de prompt com sua taxa de aceite', () => {
    const linhas = Array.from(
      fixture.nativeElement.querySelectorAll('.aq__tabela tbody tr'),
    ) as HTMLElement[];
    expect(linhas.length).toBe(2);
    expect(linhas[0].textContent).toContain('gerar-page-spec@2.2');
    expect(linhas[0].textContent).toContain('50%');
    expect(linhas[1].textContent).toContain('75%');
    expect(linhas[0].textContent).toContain('80%');
  });

  it('mostra só os tipos de mudança que tiveram propostas', () => {
    const texto = fixture.nativeElement.querySelector('.aq__barras')?.textContent ?? '';
    expect(texto).toContain('Alterar texto');
    expect(texto).toContain('Remover trecho');
    expect(texto).not.toContain('Inserir bloco');
  });

  it('mostra as rejeições por categoria e a categoria nas recentes', () => {
    const secao = fixture.nativeElement.querySelector('[aria-labelledby="aq-categorias"]') as HTMLElement;
    expect(secao.textContent).toContain('Faltou informação');
    const larguras = Array.from(secao.querySelectorAll('.aq__barra i')).map(
      i => (i as HTMLElement).style.width,
    );
    expect(larguras).toEqual(['0%', '100%', '50%']);
    const recentes = fixture.nativeElement.querySelector('[aria-labelledby="aq-rejeicoes"]') as HTMLElement;
    expect(recentes.textContent).toContain('Faltou informação');
    expect(recentes.textContent).toContain('Texto genérico demais');
  });

  it('mostra o que os autores mudaram depois do aceite', () => {
    const secao = fixture.nativeElement.querySelector('[aria-labelledby="aq-pos-aceite"]') as HTMLElement;
    expect(secao.textContent).toContain('4 na amostra');
    expect(secao.textContent).toContain('Resumo');
    expect(secao.textContent).toContain('50%');
  });

  it('compara a versão atual de cada prompt com a anterior', () => {
    fixture.componentInstance['metricas'].set({
      ...metricas,
      porPrompt: [
        { ...metricas.porPrompt[0], promptVersao: 'gerar-page-spec@2.3', taxaAceite: 0.62 },
        { ...metricas.porPrompt[0], promptVersao: 'gerar-page-spec@2.2', taxaAceite: 0.5 },
      ],
    });
    fixture.detectChanges();
    const secao = fixture.nativeElement.querySelector('[aria-labelledby="aq-versoes"]') as HTMLElement;
    expect(secao.textContent).toContain('gerar-page-spec@2.3');
    expect(secao.textContent).toContain('vs gerar-page-spec@2.2');
    expect(secao.textContent).toContain('+12 p.p.');
    expect(secao.textContent).toContain('Faltou informação');
    expect(secao.textContent).toContain('amostra pequena');
  });

  it('troca o período e recarrega', () => {
    const botao = Array.from(fixture.nativeElement.querySelectorAll('.aq__periodo-btn')).find(b =>
      (b as HTMLElement).textContent?.includes('7 dias'),
    ) as HTMLButtonElement;
    botao.click();
    expect(ai.metricas).toHaveBeenCalledWith(7);
  });

  it('mostra estado vazio sem uso no período', () => {
    ai.metricas.and.returnValue(
      of({ ...metricas, geracao: { ...metricas.geracao, jobs: 0 }, porPrompt: [] }),
    );
    fixture.componentInstance['selecionarPeriodo'](90);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sem uso da IA no período');
  });

  it('mostra o erro quando a API falha', () => {
    ai.metricas.and.returnValue(throwError(() => new Error('falha')));
    fixture.componentInstance['selecionarPeriodo'](7);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.aq__erro')).toBeTruthy();
  });
});
