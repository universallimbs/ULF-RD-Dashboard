# Project Structure

```text
.
├── index.html                  # Dashboard — markup only, all logic in assets/
├── prosthetic-user-survey.html # User research instrument
├── google-apps-script.gs       # Workspace backend: Sheets + Drive + mail
├── assets/
│   ├── css/
│   │   └── dashboard.css       # The whole neumorphic design system, shared by both pages
│   └── js/
│       ├── i18n.js             # EN/PT strings + the swap engine
│       ├── i18n-survey.js      # Survey-only strings, merged in via ulfI18n.extend()
│       ├── config.js           # submissionEndpoint for the Apps Script web app
│       ├── submit.js           # Shared POST transport (classic script, reused by the survey)
│       └── app.js              # Model / View / Presenter sections (see UI_UX_doc.md)
├── README.md                   # Setup, languages, submissions, branches
├── UI_UX_doc.md                # Design principles, tokens, MVP architecture
├── project_structure.md        # This file
├── rules.md                    # Collaboration rules
├── workflow.md                 # Daily operations
├── implementation.md           # R&D strategy
├── bugtracking.md              # Issue tracking process
├── generate.mdc                # Rules for generating new components/docs
├── .github/
│   ├── workflows/
│   │   └── link-checker.yml    # Broken-link + UL-only link validation
│   └── scripts/
│       └── check_links.py
└── *.png / *.jpg / *.webp      # Renders, diagrams and reference visuals
```

## Load order matters

Both pages load, in this order:

```
config.js   ->  submit.js  ->  i18n.js  [-> i18n-survey.js]  ->  page script
```

`i18n.js` must be parsed before anything calls `window.ulfI18n`. `app.js` is a
module (so it is deferred) and calls `window.ulfI18n.init()` itself before its
first render.

## Architecture notes

`assets/js/app.js` is a single file, internally organized into three commented
sections that map to an MVP pattern:

- **Model** — `defaultMilestones`, `getMilestones()`, `saveMilestones()`,
  `getResponses()`, `saveResponse()` (all backed by `localStorage`), plus the
  `TEAM`, `PARTS` and `PACKAGES` arrays.
- **View** — `renderTeam()`, `renderParts()`, `renderDownloads()`,
  `renderGantt()`, `renderResponses()`, `populateEditor()`, `renderGreeting()`.
- **Presenter** — `activateView()`, nav/tab click handlers, the milestone editor
  controller, the updates carousel, the visual-reference modal, and the
  deliverable / download-response submission forms.

It is kept as one file (not split into `model.js` / `view.js` / `presenter.js`)
so load order and shared DOM references stay simple for a static, no-build site.
If it grows significantly, splitting along those same section boundaries is the
natural next step.

Anything that renders text is driven by an i18n key and is re-run by
`renderAll()` on the `ulf:languagechange` event. Two handlers are deliberately
**delegated** on `document` — the bell animation and the download response
buttons — because their elements are destroyed and rebuilt on every language
change, so a directly-bound listener would be lost.
