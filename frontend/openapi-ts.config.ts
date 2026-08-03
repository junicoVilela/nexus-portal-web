import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi/nexus-portal-api.json',
  output: {
    path: 'src/app/api/generated',
    clean: true,
  },
  plugins: [
    '@hey-api/typescript',
    {
      name: '@hey-api/client-angular',
      throwOnError: true,
    },
    '@hey-api/sdk',
    '@angular/common',
  ],
});
