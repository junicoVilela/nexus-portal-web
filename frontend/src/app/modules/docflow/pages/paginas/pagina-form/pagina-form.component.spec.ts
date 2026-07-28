import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { PaginaFormComponent } from './pagina-form.component';
import { Pagina, PaginaTemplate } from '../../../models/pagina.model';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('PaginaFormComponent (smoke)', () => {
  let fixture: ComponentFixture<PaginaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(PaginaFormComponent);
    fixture.detectChanges();
  });

  it('renderiza sem erros em modo novo', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('form começa inválido (campos obrigatórios)', () => {
    expect(fixture.componentInstance['form'].valid).toBe(false);
  });

  it('hasUnsavedChanges retorna false antes de modificar', () => {
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);
  });

  it('aplica um modelo ao conteúdo de uma página nova', async () => {
    const template: PaginaTemplate = {
      id: 't1',
      codigo: 'FAQ',
      nome: 'FAQ',
      conteudoHtml: '<h2>Perguntas frequentes</h2>',
      ordem: 1,
    };
    spyOn(fixture.componentInstance['paginaService'], 'aplicarTemplatePagina').and.returnValue(
      of({
        templateId: template.id,
        versao: 1,
        conteudoHtml: template.conteudoHtml,
        variaveisResolvidas: {},
        variaveisPendentes: [],
      }),
    );

    await fixture.componentInstance.selecionarTemplate(template);

    expect(fixture.componentInstance['form'].controls.conteudoHtml.value).toBe(template.conteudoHtml);
    expect(fixture.componentInstance['templateSelecionadoId']()).toBe('t1');
  });

  it('gera prévia contextual sem substituir o conteúdo atual', async () => {
    const component = fixture.componentInstance;
    const template: PaginaTemplate = {
      id: 't1',
      codigo: 'FAQ',
      nome: 'FAQ',
      conteudoHtml: '<h2>{{ pagina.titulo }}</h2>',
      ordem: 1,
    };
    component['form'].controls.titulo.setValue('Cadastro');
    component['form'].controls.conteudoHtml.setValue('<p>Conteúdo atual</p>');
    spyOn(component['paginaService'], 'aplicarTemplatePagina').and.returnValue(
      of({
        templateId: 't1',
        versao: 2,
        conteudoHtml: '<h2>Cadastro</h2>',
        variaveisResolvidas: { 'pagina.titulo': 'Cadastro' },
        variaveisPendentes: [],
      }),
    );

    await component.previsualizarTemplate(template);

    expect(component['templatePreview']()?.aplicado.conteudoHtml).toBe('<h2>Cadastro</h2>');
    expect(component['form'].controls.conteudoHtml.value).toBe('<p>Conteúdo atual</p>');
  });

  it('salva o conteúdo atual como modelo personalizado', () => {
    const component = fixture.componentInstance;
    component['form'].controls.conteudoHtml.setValue('<section><h2>Cadastro</h2></section>');
    const template: PaginaTemplate = {
      id: 'custom-1',
      codigo: 'CUSTOM_1',
      nome: 'Cadastro padrão',
      conteudoHtml: '<section><h2>Cadastro</h2></section>',
      ordem: 1000,
      personalizado: true,
      projetoId: 'projeto-1',
      projetoNome: 'Portal',
    };
    const criar = spyOn(component['paginaService'], 'criarTemplatePagina').and.returnValue(of(template));

    component.salvarTemplatePersonalizado({ nome: 'Cadastro padrão', projetoId: 'projeto-1' });

    expect(criar).toHaveBeenCalledWith(
      jasmine.objectContaining({
        nome: 'Cadastro padrão',
        projetoId: 'projeto-1',
        conteudoHtml: '<section><h2>Cadastro</h2></section>',
      }),
    );
    expect(component['templates']()).toContain(template);
    expect(component['mostrarTemplates']()).toBe(true);
  });

  it('exclui um modelo personalizado sem alterar páginas existentes', async () => {
    const component = fixture.componentInstance;
    const template: PaginaTemplate = {
      id: 'custom-1',
      codigo: 'CUSTOM_1',
      nome: 'Cadastro padrão',
      conteudoHtml: '<h2>Cadastro</h2>',
      ordem: 1000,
      personalizado: true,
      projetoId: 'projeto-1',
      projetoNome: 'Portal',
    };
    component['templates'].set([template]);
    spyOn(component['confirmService'], 'confirm').and.resolveTo(true);
    const excluir = spyOn(component['paginaService'], 'excluirTemplatePagina').and.returnValue(of(undefined));

    await component.excluirTemplatePersonalizado(template);

    expect(excluir).toHaveBeenCalledWith('custom-1');
    expect(component['templates']()).toEqual([]);
  });

  it('delega a inserção de bloco para a seleção do editor rico', () => {
    const inserirHtml = jasmine.createSpy('inserirHtml');
    fixture.componentInstance.richEditor = { inserirHtml } as never;

    fixture.componentInstance.inserirHtml('<div class="callout">Dica</div>');

    expect(inserirHtml).toHaveBeenCalledWith('<div class="callout">Dica</div>');
  });

  it('insere um bloco reutilizável sem substituir o conteúdo atual', () => {
    const component = fixture.componentInstance;
    const inserirHtml = spyOn(component, 'inserirHtml');

    component.inserirBloco({
      id: 'objetivo',
      nome: 'Objetivo de negócio',
      descricao: 'Objetivo',
      categoria: 'Orientação',
      visual: 'objective',
      html: '<div class="objective-card"><p>Objetivo</p></div>',
    });

    expect(inserirHtml).toHaveBeenCalledWith('<div class="objective-card"><p>Objetivo</p></div>');
  });

  it('abre a biblioteca de blocos pelo comando do editor', () => {
    const abrirComBusca = jasmine.createSpy('abrirComBusca');
    fixture.componentInstance.blockLibrary = { abrirComBusca } as never;

    fixture.componentInstance.abrirBibliotecaPorAtalho();

    expect(abrirComBusca).toHaveBeenCalled();
  });

  it('reconhece a barra no início de uma linha vazia no modo código', () => {
    const component = fixture.componentInstance;
    const textarea = document.createElement('textarea');
    textarea.value = '<p>Conteúdo</p>\n';
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    const event = new KeyboardEvent('keydown', { key: '/', cancelable: true });
    Object.defineProperty(event, 'currentTarget', { value: textarea });
    const abrir = spyOn(component, 'abrirBibliotecaPorAtalho');

    component.atalhoBlocoNoCodigo(event);

    expect(event.defaultPrevented).toBe(true);
    expect(abrir).toHaveBeenCalled();
  });

  it('mantém a barra normal após conteúdo no modo código', () => {
    const component = fixture.componentInstance;
    const textarea = document.createElement('textarea');
    textarea.value = '<a href="https:';
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    const event = new KeyboardEvent('keydown', { key: '/', cancelable: true });
    Object.defineProperty(event, 'currentTarget', { value: textarea });
    const abrir = spyOn(component, 'abrirBibliotecaPorAtalho');

    component.atalhoBlocoNoCodigo(event);

    expect(event.defaultPrevented).toBe(false);
    expect(abrir).not.toHaveBeenCalled();
  });

  it('ativa e desativa o organizador visual de seções', () => {
    const component = fixture.componentInstance;

    component.alternarOrganizadorSecoes();
    expect(component['organizandoSecoes']()).toBe(true);

    component.alternarOrganizadorSecoes();
    expect(component['organizandoSecoes']()).toBe(false);
  });

  it('aplica a nova ordem ao HTML do formulário', () => {
    const component = fixture.componentInstance;
    const html = '<section><h2>Segunda</h2></section>\n<section><h2>Primeira</h2></section>';

    component.aplicarOrdemSecoes(html);

    expect(component['form'].controls.conteudoHtml.value).toBe(html);
  });

  it('confirma a exclusão e delega a remoção ao organizador', async () => {
    const component = fixture.componentInstance;
    const excluir = jasmine.createSpy('excluir').and.returnValue(true);
    component.sectionOrganizer = { excluir } as never;
    spyOn(component['confirmService'], 'confirm').and.resolveTo(true);
    const secao = {
      id: 'secao-1',
      html: '<section><h2>Introdução</h2></section>',
      titulo: 'Introdução',
      resumo: 'Resumo',
      tipo: 'Seção visual',
    };

    await component.confirmarExclusaoSecao(secao);

    expect(excluir).toHaveBeenCalledWith('secao-1');
  });

  it('mantém a seção quando a exclusão não é confirmada', async () => {
    const component = fixture.componentInstance;
    const excluir = jasmine.createSpy('excluir');
    component.sectionOrganizer = { excluir } as never;
    spyOn(component['confirmService'], 'confirm').and.resolveTo(false);

    await component.confirmarExclusaoSecao({
      id: 'secao-1',
      html: '<section><h2>Introdução</h2></section>',
      titulo: 'Introdução',
      resumo: 'Resumo',
      tipo: 'Seção visual',
    });

    expect(excluir).not.toHaveBeenCalled();
  });

  it('garante um rascunho antes de enviar a primeira imagem', async () => {
    const component = fixture.componentInstance;
    const file = new File(['imagem'], 'tela.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });
    const garantir = spyOn(
      component as unknown as { garantirRascunhoParaAnexos(): Promise<string | undefined> },
      'garantirRascunhoParaAnexos',
    ).and.resolveTo('pagina-1');
    const upload = spyOn(
      component as unknown as { uploadImagem(id: string, arquivo: File): Promise<string> },
      'uploadImagem',
    ).and.resolveTo('<img src="anexo.png">');
    const inserirHtml = jasmine.createSpy('inserirHtml');
    component.richEditor = { inserirHtml } as never;

    await component.anexarFotos({ target: input } as unknown as Event);

    expect(garantir).toHaveBeenCalled();
    expect(upload).toHaveBeenCalledWith('pagina-1', file);
    expect(inserirHtml).toHaveBeenCalledWith('<img src="anexo.png">');
  });

  it('envia autosave com a versão atual e atualiza a versão retornada', () => {
    const component = fixture.componentInstance;
    const pagina = paginaRascunho();
    component['editId'].set(pagina.id);
    component['paginaAtual'].set(pagina);
    component['form'].patchValue(
      {
        titulo: pagina.titulo,
        codigoTela: pagina.codigoTela,
        moduloId: pagina.moduloId,
        projetoId: pagina.projetoId,
        conteudoHtml: pagina.conteudoHtml,
      },
      { emitEvent: false },
    );
    const autosave = spyOn(component['paginaService'], 'autosavePagina').and.returnValue(
      of({ ...pagina, version: 2 }),
    );

    component['autosalvarServidor']();

    expect(autosave).toHaveBeenCalledWith(pagina.id, jasmine.objectContaining({ version: 1 }));
    expect(component['paginaAtual']()?.version).toBe(2);
    expect(component['autosaveStatus']()).toBe('saved');
  });

  it('mantém o catálogo aberto quando o primeiro autosave cria o rascunho', () => {
    const component = fixture.componentInstance;
    const pagina = paginaRascunho();
    component['mostrarTemplates'].set(true);
    spyOn(component['paginaService'], 'listarRevisoesPagina').and.returnValue(
      of({ items: [], totalItems: 0, totalPages: 0, page: 1, size: 10, first: true, last: true }),
    );

    component['atualizarPaginaAposPersistencia'](pagina);

    expect(component['editId']()).toBe(pagina.id);
    expect(component['mostrarTemplates']()).toBe(true);
  });

  it('interrompe o autosave e mostra conflito ao receber HTTP 409', () => {
    const component = fixture.componentInstance;
    const pagina = paginaRascunho();
    component['editId'].set(pagina.id);
    component['paginaAtual'].set(pagina);
    component['form'].patchValue(
      {
        titulo: pagina.titulo,
        codigoTela: pagina.codigoTela,
        moduloId: pagina.moduloId,
        projetoId: pagina.projetoId,
      },
      { emitEvent: false },
    );
    spyOn(component['paginaService'], 'autosavePagina').and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'Página alterada por outro usuário.' },
          }),
      ),
    );

    component['autosalvarServidor']();

    expect(component['autosaveStatus']()).toBe('conflict');
    expect(component['conflitoMensagem']()).toContain('outro usuário');
  });

  it('marca a página como pronta quando os critérios obrigatórios são atendidos', () => {
    fixture.componentInstance['form'].patchValue({
      titulo: 'Cadastro de clientes',
      codigoTela: 'CLI-001',
      projetoId: 'projeto-1',
      moduloId: 'modulo-1',
      resumo: 'Orientações completas para cadastrar clientes no sistema.',
      conteudoHtml:
        '<h2>Como cadastrar</h2><p>Acesse a tela de clientes, preencha todos os campos obrigatórios, revise os dados apresentados e selecione Salvar para concluir o procedimento com segurança.</p>',
    });

    expect(fixture.componentInstance['aptoParaRevisao']()).toBe(true);
  });
});

function paginaRascunho(): Pagina {
  return {
    id: 'pagina-1',
    version: 1,
    titulo: 'Cadastro de clientes',
    slug: 'cadastro-clientes',
    codigoTela: 'CLI-001',
    resumo: 'Resumo da página de cadastro de clientes.',
    conteudoHtml: '<h2>Cadastro</h2><p>Conteúdo da documentação.</p>',
    status: 'RASCUNHO',
    ordem: 0,
    ativo: true,
    moduloId: 'modulo-1',
    moduloNome: 'Cadastros',
    projetoId: 'projeto-1',
    projetoNome: 'Portal',
  };
}
