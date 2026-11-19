/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**', '**/coverage/**'],
  },
];

export default config;
