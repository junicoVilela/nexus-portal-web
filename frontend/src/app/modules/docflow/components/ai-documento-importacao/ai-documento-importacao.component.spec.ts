import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AiDocumentoImportacao } from '../../models/ai-documento-importacao.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { AiDocumentoImportacaoComponent } from './ai-documento-importacao.component';

describe('AiDocumentoImportacaoComponent', () => {
  let fixture: ComponentFixture<AiDocumentoImportacaoComponent>;
  let ai: jasmine.SpyObj<AiAssistenteService>;

  beforeEach(async () => {
    ai = jasmine.createSpyObj<AiAssistenteService>('AiAssistenteService', [
      'importarDocumento',
      'buscarImportacao',
      'selecionarPaginaImportada',
    ]);
    await TestBed.configureTestingModule({
      imports: [AiDocumentoImportacaoComponent],
      providers: [lucideTestIcons, { provide: AiAssistenteService, useValue: ai }],
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
    expect(fixture.nativeElement.textContent).toContain('Plano pronto para revisão');
    expect(fixture.nativeElement.textContent).toContain('Listagem de registros');
  });

  it('marca a página em edição antes de enviá-la ao briefing', () => {
    const importacao = importacaoTeste();
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

    fixture.componentInstance['usarPagina'](importacao.modulos[0].paginas[0], 'Cadastros');

    expect(ai.selecionarPaginaImportada).toHaveBeenCalledWith('importacao-1', 'pagina-1');
    expect(emitSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({ id: 'pagina-1', moduloNome: 'Cadastros', status: 'EM_EDICAO' }),
    );
  });
});

function importacaoTeste(): AiDocumentoImportacao {
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
    modulos: [
      {
        id: 'modulo-1',
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
          },
        ],
      },
    ],
    avisos: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
