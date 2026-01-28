import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

/**
 * ESLint flat config for Vue 3 + TypeScript.
 * - Uses eslint-plugin-vue "flat" recommended preset
 * - Uses typescript-eslint recommended rules (type-aware rules can be added later)
 */
// PUBLIC_INTERFACE
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    rules: {
      // Keep console logs allowed for now (early scaffolding stage).
      'no-console': 'off'
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**']
  }
]
