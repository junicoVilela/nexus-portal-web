import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AiDocumentoImportacao, AiModuloDocumento } from '../../models/ai-documento-importacao.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { AiDocumentoOrganizadorComponent } from './ai-documento-organizador.component';

describe('AiDocumentoOrganizadorComponent', () => {
  let fixture: ComponentFixture<AiDocumentoOrganizadorComponent>;
  let ai: jasmine.SpyObj<AiAssistenteService>;
  let importacao: AiDocumentoImportacao;

  beforeEach(async () => {
    ai = jasmine.createSpyObj<AiAssistenteService>('AiAssistenteService', [
      'reordenarEstruturaImportada',
      'buscarImportacao',
    ]);
    await TestBed.configureTestingModule({
      imports: [AiDocumentoOrganizadorComponent],
      providers: [lucideTestIcons, { provide: AiAssistenteService, useValue: ai }],
    }).compileComponents();
    fixture = TestBed.createComponent(AiDocumentoOrganizadorComponent);
    importacao = criarImportacao();
    fixture.componentRef.setInput('importacao', importacao);
    fixture.detectChanges();
  });

  it('apresenta módulos e páginas como um organizador visual', () => {
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('Ordene módulos e páginas');
    expect(texto).toContain('Usuários');
    expect(texto).toContain('Permissões');
    expect(texto).toContain('3 páginas');
  });

  it('reordena módulos e persiste IDs com a versão atual', () => {
    const atualizada = {
      ...importacao,
      version: 1,
      modulos: [
        { ...importacao.modulos[1], ordem: 1 },
        { ...importacao.modulos[0], ordem: 2 },
      ],
    };
    ai.reordenarEstruturaImportada.and.returnValue(of(atualizada));

    fixture.componentInstance['soltarModulo']({
      previousIndex: 0,
      currentIndex: 1,
    } as CdkDragDrop<AiModuloDocumento[]>);

    expect(ai.reordenarEstruturaImportada).toHaveBeenCalledWith('importacao-1', {
      version: 0,
      modulos: [
        { planoId: 'modulo-seguranca', nome: 'Segurança', paginas: ['pagina-senha'] },
        {
          planoId: 'modulo-usuarios',
          nome: 'Usuários',
          paginas: ['pagina-consulta', 'pagina-permissoes'],
        },
      ],
    });
    expect(fixture.componentInstance['modulos']()[0].nome).toBe('Segurança');
  });

  it('move página para outro módulo pelo controle acessível e permite desfazer', () => {
    const movida: AiDocumentoImportacao = {
      ...importacao,
      version: 1,
      modulos: [
        { ...importacao.modulos[0], paginas: [importacao.modulos[0].paginas[0]] },
        {
          ...importacao.modulos[1],
          paginas: [importacao.modulos[1].paginas[0], importacao.modulos[0].paginas[1]],
        },
      ],
    };
    const restaurada = { ...importacao, version: 2 };
    ai.reordenarEstruturaImportada.and.returnValues(of(movida), of(restaurada));
    const select = document.createElement('select');
    select.innerHTML = '<option value="modulo-seguranca">Segurança</option>';
    select.value = 'modulo-seguranca';

    fixture.componentInstance['moverPaginaParaModulo']('pagina-permissoes', {
      target: select,
    } as unknown as Event);
    fixture.componentInstance['desfazer']();

    expect(ai.reordenarEstruturaImportada).toHaveBeenCalledTimes(2);
    expect(ai.reordenarEstruturaImportada.calls.argsFor(0)[1].modulos[1].paginas).toEqual([
      'pagina-senha',
      'pagina-permissoes',
    ]);
    expect(ai.reordenarEstruturaImportada.calls.argsFor(1)[1].version).toBe(1);
    expect(fixture.componentInstance['historico']()).toEqual([]);
  });

  it('permite criar módulo, mover uma página e remover o módulo quando vazio', () => {
    const novoModuloId = '77777777-7777-4777-8777-777777777777';
    spyOn(crypto, 'randomUUID').and.returnValue(novoModuloId);
    const comModulo: AiDocumentoImportacao = {
      ...importacao,
      version: 1,
      modulos: [
        ...importacao.modulos,
        {
          id: novoModuloId,
          moduloId: null,
          nome: 'Relatórios',
          ordem: 3,
          paginas: [],
        },
      ],
    };
    const comPagina: AiDocumentoImportacao = {
      ...comModulo,
      version: 2,
      modulos: [
        { ...importacao.modulos[0], paginas: [importacao.modulos[0].paginas[0]] },
        importacao.modulos[1],
        { ...comModulo.modulos[2], paginas: [importacao.modulos[0].paginas[1]] },
      ],
    };
    const vazioNovamente: AiDocumentoImportacao = { ...comModulo, version: 3 };
    const removido: AiDocumentoImportacao = { ...importacao, version: 4 };
    ai.reordenarEstruturaImportada.and.returnValues(
      of(comModulo),
      of(comPagina),
      of(vazioNovamente),
      of(removido),
    );

    const input = document.createElement('input');
    input.value = 'Relatórios';
    fixture.componentInstance['atualizarNovoModuloNome']({ target: input } as unknown as Event);
    fixture.componentInstance['adicionarModulo'](new Event('submit'));
    expect(ai.reordenarEstruturaImportada.calls.argsFor(0)[1].modulos[2]).toEqual({
      planoId: novoModuloId,
      nome: 'Relatórios',
      paginas: [],
    });

    const select = document.createElement('select');
    select.innerHTML = `<option value="${novoModuloId}">Relatórios</option>`;
    select.value = novoModuloId;
    fixture.componentInstance['moverPaginaParaModulo']('pagina-permissoes', {
      target: select,
    } as unknown as Event);

    const retorno = document.createElement('select');
    retorno.innerHTML = '<option value="modulo-usuarios">Usuários</option>';
    retorno.value = 'modulo-usuarios';
    fixture.componentInstance['moverPaginaParaModulo']('pagina-permissoes', {
      target: retorno,
    } as unknown as Event);
    fixture.componentInstance['removerModulo'](novoModuloId);

    expect(ai.reordenarEstruturaImportada).toHaveBeenCalledTimes(4);
    expect(ai.reordenarEstruturaImportada.calls.mostRecent().args[1].modulos).toHaveSize(2);
  });

  it('recarrega a versão atual quando outra tela alterou o plano', () => {
    const atualizada = { ...importacao, version: 3 };
    ai.reordenarEstruturaImportada.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    ai.buscarImportacao.and.returnValue(of(atualizada));
    const processando = spyOn(fixture.componentInstance.processandoChange, 'emit');

    fixture.componentInstance['soltarModulo']({
      previousIndex: 0,
      currentIndex: 1,
    } as CdkDragDrop<AiModuloDocumento[]>);

    expect(ai.buscarImportacao).toHaveBeenCalledWith('importacao-1');
    expect(fixture.componentInstance['versao']()).toBe(3);
    expect(processando.calls.allArgs()).toEqual([[true], [false]]);
  });
});

function criarImportacao(): AiDocumentoImportacao {
  const pagina = (id: string, titulo: string, ordem: number) => ({
    id,
    titulo,
    ordem,
    briefing: `### Página: ${titulo}`,
    templateId: null,
    templateCodigo: null,
    templateNome: null,
    confiancaTemplate: 0,
    motivoTemplate: 'Modelo pendente.',
    status: 'PENDENTE' as const,
    paginaId: null,
    sessaoId: null,
    erroMensagem: null,
  });
  return {
    id: 'importacao-1',
    nomeArquivo: 'manual.docx',
    tipoArquivo: 'DOCX',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    tamanhoBytes: 2048,
    caracteresExtraidos: 500,
    totalPaginasOrigem: 3,
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
    sugestoes: [],
    modulos: [
      {
        id: 'modulo-usuarios',
        moduloId: null,
        nome: 'Usuários',
        ordem: 1,
        paginas: [
          pagina('pagina-consulta', 'Consultar usuários', 1),
          pagina('pagina-permissoes', 'Permissões', 2),
        ],
      },
      {
        id: 'modulo-seguranca',
        moduloId: null,
        nome: 'Segurança',
        ordem: 2,
        paginas: [pagina('pagina-senha', 'Alterar senha', 1)],
      },
    ],
    avisos: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
