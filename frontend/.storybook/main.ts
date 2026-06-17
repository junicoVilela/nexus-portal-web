import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../src/app/shared/**/*.mdx', '../src/app/shared/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/angular',
  docs: {
    autodocs: 'tag',
  },
};

export default config;
