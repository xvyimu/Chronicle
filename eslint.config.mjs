import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintPluginPrettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    'node_modules/**',
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Generated report artifacts (HTML/JS/fonts, not project source)
    'coverage/**',
    'html/**',
    'playwright-report/**',
    'test-results/**',
    'stryker-report/**',
    '.stryker-tmp/**',
    'tmp/**',
    'project-diagnostic-report/**',
  ]),
  // Allow setState in effects for legitimate use cases:
  // - localStorage init (ThemeToggle), DOM measurement (TableOfContents)
  // - Navigation-driven state reset (Header mobile menu)
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]);

export default eslintConfig;
