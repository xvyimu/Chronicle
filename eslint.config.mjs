import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

// eslint-config-next 对 jsx-a11y 只启用了部分规则；下方规则块把缺失的维度补上。
// 不用 flatConfigs.recommended（它整体替换会覆盖 next 的既有规则集），
// 也**不要**在这里 `plugins: { 'jsx-a11y': ... }` —— eslint-config-next 已经注册过
// 该插件，flat config 下重复注册同名 plugin 会直接抛
// `ConfigError: Key "plugins": Cannot redefine plugin "jsx-a11y"`，整个 lint 起不来。
// 插件已在上游注册，规则名可直接引用。
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
      // Missing a11y rules not covered by eslint-config-next's partial jsx-a11y set.
      // click-events-have-key-events: `<div onClick>` must also handle keyboard.
      // interactive-supports-focus: interactive elements must be focusable.
      // anchor-is-valid: <a> needs href or role="button" + keyboard handler.
      // mouse-events-have-key-events: onMouseOver/Out need onFocus/Blur pairs.
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/mouse-events-have-key-events': 'error',
    },
  },
]);

export default eslintConfig;
