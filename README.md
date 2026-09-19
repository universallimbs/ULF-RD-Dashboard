# ULF R&D Dashboard

### ▶ [View the site](https://universallimbs.github.io/ULF-RD-Dashboard/)

Internal R&D hub for the Universal Limbs Foundation pediatric prosthetic hand
programme, plus a standalone prosthetic-user survey.

Static — no build step. Any file server will do.

```bash
python3 -m http.server 8080
# http://127.0.0.1:8080/index.html
```

## index.html is a vendored export

`index.html` is a design-tool export, vendored into this repo. It is readable
HTML (~38 KB): a single `<style>` block, plain markup with real class names, and
one inline `<script>`. It needs `prosthetic-hand.png` alongside it — unlike the
previous export, it is **not** self-contained.

It is legible enough to edit, but **edits still do not survive a refresh** —
re-exporting overwrites the file wholesale. Anything this repo needs to keep
belongs in the patch list below, so it can be re-applied deliberately.

> **Note:** an earlier export was a ~1.2 MB self-unpacking bundle with inlined
> fonts and generated ids. That is no longer the shape. If you refresh and get a
> file starting `<title>Bundled Page</title>`, the export format has changed
> back and this section needs revisiting.

### Refreshing it

Re-download the published export over `index.html` **and its image**, then
re-apply the local patches below. The publish URL is not recorded here — ask
the R&D lead for the current one.

```bash
curl -sL "<published URL>/"                    -o index.html
curl -sL "<published URL>/prosthetic-hand.png" -o prosthetic-hand.png
```

### The local patches

All reverted by a plain re-fetch. Re-apply after every refresh:

1. **Anqido link** — the export points at `anqido.app/social`; this repo uses
   the team workspace.
2. **Ganesh A → Ganesh V** — including the `GA` avatar initials.
3. **Team roster** — the export ships 10 people; this repo carries the union
   with the R&D org chart (24), alphabetised by name, with eight new role keys
   added to the `pt` table.

(1) and (2) are find-and-replace:

```bash
python3 - <<'EOF'
s = open('index.html', encoding='utf-8').read()
s = s.replace('anqido.app/social', 'anqido.app/work/universal-limbs/my-desk')
s = s.replace('<div class="avatar">GA</div><div class="person-name">Ganesh A</div>',
              '<div class="avatar">GV</div><div class="person-name">Ganesh V</div>')
open('index.html', 'w', encoding='utf-8').write(s)
EOF
```

(3) is not — see `git log -p -- index.html` for the roster commit to re-derive it.

**No longer needed:** the previous export carried a `github.com/…` link that had
to be repointed. This one has no GitHub link at all.

### How the export does EN/PT

English lives inline in the markup on `data-i18n` elements; the script harvests
it into `COPY.en` at load. Only Portuguese is stored, as an override table
(`COPY.pt`). So **adding a person means adding the English inline and a `pt`
entry** — there is no `en` table to update.

### What the export currently ships

Department tabs **R&D · P&R · Finance · ULF**, an EN/PT switch, reference tabs
(**Waacs · YaleHand · Softfoot Pro · UL arm · Live**), a *Baseline* panel, the
team strip, and **Download / Upload / Links & Mins** buttons.

The export is re-cut without notice and has changed shape substantially more
than once — a seven-tab hub, then a five-tab bundle, now this. Treat any
description here as a snapshot, not a contract.

## The survey is hand-authored

`prosthetic-user-survey.html` is real source and the only page you edit
normally. It uses:

| File | Role |
| --- | --- |
| `assets/css/dashboard.css` | Glass design system — now used **only** by the survey |
| `assets/js/i18n.js` | EN/PT strings + the swap engine |
| `assets/js/i18n-survey.js` | Survey-only strings, merged via `ulfI18n.extend()` |
| `assets/js/config.js` | `submissionEndpoint` for the Apps Script web app |
| `assets/js/submit.js` | Shared POST transport |

Script order matters: `config.js → submit.js → i18n.js → i18n-survey.js`, then
the page's own inline script calls `ulfI18n.init()`.

Strings opt in with `data-i18n` / `data-i18n-attr`; JS reads through
`window.ulfI18n.t()`. `ulfI18n.en()` always resolves English — use it for values
leaving the browser so a Sheet column stays in one language.

The Portuguese in `i18n.js` is mixed: the base came from the vendored bundle and
is European (`ficheiro`, `equipa`), while the survey strings are Brazilian
(`arquivo`). Both are correct Portuguese; picking one is an open decision.

## Form submissions

The survey posts to a Google Apps Script web app — Apps Script, Sheets, Drive
and Gmail, all on the Workspace for Nonprofits plan. No server, no Cloud project.

```
browser  ->  Apps Script web app  ->  Drive file + Sheet row + email
```

`google-apps-script.gs` also still carries handlers for `deliverable`,
`download` and `upload` submissions. Those were used by the previous
hand-built dashboard; **nothing in the vendored bundle calls them.** They are
kept because they are working, tested code and the Sheets exist, but they are
currently unreachable from the UI.

### Setup

1. Create the Sheets you need — at minimum one for survey responses.
2. Paste `google-apps-script.gs` into a new Apps Script project.
3. **Project Settings → Script properties**:

   | Property | Value |
   | --- | --- |
   | `SURVEY_SHEET_ID` | id of the survey Sheet |
   | `DELIVERABLE_SHEET_ID` | deliverables Sheet (only if you re-expose that form) |
   | `DOWNLOAD_SHEET_ID` | download-responses Sheet (likewise) |
   | `DELIVERABLE_PARENT_FOLDER_ID` | Drive folder submissions file under |
   | `REVIEWERS_JSON` | reviewer id → name/email map; `setup()` prints a template |
   | `FALLBACK_REVIEWER_EMAIL` | receives anything misrouted |

   Optional: `ALLOWED_MAIL_DOMAINS` (default `universallimbs.com`),
   `DAILY_SUBMISSION_CAP` (default 200), `ACK_SUBMITTERS` (default true).

4. Run `setup()` and read the log — it lists what is still missing.
5. **Deploy → New deployment → Web app**, *Execute as* **Me**, *Who has access*
   **Anyone**. Put the `/exec` URL in `assets/js/config.js`.

Until that is set the survey says so plainly rather than failing silently.

### Why there is no shared secret

A static site cannot keep one — it would sit in readable JavaScript. The browser
sends a reviewer **id**, never an address; Apps Script resolves it against
`REVIEWERS_JSON` on its own side, so the endpoint can only mail people on that
allowlist. It is public and rate-limited: per-minute and per-day caps, a
honeypot field, and a file-size ceiling.

## Unreferenced assets

`testbench-architecture.webp`, `yale-multigrasp.png`, `waacs-basis.png`,
`softfoot-pro.jpg`, `ulf-prosthetic-render.*`, `ulf-product-demo-poster.jpg` are
no longer referenced by any page — the bundle inlines its own images. They are
kept because they are original programme artifacts, not regenerable.
`ul-logo.png` is used by the survey; `prosthetic-hand.png` by the hub export.

## Documentation

- [UI_UX_doc.md](UI_UX_doc.md) — design tokens (survey/`dashboard.css` only)
- [project_structure.md](project_structure.md) — repository layout
- [rules.md](rules.md) · [workflow.md](workflow.md) · [implementation.md](implementation.md) · [bugtracking.md](bugtracking.md) · [generate.mdc](generate.mdc)

## Branching

- `main` — production, published via GitHub Pages, deploys on every push.
- `develop` — working branch; PR into `main` when ready.

## Continuous checks

`.github/workflows/link-checker.yml` flags internal links to missing files and
Google Docs/Drive/Forms links not scoped to a `universallimbs.com` account.
