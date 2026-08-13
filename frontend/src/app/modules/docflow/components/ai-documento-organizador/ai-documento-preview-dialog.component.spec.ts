import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import {
  AiDocumentoPreviewDialogComponent,
  AiDocumentoPreviewDialogData,
} from './ai-documento-preview-dialog.component';

describe('AiDocumentoPreviewDialogComponent', () => {
  let fixture: ComponentFixture<AiDocumentoPreviewDialogComponent>;
  let dialogRef: jasmine.SpyObj<DialogRef<void>>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj<DialogRef<void>>('DialogRef', ['close']);
    const data: AiDocumentoPreviewDialogData = {
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
      },
    };

    await TestBed.configureTestingModule({
      imports: [AiDocumentoPreviewDialogComponent],
      providers: [
        lucideTestIcons,
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
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
});
