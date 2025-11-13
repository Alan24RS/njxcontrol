import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fixupConfigRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import prettierConfigRecommended from 'eslint-plugin-prettier/recommended'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

const patchedConfig = fixupConfigRules([
  ...compat.extends('next/core-web-vitals')
])

const eslintConfig = [
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}']
  },
  ...patchedConfig,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: globals.browser },
    plugins: {
      simpleImportSort
    },
    rules: {
      'simpleImportSort/imports': [
        'error',
        {
          groups: [
            // 1) Node built-ins
            ['^node:', '^fs$', '^path$', '^url$'],

            // 2) React primero
            ['^react$', '^react-?\\w'],

            // 3) Next (cualquier submódulo de next/*)
            ['^next($|/)'],

            // 4) next-view-transitions separado del grupo Next
            ['^next-view-transitions$'],

            // 5) Paquetes externos (npm) que no sean next*
            ['^@?\\w'],

            // 6) Alias de la app (ajustá a tus alias)
            ['^(@/|~\\/)', '^src\\/'],

            // 7) Relativos: padres, mismo directorio y resto
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],

            // 8) Estilos al final
            ['^.+\\.s?css$']
          ]
        }
      ],
      'simpleImportSort/exports': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    }
  },
  prettierConfigRecommended,
  {
    rules: {
      'prettier/prettier': 'warn'
    }
  },
  {
    ignores: ['node_modules/*', '.next/*']
  }
]

export default eslintConfig
