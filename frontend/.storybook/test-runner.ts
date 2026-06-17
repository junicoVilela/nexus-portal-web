import type { TestRunnerConfig } from '@storybook/test-runner';
import { getStoryContext } from '@storybook/test-runner';

/**
 * Configuração do test-runner do Storybook.
 *
 * Cada story é renderizada em Playwright/Chromium. Smoke automático: a story
 * deve renderizar sem erro. Stories podem expor um `play` para checagens
 * adicionais — aqui não exigimos.
 */
const config: TestRunnerConfig = {
  async postVisit(page, context) {
    // Garante que o snapshot estabilizou antes de qualquer asserção custom.
    await getStoryContext(page, context);
  },
};

export default config;
