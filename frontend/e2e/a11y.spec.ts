import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Auditoria de a11y nas rotas públicas. Falha em violações WCAG 2.0 A/AA.
 *
 * Não exige backend — usamos `/login` (a única rota pública). Demais rotas
 * exigem autenticação e não fazem sentido testar sem dados reais aqui.
 */

test.describe('A11y', () => {
  test('/login não tem violações WCAG A/AA', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['region']) // o login é uma tela com 1 form; landmark desnecessário
      .analyze();

    if (results.violations.length > 0) {
      // eslint-disable-next-line no-console
      console.log('A11y violations:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });

  test('manifest e favicon respondem com headers corretos', async ({ request }) => {
    const manifest = await request.get('/manifest.webmanifest');
    expect(manifest.headers()['content-type']).toContain('manifest+json');
    const icon = await request.get('/assets/icons/icon.svg');
    expect(icon.headers()['content-type']).toContain('svg');
  });
});
