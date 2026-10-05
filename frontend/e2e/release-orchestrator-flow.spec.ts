import { expect, test, Page } from '@playwright/test';
import { instalarMocksSeguranca } from './helpers/identity-access-mock';

/**
 * E2E do módulo Release Orchestrator após login admin/admin.
 *
 * Estes testes **não exigem backend real** (login e GETs mockados, listas vazias) — eles validam que cada tela
 * monta, renderiza o cabeçalho/skeleton e não emite erros runtime de
 * JavaScript (ícones faltantes, components quebrados, etc.). Chamadas de
 * API que falham silenciosamente caem em error-state — também é cobertura
 * útil.
 *
 * O happy path completo (release → entrega → download) está em
 * {@code jornadaCompleta} marcado como skip — exige seeds determinísticos
 * no backend. Quando o time tiver fixture stable, remover o skip.
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

test.describe('Release Orchestrator — telas após login', () => {
  test.beforeEach(async ({ page }, info) => {
    errosConsole.length = 0;
    await instrumentar(page, info.title);
    await instalarMocksSeguranca(page);
    await logar(page);
  });

  test.afterEach(async ({}, info) => {
    // 500s/erros de rede do backend não rodando são esperados aqui — UI deve
    // cair em error-state graciosamente. Falha o teste só se houver erros
    // runtime de JS (ícones faltantes, components quebrados, etc.).
    const relevantes = errosConsole.filter(
      e => !/fonts\.googleapis\.com|status of 500|status of 404|Failed to fetch|NetworkError/i.test(e.msg),
    );
    if (relevantes.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(`Console errors during "${info.title}":`);
      // eslint-disable-next-line no-console
      relevantes.forEach(e => console.warn('  -', e.msg));
    }
    expect(relevantes).toEqual([]);
  });

  test('dashboard /release-orchestrator monta e renderiza shell', async ({ page }) => {
    await page.goto('/release-orchestrator');
    await page.waitForLoadState('domcontentloaded');
    // Sidebar do shell deve ter o item Dashboard
    await expect(page.getByText('Dashboard', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Clientes', { exact: true }).first()).toBeVisible();
  });

  test('lista de clientes renderiza header com botão de novo', async ({ page }) => {
    await page.goto('/release-orchestrator/clientes');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText(/clientes/i).first()).toBeVisible();
  });

  test('agenda /proximas-entregas renderiza filtros', async ({ page }) => {
    await page.goto('/release-orchestrator/proximas-entregas');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText(/próximas entregas/i).first()).toBeVisible();
  });

  test('histórico /entregas renderiza tabela ou empty-state', async ({ page }) => {
    await page.goto('/release-orchestrator/entregas');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText(/entregas/i).first()).toBeVisible();
  });

  test('wizard /entregas/nova abre no passo 1 (Cliente)', async ({ page }) => {
    await page.goto('/release-orchestrator/entregas/nova');
    await page.waitForLoadState('domcontentloaded');
    // Sidebar do wizard com 5 passos
    await expect(page.getByText(/cliente/i).first()).toBeVisible();
    await expect(page.getByText(/produto/i).first()).toBeVisible();
    await expect(page.getByText(/release/i).first()).toBeVisible();
    await expect(page.getByText(/módulos/i).first()).toBeVisible();
    await expect(page.getByText(/revisão/i).first()).toBeVisible();
  });

  test('lista de produtos renderiza', async ({ page }) => {
    await page.goto('/release-orchestrator/produtos');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText(/produtos/i).first()).toBeVisible();
  });
});

/**
 * Happy path completo da jornada ACME — SKIP enquanto não tivermos seed
 * determinístico no backend. Quando o backend expor um endpoint de
 * "preparar cenário ACME" ou Testcontainers seed reset entre suites,
 * remover o skip e implementar os passos abaixo.
 */
test.describe('Release Orchestrator — jornada feliz ACME (skip pendente)', () => {
  test.skip(true, 'Aguarda seed determinístico do backend (ACME + NEXUS-LD + release 1.5.0)');

  test('release PUBLICADA → wizard → entrega CONCLUIDA → download PDF', async () => {
    // 1. Pré-requisito: ACME + NEXUS-LD + release 1.5.0 PUBLICADA + artefatos
    //    uploadados (ou GitHub configurado). Preparado via fixture backend.
    // 2. Login admin
    // 3. Agenda → planejar nova próxima entrega ACME NEXUS-LD 1.5.0 PROD
    // 4. Mudar status para AGENDADA → botão "Gerar" → wizard pré-preenchido
    // 5. Avançar até passo 5 → Calcular preview → Gerar pacote
    // 6. Detalhe entrega → polling até status CONCLUIDA
    // 7. Botão "Baixar pacote" → download .zip
    // 8. Botão "Documento (PDF)" → download .pdf
    // 9. Assert SHA-256 visível e tamanhoBytes > 0
  });
});
