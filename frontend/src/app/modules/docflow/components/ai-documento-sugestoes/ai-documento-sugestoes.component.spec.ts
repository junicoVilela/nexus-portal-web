import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AiDocumentoImportacao } from '../../models/ai-documento-importacao.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { AiDocumentoSugestoesComponent } from './ai-documento-sugestoes.component';

describe('AiDocumentoSugestoesComponent', () => {
  let fixture: ComponentFixture<AiDocumentoSugestoesComponent>;
  let ai: jasmine.SpyObj<AiAssistenteService>;
  let importacao: AiDocumentoImportacao;

  beforeEach(async () => {
    ai = jasmine.createSpyObj<AiAssistenteService>('AiAssistenteService', [
      'aceitarSugestaoImportacao',
      'ignorarSugestaoImportacao',
      'aplicarSugestoesSegurasImportacao',
    ]);
    await TestBed.configureTestingModule({
      imports: [AiDocumentoSugestoesComponent],
      providers: [lucideTestIcons, { provide: AiAssistenteService, useValue: ai }],
    }).compileComponents();
    fixture = TestBed.createComponent(AiDocumentoSugestoesComponent);
    importacao = criarImportacao();
    fixture.componentRef.setInput('importacao', importacao);
    fixture.detectChanges();
  });

  it('distingue ajustes seguros de decisões que exigem aceite individual', () => {
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('Análise de completude');
    expect(texto).toContain('1 ajustes sem perda de conteúdo');
    expect(texto).toContain('Página ausente');
    expect(texto).toContain('Requer decisão');
  });

  it('emite o plano atualizado depois de aplicar uma sugestão', () => {
    const atualizada: AiDocumentoImportacao = {
      ...importacao,
      sugestoes: importacao.sugestoes.map(item =>
        item.id === 'sugestao-renomear' ? { ...item, status: 'APLICADA' } : item,
      ),
    };
    ai.aceitarSugestaoImportacao.and.returnValue(of(atualizada));
    const emitSpy = spyOn(fixture.componentInstance.importacaoAtualizada, 'emit');

    fixture.componentInstance['aceitar'](importacao.sugestoes[0]);

    expect(ai.aceitarSugestaoImportacao).toHaveBeenCalledWith('importacao-1', 'sugestao-renomear');
    expect(emitSpy).toHaveBeenCalledWith(atualizada);
  });
});

function criarImportacao(): AiDocumentoImportacao {
  return {
    id: 'importacao-1',
    nomeArquivo: 'manual.docx',
    tipoArquivo: 'DOCX',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    tamanhoBytes: 2048,
    caracteresExtraidos: 500,
    totalPaginasOrigem: 2,
    status: 'PRONTO_PARA_REVISAO',
    version: 0,
    projetoNome: 'Portal',
    projetoDescricao: 'Manual do portal.',
    projetoId: null,
    clienteId: null,
    estruturaConfirmada: false,
    projetoNomesSugeridos: ['Portal'],
    analiseOrigem: 'LLM',
    analiseMensagem: 'Estrutura refinada.',
    tokensEntradaAnalise: 100,
    tokensSaidaAnalise: 50,
    sugestoes: [
      {
        id: 'sugestao-renomear',
        tipo: 'RENOMEAR_PAGINA',
        titulo: 'Padronizar título',
        justificativa: 'O título ficará mais claro.',
        confianca: 0.93,
        status: 'PENDENTE',
        aplicacaoSegura: true,
        paginaOrigemId: 'pagina-1',
        paginaDestinoId: null,
        moduloOrigemId: 'modulo-1',
        moduloDestinoId: null,
        valorSugerido: 'Pesquisar usuários',
        conteudoSugerido: null,
      },
      {
        id: 'sugestao-adicionar',
        tipo: 'ADICIONAR_PAGINA',
        titulo: 'Documentar recuperação de senha',
        justificativa: 'A jornada indica uma etapa ainda não documentada.',
        confianca: 0.82,
        status: 'PENDENTE',
        aplicacaoSegura: false,
        paginaOrigemId: null,
        paginaDestinoId: null,
        moduloOrigemId: null,
        moduloDestinoId: 'modulo-1',
        valorSugerido: 'Recuperar senha',
        conteudoSugerido: 'Explique como iniciar e concluir a recuperação.',
      },
    ],
    modulos: [
      {
        id: 'modulo-1',
        moduloId: null,
        nome: 'Usuários',
        ordem: 1,
        paginas: [
          {
            id: 'pagina-1',
            titulo: 'Consulta',
            ordem: 1,
            briefing: 'Conteúdo original.',
            templateId: null,
            templateCodigo: null,
            templateNome: null,
            confiancaTemplate: 0,
            motivoTemplate: 'Modelo pendente.',
            status: 'PENDENTE',
            paginaId: null,
            sessaoId: null,
            erroMensagem: null,
          },
        ],
      },
    ],
    avisos: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
