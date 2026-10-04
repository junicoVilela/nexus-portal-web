import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { ToastService } from '@shared/ui';
import { AiManualResposta } from '../../models/ai-manual.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { ClientePreviewLinkService } from '../../services/cliente-preview-link.service';
import { PublicacaoPerguntarComponent } from './publicacao-perguntar.component';

describe('PublicacaoPerguntarComponent', () => {
  let fixture: ComponentFixture<PublicacaoPerguntarComponent>;
  let ai: jasmine.SpyObj<AiAssistenteService>;
  let link: jasmine.SpyObj<ClientePreviewLinkService>;

  beforeEach(async () => {
    ai = jasmine.createSpyObj<AiAssistenteService>('AiAssistenteService', ['perguntarPublicacao']);
    link = jasmine.createSpyObj<ClientePreviewLinkService>('ClientePreviewLinkService', ['tokenValido']);
    await TestBed.configureTestingModule({
      imports: [PublicacaoPerguntarComponent],
      providers: [
        lucideTestIcons,
        { provide: AiAssistenteService, useValue: ai },
        { provide: ClientePreviewLinkService, useValue: link },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PublicacaoPerguntarComponent);
    fixture.componentRef.setInput('publicacaoId', 'pub1');
    fixture.componentRef.setInput('clienteId', 'c1');
    fixture.componentRef.setInput('clienteSlug', 'acme');
    fixture.detectChanges();
  });

  function perguntar(texto: string): void {
    const campo = fixture.nativeElement.querySelector('.pp__campo') as HTMLInputElement;
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('pergunta à publicação e mostra a resposta com a tela citada', () => {
    ai.perguntarPublicacao.and.returnValue(
      of({
        manual: 'Manual ACME v1.5.0',
        versao: '1.5.0',
        modo: 'IA',
        resposta: 'Use os filtros (PED-001).',
        citacoes: [
          {
            codigoTela: 'PED-001',
            titulo: 'Consulta',
            secao: 'Filtros',
            caminho: 'x',
            url: null,
            trecho: 't',
          },
        ],
      } as AiManualResposta),
    );

    perguntar('como filtrar pedidos?');

    expect(ai.perguntarPublicacao).toHaveBeenCalledWith('pub1', 'como filtrar pedidos?');
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Use os filtros (PED-001).');
    expect(texto).toContain('Consulta — Filtros');
    expect(texto).toContain('resposta da IA');
  });

  it('gera o comando MCP com o token de leitura do cliente', () => {
    link.tokenValido.and.returnValue(
      of({ id: 't', clienteId: 'c1', token: 'abc', expiresAt: '2099-01-01T00:00:00Z', createdAt: '' }),
    );

    (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[])
      .find(b => b.textContent?.includes('Gerar comando'))!
      .click();
    fixture.detectChanges();

    expect(link.tokenValido).toHaveBeenCalledWith('c1');
    expect(fixture.nativeElement.querySelector('.pp__comando').textContent).toContain(
      'claude mcp add --transport http manual-acme',
    );
    expect(fixture.nativeElement.querySelector('.pp__comando').textContent).toContain('Bearer abc');
  });
});
