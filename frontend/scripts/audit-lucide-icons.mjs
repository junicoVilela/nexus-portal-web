import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const appRoot = join(import.meta.dirname, '..', 'src', 'app');
const configPath = join(appRoot, 'app.config.ts');

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(html|ts)$/.test(entry.name) ? [path] : [];
  });
}

function collectMatches(source, expression, result) {
  for (const match of source.matchAll(expression)) result.add(match[1]);
}

function collectDynamicLucideNames(source, result) {
  for (const tag of source.matchAll(/<(?:lucide-icon|ui-button)\b[\s\S]*?>/g)) {
    // Valores produzidos por ternários em `[name]`/`[icon]`, por exemplo:
    // [icon]="ativo ? 'EyeOff' : 'Eye'".
    collectMatches(tag[0], /(?:\?|:)\s*'([A-Z][A-Za-z0-9]+)'/g, result);
    collectMatches(tag[0], /\[(?:name|icon)\]="\s*'([A-Z][A-Za-z0-9]+)'\s*"/g, result);
  }
  for (const attr of source.matchAll(/\[(?:icon|name)\]="([^"]+)"/g)) {
    for (const match of attr[1].matchAll(/(===|!==|==)?\s*'([A-Z][A-Za-z0-9]+)'/g)) {
      if (match[1]) continue;
      result.add(match[2]);
    }
  }
}

const config = readFileSync(configPath, 'utf8');
const pick = config.match(/LucideAngularModule\.pick\(\{([\s\S]*?)\}\)/)?.[1] ?? '';
const registered = new Set();
collectMatches(pick, /\b([A-Z][A-Za-z0-9]+)\s*,/g, registered);

const used = new Set();
for (const file of sourceFiles(appRoot)) {
  const source = readFileSync(file, 'utf8');
  collectMatches(source, /<lucide-icon\s+name="([A-Z][A-Za-z0-9]+)"/g, used);
  collectMatches(source, /\bicon="([A-Z][A-Za-z0-9]+)"/g, used);
  collectMatches(source, /\bicon:\s*'([A-Z][A-Za-z0-9]+)'/g, used);
  collectDynamicLucideNames(source, used);
}

const missing = [...used].filter(icon => !registered.has(icon)).sort();
if (missing.length > 0) {
  console.error(`Ícones Lucide sem registro em app.config.ts: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(`Auditoria Lucide aprovada: ${used.size} ícones em uso estão registrados.`);
