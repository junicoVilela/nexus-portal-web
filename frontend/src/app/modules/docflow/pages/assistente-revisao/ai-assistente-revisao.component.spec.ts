import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ToastService } from '@shared/ui';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { AiDocumentoImportacao } from '../../models/ai-documento-importacao.model';
import { AiProposta } from '../../models/ai-proposta.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { PaginaService } from '../../services/pagina.service';
import { AiAssistenteRevisaoComponent } from './ai-assistente-revisao.component';

describe('AiAssistenteRevisaoComponent', () => {
  let fixture: ComponentFixture<AiAssistenteRevisaoComponent>;
  let ai: jasmine.SpyObj<AiAssistenteService>;
  let paginas: jasmine.SpyObj<PaginaService>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    ai = jasmine.createSpyObj<AiAssistenteService>('AiAssistenteService', [
      'buscarImportacao',
      'sincronizarImportacao',
      'proposta',
      'gerar',
      'gerarLoteImportacao',
      'aceitarPaginaImportada',
      'aplicar',
    ]);
    paginas = jasmine.createSpyObj<PaginaService>('PaginaService', ['pagina', 'enviarRevisaoPagina']);
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['success']);
    ai.buscarImportacao.and.returnValue(of(importacaoTeste()));
    ai.sincronizarImportacao.and.returnValue(of(importacaoTeste()));
    ai.proposta.and.returnValue(of(propostaTeste()));
    paginas.pagina.and.returnValue(
      of({
        id: 'pagina-real-1',
        version: 0,
        titulo: 'Listagem de registros',
        slug: 'listagem-de-registros',
        codigoTela: 'DOC-M01-P01',
        status: 'RASCUNHO',
        ordem: 0,
        ativo: true,
        moduloId: 'modulo-real-1',
        moduloNome: 'Cadastros',
        projetoId: 'projeto-1',
        projetoNome: 'Manual do portal',
      }),
    );

    await TestBed.configureTestingModule({
      imports: [AiAssistenteRevisaoComponent],
      providers: [
        provideRouter([]),
        lucideTestIcons,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'importacao-1' }),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
        { provide: AiAssistenteService, useValue: ai },
        { provide: PaginaService, useValue: paginas },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AiAssistenteRevisaoComponent);
    fixture.detectChanges();
  });

  it('exibe o trecho de origem ao lado da proposta gerada', () => {
    const texto = fixture.nativeElement.textContent as string;

    expect(ai.sincronizarImportacao).toHaveBeenCalledWith('importacao-1');
    expect(ai.proposta).toHaveBeenCalledWith('sessao-1');
    expect(texto).toContain('Conteúdo interpretado');
    expect(texto).toContain('Use filtros para localizar registros');
    expect(texto).toContain('Página gerada pela IA');
  });

  it('aceita a proposta e passa a tratar a página como rascunho salvo', () => {
    const atualizada = importacaoTeste();
    atualizada.modulos[0].paginas[0] = {
      ...atualizada.modulos[0].paginas[0],
      paginaId: 'pagina-real-1',
    };
    ai.aceitarPaginaImportada.and.returnValue(of(atualizada));

    fixture.componentInstance['aceitarComoRascunho']();
    fixture.detectChanges();

    expect(ai.aceitarPaginaImportada).toHaveBeenCalledWith('importacao-1', 'pagina-plano-1');
    expect(paginas.pagina).toHaveBeenCalledWith('pagina-real-1');
    expect(toast.success).toHaveBeenCalledWith('Proposta aceita e página criada como rascunho.');
    expect(fixture.nativeElement.textContent).toContain('Rascunho salvo');
  });
});

function importacaoTeste(): AiDocumentoImportacao {
  return {
    id: 'importacao-1',
    nomeArquivo: 'manual.docx',
    tipoArquivo: 'DOCX',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    tamanhoBytes: 2048,
    caracteresExtraidos: 500,
    totalPaginasOrigem: 3,
    status: 'EM_REVISAO',
    version: 1,
    projetoNome: 'Manual do portal',
    projetoDescricao: 'Manual importado.',
    projetoId: 'projeto-1',
    clienteId: null,
    estruturaConfirmada: true,
    projetoNomesSugeridos: ['Manual do portal'],
    analiseOrigem: 'LLM',
    analiseMensagem: 'Estrutura identificada.',
    tokensEntradaAnalise: 100,
    tokensSaidaAnalise: 50,
    sugestoes: [],
    modulos: [
      {
        id: 'modulo-plano-1',
        moduloId: 'modulo-real-1',
        nome: 'Cadastros',
        ordem: 1,
        paginas: [
          {
            id: 'pagina-plano-1',
            titulo: 'Listagem de registros',
            ordem: 1,
            briefing: '# Página: Listagem de registros\n\nUse filtros para localizar registros.',
            templateId: null,
            templateCodigo: 'CONSULTA',
            templateNome: 'Consulta',
            confiancaTemplate: 0.91,
            motivoTemplate: 'O texto descreve filtros e resultados.',
            status: 'GERADA',
            paginaId: null,
            sessaoId: 'sessao-1',
            erroMensagem: null,
          },
        ],
      },
    ],
    avisos: [],
    createdAt: '2026-08-13T12:00:00-03:00',
    updatedAt: '2026-08-13T12:05:00-03:00',
  };
}

function propostaTeste(): AiProposta {
  return {
    id: 'proposta-1',
    sessaoId: 'sessao-1',
    jobId: 'job-1',
    tipo: 'NOVA',
    titulo: 'Página gerada pela IA',
    slug: 'listagem-de-registros',
    codigoTela: 'DOC-M01-P01',
    resumo: 'Orienta a consulta de registros.',
    conteudoHtml: '<section><h2>Página gerada pela IA</h2><p>Use os filtros.</p></section>',
    templateId: null,
    templateVersao: null,
    aptoParaRevisao: true,
    qualidade: [
      {
        codigo: 'TITULO',
        titulo: 'Título presente',
        descricao: 'A página possui um título claro.',
        ok: true,
        severidade: 'ERRO',
      },
    ],
    status: 'PENDENTE',
    paginaId: null,
    createdAt: '2026-08-13T12:04:00-03:00',
  };
}
