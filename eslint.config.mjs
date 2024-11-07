// @ts-check
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import eslintTerrestris from '@terrestris/eslint-config-typescript';
import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';
import stylisticEslint from '@stylistic/eslint-plugin'

export default tsEslint.config({
  extends: [
    eslint.configs.recommended,
    ...tsEslint.configs.recommended,
    ...tsEslint.configs.stylistic,
    importPlugin.flatConfigs.recommended
  ],
  files: [
    'src/**/*.ts',
    'spec/**/*.spec.ts'
  ],
  languageOptions: {
    ecmaVersion: 2022,
    globals: globals.browser,
    parserOptions: {
      project: true,
      tsconfigRootDir: import.meta.dirname
    },
  },
  plugins: {
    '@stylistic': stylisticEslint
  },
  rules: {
    ...eslintTerrestris.rules,
    '@typescript-eslint/member-ordering': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-this-alias': 'warn',
    '@typescript-eslint/prefer-for-of': 'warn',
    '@typescript-eslint/no-unsafe-function-type': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    'import/no-unresolved': 'off',
    'import/named': 'off',
    'import/order': ['warn', {
      groups: [
        'builtin',
        'external',
        'parent',
        'sibling',
        'index',
        'object'
      ],
      pathGroups: [{
        pattern: 'react',
        group: 'external',
        position: 'before'
      }, {
        pattern: '@terrestris/**',
        group: 'external',
        position: 'after'
      }],
      pathGroupsExcludedImportTypes: ['react'],
      'newlines-between': 'always-and-inside-groups',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      }
    }]
  }
});
