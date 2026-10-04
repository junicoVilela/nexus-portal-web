import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AuthService } from '@core/auth/services/auth.service';
import { ToastService } from '@shared/ui';
import { AiFilaPrItem } from '../../models/ai-fila-pr.model';
import { AiAplicacao, AiProposta } from '../../models/ai-proposta.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { AiPropostasIaComponent } from './ai-propostas-ia.component';

describe('AiPropostasIaComponent', () => {
  let fixture: ComponentFixture<AiPropostasIaComponent>;
  let ai: jasmine.SpyObj<AiAssistenteService>;
  let router: Router;

  function item(parcial: Partial<AiFilaPrItem> = {}): AiFilaPrItem {
    return {
      id: 'i1',
      origem: 'PR',
      repositorio: 'org/app',
      numeroPr: 42,
      titulo: 'Tela de exportação',
      corpo: null,
      url: 'https://github.com/org/app/pull/42',
      autor: 'dev',
      branchBase: 'main',
      mergedAt: '2026-10-01T12:00:00Z',
      classificacao: 'UI_NOVA',
      codigoTela: 'EXP-901',
      status: 'EM_FILA',
      mensagem: null,
      sessaoId: 's1',
      sessaoStatus: 'PRONTA',
      paginaId: null,
      responsavel: null,
      createdAt: '2026-10-01T12:00:00Z',
      proposta: {
        id: 'p1',
        sessaoId: 's1',
        tipo: 'NOVA',
        titulo: 'Exportação',
        codigoTela: 'EXP-901',
        conteudoHtml: '<p>x</p>',
        qualidade: [],
        status: 'PENDENTE',
      } as unknown as AiProposta,
      pendente: true,
      capturasDaTela: 0,
      ...parcial,
    };
  }

  async function criar(itens: AiFilaPrItem[]): Promise<void> {
    ai = jasmine.createSpyObj<AiAssistenteService>('AiAssistenteService', [
      'filaPr',
      'assumirItemFila',
      'aceitarItemFila',
      'rejeitarItemFila',
      'reprocessarItemFila',
      'dispensarItemFila',
      'aplicar',
      'gerar',
    ]);
    ai.filaPr.and.returnValue(of(itens));
    await TestBed.configureTestingModule({
      imports: [AiPropostasIaComponent],
      providers: [
        provideRouter([]),
        lucideTestIcons,
        { provide: AiAssistenteService, useValue: ai },
        { provide: AuthService, useValue: { tem: () => () => true } },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success']) },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(AiPropostasIaComponent);
    fixture.detectChanges();
  }

  function botao(texto: string): HTMLButtonElement {
    return Array.from(fixture.nativeElement.querySelectorAll('button')).find(b =>
      (b as HTMLElement).textContent?.includes(texto),
    ) as HTMLButtonElement;
  }

  it('lista os pendentes e mostra a proposta de página nova', async () => {
    await criar([item()]);
    expect(ai.filaPr).toHaveBeenCalledWith(true);
    expect(fixture.nativeElement.textContent).toContain('org/app#42');
    expect(fixture.nativeElement.querySelector('app-ai-proposta-preview')).toBeTruthy();
  });

  it('aceitar cria o rascunho e abre a página', async () => {
    await criar([item()]);
    ai.aceitarItemFila.and.returnValue(of({ paginaId: 'pg1' } as AiAplicacao));

    botao('Aceitar e criar rascunho').click();

    expect(ai.aceitarItemFila).toHaveBeenCalledWith('i1');
    expect(router.navigate).toHaveBeenCalledWith(['/doc-flow/paginas', 'pg1', 'editar']);
  });

  it('ajuste assume o item e abre o editor com o painel', async () => {
    const ajuste = item({
      paginaId: 'pg7',
      classificacao: 'UI_ALTERACAO',
      proposta: { ...item().proposta!, tipo: 'ATUALIZACAO', resumoDaMudanca: 'Novos filtros', operacoes: [] },
    });
    await criar([ajuste]);
    ai.assumirItemFila.and.returnValue(of(ajuste));

    botao('Revisar no editor').click();

    expect(ai.assumirItemFila).toHaveBeenCalledWith('i1');
    expect(router.navigate).toHaveBeenCalledWith(['/doc-flow/paginas', 'pg7', 'editar'], {
      queryParams: { ajuste: 's1' },
    });
  });

  it('página publicada oferece gerar o ajuste depois de voltar a rascunho', async () => {
    const aguardando = item({
      status: 'AGUARDANDO_RASCUNHO',
      proposta: null,
      sessaoId: null,
      paginaId: 'pg7',
    });
    await criar([aguardando]);
    ai.reprocessarItemFila.and.returnValue(of({ ...aguardando, status: 'EM_FILA', sessaoStatus: 'GERANDO' }));

    expect(fixture.nativeElement.textContent).toContain('Aguardando rascunho');
    botao('Gerar ajuste').click();
    fixture.detectChanges();

    expect(ai.reprocessarItemFila).toHaveBeenCalledWith('i1');
    expect(fixture.nativeElement.textContent).toContain('A IA está preparando a proposta');
  });

  it('aba Todos inclui os ignorados', async () => {
    await criar([]);
    expect(fixture.nativeElement.textContent).toContain('Nada pendente');
    botao('Todos').click();
    expect(ai.filaPr).toHaveBeenCalledWith(false);
  });

  it('item de release oferece gerar ajuste ou dispensar e avisa das capturas', async () => {
    const release = item({
      origem: 'RELEASE',
      repositorio: 'Portal 1.5.0',
      numeroPr: null,
      status: 'PARA_REVISAR',
      proposta: null,
      sessaoId: null,
      paginaId: 'pg7',
      codigoTela: 'PED-001',
      corpo: '- Filtro por status na PED-001',
      url: '/release-orchestrator/releases/r1',
      capturasDaTela: 2,
    });
    await criar([release, item({ id: 'i2' })]);
    ai.dispensarItemFila.and.returnValue(of({ ...release, status: 'IGNORADO', pendente: false }));

    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Portal 1.5.0 · PED-001');
    expect(texto).toContain('Para revisar');
    expect(texto).toContain('2 capturas da tela PED-001');
    expect(texto).toContain('- Filtro por status na PED-001');

    botao('Dispensar').click();
    expect(ai.dispensarItemFila).toHaveBeenCalledWith('i1');

    botao('Releases').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.fp__item').length).toBe(1);
  });
});
