import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, extractCandidateTags } from './check-sri.mjs';

test('extracts only next-static script and stylesheet link tags', () => {
  const html = `
    <script src="/_next/static/chunks/main.js" integrity="sha384-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"></script>
    <script src="/other.js" integrity="sha384-bbbb"></script>
    <link rel="stylesheet" href="/_next/static/css/app.css" integrity="sha384-cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc" />
    <link rel="preload" href="/_next/static/css/app.css" as="style" />
    <link rel="stylesheet" href="/global.css" />
  `;
  const tags = extractCandidateTags(html);
  assert.equal(tags.length, 2);
  assert.equal(tags[0].tag, 'script');
  assert.equal(tags[1].tag, 'link');
});

test('expect on passes when at least one sha384 integrity present', () => {
  const html = `
    <script src="/_next/static/a.js" integrity="sha384-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"></script>
    <script src="/_next/static/b.js"></script>
  `;
  const r = analyze(html, 'on');
  assert.equal(r.ok, true);
  assert.equal(r.protected, 1);
  assert.equal(r.unprotected, 1);
});

test('expect on fails when no integrity', () => {
  const html = `<script src="/_next/static/a.js"></script>`;
  const r = analyze(html, 'on');
  assert.equal(r.ok, false);
});

test('expect off passes with zero integrity attrs', () => {
  const html = `
    <script src="/_next/static/a.js"></script>
    <link rel="stylesheet" href="/_next/static/b.css" />
  `;
  const r = analyze(html, 'off');
  assert.equal(r.ok, true);
  assert.equal(r.protected, 0);
  assert.equal(r.total, 2);
});

test('expect off fails when integrity present', () => {
  const html = `<script src="/_next/static/a.js" integrity="sha384-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"></script>`;
  const r = analyze(html, 'off');
  assert.equal(r.ok, false);
});

test('absolute next static urls are in scope', () => {
  const html = `<script src="https://cdn.example/_next/static/x.js" integrity="sha384-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"></script>`;
  const tags = extractCandidateTags(html);
  assert.equal(tags.length, 1);
  assert.equal(analyze(html, 'on').ok, true);
});
