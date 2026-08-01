import { expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  TODAS_PERMISSOES,
  e2eJwtToken,
  tryHandleAuthRoutes,
  tryHandleDocFlowRoutes,
} from './docflow-api-fixtures';

/** Instala JWT mock e rotas mínimas para rotas autenticadas do Doc Flow em E2E a11y. */
export async function instalarMocksDocFlowA11y(
  page: Page,
  permissoes: string[] = TODAS_PERMISSOES,
): Promise<void> {
  await page.addInitScript(
    ({ token }) => {
      localStorage.clear();
      localStorage.setItem('doc-flow-jwt', token);
      localStorage.setItem('doc-flow-username', 'admin');
    },
    { token: e2eJwtToken() },
  );

  await page.context().route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const ctx = { path: url.pathname, method: request.method() };
    const responder = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (await tryHandleAuthRoutes(ctx, responder, permissoes)) return;
    if (await tryHandleDocFlowRoutes(ctx, responder)) return;

    return responder({ message: `Mock a11y não configurado para ${ctx.method} ${ctx.path}` }, 501);
  });
}

export async function analisarA11y(page: Page, selector?: string, exclude?: string) {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
  if (selector) {
    builder = builder.include(selector);
  }
  if (exclude) {
    builder = builder.exclude(exclude);
  }
  const results = await builder.analyze();
  if (results.violations.length > 0) {
    // eslint-disable-next-line no-console
    console.log('A11y violations:', JSON.stringify(results.violations, null, 2));
  }
  expect(results.violations).toEqual([]);
}
