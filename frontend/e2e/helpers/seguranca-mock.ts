import { Page } from '@playwright/test';
import {
  tryHandleAuthRoutes,
  tryHandleDocFlowFallbackGet,
  tryHandleDocFlowRoutes,
  tryHandleRbacRoutes,
} from './docflow-api-fixtures';

/** Instala mocks de auth/RBAC e rotas mínimas do Doc Flow para E2E do módulo Segurança. */
export async function instalarMocksSeguranca(page: Page): Promise<void> {
  await page.context().route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const ctx = { path: url.pathname, method: request.method() };
    const responder = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (await tryHandleAuthRoutes(ctx, responder)) return;
    if (await tryHandleRbacRoutes(ctx, responder)) return;
    if (await tryHandleDocFlowRoutes(ctx, responder)) return;
    if (await tryHandleDocFlowFallbackGet(ctx, responder)) return;

    return responder({ message: `Mock segurança não configurado para ${ctx.method} ${ctx.path}` }, 501);
  });
}
