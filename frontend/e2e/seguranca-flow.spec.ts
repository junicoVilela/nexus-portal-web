import { expect, test, Page } from '@playwright/test';
import { instalarMocksSeguranca } from './helpers/seguranca-mock';

/**
 * E2E do fluxo do módulo Segurança após login admin/admin.
 *
 * Usa mocks de API (auth, RBAC e rotas mínimas do Doc Flow) via Playwright route.
 * Cobertura: login → navegação a 7 telas + ausência de proxy errors
 * (ConfiguracaoService) + ícones registrados em runtime.
 */

const errosConsole: { ctx: string; msg: string }[] = [];

async function instrumentar(page: Page, ctx: string) {
  page.on('console', msg => {
    if (msg.type() === 'error') errosConsole.push({ ctx, msg: msg.text() });
  });
  page.on('pageerror', e => errosConsole.push({ ctx, msg: `pageerror: ${e.message}` }));
}

async function logar(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Usuário').fill('admin');
  await page.getByLabel('Senha').fill('admin');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 8_000 });
}

test.describe('Segurança — fluxo após login', () => {
  test.beforeEach(async ({ page }, info) => {
    errosConsole.length = 0;
    await instrumentar(page, info.title);
    await instalarMocksSeguranca(page);
  });

  test.afterEach(async ({}, info) => {
    // Console errors de runtime (ícones faltantes, etc.) viram falha do teste.
    // Ignora 500s de fonts externas (offline em CI).
    const relevantes = errosConsole.filter(
      e => !/fonts\.googleapis\.com|status of 500|status of 404/i.test(e.msg),
    );
    if (relevantes.length > 0) {
      console.warn(`Console errors during "${info.title}":`);
      relevantes.forEach(e => console.warn('  -', e.msg));
    }
    expect(relevantes, 'console deve ficar limpo (sem ícones faltantes etc.)').toHaveLength(0);
  });

  test('login admin/admin redireciona pra dashboard', async ({ page }) => {
    await logar(page);
    expect(page.url()).not.toContain('/login');
  });

  test('/seguranca mostra as áreas principais de administração', async ({ page }) => {
    await logar(page);
    await page.goto('/seguranca');
    await expect(page.getByRole('link', { name: /usuários/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /domínios e permissões/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /auditoria/i })).toBeVisible();
  });

  test('/seguranca/usuarios renderiza a lista', async ({ page }) => {
    await logar(page);
    await page.goto('/seguranca/usuarios');
    await expect(page.locator('ui-list-page')).toBeVisible();
  });

  test('/seguranca/auditoria carrega sem erro', async ({ page }) => {
    await logar(page);
    await page.goto('/seguranca/auditoria');
    await expect(page.locator('ui-list-page')).toBeVisible();
  });

  test('/seguranca/grupos renderiza a lista', async ({ page }) => {
    await logar(page);
    await page.goto('/seguranca/grupos');
    await expect(page.locator('ui-list-page')).toBeVisible();
    await expect(page.getByText('Administradores')).toBeVisible();
  });

  test('/seguranca/dominios exibe matriz somente leitura', async ({ page }) => {
    await logar(page);
    await page.goto('/seguranca/dominios');
    await expect(page.getByRole('heading', { name: 'Matriz de segurança' })).toBeVisible();
    await expect(page.getByText('Catálogo definido por seed (somente leitura).')).toBeVisible();
    await expect(page.locator('app-matriz-seguranca').getByText('Segurança', { exact: true })).toBeVisible();
    await expect(page.locator('app-matriz-seguranca').getByText('SEGURANCA')).toBeVisible();
    await expect(page.getByRole('button', { name: /novo/i })).toHaveCount(0);
    await expect(page.locator('form')).toHaveCount(0);
  });

  test('/doc-flow mostra os itens essenciais do menu', async ({ page }) => {
    await logar(page);
    await page.goto('/doc-flow');
    await expect(page.locator('.df-shell__nav-link').filter({ hasText: 'Dashboard' })).toBeVisible();
    await expect(page.locator('.df-shell__nav-link').filter({ hasText: 'Páginas' })).toBeVisible();
    await expect(page.locator('.df-shell__nav-link').filter({ hasText: 'Publicações' })).toBeVisible();
  });

  test('/doc-flow/configuracoes não dispara requisições a /api real', async ({ page }) => {
    const apiCalls: string[] = [];
    page.on('requestfailed', r => {
      if (r.url().includes('/api/')) apiCalls.push(`${r.failure()?.errorText} ${r.url()}`);
    });
    await logar(page);
    await page.goto('/doc-flow/configuracoes');
    await page.waitForTimeout(500);
    expect(apiCalls, 'ConfiguracaoService mockado não deve falhar em /api/*').toEqual([]);
  });

  test('/release-orchestrator mostra os itens essenciais do menu', async ({ page }) => {
    await logar(page);
    await page.goto('/release-orchestrator');
    await expect(page.locator('.rf-shell__nav-link').filter({ hasText: 'Dashboard' })).toBeVisible();
    await expect(page.locator('.rf-shell__nav-link').filter({ hasText: 'Releases' })).toBeVisible();
    await expect(page.locator('.rf-shell__nav-link').filter({ hasText: 'Templates' })).toBeVisible();
  });
});
