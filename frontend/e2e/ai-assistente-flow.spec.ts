import { expect, test } from '@playwright/test';
import { instalarMocksAiAssistente } from './helpers/ai-api-fixtures';

test.describe('Nexus AI — assistente (intercept, sem LLM)', () => {
  test('briefing → gerar → aplicar no editor', async ({ page }) => {
    await instalarMocksAiAssistente(page);

    await page.goto('/ai/assistente');
    await expect(page.getByRole('heading', { name: 'Assistente de página' })).toBeVisible();

    const briefing =
      'Consulta de pedidos\ncodigoTela: PED-CONSULTA\n' +
      'Público operador. Fluxo completo para filtrar e exportar pedidos.';
    await page.locator('#briefing').fill(briefing);
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page.getByText('Passo 2 de 3')).toBeVisible();
    await page.getByRole('button', { name: 'Gerar rascunho' }).click();

    await expect(page.getByText('Passo 3 de 3')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Consulta de pedidos')).toBeVisible();
    await expect(page.getByText('PED-CONSULTA')).toBeVisible();

    await page.getByRole('button', { name: 'Aplicar no editor' }).click();
    await expect(page).toHaveURL(/\/doc-flow\/paginas\/novo/, { timeout: 10_000 });
  });
});
