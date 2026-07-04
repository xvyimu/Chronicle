import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const node = quote(process.execPath);
const eslint = quote(path.join(rootDir, 'node_modules', 'eslint', 'bin', 'eslint.js'));
const prettier = quote(
  path.join(rootDir, 'node_modules', 'prettier', 'bin', 'prettier.cjs'),
);

function quote(value) {
  return `"${String(value).replaceAll('"', '\\"')}"`;
}

function files(values) {
  return values.map(quote).join(' ');
}

const config = {
  '*.{ts,tsx,mjs,mts}': (stagedFiles) => `${node} ${eslint} --fix ${files(stagedFiles)}`,
  '*.{ts,tsx,mjs,mts,css,json,md}': (stagedFiles) =>
    `${node} ${prettier} --write ${files(stagedFiles)}`,
};

export default config;
