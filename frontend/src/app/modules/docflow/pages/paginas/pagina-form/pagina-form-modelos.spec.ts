import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PaginaTemplate, PaginaTemplateVersao } from '@modules/docflow/models/pagina.model';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { ConfirmService, ToastService } from '@shared/ui';
import { PaginaFormModelos } from './pagina-form-modelos';

describe('PaginaFormModelos', () => {
  let modelos: PaginaFormModelos;
  let pagina: jasmine.SpyObj<PaginaService>;
  let toast: jasmine.SpyObj<ToastService>;
  let projetoId: string | undefined;

  const template = (id: string, extra: Partial<PaginaTemplate> = {}) =>
    ({ id, codigo: id, nome: `Modelo ${id}`, conteudoHtml: '<p/>', ordem: 1, ...extra }) as PaginaTemplate;
  const versao = (numero: number) => ({ numero }) as PaginaTemplateVersao;

  beforeEach(() => {
    pagina = jasmine.createSpyObj<PaginaService>('PaginaService', [
      'templatesPagina',
      'duplicarTemplatePagina',
      'criarTemplatePagina',
    ]);
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error', 'warn']);
    TestBed.configureTestingModule({
      providers: [
        PaginaFormModelos,
        { provide: PaginaService, useValue: pagina },
        { provide: ToastService, useValue: toast },
        { provide: ConfirmService, useValue: { confirm: () => Promise.resolve(true) } },
      ],
    });
    modelos = TestBed.inject(PaginaFormModelos);
    projetoId = 'proj-1';
    modelos.configurar({
      projetoId: () => projetoId,
      aplicacao: () => ({}),
      conteudoHtml: () => '<section><h2>Cadastro</h2></section>',
    });
  });

  it('carrega o catálogo no escopo do projeto do formulário', () => {
    pagina.templatesPagina.and.returnValue(of([template('a')]));
    modelos.alterarArquivadosTemplates(true);
    expect(pagina.templatesPagina).toHaveBeenCalledWith({
      projetoId: 'proj-1',
      somenteContexto: true,
      incluirArquivados: true,
    });
    expect(modelos.templates().length).toBe(1);
  });

  it('comparação de versões alterna entre as posições A e B', () => {
    modelos.selecionarVersaoComparacao(versao(3));
    modelos.selecionarVersaoComparacao(versao(2));
    expect([modelos.versaoComparacaoA(), modelos.versaoComparacaoB()]).toEqual([3, 2]);
    modelos.selecionarVersaoComparacao(versao(1));
    expect([modelos.versaoComparacaoA(), modelos.versaoComparacaoB()]).toEqual([2, 1]);
    modelos.selecionarVersaoComparacao(versao(2));
    expect([modelos.versaoComparacaoA(), modelos.versaoComparacaoB()]).toEqual([null, 1]);
  });

  it('duplicar modelo do sistema exige projeto selecionado', async () => {
    projetoId = undefined;
    await modelos.duplicarTemplate(template('sistema'));
    expect(pagina.duplicarTemplatePagina).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('salva o conteúdo do editor como modelo personalizado', () => {
    pagina.criarTemplatePagina.and.returnValue(of(template('novo', { projetoNome: 'Portal' })));
    modelos.salvarTemplatePersonalizado({ nome: 'Cadastro', descricao: null, projetoId: 'proj-1' } as never);
    expect(pagina.criarTemplatePagina).toHaveBeenCalledWith(
      jasmine.objectContaining({ conteudoHtml: '<section><h2>Cadastro</h2></section>' }),
    );
    expect(modelos.templates().map(t => t.id)).toEqual(['novo']);
    expect(modelos.mostrarTemplates()).toBeTrue();
  });
});
