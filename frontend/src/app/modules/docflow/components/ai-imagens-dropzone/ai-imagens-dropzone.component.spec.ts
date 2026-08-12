import { ComponentFixture, TestBed } from '@angular/core/testing';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AiImagensDropzoneComponent } from './ai-imagens-dropzone.component';

describe('AiImagensDropzoneComponent', () => {
  let fixture: ComponentFixture<AiImagensDropzoneComponent>;
  let cmp: AiImagensDropzoneComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiImagensDropzoneComponent],
      providers: [lucideTestIcons],
    }).compileComponents();

    fixture = TestBed.createComponent(AiImagensDropzoneComponent);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('aceita imagem válida via drop', () => {
    const emits: unknown[] = [];
    cmp.imagensChange.subscribe(v => emits.push(v));

    const file = new File([new Uint8Array(1200)], 'tela.png', { type: 'image/png' });
    const dt = new DataTransfer();
    dt.items.add(file);
    const event = new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true });
    cmp['onDrop'](event);

    expect(emits.length).toBe(1);
    expect((emits[0] as { nome: string }[])[0]?.nome).toBe('tela.png');
  });

  it('rejeita arquivo que não é imagem', () => {
    let erro: string | null = null;
    cmp.erroChange.subscribe(v => (erro = v));

    const file = new File(['x'], 'nota.txt', { type: 'text/plain' });
    const dt = new DataTransfer();
    dt.items.add(file);
    cmp['onDrop'](new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));

    expect(erro).toContain('não é imagem');
  });
});
