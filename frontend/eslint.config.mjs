// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config({
  files: ['src/**/*.ts'],
  extends: [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...tseslint.configs.stylistic,
  ],
  plugins: { '@angular-eslint': angular },
  rules: {
    '@angular-eslint/component-class-suffix': 'error',
    '@angular-eslint/directive-class-suffix': 'error',
    '@angular-eslint/no-empty-lifecycle-method': 'warn',
    '@angular-eslint/use-lifecycle-interface': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    'no-empty': ['warn', { allowEmptyCatch: true }],
  },
}, {
  files: ['src/**/*.html'],
  languageOptions: { parser: angularTemplateParser },
  plugins: { '@angular-eslint/template': angularTemplate },
  rules: {
    '@angular-eslint/template/banana-in-box': 'error',
    '@angular-eslint/template/no-negated-async': 'error',
    '@angular-eslint/template/eqeqeq': 'warn',
  },
}, prettierConfig, {
  ignores: ['dist/**', 'coverage/**', '.angular/**', 'node_modules/**', 'src/app/api/generated/**'],
}, storybook.configs["flat/recommended"]);
