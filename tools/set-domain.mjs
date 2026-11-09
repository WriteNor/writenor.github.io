// Переносит сайт на новый домен.   node tools/set-domain.mjs https://writenor.com
// 1) заменяет старый адрес во всех файлах, 2) пишет CNAME, 3) пересобирает языковые страницы, sitemap и robots.
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

const skip = new Set(['.git', 'node_modules']);
let changed = 0;
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (skip.has(name)) continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) { walk(full); continue; }
    if (!/\.(html|xml|txt|md|js|json|css)$/i.test(name)) continue;
    const text = fs.readFileSync(full, 'utf8');
    if (!text.includes(prev)) continue;
    fs.writeFileSync(full, text.split(prev).join(next));
    changed++;
  }
})(ROOT);

fs.writeFileSync(cfgPath, JSON.stringify({ site: next }, null, 2) + '\n');
fs.writeFileSync(path.join(ROOT, 'CNAME'), new URL(next).hostname + '\n');
execFileSync(process.execPath, [path.join(ROOT, 'tools', 'build-i18n.mjs')], { stdio: 'inherit' });
console.log(`Готово: ${prev} -> ${next}, изменено файлов: ${changed}. Закоммить всё и добавь домен в Settings -> Pages.`);
