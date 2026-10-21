# WriteNor — official website

WriteNor is a first-person psychological horror game by Terawww, about Johnny’s frozen present, an unfolding past and Nori at the centre of his memories.

- Official website: https://writenor.github.io/
- Steam: https://store.steampowered.com/app/4312600/WriteNor/
- Demo on itch.io: https://terawww.itch.io/writenor

## Website

Static HTML, CSS and JavaScript, published from the root of this repository using GitHub Pages. No build step or package installation is required.

The main page and `/nori/` share local styles, fonts, eight translations, automatic browser language selection and saved visual-effects settings. Red particles remain visible across the entire page, while scroll-responsive optics occupy the wide side gutters. The hero terrain stops outside the first screen. Animation pauses in a hidden tab, and reduced-motion or disabled effects are respected.

The main page has a short, skippable boot introduction once per tab session. Escape, Enter or Skip closes it immediately; the footer can replay it. Independent CSS and JavaScript timeouts keep the intro from hiding the page, and late script loads do not interrupt reading with an automatic intro.

The presentation leads to the available demo and Steam wishlist, with a contextual action bar after the hero. The full game is not presented as already available to buy. Modern scroll timelines, registered CSS properties, Web Animations and optional View Transitions progressively enhance the page; the content and controls also work without those APIs.

`/nori.html` and `/write-nor/` redirect to their canonical pages. Existing image URLs and the Google site-verification file remain available. The sitemap lists canonical pages only.

## Search identity

The official title is **WriteNor**. **Write Nor** is its spaced alternate name. A short visible spelling note also helps visitors who typed **Wrote Nor** or **врите нор**. Those misspellings are not presented as official titles, and search rankings or automatic correction are not guaranteed.

Static JSON-LD connects the game, website, creator and Nori character page. After publication, submit `https://writenor.github.io/sitemap.xml` through Google Search Console and request indexing of `/` and `/nori/`.

## Editing

- `index.html` — main page and game structured data.
- `nori/index.html` — character page.
- `assets/site.css` and `assets/site.js` — shared appearance and interactions.
- `assets/atmosphere.css` and `assets/atmosphere.js` — red particles and side-gutter animations.
- `assets/boot.css` and `assets/boot.js` — optional opening sequence.
- `assets/campaign.css`, `assets/campaign.js`, `assets/campaign-copy.js` — game presentation and translated calls to action.
- `assets/languages.js` — English and Russian.
- `assets/languages-extra.js` — Ukrainian, Polish, German, Spanish, Japanese and Simplified Chinese.
- `robots.txt` and `sitemap.xml` — crawler entry points.

Game information was checked against Steam on 21 October 2026. Windows and Linux are listed; the full release date remains to be announced. Keep release, platform and language information consistent with the current Steam page when editing.
