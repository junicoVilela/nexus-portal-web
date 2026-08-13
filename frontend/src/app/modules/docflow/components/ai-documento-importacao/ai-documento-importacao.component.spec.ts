import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AiDocumentoImportacao } from '../../models/ai-documento-importacao.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { ClienteService } from '../../services/cliente.service';
import { ModuloService } from '../../services/modulo.service';
import { ProjetoService } from '../../services/projeto.service';
import { AiDocumentoImportacaoComponent } from './ai-documento-importacao.component';

describe('AiDocumentoImportacaoComponent', () => {
  let fixture: ComponentFixture<AiDocumentoImportacaoComponent>;
  let ai: jasmine.SpyObj<AiAssistenteService>;
  let clientes: jasmine.SpyObj<ClienteService>;
  let modulos: jasmine.SpyObj<ModuloService>;
  let projetos: jasmine.SpyObj<ProjetoService>;

  beforeEach(async () => {
    ai = jasmine.createSpyObj<AiAssistenteService>('AiAssistenteService', [
      'importarDocumento',
      'buscarImportacao',
      'confirmarEstruturaImportada',
      'selecionarPaginaImportada',
      'sincronizarImportacao',
      'estimarLoteImportacao',
      'gerarLoteImportacao',
    ]);
    clientes = jasmine.createSpyObj<ClienteService>('ClienteService', ['clientes']);
    projetos = jasmine.createSpyObj<ProjetoService>('ProjetoService', ['projetos', 'invalidarCache']);
    modulos = jasmine.createSpyObj<ModuloService>('ModuloService', ['invalidarCache']);
    clientes.clientes.and.returnValue(of([]));
    projetos.projetos.and.returnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [AiDocumentoImportacaoComponent],
      providers: [
        lucideTestIcons,
        { provide: AiAssistenteService, useValue: ai },
        { provide: ClienteService, useValue: clientes },
        { provide: ProjetoService, useValue: projetos },
        { provide: ModuloService, useValue: modulos },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AiDocumentoImportacaoComponent);
    fixture.detectChanges();
  });

  it('envia arquivo válido e apresenta o plano devolvido pelo backend', () => {
    ai.importarDocumento.and.returnValue(of(importacaoTeste()));
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const arquivo = new File(['# Manual\nConteúdo suficiente para importação.'], 'manual.txt', {
      type: 'text/plain',
    });
    Object.defineProperty(input, 'files', { value: [arquivo] });

    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(ai.importarDocumento).toHaveBeenCalledWith(arquivo, { projetoId: null, clienteId: null });
    expect(fixture.nativeElement.textContent).toContain('Estrutura sugerida para revisão');
    expect(fixture.nativeElement.textContent).toContain('Listagem de registros');
  });

  it('confirma projeto novo e módulos antes de liberar as páginas', () => {
    const importacao = importacaoTeste();
    const confirmada = importacaoTeste(true);
    ai.confirmarEstruturaImportada.and.returnValue(of(confirmada));
    fixture.componentInstance['definirImportacao'](importacao);
    fixture.componentInstance['prepararEstrutura'](importacao);
    fixture.componentInstance['modoCliente'].set('NOVO_CLIENTE');
    fixture.componentInstance['estruturaForm'].controls.clienteNome.setValue('Cliente ACME');

    fixture.componentInstance['confirmarEstrutura']();

    expect(ai.confirmarEstruturaImportada).toHaveBeenCalledWith(
      'importacao-1',
      jasmine.objectContaining({
        modoProjeto: 'NOVO_PROJETO',
        modoCliente: 'NOVO_CLIENTE',
        clienteNome: 'Cliente ACME',
        projetoNome: 'Manual do portal',
        modulos: [{ planoId: 'modulo-1', nome: 'Cadastros' }],
      }),
    );
    expect(fixture.componentInstance['importacao']()?.estruturaConfirmada).toBeTrue();
  });

  it('marca a página em edição antes de enviá-la ao briefing', () => {
    const importacao = importacaoTeste(true);
    ai.importarDocumento.and.returnValue(of(importacao));
    ai.selecionarPaginaImportada.and.returnValue(
      of({
        ...importacao,
        status: 'EM_REVISAO',
        modulos: [
          {
            ...importacao.modulos[0],
            paginas: [{ ...importacao.modulos[0].paginas[0], status: 'EM_EDICAO' }],
          },
        ],
      }),
    );
    const emitSpy = spyOn(fixture.componentInstance.paginaSelecionada, 'emit');
    fixture.componentInstance['importacao'].set(importacao);

    fixture.componentInstance['usarPagina'](importacao.modulos[0].paginas[0], importacao.modulos[0]);

    expect(ai.selecionarPaginaImportada).toHaveBeenCalledWith('importacao-1', 'pagina-1');
    expect(emitSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 'pagina-1',
        moduloNome: 'Cadastros',
        moduloId: 'modulo-real-1',
        projetoId: 'projeto-1',
        status: 'EM_EDICAO',
      }),
    );
  });

  it('estima e inicia um lote somente após confirmação do consumo', () => {
    const importacao = importacaoTeste(true);
    const estimativa = {
      paginas: 1,
      caracteresEntrada: 120,
      tokensEntradaEstimados: 700,
      tokensSaidaEstimados: 3000,
      modelo: 'openai/gpt-5.6-luna',
      observacao: 'Estimativa técnica.',
    };
    ai.estimarLoteImportacao.and.returnValue(of(estimativa));
    ai.gerarLoteImportacao.and.returnValue(
      of({
        ...importacao,
        modulos: [
          {
            ...importacao.modulos[0],
            paginas: [{ ...importacao.modulos[0].paginas[0], status: 'EM_GERACAO', sessaoId: 'sessao-1' }],
          },
        ],
      }),
    );
    fixture.componentInstance['importacao'].set(importacao);
    fixture.componentInstance['paginasSelecionadas'].set(new Set(['pagina-1']));

    fixture.componentInstance['estimarLote']();
    expect(ai.estimarLoteImportacao).toHaveBeenCalledWith('importacao-1', ['pagina-1']);
    expect(fixture.componentInstance['estimativaLote']()).toEqual(estimativa);

    fixture.componentInstance['gerarLote']();
    expect(ai.gerarLoteImportacao).toHaveBeenCalledWith('importacao-1', ['pagina-1']);
    expect(fixture.componentInstance['importacao']()?.modulos[0].paginas[0].status).toBe('EM_GERACAO');
  });
});

function importacaoTeste(confirmada = false): AiDocumentoImportacao {
  return {
    id: 'importacao-1',
    nomeArquivo: 'manual.txt',
    tipoArquivo: 'TXT',
    mimeType: 'text/plain',
    tamanhoBytes: 100,
    caracteresExtraidos: 120,
    totalPaginasOrigem: 1,
    status: 'PRONTO_PARA_REVISAO',
    version: 0,
    projetoNome: 'Manual do portal',
    projetoDescricao: 'Manual criado a partir do documento.',
    projetoId: confirmada ? 'projeto-1' : null,
    clienteId: null,
    estruturaConfirmada: confirmada,
    projetoNomesSugeridos: ['Manual do portal'],
    analiseOrigem: 'ESTRUTURAL',
    analiseMensagem: 'Estrutura analisada localmente.',
    tokensEntradaAnalise: null,
    tokensSaidaAnalise: null,
    modulos: [
      {
        id: 'modulo-1',
        moduloId: confirmada ? 'modulo-real-1' : null,
        nome: 'Cadastros',
        ordem: 1,
        paginas: [
          {
            id: 'pagina-1',
            titulo: 'Listagem de registros',
            ordem: 1,
            briefing: '# Projeto\n## Cadastros\n### Listagem\nTexto da página.',
            templateId: 'template-1',
            templateCodigo: 'LISTAR_REGISTROS',
            templateNome: 'Listar registros',
            confiancaTemplate: 0.9,
            motivoTemplate: 'Listagem identificada.',
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
