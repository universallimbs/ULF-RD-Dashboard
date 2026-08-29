# Project Structure

```text
.
├── index.html                  # Main Dashboard (markup only, MVP logic lives in assets/)
├── prosthetic-user-survey.html # User Feedback Tool
├── google-apps-script.gs       # Workspace backend: Sheets + Drive + mail
├── assets/
│   ├── css/
│   │   └── dashboard.css       # All dashboard styling (extracted from index.html)
│   └── js/
│       ├── app.js              # Model / View / Presenter sections (see UI_UX_doc.md)
│       ├── config.js           # submissionEndpoint for the Apps Script web app
│       └── submit.js           # Shared POST transport (classic script, reused by the survey)
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

- **Model** — `defaultMilestones`, `getMilestones()`, `saveMilestones()`, and
  `getResponses()` / `saveResponse()` for download-response receipts (all backed by `localStorage`).
- **View** — `renderGantt()`, `populateEditor()`, `renderResponses()`, and the DOM-rendering logic for the Gantt charts, milestone editor and download-response table.
- **Presenter** — event wiring: `activateView()`, nav/tab click handlers, the milestone editor controller, the updates carousel, the visual-reference modal, and the deliverable / download-response submission forms.

It's kept as one file (not split into `model.js` / `view.js` / `presenter.js`) so load order and shared DOM references stay simple for a static, no-build site. If the codebase grows significantly, splitting into separate files along those same section boundaries is the natural next step.
