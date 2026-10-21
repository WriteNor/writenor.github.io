# WriteNor — official website

WriteNor is a first-person psychological horror game by Terawww, about Johnny’s frozen present, an unfolding past and Nori at the centre of his memories.

- Official website: https://writenor.github.io/
- Steam: https://store.steampowered.com/app/4312600/WriteNor/
- Demo on itch.io: https://terawww.itch.io/writenor

## Website

Static HTML, CSS and JavaScript, published from the root of this repository using GitHub Pages. No build step or package installation is required.

The main page and `/nori/` share local styles, fonts, eight translations, automatic browser language selection and saved visual-effects settings. The Canvas terrain and red particles stop animating outside the hero section, while the tab is hidden, or when effects are disabled. Reduced-motion preferences are respected.

`/nori.html` and `/write-nor/` redirect to their canonical pages. Existing image URLs and the Google site-verification file remain available. The sitemap lists canonical pages only.

## Search identity

The official title is **WriteNor**. **Write Nor** is its spaced alternate name. A short visible spelling note also helps visitors who typed **Wrote Nor** or **врите нор**. Those misspellings are not presented as official titles, and search rankings or automatic correction are not guaranteed.

Static JSON-LD connects the game, website, creator and Nori character page. After publication, submit `https://writenor.github.io/sitemap.xml` through Google Search Console and request indexing of `/` and `/nori/`.

## Editing

- `index.html` — main page and game structured data.
- `nori/index.html` — character page.
- `assets/site.css` and `assets/site.js` — shared appearance and interactions.
- `assets/languages.js` — English and Russian.
- `assets/languages-extra.js` — Ukrainian, Polish, German, Spanish, Japanese and Simplified Chinese.
- `robots.txt` and `sitemap.xml` — crawler entry points.

Game information was checked against Steam on 21 October 2026. Windows and Linux are listed; the full release date remains to be announced. Keep release, platform and language information consistent with the current Steam page when editing.
