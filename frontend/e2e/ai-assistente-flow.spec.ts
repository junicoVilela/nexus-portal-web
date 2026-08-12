import { expect, test } from '@playwright/test';
import { instalarMocksAiAssistente } from './helpers/ai-api-fixtures';

test.describe('DocFlow — assistente IA (intercept, sem LLM)', () => {
  test('importa manual, revisa a ordem e leva somente uma página ao briefing', async ({ page }) => {
    await instalarMocksAiAssistente(page);
    await page.goto('/doc-flow/assistente');

    await page.locator('app-ai-documento-importacao input[type="file"]').setInputFiles({
      name: 'manual-cadastro.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('# Cadastro\n\n## Listagem\n\nA tela apresenta filtros e registros.'),
    });

    await expect(page.getByText('Estrutura sugerida para revisão')).toBeVisible();
    await expect(page.getByText('Cadastro de produto')).toBeVisible();
    await expect(page.getByText('1.1')).toBeVisible();
    await page.getByRole('button', { name: 'Criar estrutura e continuar' }).click();
    await expect(page.getByText('Projeto e módulos confirmados')).toBeVisible();
    await page.getByRole('button', { name: 'Gerar esta página' }).click();

    await expect(page.locator('#briefing')).toHaveValue(/### Página: Listagem de registros/);
    await expect(page.getByRole('button', { name: 'Em edição' })).toBeVisible();
  });

  test('briefing → gerar → aplicar no editor', async ({ page }) => {
    await instalarMocksAiAssistente(page);

    await page.goto('/doc-flow/assistente');
    await expect(page.getByRole('heading', { name: 'Assistente de página' })).toBeVisible();

    const briefing =
      'Consulta de pedidos\ncodigoTela: PED-CONSULTA\n' +
      'Público operador. Fluxo completo para filtrar e exportar pedidos.';
    await page.locator('#briefing').fill(briefing);
    await page.getByRole('button', { name: 'Analisar página' }).click();

    await expect(page.getByText('Passo 2 de 3')).toBeVisible();
    await page.getByRole('button', { name: 'Gerar rascunho' }).click();

    await expect(page.getByText('Passo 3 de 3')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Consulta de pedidos')).toBeVisible();
    await expect(page.getByText('PED-CONSULTA')).toBeVisible();

    await page.getByRole('button', { name: 'Aplicar no editor' }).click();
    await expect(page).toHaveURL(/\/doc-flow\/paginas\/novo/, { timeout: 10_000 });
  });
});
