# Documentation screenshots

These PNGs capture the shipped options and popup pages in English and Russian.
All usernames, comments and the DEMO post URL are fictional documentation fixtures.
No real Instagram account, session cookies or collected comments are used.

To regenerate, install Playwright in a development environment and its Chromium browser:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node scripts/capture-screenshots.js
```

The capture tool uses an isolated browser context for each language, mocks the
extension APIs and blocks all requests outside its local fixture origin. It
renders the actual application bundles and localization script. Playwright is
an optional documentation dependency, not part of the extension runtime.

`options-en.png` and `popup-en.png` belong to the English README section;
`options-ru.png` and `popup-ru.png` belong to the Russian section.
