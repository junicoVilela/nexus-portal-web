import { TestBed } from '@angular/core/testing';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AiJob } from '../../models/ai-proposta.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { AiGeracaoAcompanhamento } from './ai-geracao-acompanhamento';
import { AiGeracaoStatusComponent } from './ai-geracao-status.component';

describe('AiGeracaoStatusComponent', () => {
  function montar(job: Partial<AiJob>, demorada = false) {
    TestBed.configureTestingModule({
      imports: [AiGeracaoStatusComponent],
      providers: [lucideTestIcons, AiGeracaoAcompanhamento, { provide: AiAssistenteService, useValue: {} }],
    });
    const geracao = TestBed.inject(AiGeracaoAcompanhamento);
    geracao.job.set(job as AiJob);
    geracao.demorada.set(demorada);
    const fixture = TestBed.createComponent(AiGeracaoStatusComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('mostra etapa, progresso e tentativa', () => {
    const el = montar({ etapa: 'VALIDANDO_QUALIDADE', progresso: 80, tentativa: 2 });
    expect(el.textContent).toContain('Validando qualidade');
    expect(el.textContent).toContain('80%');
    expect(el.textContent).toContain('tentativa 2');
    expect(el.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('80');
  });

  it('tranquiliza o autor quando a geração demora', () => {
    const el = montar({ etapa: 'GERANDO_CONTEUDO', progresso: 50, tentativa: 1 }, true);
    expect(el.textContent).toContain('Não é necessário iniciar novamente');
  });
});
