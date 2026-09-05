# UI/UX Documentation

**Scope: `prosthetic-user-survey.html` only.**

`index.html` is now a vendored design-tool export — its styling is inlined and
generated, and none of the tokens below apply to it. Everything here describes
`assets/css/dashboard.css`, which the survey is the only remaining consumer of.

Tokens were originally matched to that export, so the survey still looks like a
sibling of the hub even though they no longer share code.

## Design principles

- **Frosted glass, not solid cards.** Surfaces are translucent white over a flat
  `#eceff4` ground — `rgba(255,255,255,.55)` with a `1px solid #e2e7ec` hairline,
  a barely-there shadow, and `backdrop-filter: blur(8px)`. Depth comes from the
  border and the blur, never from a heavier fill.
- **Two surface weights.** Outer cards use `--card` (.55). Anything nested
  inside one — a person card, a link pill, a table row — steps up to
  `--card-solid` (.78) or `--card-strong` (.86) so it reads as *on* the card
  rather than beside it.
- **Accent sparingly.** Lime marks live state only: the current phase, the `1`
  in a priority list, the active rail step. The active tab is violet, not lime,
  precisely so navigation never competes with status.
- **Red is reserved.** `--red` is due-dates and blockers. Nothing else.

## Colour palette

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#eceff4` | page ground |
| `--ink` | `#1a1d21` | primary text, dark buttons |
| `--muted` | `#9ba3ab` | secondary text, labels |
| `--line` | `#e2e7ec` | every hairline border |
| `--rule` | `#dedede` | dividers, inactive dots |
| `--lime` | `#d6f84c` | live/active state |
| `--lime-tint` | `#f8fcea` | lime glow, focus ring |
| `--red` / `--red-tint` | `#c0392b` / `#fdecea` | due dates, blockers |
| `--violet` / `--violet-tint` | `#6b5bd6` / `#eeebff` | active tab |
| `--green` / `--blue` (+ tints) | | legend chips |

Radii: `--r-pill` 999px, then 8 / 10 / 14 / 18 / 22 / 28px. Cards are 28px,
nested cards 22px, rows and pills 14px.

Type is **Urbanist** (Google Fonts). Body is 13px; card titles 22px; the page
title 34px at `-.025em`. Micro-labels are 11px, `600`, `.14em` tracking, upper.

## Bilingual behaviour

Every visible string is a key in `assets/js/i18n.js` (survey strings in
`assets/js/i18n-survey.js`). Markup opts in with `data-i18n` /
`data-i18n-attr`; JS reads through `window.ulfI18n.t()`.

Switching writes to `localStorage`, sets `<html lang>` and fires
`ulf:languagechange`; the survey rebuilds its rating/scale blocks on that event,
snapshotting and restoring the answers so a mid-survey switch loses nothing.

**Two rules when adding UI:**
1. No literal user-visible text — add a key to both tables.
2. If you render it in JavaScript, rebuild it on `ulf:languagechange`, or it
   will keep the old language after a switch.

`ulfI18n.en()` resolves against the English table whatever the UI shows. Use it
for any value leaving the browser, so a Sheet column holds one language.

Portuguese runs 15–25% longer than English, and some strings much more —
"Waiting" becomes "À espera de validação". Chips and table rows must wrap or
grow rather than being sized to the English string. Check the PT view before
calling a layout done.

## Compatibility aliases

`:root` carries a small block of aliases (`--accent`, `--sh-1`, `--quiet`, …)
mapping the previous neumorphic token names onto this system, because
`prosthetic-user-survey.html` was authored against them. They exist so the
survey inherits this theme instead of breaking. **Do not use them in new work.**

## Accessibility notes

- Every control keeps a visible `:focus-visible` ring.
- The glass borders are low-contrast by design, so text must stay on `--ink` or
  `--muted` — never lightened to match the hairlines.
- Clock offsets come from `Intl.DateTimeFormat` with `timeZoneName: 'longOffset'`
  rather than being hardcoded, so they stay correct across DST on both sides.
- `prefers-reduced-motion` disables the panel transition.
