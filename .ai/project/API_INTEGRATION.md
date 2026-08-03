# Integração com Backend

## API base

O frontend consome o backend `nexus-portal-api`.

Existem **dois prefixos**, configurados em `src/environments/environment.ts`:

```ts
export const environment = {
  apiUrl:             '/api/doc-flow',       // Doc Flow, Auth, Usuários, Configurações
  releaseOrchestratorApiUrl:  '/api/v1/release-orchestrator', // Release Orchestrator
};
```

Proxy de desenvolvimento (`proxy.conf.json`):

```json
{
  "/api/doc-flow/**": {
    "target": "http://localhost:8080",
    "pathRewrite": { "^/api/doc-flow": "/api/v1" }
  },
  "/api/v1/**": {
    "target": "http://localhost:8080"
  }
}
```

> `/api/doc-flow` é reescrito para `/api/v1` antes de chegar no backend. O release-orchestrator já
> usa `/api/v1/release-orchestrator` direto e tem rota própria de proxy.

## Organização

Cada módulo tem seu próprio service em `src/app/modules/{nome}/services/`.

```text
modules/manual-usuario/services/cliente.service.ts
modules/manual-usuario/services/projeto.service.ts
modules/release-orchestrator/services/release.service.ts
modules/release-orchestrator/services/produto-rh.service.ts
modules/administracao/services/usuario.service.ts
modules/administracao/services/configuracao.service.ts
```

## Padrão de service Angular (Doc Flow)

```ts
@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly base = `${environment.apiUrl}/clientes`;

  constructor(private readonly http: HttpClient) {}

  listar(params?: HttpParams): Observable<PageResult<Cliente>> {
    return this.http.get<PageResult<Cliente>>(this.base, { params });
  }

  buscar(id: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.base}/${id}`);
  }

  criar(data: ClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(this.base, data);
  }

  atualizar(id: string, data: ClienteRequest): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.base}/${id}`, data);
  }

  remover(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
```

## Padrão de service Angular (Release Orchestrator)

```ts
@Injectable({ providedIn: 'root' })
export class ReleaseService {
  private readonly base = `${environment.releaseOrchestratorApiUrl}/releases`;

  constructor(private readonly http: HttpClient) {}

  listar(params?: HttpParams): Observable<PageResult<Release>> {
    return this.http.get<PageResult<Release>>(this.base, { params });
  }

  buscar(id: string): Observable<Release> {
    return this.http.get<Release>(`${this.base}/${id}`);
  }

  criar(data: ReleaseRequest): Observable<Release> {
    return this.http.post<Release>(this.base, data);
  }
}
```

IDs do release-orchestrator são UUID (string), não number.
Endpoints disponíveis: consulte `nexus-portal-api/docs/release-orchestrator/37-contratos-openapi.md`.

## Models

Separar request e response quando há diferença:

```text
cliente.model.ts  ← interface Cliente (response)
                  ← interface ClienteRequest (create/update body)
```

## Autenticação

- Token JWT em `localStorage['doc-flow-jwt']`.
- Adicionado automaticamente pelo `authInterceptor` como `Authorization: Bearer <token>`.
- Em 401: interceptor limpa sessão e redireciona para `/login`.
- Não adicionar token manualmente em nenhum service.
- Login: `POST /api/doc-flow/auth/login` via `AuthService.login()`.

## Paginação

A API retorna `PageResult<T>`:

```ts
// shared/models/page-result.model.ts
export interface PageResult<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
```

Use `buildQueryParams()` de `shared/utils/http-params.util.ts` para montar `HttpParams`
a partir de objetos simples (números, strings, opcionais).

## Tratamento de erro

Usar interceptor global para 401.

Nos components, exibir mensagens amigáveis:

- "Não foi possível carregar os dados."
- "Não foi possível salvar o registro."
- "Registro não encontrado."
- "Você não tem permissão para executar esta ação."

Nunca use `fetch()` ou `XMLHttpRequest` direto no component — encapsule em um service com
`HttpClient`. Assim o interceptor de auth roda e os erros são tratados de forma uniforme.
