# ULF R&D Dashboard

Internal R&D hub for the Universal Limbs Foundation pediatric prosthetic hand
programme, plus a standalone prosthetic-user survey.

Static — no build step. Any file server will do.

```bash
python3 -m http.server 8080
# http://127.0.0.1:8080/index.html
```

## ⚠️ index.html is a vendored build artifact

`index.html` is the published bundle from
**https://rasna-spec.github.io/ULF-RD-Dashboard/**, copied verbatim so this repo
serves exactly that site. It is a ~1.2 MB self-contained page: a design-tool
export whose markup, styles, fonts and images are all inlined, unpacked at
runtime by a loader.

**It is not editable source.** There are no classes to target, no stylesheet to
change; styles are inline and element ids are generated. Do not hand-edit it —
any change will be lost the next time the bundle is refreshed, and a careless
edit can break the loader and leave the page stuck on "Unpacking…".

### Refreshing it

```bash
curl -sL https://rasna-spec.github.io/ULF-RD-Dashboard/ -o index.html
# then re-apply the local patches below
```

### The local patches

Two, both reverted by a plain re-fetch. Re-apply after every refresh:

1. **Anqido buttons** — upstream points all five at `anqido.app/social`; this
   repo uses the team workspace.
2. **GitHub link** — upstream points at `github.com/rasna-spec/…`; this repo is
   published from the `universallimbs` org.

```bash
python3 - <<'EOF'
s = open('index.html', encoding='utf-8').read()
s = s.replace('anqido.app/social', 'anqido.app/work/universal-limbs/my-desk')
s = s.replace('github.com/rasna-spec/ULF-RD-Dashboard',
              'github.com/universallimbs/ULF-RD-Dashboard')
open('index.html', 'w', encoding='utf-8').write(s)
EOF
```

Note the *fetch* URL stays `rasna-spec.github.io` — that is genuinely where the
bundle is published, and is unrelated to the repo link shown inside the page.

### What upstream currently ships

Tabs: **Overview · Upload · Download · Teams · Mins**. A dual-timezone clock
(Brazil fixed, second city selectable), an EN/PT switch, a dark-mode toggle, and
an Overview built around *Current projects* (MVP 1 terminal hand, MVP 2 silicone
glove), *Unassigned tasks* and *Blockers*.

Upstream changes without notice — it was a different layout a week before this
was written — so treat any description here as a snapshot, not a contract.

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

The Portuguese in `i18n.js` is mixed: the base came from the upstream bundle and
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
`ul-logo.png` is still used by the survey.

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
