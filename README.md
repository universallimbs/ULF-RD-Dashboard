# ULF R&D Dashboard

Static, bilingual (EN / PT-BR) R&D dashboard for the Universal Limbs Foundation
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

## Sections

| View | What it is for |
| --- | --- |
| Dashboard | Greeting, progress, today's focus, next meeting, project summary, team, latest updates, documents |
| Goal | Milestone timeline (week / month / year) with an inline milestone editor |
| Resources | Playbooks, SOPs, links and presentations |
| University collaboration | Partner deck, test-rig architecture, student build brief, deliverable submission |
| Downloads | Reference packages for university teams, each paired with a project-response form |

## Languages

Every visible string lives in [assets/js/i18n.js](assets/js/i18n.js) as an
`en` / `pt` pair; the survey's own vocabulary is in
[assets/js/i18n-survey.js](assets/js/i18n-survey.js). Markup opts in per node:

```html
<h1 data-i18n="summary.heading">Project summary</h1>
<input data-i18n-attr="placeholder:form.emailPlaceholder">
```

The EN/PT switch in the header writes the choice to `localStorage`, sets
`<html lang>`, and fires `ulf:languagechange`. Anything rendered in JavaScript —
the team cards, the download cards, the milestone timeline, the response table —
listens for that event and re-renders, so no reload is needed.

New visitors get Portuguese automatically when their browser language starts
with `pt`; otherwise English.

**Adding a string:** add the key to *both* `en` and `pt` in `i18n.js`, then point
markup at it. A key missing from `pt` falls back to English rather than
rendering blank, so a partial translation degrades gracefully.

**Milestones** are the one exception. The three built-in milestones carry an
`i18n` prefix and follow the language. Once someone edits a milestone it stores
literal text instead, because user-authored text cannot be auto-translated.

## Form submissions

The survey, the University Collaboration deliverable form and the Downloads
project-response form all post to a Google Apps Script web app. Everything runs
on the Google Workspace for Nonprofits plan — Apps Script, Sheets, Drive and
Gmail. There is no server to host and no Google Cloud project.

```
browser  ->  Apps Script web app  ->  Drive file + Sheet row + email
```

### Setup

1. Create three Google Sheets: survey responses, deliverables, download responses.
2. Paste [google-apps-script.gs](google-apps-script.gs) into a new Apps Script
   project (script.google.com → New project).
3. In **Project Settings → Script properties**, add:

   | Property | Value |
   | --- | --- |
   | `DELIVERABLE_SHEET_ID` | id of the deliverables Sheet |
   | `SURVEY_SHEET_ID` | id of the survey Sheet |
   | `DOWNLOAD_SHEET_ID` | id of the download-responses Sheet |
   | `DELIVERABLE_PARENT_FOLDER_ID` | Drive folder submissions are filed under |
   | `REVIEWERS_JSON` | reviewer id → name/email map; run `setup()` to print a template |
   | `FALLBACK_REVIEWER_EMAIL` | receives "Other", misroutes, and every download response |

   Optional: `ALLOWED_MAIL_DOMAINS` (default `universallimbs.com`),
   `DAILY_SUBMISSION_CAP` (default 200), `ACK_SUBMITTERS` (default true).

4. Run `setup()` once and read the execution log — it lists anything still
   missing instead of letting submissions fail later.
5. **Deploy → New deployment → Web app**, *Execute as* **Me**, *Who has access*
   **Anyone**. Copy the `/exec` URL into `submissionEndpoint` in
   [assets/js/config.js](assets/js/config.js).

Until that endpoint is set, both forms say so plainly rather than failing
silently.

The reviewer ids in `REVIEWERS_JSON` must match the `<option value>` entries in
the reviewer dropdown in [index.html](index.html).

### Downloads and project responses

Each Downloads card pairs its download with a **Submit response** action. A
response records the package, team, status, what the team did, what they found
and what they need from UL next; a supporting file is optional.

Responses land in `DOWNLOAD_SHEET_ID` and email the collaboration coordinator
(`FALLBACK_REVIEWER_EMAIL`) — the goal is programme-level tracking rather than
per-reviewer routing. Attachments file under `Responses/<yyyy-MM>/`.

Package and status reach the sheet as **English** text regardless of the
submitter's language, and the chosen language is recorded in its own column, so
one spreadsheet stays sortable across both languages.

The submitting device also keeps `localStorage` receipts, which is what the
*Project responses* table shows. That table is a convenience for the student —
the Sheet is the record of truth.

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

## Contact / feedback

Every page has a persistent feedback bar that opens a pre-filled email to the
R&D team.
