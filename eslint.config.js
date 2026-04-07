import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import prettier from 'eslint-plugin-prettier'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...eslintConfigPrettier.rules,
      'react/jsx-uses-vars': 'error',
      'prettier/prettier': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off', // no necesario en React 17+
      'react/prop-types': 'off', // usamos JS no TS
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prettier/prettier': 'warn',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
])
