// eslint.config.js
import js from "@eslint/js";
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        process: false
      },
      parserOptions: {
        sourceType: 'module'
      }
    },
    rules: {
      semi: 'error',
      'prefer-const': 'error',
      quotes: ['warn', 'single'],
      'no-unused-vars': [
        'warn', {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ]
    }
  }
];
