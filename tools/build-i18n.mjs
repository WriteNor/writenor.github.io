// Генерирует готовые страницы на каждом языке (/ru/, /pl/, /de/ ...), hreflang, sitemap.xml и robots.txt.
// Запуск из корня репозитория:  node tools/build-i18n.mjs
// Нужен только Node.js 18+, пакеты ставить не надо.
// Английские страницы (index.html, nori/index.html) — это шаблоны. Тексты берутся из assets/languages*.js и assets/campaign-copy.js.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8')).site.replace(/\/+$/, '');
const TODAY = new Date().toISOString().slice(0, 10);

const LOCALES = ['en', 'ru', 'uk', 'pl', 'de', 'es', 'ja', 'zh'];
const HREFLANG = { en: 'en', ru: 'ru', uk: 'uk', pl: 'pl', de: 'de', es: 'es', ja: 'ja', zh: 'zh-Hans' };
const OG_LOCALE = { en: 'en_US', ru: 'ru_RU', uk: 'uk_UA', pl: 'pl_PL', de: 'de_DE', es: 'es_ES', ja: 'ja_JP', zh: 'zh_CN' };
const PAGES = [
  { src: 'index.html', sub: '', isNori: false },
  { src: 'nori/index.html', sub: 'nori/', isNori: true },
];

const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['languages.js', 'languages-extra.js', 'campaign-copy.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets', f), 'utf8'), ctx, { filename: f });
const L = ctx.WRITENOR_LANGUAGES;

const pageUrl = (loc, page) => `${SITE}/${loc === 'en' ? '' : loc + '/'}${page.sub}`;
const pagePath = (loc, page) => `/${loc === 'en' ? '' : loc + '/'}${page.sub}`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const t = (loc, key) => L[loc]?.[key] ?? L.en[key];

function hreflangBlock(page) {
  const lines = LOCALES.map(l => `<link rel="alternate" hreflang="${HREFLANG[l]}" href="${pageUrl(l, page)}">`);
  lines.push(`<link rel="alternate" hreflang="x-default" href="${pageUrl('en', page)}">`);
  return `<!-- hreflang:start -->\n  ${lines.join('\n  ')}\n  <!-- hreflang:end -->`;
}
const BLOCK_RE = /<!-- hreflang:start -->[\s\S]*?<!-- hreflang:end -->/;

function findClose(html, tag, from) {
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    if (m[1]) { if (--depth === 0) return m.index; }
    else if (!m[0].endsWith('/>')) depth++;
  }
  return -1;
}

function replaceInner(html, loc) {
  const openRe = /<([a-zA-Z][\w-]*)\b[^>]*?\sdata-i18n="([^"]+)"[^>]*>/g;
  let out = '', last = 0, m;
  while ((m = openRe.exec(html))) {
    const start = m.index + m[0].length;
    const end = findClose(html, m[1], start);
    const value = t(loc, m[2]);
    if (end < 0 || value === undefined) continue;
    out += html.slice(last, start) + value;
    last = end;
    openRe.lastIndex = end;
  }
  return out + html.slice(last);
}

function replaceAttrs(html, loc) {
  for (const [source, target] of [['data-i18n-aria', 'aria-label'], ['data-i18n-alt', 'alt'], ['data-i18n-placeholder', 'placeholder']]) {
    const re = new RegExp(`<[a-zA-Z][^>]*?\\s${source}="([^"]+)"[^>]*>`, 'g');
    html = html.replace(re, (tag, key) => {
      const value = t(loc, key);
      if (value === undefined) return tag;
      const attr = `${target}="${esc(value)}"`;
      const has = new RegExp(`\\s${target}="[^"]*"`);
      return has.test(tag) ? tag.replace(has, ` ${attr}`) : tag.replace(/^<([a-zA-Z][\w-]*)/, `<$1 ${attr}`);
    });
  }
  return html;
}

function setMeta(html, selector, value) {
  // selector: ['name'|'property', 'description']
  const re = new RegExp(`(<meta\\s+${selector[0]}="${selector[1]}"\\s+content=")[^"]*(")`);
  return re.test(html) ? html.replace(re, `$1${esc(value)}$2`) : html;
}

function localizeJsonLd(html, loc, page, title, description) {
  return html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_, a, json, c) => {
    const data = JSON.parse(json);
    const url = pageUrl(loc, page);
    for (const node of data['@graph']) {
      if (node['@type'] === 'WebPage') {
        node['@id'] = `${url}#webpage`;
        node.url = url;
        node.name = title;
        node.description = description;
        node.inLanguage = HREFLANG[loc];
      }
    }
    return a + JSON.stringify(data) + c;
  });
}

function render(template, loc, page) {
  let html = template;
  const title = t(loc, page.isNori ? 'nori_meta_title' : 'page_title');
  const description = t(loc, page.isNori ? 'nori_meta_description' : 'page_description');
  const url = pageUrl(loc, page);

  if (loc !== 'en') {
    html = replaceInner(html, loc);
    html = replaceAttrs(html, loc);
    html = html.replace(/<html lang="en"/, `<html lang="${HREFLANG[loc]}" data-static-locale="${loc}"`);
    html = html.replace(/(<option value="auto">)[^<]*(<\/option>)/, `$1${t(loc, 'auto')} · ${loc.toUpperCase()}$2`);
    html = html.replace(/ selected(?=[ >])/g, '');
    html = html.replace(new RegExp(`(<option value="${loc}")`), '$1 selected');
    // внутренние ссылки ведут на ту же языковую версию
    html = html.replace(/href="\/(#[^"]*)?"/g, (_, hash) => `href="/${loc}/${hash || ''}"`);
    html = html.replace(/href="\/nori\/(#[^"]*)?"/g, (_, hash) => `href="/${loc}/nori/${hash || ''}"`);
    html = localizeJsonLd(html, loc, page, title, description);
  }

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  html = setMeta(html, ['name', 'description'], description);
  html = setMeta(html, ['property', 'og:title'], title);
  html = setMeta(html, ['property', 'og:description'], description);
  html = setMeta(html, ['property', 'og:url'], url);
  html = setMeta(html, ['name', 'twitter:title'], title);
  html = setMeta(html, ['name', 'twitter:description'], description);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);

  // og:locale (и альтернативы) — вместе с блоком hreflang
  const og = `<meta property="og:locale" content="${OG_LOCALE[loc]}">` +
    LOCALES.filter(l => l !== loc).map(l => `<meta property="og:locale:alternate" content="${OG_LOCALE[l]}">`).join('');
  html = html.replace(/<meta property="og:locale"[^>]*>(<meta property="og:locale:alternate"[^>]*>)*/g, '');
  html = html.replace(BLOCK_RE, `${hreflangBlock(page)}\n  ${og}`);
  return html;
}

// --- 1. Английские шаблоны: обновляем hreflang и мета
const templates = {};
for (const page of PAGES) {
  const file = path.join(ROOT, page.src);
  let html = fs.readFileSync(file, 'utf8');
  if (!BLOCK_RE.test(html))
    html = html.replace(/(<link rel="canonical" href="[^"]*">)/, `$1\n  <!-- hreflang:start -->\n  <!-- hreflang:end -->`);
  html = render(html, 'en', page);
  fs.writeFileSync(file, html);
  templates[page.src] = html;
}

// --- 2. Остальные языки
for (const loc of LOCALES.filter(l => l !== 'en')) {
  for (const page of PAGES) {
    const out = path.join(ROOT, loc, page.sub, 'index.html');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, render(templates[page.src], loc, page));
  }
}

// --- 3. sitemap.xml и robots.txt
const entries = [];
for (const page of PAGES) {
  for (const loc of LOCALES) {
    const alts = LOCALES.map(l => `    <xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${pageUrl(l, page)}"/>`)
      .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl('en', page)}"/>`).join('\n');
    entries.push(`  <url>\n    <loc>${pageUrl(loc, page)}</loc>\n    <lastmod>${TODAY}</lastmod>\n${alts}\n  </url>`);
  }
}
for (const p of ['privacy.html', 'terms.html']) entries.push(`  <url>\n    <loc>${SITE}/${p}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </url>`);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`OK: ${LOCALES.length * PAGES.length} страниц, сайт ${SITE}`);
