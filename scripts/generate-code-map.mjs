#!/usr/bin/env node
// =============================================
// generate-code-map.mjs - Agent Navigation Map Generator
// =============================================
//
// Emits docs/CODE_MAP.md: a compact, regeneration-driven map of the codebase so an
// agent can locate a target file and line instead of sweeping the repository.
//
// Usage:
//   node scripts/generate-code-map.mjs            write docs/CODE_MAP.md
//   node scripts/generate-code-map.mjs --check    exit 1 if the committed map is stale
//   node scripts/generate-code-map.mjs --stdout   print without writing
//
// No dependencies. Deterministic: the fingerprint covers the body only, so the
// timestamp and commit in the header do not affect staleness detection.
//
// Haraya extension over the reference generator: TypeScript sources (.ts, .tsx)
// are first-class inputs, since this is a React + TS project.

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, dirname, basename, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'CODE_MAP.md');
const ANCHOR_MIN_LINES = 300;

const args = new Set(process.argv.slice(2));
const CHECK = args.has('--check');
const STDOUT = args.has('--stdout');

// Build output, dependency trees, tool state, and duplicate checkouts stay out of
// the map: a duplicated tree doubles every search result.
const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', '.github', '.zcode', '.vscode',
  'vendor', 'dist', 'build', 'scratch', 'logs', 'tmp', 'temp', 'coverage',
  '.playwright-mcp', 'gui-test-screenshots', 'reports',
]);
const EXCLUDE_RE = /(^|[\\/])(dist[-_].*|dist-build.*|build-.*|\.next|cache)$/;
const KEEP_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.css', '.html']);

// ---------- discovery ----------

function walk(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      if (EXCLUDE_RE.test(entry.name)) continue;
      if (entry.name.startsWith('.')) continue;
      walk(full, acc);
    } else if (entry.isFile()) {
      if (KEEP_EXT.has(extname(entry.name).toLowerCase())) acc.push(full);
    }
  }
  return acc;
}

// ---------- purpose inference ----------

/** One-line purpose per file, inferred from its path and leading doc comment. */
function describe(relPath, source) {
  const docMatch = source.match(/^\/\*\*([\s\S]*?)\*\//m);
  if (docMatch) {
    const firstLine = docMatch[1]
      .split('\n')
      .map((line) => line.replace(/^\s*\*\s?/, '').trim())
      .filter(Boolean)[0];
    if (firstLine) return firstLine;
  }
  const base = basename(relPath);
  const dir = dirname(relPath).split(sep).pop() ?? '';
  const name = base.replace(/\.(tsx?|mjs|css)$/, '');
  if (name === 'index' || name === 'main') return `${dir} entry point`;
  return `${dir} module: ${name}`;
}

// ---------- anchors ----------

/** Line anchors for large files: exports, functions, components, sections. */
function anchors(source) {
  const lines = source.split('\n');
  const marks = [];
  const patterns = [
    /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)/,
    /^export\s+const\s+([A-Za-z0-9_$]+)\s*[=:]/,
    /^export\s+(?:interface|type)\s+([A-Za-z0-9_$]+)/,
    /^export\s+default\s+function\s+([A-Za-z0-9_$]+)/,
    /^(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*=\s*(?:React\.)?FC/,
    /^(?:export\s+)?interface\s+([A-Za-z0-9_$]+)/,
    /^(?:export\s+)?type\s+([A-Za-z0-9_$]+)\s*=/,
    /^\/\*\*\s*@section\s+(.+?)\s*\*\/$/,
  ];
  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        marks.push({ line: index + 1, label: match[1] });
        break;
      }
    }
  });
  return marks;
}

// ---------- fingerprint ----------

function fingerprint(files) {
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(relative(ROOT, file).replaceAll('\\', '/'));
    hash.update('\0');
    hash.update(readFileSync(file));
    hash.update('\0');
  }
  return hash.digest('hex').slice(0, 16);
}

// ---------- compose ----------

function compose(files) {
  const stamp = new Date().toISOString().slice(0, 10);
  let commit = '';
  try {
    commit = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  } catch {
    commit = 'uncommitted';
  }

  const groups = new Map();
  for (const file of files) {
    const rel = relative(ROOT, file).replaceAll('\\', '/');
    const parts = rel.split('/');
    const area = parts.length <= 2 ? 'root' : parts.slice(0, parts.length - 1).join('/');
    if (!groups.has(area)) groups.set(area, []);
    const source = readFileSync(file, 'utf8');
    const lineCount = source.split('\n').length;
    groups.get(area).push({ rel, describe: describe(rel, source), lineCount, marks: lineCount >= ANCHOR_MIN_LINES ? anchors(source) : [] });
  }

  const out = [];
  out.push('# CODE_MAP: Haraya Agent Navigation Map');
  out.push('');
  out.push(`Generated ${stamp} : commit ${commit} : fingerprint ${fingerprint(files)}`);
  out.push('');
  out.push('Regenerate with `npm run map:code`; verify staleness with `npm run map:code:check`.');
  out.push('Never hand-edit: the generator owns this file.');
  out.push('');
  out.push('All Davao Region content: cafes, roasteries, bean lots, drop batches, trails, and Cup Check posts.');
  out.push('');

  const areas = [...groups.keys()].sort();
  for (const area of areas) {
    out.push(`## ${area}/`);
    out.push('');
    const entries = groups.get(area).sort((a, b) => a.rel.localeCompare(b.rel));
    for (const entry of entries) {
      out.push(`- \`${entry.rel}\` (${entry.lineCount} lines) : ${entry.describe}`);
      for (const mark of entry.marks.slice(0, 24)) {
        out.push(`  - L${mark.line} : ${mark.label}`);
      }
      if (entry.marks.length > 24) out.push(`  - ... ${entry.marks.length - 24} more anchors`);
    }
    out.push('');
  }

  return out.join('\n');
}

// ---------- main ----------

const files = walk(ROOT).sort();
if (files.length === 0) {
  console.error('generate-code-map: no source files found');
  process.exit(1);
}

const rendered = compose(files);

if (STDOUT) {
  process.stdout.write(rendered + '\n');
  process.exit(0);
}

if (CHECK) {
  if (!existsSync(OUT)) {
    console.error('generate-code-map: docs/CODE_MAP.md missing; run npm run map:code');
    process.exit(1);
  }
  const committed = readFileSync(OUT, 'utf8');
  const committedFp = committed.match(/fingerprint ([0-9a-f]+)/)?.[1];
  const currentFp = rendered.match(/fingerprint ([0-9a-f]+)/)?.[1];
  if (committedFp !== currentFp) {
    console.error('generate-code-map: docs/CODE_MAP.md is stale; run npm run map:code and commit it');
    process.exit(1);
  }
  console.log('generate-code-map: CODE_MAP.md is current');
  process.exit(0);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, rendered + '\n');
console.log(`generate-code-map: wrote ${relative(ROOT, OUT)} (${files.length} files)`);
