# Project Structure

```text
.
├── index.html                  # Main Dashboard (markup only, MVP logic lives in assets/)
├── prosthetic-user-survey.html # User Feedback Tool
├── assets/
│   ├── css/
│   │   └── dashboard.css       # All dashboard styling (extracted from index.html)
│   └── js/
│       └── app.js              # Model / View / Presenter sections (see UI_UX_doc.md)
├── README.md                   # Setup, branch URLs, and overview
├── rules.md                    # Collaboration rules
├── bugtracking.md              # Issue tracking process
├── implementation.md           # R&D strategy
├── project_structure.md        # This file
├── UI_UX_doc.md                # Interface design guidelines + MVP architecture
├── workflow.md                 # Daily operations
├── generate.mdc                # Rules for generating new components/docs
├── .github/
│   └── workflows/
│       └── link-checker.yml    # Broken-link + UL-only link validation
└── *.png / *.jpg / *.webp       # Renders, diagrams, and reference visuals used by the pages
```

## Architecture notes

`assets/js/app.js` is a single file, internally organized into three commented sections that map to an MVP pattern:

- **Model** — `defaultMilestones`, `getMilestones()`, `saveMilestones()` (backed by `localStorage`).
- **View** — `renderGantt()`, `populateEditor()`, and the DOM-rendering logic for the Gantt charts and milestone editor.
- **Presenter** — event wiring: `activateView()`, nav/tab click handlers, the milestone editor controller, the updates carousel, and the visual-reference modal.

It's kept as one file (not split into `model.js` / `view.js` / `presenter.js`) so load order and shared DOM references stay simple for a static, no-build site. If the codebase grows significantly, splitting into separate files along those same section boundaries is the natural next step.
