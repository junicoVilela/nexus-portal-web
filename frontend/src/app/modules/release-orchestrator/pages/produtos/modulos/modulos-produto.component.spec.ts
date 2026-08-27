import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { ModuloProduto } from '../../../models/modulo-produto.model';
import { Produto } from '../../../models/produto.model';
import { ModulosProdutoComponent } from './modulos-produto.component';

const PRODUTO: Produto = {
  id: 'p1',
  nome: 'Softon V5',
  sigla: 'LD',
  cor: '#2563eb',
  ativo: true,
};

const MODULO: ModuloProduto = {
  id: 'm1',
  produtoId: 'p1',
  codigo: 'nexus-portal',
  nome: 'Portal Web',
  tipo: 'WEB',
  geraDelta: false,
  obrigatorio: true,
  ordem: 2,
  ativo: true,
};

describe('ModulosProdutoComponent', () => {
  let fixture: ComponentFixture<ModulosProdutoComponent>;
  let http: HttpTestingController;
  let component: ModulosProdutoComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModulosProdutoComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        lucideTestIcons,
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: 'p1' })) },
        },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ModulosProdutoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    flushLoad();
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function flushLoad(modulos: ModuloProduto[] = [MODULO]): void {
    http.expectOne('/api/v1/release-orchestrator/produtos/p1').flush(PRODUTO);
    http.expectOne('/api/v1/release-orchestrator/produtos/p1/modulos').flush(modulos);
  }

  it('lista os módulos do produto', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('nexus-portal');
    expect(el.textContent).toContain('Portal Web');
  });

  it('abre o modal de cadastro com tiles de tipo e overlay', () => {
    component['abrirNovo']();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.rf-overlay')).toBeTruthy();
    expect(el.querySelector('.rf-modal--modulo')).toBeTruthy();
    expect(el.textContent).toContain('Novo módulo');
    expect(el.querySelectorAll('.rf-modal__tipo').length).toBe(6);
    expect(component['form'].get('ordem')?.value).toBe(3);
  });

  it('ao escolher BANCO aplica defaults e atualiza extensões aceitas', () => {
    component['abrirNovo']();
    component['escolherTipo']('BANCO');
    fixture.detectChanges();

    expect(component['tipoAtual']()).toBe('BANCO');
    expect(component['form'].get('geraDelta')?.value).toBe(true);
    expect(component['form'].get('obrigatorio')?.value).toBe(true);
    expect(component['extensoesAceitas']()).toEqual(['.sql', '.zip']);
    expect(fixture.nativeElement.textContent).toContain('.sql');
  });

  it('trava código, tipo e ordem na edição', () => {
    component['editar'](MODULO);
    fixture.detectChanges();

    expect(component['editando']()).toBe(true);
    expect(component['form'].get('codigo')?.disabled).toBe(true);
    expect(component['form'].get('tipo')?.disabled).toBe(true);
    expect(component['form'].get('ordem')?.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('imutável');
  });
});
