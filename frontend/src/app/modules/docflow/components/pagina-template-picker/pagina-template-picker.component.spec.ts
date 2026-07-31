import { ComponentFixture, TestBed } from '@angular/core/testing';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { PaginaTemplate } from '../../models/pagina.model';
import { PaginaTemplatePickerComponent } from './pagina-template-picker.component';

describe('PaginaTemplatePickerComponent', () => {
  let fixture: ComponentFixture<PaginaTemplatePickerComponent>;

  const template: PaginaTemplate = {
    id: 'template-1',
    codigo: 'PASSO_A_PASSO',
    nome: 'Passo a passo',
    descricao: 'Estrutura operacional',
    conteudoHtml: '<h2>Passos</h2>',
    ordem: 10,
  };

  beforeEach(async () => {
    localStorage.removeItem('docflow:templates-favoritos');
    await TestBed.configureTestingModule({
      imports: [PaginaTemplatePickerComponent],
      providers: [lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(PaginaTemplatePickerComponent);
    fixture.componentRef.setInput('templates', [template]);
    fixture.detectChanges();
  });

  it('renderiza página em branco e os modelos recebidos', () => {
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Página em branco');
    expect(texto).toContain('Passo a passo');
    expect(fixture.nativeElement.querySelector('.template-mini--flow')).not.toBeNull();
  });

  it('escolhe uma miniatura coerente com cada estrutura', () => {
    const component = fixture.componentInstance;

    expect(component.visualDoTemplate('CADASTRO')).toBe('screen');
    expect(component.visualDoTemplate('PROCESSO')).toBe('flow');
    expect(component.visualDoTemplate('DICIONARIO_CAMPOS')).toBe('dictionary');
    expect(component.visualDoTemplate('FAQ')).toBe('faq');
    expect(component.visualDoTemplate('SOLUCAO_PROBLEMAS')).toBe('troubleshooting');
    expect(component.visualDoTemplate('CENTRAL_AJUDA')).toBe('home');
    expect(component.visualDoTemplate('CATEGORIA_ARTIGOS')).toBe('category');
    expect(component.visualDoTemplate('PRIMEIROS_PASSOS')).toBe('onboarding');
    expect(component.visualDoTemplate('RELATORIO')).toBe('report');
    expect(component.visualDoTemplate('LAB_FILTROS')).toBe('filters');
    expect(component.visualDoTemplate('PAINEL_METRICAS')).toBe('metrics');
    expect(component.visualDoTemplate('DOSSIE_DECISAO')).toBe('dossier');
    expect(component.visualDoTemplate('ESPECIFICACAO_REGRA')).toBe('rulespec');
    expect(component.visualDoTemplate('CATALOGO_PARAMETROS')).toBe('catalog');
  });

  it('emite o modelo selecionado', () => {
    const emitSpy = spyOn(fixture.componentInstance.selecionado, 'emit');
    const botoes = fixture.nativeElement.querySelectorAll(
      '.template-card__select',
    ) as NodeListOf<HTMLButtonElement>;

    botoes[1].click();

    expect(emitSpy).toHaveBeenCalledWith(template);
  });

  it('solicita prévia sem aplicar o modelo', () => {
    const preview = spyOn(fixture.componentInstance.previewSolicitada, 'emit');

    (
      fixture.nativeElement.querySelector('[title="Pré-visualizar com dados atuais"]') as HTMLButtonElement
    ).click();

    expect(preview).toHaveBeenCalledWith(template);
  });

  it('identifica o escopo e permite excluir somente modelos personalizados', () => {
    const personalizado: PaginaTemplate = {
      ...template,
      id: 'custom-1',
      codigo: 'CUSTOM_1',
      nome: 'Modelo do portal',
      personalizado: true,
      projetoId: 'projeto-1',
      projetoNome: 'Portal',
    };
    fixture.componentRef.setInput('templates', [template, personalizado]);
    fixture.detectChanges();
    const emitSpy = spyOn(fixture.componentInstance.exclusaoSolicitada, 'emit');

    expect(fixture.componentInstance.escopoLabel(template)).toBe('Modelo do sistema');
    expect(fixture.componentInstance.escopoLabel(personalizado)).toBe('Projeto · Portal');
    const excluir = fixture.nativeElement.querySelector(
      '.template-card__actions .is-danger',
    ) as HTMLButtonElement;
    excluir.click();

    expect(emitSpy).toHaveBeenCalledWith(personalizado);
    expect(fixture.nativeElement.querySelectorAll('.template-card__actions .is-danger').length).toBe(1);
  });

  it('filtra modelos de sistema, projeto e cliente', () => {
    fixture.componentRef.setInput('templates', [
      template,
      {
        ...template,
        id: 'projeto-template',
        personalizado: true,
        projetoId: 'projeto-1',
        projetoNome: 'Portal',
      },
      {
        ...template,
        id: 'cliente-template',
        personalizado: true,
        clienteId: 'cliente-1',
        clienteNome: 'Softon',
      },
    ]);

    fixture.componentInstance.filtro.set('PROJETO');
    expect(fixture.componentInstance.templatesVisiveis().map(item => item.id)).toEqual(['projeto-template']);
    fixture.componentInstance.filtro.set('CLIENTE');
    expect(fixture.componentInstance.templatesVisiveis().map(item => item.id)).toEqual(['cliente-template']);
    fixture.componentInstance.filtro.set('SISTEMA');
    expect(fixture.componentInstance.templatesVisiveis().map(item => item.id)).toEqual(['template-1']);
  });

  it('separa modelos arquivados e emite ações de gestão', () => {
    const arquivado: PaginaTemplate = {
      ...template,
      id: 'custom-arquivado',
      personalizado: true,
      projetoId: 'projeto-1',
      ativo: false,
    };
    fixture.componentRef.setInput('templates', [template, arquivado]);
    fixture.componentRef.setInput('incluirArquivados', true);
    fixture.componentInstance.filtro.set('ARQUIVADOS');
    fixture.detectChanges();
    const reativar = spyOn(fixture.componentInstance.reativacaoSolicitada, 'emit');

    expect(fixture.componentInstance.templatesVisiveis()).toEqual([arquivado]);
    (fixture.nativeElement.querySelector('[title="Reativar modelo"]') as HTMLButtonElement).click();

    expect(reativar).toHaveBeenCalledWith(arquivado);
  });

  it('oculta ações administrativas sem permissão visual', () => {
    fixture.componentRef.setInput('templates', [
      { ...template, personalizado: true, projetoId: 'projeto-1' },
    ]);
    fixture.componentRef.setInput('podeDuplicar', false);
    fixture.componentRef.setInput('podeEditar', false);
    fixture.componentRef.setInput('podeExcluir', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[title="Duplicar modelo"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[title="Editar modelo"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.is-danger')).toBeNull();
    expect(fixture.nativeElement.querySelector('[title="Pré-visualizar com dados atuais"]')).not.toBeNull();
  });

  it('busca modelos e mantém favoritos no topo', () => {
    const faq = { ...template, id: 'faq-1', codigo: 'FAQ', nome: 'Perguntas frequentes', ordem: 20 };
    fixture.componentRef.setInput('templates', [template, faq]);
    fixture.componentInstance.busca.set('perguntas');

    expect(fixture.componentInstance.templatesVisiveis().map(item => item.id)).toEqual(['faq-1']);

    fixture.componentInstance.busca.set('');
    fixture.componentInstance.alternarFavorito(faq, new Event('click'));
    expect(fixture.componentInstance.templatesVisiveis()[0].id).toBe('faq-1');
    expect(localStorage.getItem('docflow:templates-favoritos')).toContain('faq-1');
  });
});
