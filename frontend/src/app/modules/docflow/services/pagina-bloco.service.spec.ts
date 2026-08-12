import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { PaginaBlocoService } from './pagina-bloco.service';

describe('PaginaBlocoService', () => {
  let service: PaginaBlocoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PaginaBlocoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carrega e compartilha o catálogo canônico do backend', fakeAsync(() => {
    const resultados: unknown[] = [];
    service.listar().subscribe(lista => resultados.push(lista));
    service.listar().subscribe(lista => resultados.push(lista));
    tick();

    const req = http.expectOne('/api/v1/docflow/paginas/blocos');
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 'introducao',
        nome: 'Introdução',
        descricao: 'Contexto',
        categoria: 'Estrutura',
        visual: 'intro',
        html: '<section></section>',
        versao: 1,
        slots: [],
      },
    ]);
    tick();

    expect(resultados.length).toBe(2);
  }));
});
