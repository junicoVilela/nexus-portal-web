import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { PaginaFormComponent } from './pagina-form.component';
import { AiAplicacao, AiProposta } from '../../../models/ai-proposta.model';
import { Pagina, PaginaTemplate } from '../../../models/pagina.model';
import { Modulo } from '../../../models/modulo.model';
import { Projeto } from '../../../models/projeto.model';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { canDeactivateGuard } from '@shared/guards';
import { TIMINGS } from '@core/config/timings';

describe('PaginaFormComponent (smoke)', () => {
  let fixture: ComponentFixture<PaginaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(PaginaFormComponent);
    fixture.componentInstance['blocosCatalogo'].set([
      {
        id: 'kit-editar',
        nome: 'Kit editar',
        descricao: 'Edição',
        categoria: 'Kits',
        visual: 'kit',
        html: '<section><h2>Campos editáveis</h2></section>',
      },
      {
        id: 'kit-menu',
        nome: 'Kit menu',
        descricao: 'Menu',
        categoria: 'Kits',
        visual: 'kit',
        html: '<section><h2>Guias disponíveis</h2><div class="resource-list"></div></section>',
      },
    ]);
    fixture.detectChanges();
  });

  it('aplica a proposta da IA uma vez só (F5 não sobrescreve edições)', () => {
    const component = fixture.componentInstance;
    const anterior = history.state;
    history.replaceState(
      { ...anterior, origem: 'ai', proposta: { titulo: 'Consulta de pedidos', codigoTela: 'PED-001' } },
      '',
    );
    try {
      component['aplicarPropostaAiSePresente']();
      expect(component['form'].controls.titulo.value).toBe('Consulta de pedidos');
      expect(history.state?.['proposta']).toBeUndefined();

      component['form'].controls.titulo.setValue('Editado pelo autor');
      component['aplicarPropostaAiSePresente']();
      expect(component['form'].controls.titulo.value).toBe('Editado pelo autor');
    } finally {
      history.replaceState(anterior, '');
    }
  });

  it('página publicada mostra o conteúdo travado e volta para rascunho após confirmar', async () => {
    const component = fixture.componentInstance;
    const publicada = { id: 'p1', status: 'PUBLICADO', version: 4 } as Pagina;
    component['editId'].set('p1');
    component['paginaAtual'].set(publicada);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pf-travada')?.textContent).toContain('página publicada');

    spyOn(component['confirmService'], 'confirm').and.resolveTo(true);
    spyOn(component['paginaService'], 'salvarRascunho').and.returnValue(
      of({ ...publicada, status: 'RASCUNHO', version: 5 } as Pagina),
    );
    await component.voltarParaRascunho();
    fixture.detectChanges();

    expect(component['paginaService'].salvarRascunho).toHaveBeenCalledWith('p1');
    expect(component['paginaAtual']()?.version).toBe(5);
    expect(fixture.nativeElement.querySelector('.pf-travada')).toBeNull();
  });

  it('não volta para rascunho se o autor cancelar a confirmação', async () => {
    const component = fixture.componentInstance;
    component['editId'].set('p1');
    component['paginaAtual'].set({ id: 'p1', status: 'APROVADO', version: 2 } as Pagina);
    spyOn(component['confirmService'], 'confirm').and.resolveTo(false);
    const salvar = spyOn(component['paginaService'], 'salvarRascunho');

    await component.voltarParaRascunho();

    expect(salvar).not.toHaveBeenCalled();
  });

  it('ajuste da IA entra no editor como alteração pendente e fecha o painel', () => {
    const component = fixture.componentInstance;
    component['painelAjusteAberto'].set(true);

    component.aplicarAjusteIa({
      titulo: 'Consulta e exportação',
      resumo: 'Resumo novo',
      conteudoHtml: '<p>Perfil gestor.</p>',
    } as AiAplicacao);

    expect(component['form'].controls.titulo.value).toBe('Consulta e exportação');
    expect(component['form'].controls.conteudoHtml.value).toBe('<p>Perfil gestor.</p>');
    expect(component.hasUnsavedChanges()).toBeTrue();
    expect(component['painelAjusteAberto']()).toBeFalse();
  });

  it('não abre o ajuste da IA com alterações não salvas', () => {
    const component = fixture.componentInstance;
    spyOn(component as never, 'podeAjustarComIa' as never).and.returnValue(true as never);
    component['dirty'] = true;
    component['justSaved'] = false;
    const aviso = spyOn(component['toast'], 'warn');

    component.abrirAjusteIa();

    expect(aviso).toHaveBeenCalled();
    expect(component['painelAjusteAberto']()).toBeFalse();
  });

  it('página vinda da IA vincula a proposta quando ganha id pela primeira vez', () => {
    const component = fixture.componentInstance;
    const vincular = spyOn(component['aiAssistenteService'], 'vincularPagina').and.returnValue(
      of({} as AiProposta),
    );
    const anterior = history.state;
    history.replaceState(
      { ...anterior, origem: 'ai', proposta: { sessaoId: 'sess-1', titulo: 'Consulta' } },
      '',
    );
    try {
      component['aplicarPropostaAiSePresente']();
      component['ativarPaginaSalva']({
        id: 'pag-1',
        slug: 'consulta',
        status: 'RASCUNHO',
        version: 1,
      } as Pagina);
      component['ativarPaginaSalva']({
        id: 'pag-1',
        slug: 'consulta',
        status: 'RASCUNHO',
        version: 2,
      } as Pagina);
    } finally {
      history.replaceState(anterior, '');
    }
    expect(vincular).toHaveBeenCalledOnceWith('sess-1', 'pag-1');
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

  it('hasUnsavedChanges retorna true quando dirty e justSaved falso', () => {
    const component = fixture.componentInstance;
    component['dirty'] = true;
    component['justSaved'] = false;
    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('hasUnsavedChanges retorna false após salvar define justSaved', () => {
    const component = fixture.componentInstance;
    component['dirty'] = true;
    component['justSaved'] = true;
    expect(component.hasUnsavedChanges()).toBe(false);
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

    await component['modelos'].previsualizarTemplate(template);

    expect(component['modelos'].templatePreview()?.aplicado.conteudoHtml).toBe('<h2>Cadastro</h2>');
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

    component['modelos'].salvarTemplatePersonalizado({ nome: 'Cadastro padrão', projetoId: 'projeto-1' });

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

    await component['modelos'].excluirTemplatePersonalizado(template);

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

  it('aplica estrutura inicial do tipo edição', () => {
    const component = fixture.componentInstance;
    spyOn(component['route'].snapshot.queryParamMap, 'get').and.callFake((key: string) =>
      key === 'tipoPagina' ? 'editar' : null,
    );
    component['aplicarTipoPaginaInicial']();
    expect(component['form'].controls.titulo.value).toBe('Editar registro');
    expect(component['form'].controls.codigoTela.value).toBe('EDITAR-001');
    expect(component['form'].controls.conteudoHtml.value).toContain('Campos editáveis');
  });

  it('aplica estrutura inicial do tipo menu', () => {
    const component = fixture.componentInstance;
    spyOn(component['route'].snapshot.queryParamMap, 'get').and.callFake((key: string) =>
      key === 'tipoPagina' ? 'menu' : null,
    );
    component['aplicarTipoPaginaInicial']();
    expect(component['form'].controls.titulo.value).toBe('Menu');
    expect(component['form'].controls.codigoTela.value).toBe('MENU-001');
    expect(component['form'].controls.conteudoHtml.value).toContain('Guias disponíveis');
  });

  it('exibe subtítulo de subpágina quando parentId está definido', () => {
    const component = fixture.componentInstance;
    component['paginas'].set([paginaRascunho(), { ...paginaRascunho(), id: 'pai-1', titulo: 'Operações' }]);
    component['form'].controls.parentId.setValue('pai-1');
    expect(component['subtituloCabecalho']()).toBe('Subpágina de Operações');
  });

  describe('canDeactivate', () => {
    it('permite sair quando o formulário está limpo', async () => {
      const component = fixture.componentInstance;
      const confirmar = spyOn(component['confirmService'], 'confirm');

      const podeSair = await TestBed.runInInjectionContext(() =>
        Promise.resolve(canDeactivateGuard(component, null as never, null as never, null as never)),
      );

      expect(podeSair).toBe(true);
      expect(confirmar).not.toHaveBeenCalled();
    });

    it('bloqueia a saída quando o usuário cancela com alterações pendentes', async () => {
      const component = fixture.componentInstance;
      component['dirty'] = true;
      component['justSaved'] = false;
      spyOn(component['confirmService'], 'confirm').and.resolveTo(false);

      const podeSair = await TestBed.runInInjectionContext(() =>
        Promise.resolve(canDeactivateGuard(component, null as never, null as never, null as never)),
      );

      expect(podeSair).toBe(false);
      expect(component['confirmService'].confirm).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'Sair sem salvar?',
          acceptLabel: 'Sair sem salvar',
          rejectLabel: 'Continuar editando',
        }),
      );
    });

    it('permite sair quando o usuário confirma descarte das alterações', async () => {
      const component = fixture.componentInstance;
      component['dirty'] = true;
      component['justSaved'] = false;
      spyOn(component['confirmService'], 'confirm').and.resolveTo(true);

      const podeSair = await TestBed.runInInjectionContext(() =>
        Promise.resolve(canDeactivateGuard(component, null as never, null as never, null as never)),
      );

      expect(podeSair).toBe(true);
    });
  });

  describe('autosave', () => {
    it('envia salvarPagina no autosave de página nova válida', () => {
      const component = fixture.componentInstance;
      const pagina = paginaRascunho();
      component['form'].patchValue(
        {
          titulo: pagina.titulo,
          codigoTela: pagina.codigoTela,
          moduloId: pagina.moduloId,
          projetoId: pagina.projetoId,
        },
        { emitEvent: false },
      );
      const salvar = spyOn(component['paginaService'], 'salvarPagina').and.returnValue(of(pagina));

      component['autosalvarServidor']();

      expect(salvar).toHaveBeenCalledWith(jasmine.objectContaining({ titulo: pagina.titulo }));
      expect(component['autosaveStatus']()).toBe('saved');
    });

    it('não envia autosave quando o formulário está inválido', () => {
      const component = fixture.componentInstance;
      const salvar = spyOn(component['paginaService'], 'salvarPagina');
      const autosave = spyOn(component['paginaService'], 'autosavePagina');

      component['autosalvarServidor']();

      expect(salvar).not.toHaveBeenCalled();
      expect(autosave).not.toHaveBeenCalled();
      expect(component['autosaveStatus']()).toBe('idle');
    });

    it('salva rascunho local e dispara autosave após debounce', fakeAsync(() => {
      const component = fixture.componentInstance;
      const savedAt = new Date();
      spyOn(component['paginaDraftService'], 'salvar').and.returnValue(savedAt);
      const autosalvar = spyOn(component as unknown as { autosalvarServidor(): void }, 'autosalvarServidor');

      component['inicializarAutoSave']();
      component['form'].controls.titulo.setValue('Título alterado');
      tick(TIMINGS.autosaveDebounceMs);

      expect(component['paginaDraftService'].salvar).toHaveBeenCalledWith(
        'docflow:pagina-form:novo',
        jasmine.objectContaining({ titulo: 'Título alterado' }),
      );
      expect(component['dirty']).toBe(true);
      expect(component['rascunhoSalvoEm']()).toBe(savedAt);
      expect(autosalvar).toHaveBeenCalled();
    }));
  });

  describe('restauração de rascunho local', () => {
    it('restaura valores do localStorage e notifica o usuário', () => {
      const component = fixture.componentInstance;
      const savedAt = new Date();
      const draftValue = {
        titulo: 'Do rascunho',
        codigoTela: 'DRAFT-001',
        projetoId: 'projeto-1',
        moduloId: 'modulo-1',
        conteudoHtml: '<p>Conteúdo salvo localmente</p>',
      };
      spyOn(component['paginaDraftService'], 'carregar').and.returnValue({
        value: draftValue,
        savedAt,
      });
      const toast = spyOn(component['toast'], 'success');

      component['restaurarRascunho']();

      expect(component['form'].controls.titulo.value).toBe('Do rascunho');
      expect(component['form'].controls.conteudoHtml.value).toBe('<p>Conteúdo salvo localmente</p>');
      expect(component['rascunhoSalvoEm']()).toBe(savedAt);
      expect(toast).toHaveBeenCalledWith('Rascunho local restaurado.');
    });

    it('ignora restauração quando não há snapshot local', () => {
      const component = fixture.componentInstance;
      spyOn(component['paginaDraftService'], 'carregar').and.returnValue(null);
      const toast = spyOn(component['toast'], 'success');
      component['form'].controls.titulo.setValue('Original', { emitEvent: false });

      component['restaurarRascunho']();

      expect(component['form'].controls.titulo.value).toBe('Original');
      expect(component['rascunhoSalvoEm']()).toBeNull();
      expect(toast).not.toHaveBeenCalled();
    });
  });

  describe('contexto inicial via query', () => {
    it('aplica parentId da query e exibe subtítulo da página pai', () => {
      const component = fixture.componentInstance;
      const projeto: Projeto = {
        id: 'projeto-1',
        nome: 'Portal',
        slug: 'portal',
        ativo: true,
      };
      const modulo: Modulo = {
        id: 'modulo-1',
        nome: 'Cadastros',
        slug: 'cadastros',
        ordem: 1,
        ativo: true,
        projetoId: projeto.id,
        projetoNome: projeto.nome,
      };
      const pai: Pagina = { ...paginaRascunho(), id: 'pai-1', titulo: 'Menu principal', parentId: undefined };
      component['projetos'].set([projeto]);
      component['todosModulos'].set([modulo]);
      component['modulos'].set([modulo]);
      component['paginas'].set([pai]);
      spyOn(component['route'].snapshot.queryParamMap, 'get').and.callFake((key: string) => {
        if (key === 'projetoId') return projeto.id;
        if (key === 'moduloId') return modulo.id;
        if (key === 'parentId') return pai.id;
        return null;
      });

      component['aplicarContextoInicial']();

      expect(component['form'].controls.parentId.value).toBe('pai-1');
      expect(component['form'].controls.projetoId.value).toBe('projeto-1');
      expect(component['form'].controls.moduloId.value).toBe('modulo-1');
      // formValue (toSignal) só atualiza com emitEvent; após sync manual o subtítulo reflete o pai.
      component['form'].patchValue({ parentId: 'pai-1' });
      expect(component['subtituloCabecalho']()).toBe('Subpágina de Menu principal');
    });
  });

  describe('tipoPagina=menu', () => {
    it('aplica kit-menu e avança para a etapa de conteúdo', () => {
      const component = fixture.componentInstance;
      const toast = spyOn(component['toast'], 'success');
      spyOn(component['route'].snapshot.queryParamMap, 'get').and.callFake((key: string) =>
        key === 'tipoPagina' ? 'menu' : null,
      );

      component['aplicarTipoPaginaInicial']();

      expect(component['form'].controls.titulo.value).toBe('Menu');
      expect(component['form'].controls.codigoTela.value).toBe('MENU-001');
      expect(component['form'].controls.conteudoHtml.value).toContain('Guias disponíveis');
      expect(component['form'].controls.conteudoHtml.value).toContain('resource-list');
      expect(component['mostrarTemplates']()).toBe(false);
      expect(component['etapaAtiva']()).toBe('conteudo');
      expect(toast).toHaveBeenCalledWith('Estrutura inicial aplicada conforme o tipo de página.');
    });
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
