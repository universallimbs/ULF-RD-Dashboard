# UI/UX Documentation

## Design principles

- **One surface colour.** The whole page is a single tone. Depth comes only from
  a paired shadow — dark bottom-right, light top-left. Never give a card its own
  background colour; it breaks the illusion immediately.
- **Raised vs. pressed.** Interactive things are raised (`--sh-1`/`--sh-2`).
  Selected states, active tabs and input fields are pressed (`--sh-in`). That
  contrast is the entire state language, so apply it consistently.
- **Accent sparingly.** Lime marks the one thing that matters in a view — the
  primary action, the active year, the current milestone. More than a few lime
  elements per screen and none of them read as important. Placeholder actions
  (an "Add link" pointing at `#`) stay neutral.
- **Actionable.** Every card leads to a clear next step: Open, Download,
  Submit response.
- **Visual feedback.** Animate user actions (the ringing bell, pressed pills).

## Colour palette

- **Canvas** `#eceff4` — background *and* every surface
- **Primary ink** `#1a1d21`
- **Muted / quiet text** `#5b636d` / `#8d959f`
- **Accent** `#d6f84c` (lime), deepened to `#b6d92f` for text on the canvas
- **Shadow pair** `#c6cbd3` (low) and `#ffffff` (high)

## Depth tokens

| Token | Use |
| --- | --- |
| `--sh-1` | Buttons, chips, avatars |
| `--sh-2` | Cards, panels, header, sidebar |
| `--sh-3` | Hero, modals, hover lift on cards |
| `--sh-in` | Inputs, segmented-control tracks, selected nav, inner wells |
| `--sh-in-deep` | Focused inputs, pressed primary buttons |

Radii run `--r-xs` 10px through `--r-xl` 36px; pills use `999px`.

## Views

`Dashboard`, `Goal`, `Resources`, `University collaboration`, `Downloads`.
Only one `.view` carries `.active` at a time; `activateView()` in `app.js` owns
that switch.

## Bilingual behaviour

Every visible string is a key in `assets/js/i18n.js` (survey strings in
`assets/js/i18n-survey.js`), with an `en` and a `pt` entry. Markup opts in with
`data-i18n` / `data-i18n-attr`; JS reads through `window.ulfI18n.t()`.

Switching language writes to `localStorage`, updates `<html lang>` and fires
`ulf:languagechange`. Every JS-rendered block re-renders on that event.

**Two rules when adding UI:**
1. No literal user-visible text in markup or JS — add a key to both tables.
2. If you render it in JavaScript, make sure it is rebuilt by `renderAll()`,
   otherwise it will keep the old language after a switch.

Portuguese is roughly 15–25% longer than English. Buttons, nav items and table
headers must wrap or shrink gracefully rather than being sized to the English
string — check the PT view before considering a layout done.

## MVP architecture

- **Model** — milestone data and download-response receipts in `localStorage`;
  the team, parts and package lists as plain arrays at the top of `app.js`.
- **View** — `renderTeam()`, `renderParts()`, `renderDownloads()`,
  `renderGantt()`, `renderResponses()`, `populateEditor()`.
- **Presenter** — `activateView()`, nav/tab handlers, the milestone editor, the
  carousel, and the deliverable / download-response forms.

## Accessibility notes

- Every interactive control keeps a visible `:focus-visible` ring — do not
  remove it to tidy up the soft-UI look.
- Neumorphic edges are low-contrast by nature, so text and icons must stay on
  the ink/muted tokens rather than being lightened to match the borders.
- Modals close on `Escape` and on backdrop click.
- `prefers-reduced-motion` disables view and modal transitions.
