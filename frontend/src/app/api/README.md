# Cliente da API

`generated/` é produzido automaticamente a partir de
`openapi/softon-portal-api.json`. Não edite os arquivos gerados manualmente.

```bash
npm run api:generate
npm run api:check
```

O cliente usa `HttpClient` do Angular e pode ser adotado gradualmente pelos
services existentes. O snapshot OpenAPI deve ser atualizado a partir de
`GET /v3/api-docs` sempre que o contrato do backend mudar.

Exemplo com o backend local:

```bash
curl --fail http://localhost:8080/v3/api-docs \
  --output openapi/softon-portal-api.json
npm run api:generate
```

O provider é registrado em `app.config.ts`; com isso o cliente gerado participa dos
mesmos interceptors de autenticação, loading e erro usados pelos services manuais.
