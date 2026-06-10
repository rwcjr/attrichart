import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      'reference/**',
      'examples/**/*.html',
      'docs/**',
      'examples/vue-vuetify/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['**/scripts/**/*.mjs'],
    languageOptions: {
      globals: { console: 'readonly', URL: 'readonly', process: 'readonly' },
    },
  },
);
