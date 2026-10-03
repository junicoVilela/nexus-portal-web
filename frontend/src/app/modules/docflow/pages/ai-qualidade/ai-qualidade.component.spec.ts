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
      { motivo: 'Texto genérico demais', promptVersao: 'gerar-page-spec@2.2', em: '2026-10-01T12:00:00Z' },
    ],
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
  });

  it('mostra só os tipos de mudança que tiveram propostas', () => {
    const texto = fixture.nativeElement.querySelector('.aq__barras')?.textContent ?? '';
    expect(texto).toContain('Alterar texto');
    expect(texto).toContain('Remover trecho');
    expect(texto).not.toContain('Inserir bloco');
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
