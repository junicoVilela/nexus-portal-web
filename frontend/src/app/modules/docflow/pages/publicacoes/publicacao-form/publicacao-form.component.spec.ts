import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { ClienteService } from '@modules/docflow/services/cliente.service';
import { Publicacao } from '@modules/docflow/models/publicacao.model';
import { PublicacaoService } from '@modules/docflow/services/publicacao.service';
import { NotificationService, ToastService } from '@shared/ui';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { PublicacaoFormComponent } from './publicacao-form.component';

describe('PublicacaoFormComponent', () => {
  let fixture: ComponentFixture<PublicacaoFormComponent>;
  let publicacaoService: PublicacaoService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicacaoFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        lucideTestIcons,
        {
          provide: ClienteService,
          useValue: { clientes: () => of([{ id: 'c1', nome: 'Cliente A', slug: 'cliente-a', ativo: true }]) },
        },
        {
          provide: ToastService,
          useValue: { success: jasmine.createSpy('success'), error: jasmine.createSpy('error'), warn: jasmine.createSpy('warn') },
        },
        {
          provide: NotificationService,
          useValue: { add: jasmine.createSpy('add') },
        },
      ],
    }).compileComponents();
    publicacaoService = TestBed.inject(PublicacaoService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(PublicacaoFormComponent);
    fixture.detectChanges();
  });

  it('renderiza sem erros', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('form começa inválido (clienteId + versao obrigatórios)', () => {
    expect(fixture.componentInstance.form.valid).toBe(false);
  });

  it('selecionar cliente dispara preview e diagnóstico', () => {
    const previewSpy = spyOn(publicacaoService, 'previewPublicacao').and.returnValue(of([]));
    const diagnosticoSpy = spyOn(publicacaoService, 'diagnosticoPublicacao').and.returnValue(of([]));

    fixture.componentInstance.form.patchValue({ clienteId: 'c1', versao: '2026.04' });
    fixture.componentInstance.preview();

    expect(previewSpy).toHaveBeenCalledWith('c1');
    expect(diagnosticoSpy).toHaveBeenCalledWith('c1');
  });

  it('gerar navega para publicações após sucesso', () => {
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(publicacaoService, 'gerarPublicacao').and.returnValue(
      of({
        id: 'pub-1',
        clienteId: 'c1',
        clienteNome: 'Cliente A',
        versao: '2026.04',
        status: 'SUCESSO',
        cancelamentoSolicitado: false,
        quantidadePaginas: 1,
        quantidadeModulos: 1,
        createdAt: '2026-01-01T00:00:00Z',
        createdBy: 'editor',
      } satisfies Publicacao),
    );

    fixture.componentInstance.form.patchValue({ clienteId: 'c1', versao: '2026.04' });
    fixture.componentInstance.gerar();

    expect(navigate).toHaveBeenCalled();
    const commands = navigate.calls.mostRecent().args[0] as string[];
    expect(commands.join('/')).toContain('publicacoes');
  });
});
