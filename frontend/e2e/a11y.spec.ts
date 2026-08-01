import { expect, test } from '@playwright/test';
import { analisarA11y, instalarMocksDocFlowA11y } from './helpers/docflow-a11y-mock';

/**
 * Auditoria de a11y nas rotas públicas e nas rotas Doc Flow com mock de API.
 * Falha em violações WCAG 2.0 A/AA.
 */

test.describe('A11y', () => {
  test('/login não tem violações WCAG A/AA', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await analisarA11y(page);
  });

  test('/doc-flow dashboard atende WCAG A/AA com mock autenticado', async ({ page }) => {
    await instalarMocksDocFlowA11y(page);
    await page.goto('/doc-flow');
    await page.waitForSelector('.df-dash');
    await analisarA11y(page, '.df-dash');
  });

  test('/doc-flow/midias atende WCAG A/AA com mock autenticado', async ({ page }) => {
    await instalarMocksDocFlowA11y(page);
    await page.goto('/doc-flow/midias');
    await page.waitForSelector('.media-filters');
    await analisarA11y(page, 'ui-list-page');
  });

  test('/doc-flow/paginas atende WCAG A/AA com mock autenticado', async ({ page }) => {
    await instalarMocksDocFlowA11y(page);
    await page.goto('/doc-flow/paginas');
    await page.waitForSelector('ui-list-page');
    await analisarA11y(page, 'ui-list-page');
  });

  test('/doc-flow/publicacoes atende WCAG A/AA com mock autenticado', async ({ page }) => {
    await instalarMocksDocFlowA11y(page);
    await page.goto('/doc-flow/publicacoes');
    await page.waitForSelector('ui-list-page');
    await analisarA11y(page, 'ui-list-page', '.pubs__stats');
  });

  test('manifest e favicon respondem com headers corretos', async ({ request }) => {
    const manifest = await request.get('/manifest.webmanifest');
    expect(manifest.headers()['content-type']).toContain('manifest+json');
    const icon = await request.get('/assets/icons/icon.svg');
    expect(icon.headers()['content-type']).toContain('svg');
  });
});
