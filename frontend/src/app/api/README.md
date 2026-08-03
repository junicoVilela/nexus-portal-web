# Cliente da API

`generated/` é produzido automaticamente a partir de
`openapi/nexus-portal-api.json`. Não edite os arquivos gerados manualmente.

```bash
npm run api:generate
npm run api:check
```

O cliente usa `HttpClient` do Angular e pode ser adotado gradualmente pelos
services existentes. O snapshot OpenAPI deve ser atualizado a partir de
`GET /v3/api-docs` sempre que o contrato do backend mudar.

## Atualizar o snapshot (fluxo principal)

Com o backend local em execução:

```bash
curl --fail http://localhost:8080/v3/api-docs \
  --output openapi/nexus-portal-api.json
npm run api:generate
```

## Geração via Maven (opcional)

O módulo `nexus-portal-api/application` declara o
`springdoc-openapi-maven-plugin` para exportar a spec quando a aplicação está
rodando (o plugin consulta `http://localhost:8080/v3/api-docs`).

```bash
# 1) Subir a API (ex.: profile dev)
cd nexus-portal-api && ./mvnw -pl application spring-boot:run -Dspring-boot.run.profiles=dev

# 2) Em outro terminal, gerar openapi.yaml em application/docs/api/
cd nexus-portal-api && ./mvnw -pl application org.springdoc:springdoc-openapi-maven-plugin:generate
```

O goal não está ligado ao ciclo `mvn test` — CI continua verde. Para o frontend,
o `curl` + snapshot versionado permanece o caminho preferido.

O provider é registrado em `app.config.ts`; com isso o cliente gerado participa dos
mesmos interceptors de autenticação, loading e erro usados pelos services manuais.
