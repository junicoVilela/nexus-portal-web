import { TestBed } from '@angular/core/testing';
import { PaginaDraftService } from './pagina-draft.service';

describe('PaginaDraftService', () => {
  let service: PaginaDraftService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaginaDraftService);
    localStorage.clear();
  });

  it('salva e restaura o formulário com a data do rascunho', () => {
    const savedAt = service.salvar('pagina:1', { titulo: 'Cadastro' });
    const snapshot = service.carregar<{ titulo: string }>('pagina:1', { maxAgeDays: 7 });

    expect(savedAt).not.toBeNull();
    expect(snapshot?.value.titulo).toBe('Cadastro');
    expect(snapshot?.savedAt.getTime()).toBe(savedAt?.getTime());
  });

  it('descarta rascunho expirado', () => {
    localStorage.setItem(
      'pagina:1',
      JSON.stringify({ value: { titulo: 'Antigo' }, at: Date.now() - 8 * 86_400_000 }),
    );

    expect(service.carregar('pagina:1', { maxAgeDays: 7 })).toBeNull();
    expect(localStorage.getItem('pagina:1')).toBeNull();
  });

  it('descarta rascunho anterior à versão salva no servidor', () => {
    const at = Date.now() - 60_000;
    localStorage.setItem('pagina:1', JSON.stringify({ value: { titulo: 'Local' }, at }));

    expect(
      service.carregar('pagina:1', {
        maxAgeDays: 7,
        servidorAtualizadoEm: new Date().toISOString(),
      }),
    ).toBeNull();
  });
});
