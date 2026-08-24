# ULF R&D Dashboard

React and Vite R&D dashboard for the Universal Limbs Foundation prosthetic hand program.

## Live pages

| Branch | Purpose | URL |
| --- | --- | --- |
| `main` | Production (published via GitHub Pages) | https://rasna-spec.github.io/ULF-RD-Dashboard/ |
| `develop` | Active development / staging | Run locally (see below) until a preview deployment is configured |

Direct pages:
- Dashboard: `/`
- Prosthetic user survey: `/survey`

## Quick start (local preview)

Install Node.js 20 or later, then run from the repository root:

```bash
npm install
npm run dev
```

Then open:
- http://localhost:8000/
- http://localhost:8000/survey

Build and preview the production bundle:

```bash
npm run build
npm run preview
```


`npm start` runs the same files through Express on port 8000 with the production
URLs (`/` and `/survey`). The site is plain static HTML/CSS/JS, so any static file
server works too.

## Form Submissions

The prosthetic-user survey and the University Collaboration deliverable form post
directly to a Google Apps Script web app. Everything runs on the Google Workspace
for Nonprofits plan — Apps Script, Sheets, Drive and Gmail. There is no server to
host and no Google Cloud project, so the dashboard stays a static site and keeps
working on GitHub Pages.

```
browser  ->  Apps Script web app  ->  Drive file + Sheet row + email to the reviewer
```

### Setup

1. Create two Google Sheets: one for survey responses, one for deliverables.
2. Open [google-apps-script.gs](google-apps-script.gs) in a new Apps Script project
   (script.google.com → New project) and paste the file in.
3. In **Project Settings → Script properties**, add:

   | Property | Value |
   | --- | --- |
   | `DELIVERABLE_SHEET_ID` | id of the deliverables Sheet |
   | `SURVEY_SHEET_ID` | id of the survey Sheet |
   | `DELIVERABLE_PARENT_FOLDER_ID` | Drive folder to file submissions under |
   | `REVIEWERS_JSON` | reviewer id → name/email map; run `setup()` to print a template |
   | `FALLBACK_REVIEWER_EMAIL` | receives "Other" and any misrouted submission |

   Optional: `ALLOWED_MAIL_DOMAINS` (default `universallimbs.com`),
   `DAILY_SUBMISSION_CAP` (default 200), `ACK_SUBMITTERS` (default true).

4. Run `setup()` once and read the execution log — it lists anything still missing
   instead of letting submissions fail later. `selfTest()` files a throwaway
   deliverable end to end so you can confirm Drive, Sheets and mail all work.
5. **Deploy → New deployment → Web app**, with *Execute as* **Me** and
   *Who has access* **Anyone**. Copy the `/exec` URL into
   `submissionEndpoint` in [assets/js/config.js](assets/js/config.js).

The reviewer ids in `REVIEWERS_JSON` must match the `<option value>` entries in the
reviewer dropdown in [index.html](index.html).

### How reviewer routing is protected

The browser sends a reviewer **id** (`saja-amro`, `walid`, …), never an email
address. Apps Script resolves that id against `REVIEWERS_JSON` on its own side, so
the endpoint can only ever mail people on that allowlist — it cannot be used to
send mail to arbitrary addresses. The "Other" option, and any id that is missing or
misconfigured, routes to `FALLBACK_REVIEWER_EMAIL`; whatever the submitter typed is
recorded in the Sheet rather than mailed.

There is deliberately **no shared secret**. A static site cannot keep one — it
would sit in readable JavaScript. The endpoint is public and rate-limited
(per-minute and per-day caps, a honeypot field, and a 10 MB file ceiling).

## Project structure

See [project_structure.md](project_structure.md) for the full file layout and the [MVP architecture](UI_UX_doc.md#mvp-architecture) the dashboard follows (state in `assets/js/model.js`, rendering in `assets/js/view.js`, event/interaction logic in `assets/js/presenter.js`).

## Documentation

- [rules.md](rules.md) — R&D collaboration rules
- [workflow.md](workflow.md) — operational workflow
- [implementation.md](implementation.md) — R&D implementation strategy
- [bugtracking.md](bugtracking.md) — how bugs/issues are tracked
- [UI_UX_doc.md](UI_UX_doc.md) — design principles, color palette, MVP architecture
- [project_structure.md](project_structure.md) — repository layout
- [generate.mdc](generate.mdc) — rules for generating new components/docs

## Branching

- `main` — production, published via GitHub Pages.
- `develop` — active development branch. Open PRs from `develop` into `main` when a change is ready to publish.

## Continuous checks

`.github/workflows/link-checker.yml` runs on every push/PR to `main` and `develop` and:
- scans the site for internal links (relative `href`/`src`) and flags any pointing to a file that doesn't exist in the repo,
- flags Google Docs/Drive/Forms links that aren't scoped to a `universallimbs.com` account, so shared documents stay restricted to UL team members instead of being publicly open.

## Contact / feedback

Every page has a persistent feedback bar at the bottom that opens a pre-filled email to the R&D team.
