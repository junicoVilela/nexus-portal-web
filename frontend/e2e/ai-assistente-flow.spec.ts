import { expect, test } from '@playwright/test';
import { instalarMocksAiAssistente } from './helpers/ai-api-fixtures';

test.describe('DocFlow — assistente IA (intercept, sem LLM)', () => {
  test('importa manual, revisa páginas e leva a estrutura confirmada ao briefing', async ({ page }) => {
    await instalarMocksAiAssistente(page);
    await page.goto('/doc-flow/assistente');

    await page.locator('app-ai-documento-importacao input[type="file"]').setInputFiles({
      name: 'manual-cadastro.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('# Cadastro\n\n## Listagem\n\nA tela apresenta filtros e registros.'),
    });

    await expect(page.getByText('Estrutura sugerida para revisão')).toBeVisible();
    await expect(
      page.locator('.doc-import__summary strong', { hasText: 'Cadastro de produto' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ordene módulos e páginas' })).toBeVisible();
    await expect(page.locator('.organizer__page-order', { hasText: '1.1' })).toBeVisible();
    await page.getByRole('button', { name: 'Visualizar conteúdo da página Listagem de registros' }).click();
    const previa = page.getByRole('dialog', { name: 'Conteúdo da página Listagem de registros' });
    await expect(previa).toBeVisible();
    await expect(previa.getByText('A tela apresenta filtros, tabela e paginação.')).toBeVisible();
    await expect(previa.getByText('Listar e consultar registros')).toBeVisible();
    await previa.getByRole('button', { name: 'Editar', exact: true }).click();
    await previa.getByLabel('Título da página').fill('Pesquisa de registros');
    await previa
      .getByLabel('Conteúdo que será enviado à IA')
      .fill('Use os filtros para localizar registros.\n\nConsulte os resultados e a paginação.');
    await previa.getByRole('button', { name: 'Salvar página' }).click();
    await expect(previa).toBeHidden();
    await expect(page.locator('.organizer__page').filter({ hasText: 'Pesquisa de registros' })).toBeVisible();

    await page
      .getByRole('button', {
        name: 'Visualizar conteúdo da página Pesquisa de registros',
        exact: true,
      })
      .click();
    const inspetor = page.getByRole('dialog', { name: 'Conteúdo da página Pesquisa de registros' });
    await inspetor.getByRole('button', { name: 'Dividir', exact: true }).click();
    await inspetor.getByRole('button', { name: 'Criar duas páginas' }).click();
    await expect(page.locator('.organizer__page')).toHaveCount(2);

    await page
      .getByRole('button', {
        name: 'Visualizar conteúdo da página Pesquisa de registros',
        exact: true,
      })
      .click();
    const mesclagem = page.getByRole('dialog', {
      name: 'Conteúdo da página Pesquisa de registros',
      exact: true,
    });
    await mesclagem.getByRole('button', { name: 'Mesclar', exact: true }).click();
    await mesclagem.getByRole('button', { name: 'Mesclar páginas' }).click();
    await expect(page.locator('.organizer__page')).toHaveCount(1);

    await page.getByRole('button', { name: 'Adicionar página ao módulo Cadastros' }).click();
    const novaPagina = page.getByRole('dialog', { name: 'Nova página no módulo Cadastros' });
    await novaPagina.getByLabel('Título da nova página').fill('Exportar registros');
    await novaPagina
      .getByLabel('Conteúdo e instruções')
      .fill('Explique como exportar o resultado filtrado para Excel e PDF.');
    await novaPagina.getByRole('button', { name: 'Salvar página' }).click();
    await expect(page.locator('.organizer__page')).toHaveCount(2);
    await expect(page.locator('.organizer__page').filter({ hasText: 'Criada manualmente' })).toBeVisible();

    await page.getByRole('button', { name: 'Visualizar conteúdo da página Exportar registros' }).click();
    const paginaManual = page.getByRole('dialog', { name: 'Conteúdo da página Exportar registros' });
    await paginaManual.getByRole('button', { name: 'Remover', exact: true }).click();
    await page.getByRole('button', { name: 'Remover página' }).click();
    await expect(page.locator('.organizer__page')).toHaveCount(1);

    await page.getByLabel('Novo módulo').fill('Relatórios');
    await page.getByRole('button', { name: 'Criar módulo' }).click();
    await expect(page.locator('.organizer__module')).toHaveCount(2);
    const modulos = await page.locator('.organizer__module').evaluateAll(cards =>
      cards.map(card => {
        const box = card.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom };
      }),
    );
    expect(modulos[1].top).toBeGreaterThan(modulos[0].bottom);
    await page.getByRole('button', { name: 'Remover módulo Relatórios' }).click();
    await expect(page.locator('.organizer__module')).toHaveCount(1);
    await page.getByRole('button', { name: 'Criar estrutura e continuar' }).click();
    await expect(page.getByText('Projeto e módulos confirmados')).toBeVisible();
    await page.getByRole('button', { name: 'Gerar esta página' }).click();

    await expect(page.locator('#briefing')).toHaveValue(/### Página: Pesquisa de registros/);
    await expect(page.locator('#briefing')).toHaveValue(/Consulte os resultados e a paginação/);
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
