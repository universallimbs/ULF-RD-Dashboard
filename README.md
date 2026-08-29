# ULF R&D Dashboard

Static, bilingual (EN / PT) internal R&D hub for the Universal Limbs Foundation
pediatric prosthetic hand programme.

No build step, no framework. Plain HTML, one stylesheet and a handful of classic
scripts, so it can be served by GitHub Pages or any static file server.

## Live pages

| Branch | Purpose | URL |
| --- | --- | --- |
| `main` | Production, published via GitHub Pages | https://universallimbs.github.io/ULF-RD-Dashboard/ |
| `develop` | Working branch — everything lands here first | run locally |

Direct pages:
- Dashboard: `/index.html`
- Prosthetic user survey: `/prosthetic-user-survey.html`

## Run it locally

Any static server works, because there is nothing to compile:

```bash
python3 -m http.server 8080
# then open http://127.0.0.1:8080/index.html
```

## Layout

A persistent shell plus one swappable panel. The **Priority board** (left),
**Project stage** and **Tasks** (right) stay on screen for every tab; only the
lower-left card changes.

| Tab | Lower-left panel |
| --- | --- |
| Dashboard | Overview — programme summary, reference carousel, five-step delivery rail |
| Upload | Drag-and-drop upload posting to the Apps Script endpoint |
| Download | Programme pack, meeting minutes archive, team roster |
| Links | Quick links grid |
| Team | Roles and team members |
| Mins | Meeting minutes |

The header carries a dual-timezone clock (São Paulo fixed, second city
selectable). Offsets are derived with `Intl.DateTimeFormat` rather than
hardcoded, so daylight saving stays correct on both sides.

## Languages

Every visible string lives in [assets/js/i18n.js](assets/js/i18n.js) as an
`en` / `pt` pair; the survey's own vocabulary is in
[assets/js/i18n-survey.js](assets/js/i18n-survey.js). The base dictionary is
carried over from the reference build, so the Portuguese is **European
Portuguese** ("ficheiro", "equipa", "Planeado"). If the primary audience is the
Brazilian partner (UTFPR) this wants a pt-BR pass — the keys would not change.

Markup opts in per node:

```html
<h1 data-i18n="summary.heading">Project summary</h1>
<input data-i18n-attr="placeholder:form.emailPlaceholder">
```

The EN/PT switch in the header writes the choice to `localStorage`, sets
`<html lang>`, and fires `ulf:languagechange`. Everything rendered in JavaScript
listens for that event and re-renders, so no reload is needed.

New visitors get Portuguese automatically when their browser language starts
with `pt`; otherwise English.

**Adding a string:** add the key to *both* `en` and `pt` in `i18n.js`, then point
markup at it. A key missing from `pt` falls back to English rather than
rendering blank, so a partial translation degrades gracefully.

Every list on the page — priority board, phases, tasks, links, team, minutes —
is rendered from a key table in `app.js` rather than written into the markup, so
one `renderAll()` rebuilds the page in the new language.

## Form submissions

The survey and the Upload panel post to a Google Apps Script web app. Everything runs
on the Google Workspace for Nonprofits plan — Apps Script, Sheets, Drive and
Gmail. There is no server to host and no Google Cloud project.

```
browser  ->  Apps Script web app  ->  Drive file + Sheet row + email
```

### Setup

1. Create the Google Sheets you need — at minimum one for survey responses.
2. Paste [google-apps-script.gs](google-apps-script.gs) into a new Apps Script
   project (script.google.com → New project).
3. In **Project Settings → Script properties**, add:

   | Property | Value |
   | --- | --- |
   | `SURVEY_SHEET_ID` | id of the survey Sheet |
   | `DELIVERABLE_SHEET_ID` | id of the deliverables Sheet |
   | `DOWNLOAD_SHEET_ID` | id of the download-responses Sheet |
   | `DELIVERABLE_PARENT_FOLDER_ID` | Drive folder submissions are filed under |
   | `REVIEWERS_JSON` | reviewer id → name/email map; run `setup()` to print a template |
   | `FALLBACK_REVIEWER_EMAIL` | receives anything misrouted |

   Optional: `ALLOWED_MAIL_DOMAINS` (default `universallimbs.com`),
   `DAILY_SUBMISSION_CAP` (default 200), `ACK_SUBMITTERS` (default true).

4. Run `setup()` once and read the execution log — it lists anything still
   missing instead of letting submissions fail later.
5. **Deploy → New deployment → Web app**, *Execute as* **Me**, *Who has access*
   **Anyone**. Copy the `/exec` URL into `submissionEndpoint` in
   [assets/js/config.js](assets/js/config.js).

Until that endpoint is set, the Upload panel and the survey both say so plainly
rather than failing silently.

### Upload

The Upload panel accepts a drag-and-drop or picked file and posts it as an
`upload` submission with the submitter's UI language recorded alongside. The
20 MB ceiling in the copy is enforced client-side before the file is read.

`handleUpload` files it under `Uploads/<yyyy-MM>/` in the Drive parent folder
and emails `FALLBACK_REVIEWER_EMAIL` that it arrived. No reviewer routing and no
required metadata, because the panel asks for none.

### Why there is no shared secret

A static site cannot keep one; it would sit in readable JavaScript. The browser
sends a reviewer **id**, never an address, and Apps Script resolves it against
`REVIEWERS_JSON` on its own side, so the endpoint can only mail people on that
allowlist. The endpoint is public and rate-limited: per-minute and per-day caps,
a honeypot field, and a 10 MB file ceiling.

## Documentation

- [UI_UX_doc.md](UI_UX_doc.md) — design principles, colour and depth tokens, MVP architecture
- [project_structure.md](project_structure.md) — repository layout
- [rules.md](rules.md) — R&D collaboration rules
- [workflow.md](workflow.md) — operational workflow
- [implementation.md](implementation.md) — R&D implementation strategy
- [bugtracking.md](bugtracking.md) — how bugs and issues are tracked
- [generate.mdc](generate.mdc) — rules for generating new components/docs

## Branching

- `main` — production, deploys on every push.
- `develop` — the working branch. Open a PR into `main` when a change is ready.

## Continuous checks

`.github/workflows/link-checker.yml` runs on every push/PR to `main` and
`develop` and:
- flags internal links pointing at files that do not exist in the repo,
- flags Google Docs/Drive/Forms links not scoped to a `universallimbs.com`
  account, so shared documents stay restricted to UL team members.

## Contact

The **Links** panel carries an *Email research team* link; team members' Gmail
links are on the **Team** panel.
