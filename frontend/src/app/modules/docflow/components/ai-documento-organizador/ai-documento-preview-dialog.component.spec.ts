import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import {
  AiDocumentoInspectorResultado,
  AiDocumentoPreviewDialogComponent,
  AiDocumentoPreviewDialogData,
} from './ai-documento-preview-dialog.component';
import { PaginaBlocoService } from '../../services/pagina-bloco.service';

describe('AiDocumentoPreviewDialogComponent', () => {
  let fixture: ComponentFixture<AiDocumentoPreviewDialogComponent>;
  let dialogRef: jasmine.SpyObj<DialogRef<AiDocumentoInspectorResultado | undefined>>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj<DialogRef<AiDocumentoInspectorResultado | undefined>>('DialogRef', [
      'close',
    ]);
    const data: AiDocumentoPreviewDialogData = {
      projetoNome: 'Portal',
      paginasMesclagem: [
        {
          id: 'pagina-2',
          titulo: 'Editar usuários',
          ordem: 4,
          briefing:
            '# Projeto: Portal\n\n## Módulo: Usuários\n\n### Página: Editar usuários\n\nAltere os campos e salve.',
          templateId: null,
          templateCodigo: null,
          templateNome: null,
          confiancaTemplate: 0,
          motivoTemplate: 'Modelo pendente.',
          status: 'PENDENTE',
          paginaId: null,
          sessaoId: null,
          erroMensagem: null,
          origem: 'DOCUMENTO',
          ajustadaManualmente: false,
        },
      ],
      modulo: {
        id: 'modulo-1',
        moduloId: null,
        nome: 'Usuários',
        ordem: 2,
        paginas: [],
      },
      pagina: {
        id: 'pagina-1',
        titulo: 'Consultar usuários',
        ordem: 3,
        briefing:
          '# Projeto: Portal\n\n## Módulo: Usuários\n\n### Página: Consultar usuários\n\nUse os filtros para localizar um usuário. <script>alert("x")</script>',
        templateId: null,
        templateCodigo: 'CONSULTA',
        templateNome: 'Consulta com filtros',
        confiancaTemplate: 0.9,
        motivoTemplate: 'Filtros identificados.',
        status: 'PENDENTE',
        paginaId: null,
        sessaoId: null,
        erroMensagem: null,
        origem: 'DOCUMENTO',
        ajustadaManualmente: false,
        blueprintId: 'consulta-operacional',
        blueprintNome: 'Consulta operacional',
        componentesSelecionados: ['introducao', 'visao-tela', 'filtros-resultado'],
        componentesObrigatorios: ['introducao'],
        composicaoAjustadaManualmente: false,
      },
    };

    await TestBed.configureTestingModule({
      imports: [AiDocumentoPreviewDialogComponent],
      providers: [
        lucideTestIcons,
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
        {
          provide: PaginaBlocoService,
          useValue: {
            listar: () =>
              of([
                bloco('introducao', 'Introdução'),
                bloco('visao-tela', 'Visão da tela'),
                bloco('filtros-resultado', 'Filtros e resultados'),
                bloco('resultado-esperado', 'Resultado esperado'),
              ]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiDocumentoPreviewDialogComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renderiza metadados e o briefing completo de forma segura', () => {
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('Consultar usuários');
    expect(texto).toContain('2.3');
    expect(texto).toContain('Consulta com filtros');
    expect(texto).toContain('Use os filtros para localizar um usuário.');
    expect(fixture.nativeElement.querySelector('script')).toBeNull();
  });

  it('fecha a prévia pelo botão', () => {
    const botao = fixture.nativeElement.querySelector('[aria-label="Fechar prévia"]') as HTMLButtonElement;

    botao.click();

    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('edita título e conteúdo e devolve a alteração ao organizador', () => {
    fixture.componentInstance['editar']();
    fixture.componentInstance['paginaForm'].setValue({
      titulo: 'Pesquisar usuários',
      conteudo: 'Use filtros avançados para localizar um usuário.',
    });

    fixture.componentInstance['salvar']();

    expect(dialogRef.close).toHaveBeenCalledWith({
      tipo: 'SALVAR',
      titulo: 'Pesquisar usuários',
      conteudo: 'Use filtros avançados para localizar um usuário.',
    });
  });

  it('prepara divisão em duas páginas e devolve os dois conteúdos', () => {
    fixture.componentInstance['paginaForm'].controls.conteudo.setValue(
      'Primeiro bloco da página.\n\nSegundo bloco da página.',
    );

    fixture.componentInstance['dividir']();
    fixture.componentInstance['confirmarDivisao']();

    expect(dialogRef.close).toHaveBeenCalledWith(
      jasmine.objectContaining({
        tipo: 'DIVIDIR',
        atual: jasmine.objectContaining({ conteudo: 'Primeiro bloco da página.' }),
        nova: jasmine.objectContaining({ conteudo: 'Segundo bloco da página.' }),
      }),
    );
  });

  it('mescla com outra página e identifica a página removida', () => {
    fixture.componentInstance['mesclar']();
    fixture.componentInstance['confirmarMesclagem']();

    expect(dialogRef.close).toHaveBeenCalledWith(
      jasmine.objectContaining({
        tipo: 'MESCLAR',
        paginaRemovidaId: 'pagina-2',
        conteudo: jasmine.stringMatching(/Altere os campos e salve/),
      }),
    );
  });

  it('devolve a composição modular revisada mantendo a ordem escolhida', () => {
    fixture.componentInstance['compor']();
    fixture.componentInstance['atualizarComponentes'](['introducao', 'resultado-esperado', 'visao-tela']);
    fixture.componentInstance['salvarComposicao']();

    expect(dialogRef.close).toHaveBeenCalledWith({
      tipo: 'COMPOSICAO',
      componentesSelecionados: ['introducao', 'resultado-esperado', 'visao-tela'],
    });
  });
});

function bloco(id: string, nome: string) {
  return {
    id,
    nome,
    descricao: nome,
    categoria: 'Estrutura' as const,
    visual: 'intro',
    html: `<section>${nome}</section>`,
  };
}
