import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { PaginaBlueprintService } from './pagina-blueprint.service';

describe('PaginaBlueprintService', () => {
  let service: PaginaBlueprintService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PaginaBlueprintService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carrega e compartilha os blueprints editoriais', fakeAsync(() => {
    const resultados: unknown[] = [];
    service.listar().subscribe(lista => resultados.push(lista));
    service.listar().subscribe(lista => resultados.push(lista));
    tick();

    const req = http.expectOne('/api/v1/docflow/paginas/blueprints');
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 'consulta-operacional',
        nome: 'Consulta operacional',
        descricao: 'Consulta com filtros e ações.',
        tipoConteudo: 'CONSULTA',
        versao: 1,
        status: 'PUBLICADO',
        minimoComponentes: 4,
        maximoComponentes: 7,
        templatesCompativeis: ['CONSULTA'],
        secoes: [],
      },
    ]);
    tick();

    expect(resultados.length).toBe(2);
    expect((resultados[0] as { id: string }[])[0].id).toBe('consulta-operacional');
  }));
});
