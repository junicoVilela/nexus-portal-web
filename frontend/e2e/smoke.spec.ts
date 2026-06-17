import { expect, test } from '@playwright/test';

/**
 * Smoke E2E sem backend: confia que a app sobe, redireciona pra /login
 * e renderiza componentes-chave. Não exige API real.
 */

test.describe('Smoke', () => {
  test('redireciona / para /login quando não autenticado', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('tela de login renderiza form com campos esperados (login/senha)', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[formcontrolname="login"]').first()).toBeVisible();
    await expect(page.locator('input[formcontrolname="senha"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('manifest.webmanifest está acessível e tem nome correto', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Softon Portal');
    expect(body.theme_color).toBe('#2563eb');
  });

  test('título da página é Softon Portal', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Softon/i);
  });
});
