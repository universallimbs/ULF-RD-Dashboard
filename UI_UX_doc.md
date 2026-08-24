# UI/UX Documentation

## Design Principles
- **Clarity**: High contrast for readability in various lighting conditions.
- **Actionable**: Every card should lead to a clear next step (e.g., "Open", "Assign").
- **Visual Feedback**: Use animations for user actions (e.g., the ringing bell).

## Color Palette
- **Background**: `#181a1c` (Deep Dark)
- **Primary Ink**: `#f6f3fa` (Off-white)
- **Accent**: `#e6d46a` (Yellow)
- **Secondary**: `#6339b5` (Purple)

## MVP Architecture
The dashboard follows a Model-View-Presenter (MVP) pattern:
- **Model**: Milestone data in `localStorage`.
- **View**: DOM elements and CSS styling.
- **Presenter**: Logic layer handling navigation, carousel, and milestone updates.
