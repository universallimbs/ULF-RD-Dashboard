# UI/UX Documentation

## Design Principles
- **One surface colour**: The whole page is a single tone. Depth comes only from a
  paired shadow — dark bottom-right, light top-left. Never give a card its own
  background colour; it breaks the illusion immediately.
- **Raised vs. pressed**: Interactive things are raised (`--sh-1`/`--sh-2`).
  Selected, active and input fields are pressed (`--sh-in`). That contrast is the
  entire state language, so use it consistently.
- **Accent sparingly**: Lime marks the one thing that matters in a view — the
  primary action, the active year, the current milestone. More than a few lime
  elements per screen and none of them read as important.
- **Actionable**: Every card leads to a clear next step ("Open", "Download",
  "Submit response").
- **Visual feedback**: Animate user actions (the ringing bell, pressed pills).

## Color Palette
- **Canvas**: `#eceff4` (soft grey — background *and* every surface)
- **Primary ink**: `#1a1d21` (near-black)
- **Muted / quiet text**: `#5b636d` / `#8d959f`
- **Accent**: `#d6f84c` (lime), deepened to `#b6d92f` for text on the canvas
- **Shadow pair**: `#c6cbd3` (low) and `#ffffff` (high)

## Depth tokens
| Token | Use |
| --- | --- |
| `--sh-1` | Buttons, small chips, avatars |
| `--sh-2` | Cards, panels, the header and sidebar |
| `--sh-3` | Hero, modals, hover lift on cards |
| `--sh-in` | Inputs, segmented-control tracks, selected nav, inner wells |
| `--sh-in-deep` | Focused inputs, pressed primary buttons |

Radii run `--r-xs` 10px through `--r-xl` 36px; pills use `999px`.

## Views
`Dashboard`, `Goal`, `Resources`, `University collaboration`, `Downloads`.
Only one `.view` carries `.active` at a time; `activateView()` in `app.js` owns
that switch.

## MVP Architecture
The dashboard follows a Model-View-Presenter (MVP) pattern:
- **Model**: Milestone data and download-response receipts in `localStorage`.
- **View**: DOM elements and CSS styling.
- **Presenter**: Logic layer handling navigation, carousel, milestone editing,
  and the deliverable / download-response submission forms.

## Accessibility notes
- Every interactive control keeps a visible `:focus-visible` ring — do not remove
  it to tidy up the soft-UI look.
- Neumorphic edges are low-contrast by nature, so text and icons must stay on the
  ink/muted tokens rather than being lightened to match the borders.
- `prefers-reduced-motion` disables the view and modal transitions.
