import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');

const root = process.cwd();
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
}
for (const dir of ['app', 'components', 'lib']) walk(path.join(root, dir));
files.push(path.join(root, 'proxy.ts'));

const syntaxErrors = [];
for (const file of files) {
  const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    fileName: file,
    reportDiagnostics: true,
  });
  for (const diagnostic of result.diagnostics ?? []) {
    if (diagnostic.category === ts.DiagnosticCategory.Error) syntaxErrors.push(`${path.relative(root, file)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`);
  }
}

const importPattern = /(?:import[^'";]*from\s*|import\s*\(\s*|export[^'";]*from\s*)['"]([^'"]+)['"]/g;
const missing = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = importPattern.exec(text))) {
    const specifier = match[1];
    if (!specifier.startsWith('.') && !specifier.startsWith('@/')) continue;
    const base = specifier.startsWith('@/') ? path.join(root, specifier.slice(2)) : path.resolve(path.dirname(file), specifier);
    const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
    if (!candidates.some(candidate => fs.existsSync(candidate))) missing.push(`${path.relative(root, file)} -> ${specifier}`);
  }
}

if (syntaxErrors.length || missing.length) {
  console.error('Validation failed.');
  if (syntaxErrors.length) console.error('\nSyntax errors:\n' + syntaxErrors.join('\n'));
  if (missing.length) console.error('\nMissing local imports:\n' + missing.join('\n'));
  process.exit(1);
}
console.log(`AxomPrep validation passed: ${files.length} TypeScript/TSX files checked; all local imports resolved.`);
