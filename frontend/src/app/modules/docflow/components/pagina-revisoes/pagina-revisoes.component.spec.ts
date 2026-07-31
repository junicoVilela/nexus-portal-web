import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginaRevisao } from '@modules/docflow/models/pagina.model';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { PaginaRevisoesComponent } from './pagina-revisoes.component';

describe('PaginaRevisoesComponent', () => {
  let fixture: ComponentFixture<PaginaRevisoesComponent>;

  const revisao = (overrides: Partial<PaginaRevisao> = {}): PaginaRevisao =>
    ({
      id: 'r1',
      numero: 1,
      titulo: 'Página',
      tipo: 'SALVAMENTO_MANUAL',
      status: 'RASCUNHO',
      createdAt: '2026-01-01T10:00:00Z',
      createdBy: 'editor',
      ...overrides,
    }) as PaginaRevisao;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaRevisoesComponent],
      providers: [lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(PaginaRevisoesComponent);
    fixture.componentRef.setInput('revisoes', [revisao(), revisao({ id: 'r2', numero: 2 })]);
    fixture.componentRef.setInput('totalRevisoes', 2);
    fixture.componentRef.setInput('revisoesPage', 1);
    fixture.componentRef.setInput('revisoesPageSize', 10);
    fixture.componentRef.setInput('revisoesSort', 'numero');
    fixture.componentRef.setInput('revisoesDir', 'DESC');
    fixture.componentRef.setInput('showDiff', true);
    fixture.componentRef.setInput('diffLinhas', [{ tipo: '+', tokens: [{ tipo: '+', texto: 'novo' }] }]);
    fixture.componentRef.setInput('conteudoAnterior', '<p>antigo</p>');
    fixture.componentRef.setInput('conteudoAtual', '<p>novo</p>');
    fixture.componentRef.setInput('nomeUsuario', (user?: string) => user ?? 'sistema');
    fixture.detectChanges();
  });

  it('renderiza diff unificado por padrão', () => {
    expect(fixture.nativeElement.querySelector('.pf-diff')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('novo');
  });

  it('alterna para visualização lado a lado', () => {
    fixture.componentInstance['definirModoDiff']('lado-a-lado');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.df-diff-side')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Versão anterior');
    expect(fixture.nativeElement.textContent).toContain('Versão atual');
  });
});
