import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'];

/**
 * Configuração de smoke E2E.
 *
 * Estes testes NÃO precisam de backend real: validam apenas que a app
 * monta, rotas públicas funcionam e a UI principal renderiza. O servidor
 * de dev é levantado em `http://localhost:4200`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    actionTimeout: 5_000,
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'npx ng serve --port 4200 --host 127.0.0.1',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: executablePath ? { executablePath } : undefined,
      },
    },
  ],
});
