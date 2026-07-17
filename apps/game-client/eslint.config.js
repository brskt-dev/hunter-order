import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

// Flat ESLint configuration.
// - typescript-eslint recommended rules (non type-checked: fast, no project service)
// - simple-import-sort keeps imports/exports ordered consistently as the codebase grows
// - prettier is last so it disables formatting-related rules (no ESLint/Prettier clash)
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  prettier,
);
