# Project Structure

```text
.
├── index.html                  # VENDORED — a design-tool export, ~38 KB.
│                               # Readable HTML, but overwritten on refresh.
│                               # Needs prosthetic-hand.png. See README.
├── prosthetic-user-survey.html # Hand-authored. The page you actually edit.
├── google-apps-script.gs       # Workspace backend: Sheets + Drive + mail
├── assets/
│   ├── css/
│   │   └── dashboard.css       # Glass design system — used only by the survey
│   └── js/
│       ├── i18n.js             # EN/PT strings + swap engine
│       ├── i18n-survey.js      # Survey-only strings, via ulfI18n.extend()
│       ├── config.js           # submissionEndpoint for the Apps Script web app
│       └── submit.js           # Shared POST transport
├── README.md                   # Refresh procedure, the Anqido patch, setup
├── UI_UX_doc.md                # Design tokens (survey only)
├── project_structure.md        # This file
├── rules.md · workflow.md · implementation.md · bugtracking.md · generate.mdc
├── .github/
│   ├── workflows/link-checker.yml
│   └── scripts/check_links.py
├── prosthetic-hand.png         # used by the hub export
└── ul-logo.png                 # used by the survey
    *.webp / *.png / *.jpg      # programme reference visuals, currently unreferenced
```

## Two separate worlds

This repo now holds two things that share almost nothing:

**1. The hub (`index.html`)** is a vendored design-tool export — readable HTML
with its own inline styles and script, plus `prosthetic-hand.png`. Changes
belong in the design tool: a refresh overwrites the file wholesale. The local
modifications (Anqido link, Ganesh V rename, team roster) are documented in the
README and must be re-applied after every refresh.

**2. The survey** is ordinary hand-written source with a small shared runtime
(`dashboard.css`, `i18n.js`, `i18n-survey.js`, `config.js`, `submit.js`).

`assets/js/app.js` was deleted when the hub was vendored — it drove the previous
hand-built dashboard and nothing references it any more. It is recoverable from
git history at `5636105` if that dashboard is ever revived.

## Load order (survey)

```
config.js  ->  submit.js  ->  i18n.js  ->  i18n-survey.js  ->  page script
```

`i18n.js` must be parsed before anything calls `window.ulfI18n`. The page's own
inline script calls `ulfI18n.init()` and then renders its dynamic blocks.

## i18n contract

Strings live in `i18n.js` / `i18n-survey.js` as `en` / `pt` pairs. Markup opts in
with `data-i18n` and `data-i18n-attr`; JS reads via `window.ulfI18n.t()`.
Switching writes to `localStorage`, sets `<html lang>` and fires
`ulf:languagechange` — anything rendered in JS must rebuild on that event, and
listeners bound to JS-rendered nodes must be re-attached inside the render
function, since those nodes are destroyed on every switch.

`ulfI18n.en()` always resolves English, whatever the UI shows. Use it for values
leaving the browser so a Sheet column holds one language.
