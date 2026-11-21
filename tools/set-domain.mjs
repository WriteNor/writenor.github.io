// Переносит сайт на новый домен.   node tools/set-domain.mjs https://writenor.com
// Заменяет текущий и известные старые домены, пишет CNAME и пересобирает SEO-страницы.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const next = (process.argv[2] || '').replace(/\/+$/, '');
if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(next)) {
  console.error('Пример: node tools/set-domain.mjs https://writenor.com');
  process.exit(1);
}
const cfgPath = path.join(ROOT, 'site.config.json');
const prev = JSON.parse(fs.readFileSync(cfgPath, 'utf8')).site.replace(/\/+$/, '');
const oldDomains = new Set([
  prev,
  'https://writenor.pl',
  'http://writenor.pl',
  'https://writenor.github.io',
  'http://writenor.github.io',
]);
const replacements = [...oldDomains]
  .filter(domain => domain !== next)
  .sort((a, b) => b.length - a.length);

const skip = new Set(['.git', 'node_modules']);
let changed = 0;
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (skip.has(name)) continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) { walk(full); continue; }
    if (!/\.(html|xml|txt|md|js|json|css)$/i.test(name)) continue;
    let text = fs.readFileSync(full, 'utf8');
    const original = text;
    for (const oldDomain of replacements)
      text = text.split(oldDomain).join(next);
    if (text !== original) {
      fs.writeFileSync(full, text);
      changed++;
    }
  }
})(ROOT);

fs.writeFileSync(cfgPath, JSON.stringify({ site: next }, null, 2) + '\n');
fs.writeFileSync(path.join(ROOT, 'CNAME'), new URL(next).hostname + '\n');
execFileSync(process.execPath, [path.join(ROOT, 'tools', 'build-i18n.mjs')], { stdio: 'inherit' });
console.log(`Готово: домен сайта установлен на ${next}; обновлено файлов: ${changed}. Проверьте изменения и опубликуйте их.`);
