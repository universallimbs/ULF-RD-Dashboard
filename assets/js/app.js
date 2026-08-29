// ULF R&D Dashboard — application script
// Organized as MVP: MODEL (data + persistence), VIEW (rendering), PRESENTER (event wiring).
// Kept in one file (not three) so load order and shared references stay simple for a
// static site.
//
// Anything the user can read is built from a key in assets/js/i18n.js rather than from
// literal text, and every JS-rendered block re-renders on `ulf:languagechange`.

const t = (key) => window.ulfI18n.t(key);

// ===== PRESENTER: view/navigation switching =====
function activateView(id) {
  document.querySelectorAll('.nav button').forEach(button => {
    button.classList.toggle('active', button.dataset.view === id);
  });
  document.querySelectorAll('.view').forEach(view => {
    view.classList.toggle('active', view.id === id);
  });
  window.scrollTo(0, 0);
}

document.querySelectorAll('.nav button').forEach(button => {
  button.addEventListener('click', () => activateView(button.dataset.view));
});

document.querySelectorAll('[data-jump]').forEach(button => {
  button.addEventListener('click', () => activateView(button.dataset.jump));
});

document.querySelectorAll('.year').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.year').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    document.querySelector('.top-year').textContent = button.dataset.year === '2' ? '2027' : '2026';
    activateView('dashboard');
  });
});

// ===== MODEL: team =====
const TEAM = [
  { initial: 'R', name: 'Rasna',   email: 'rasna@universallimbs.com',   key: 'rasna' },
  { initial: 'S', name: 'Sahitya', email: 'sahitya@universallimbs.com', key: 'sahitya' },
  { initial: 'S', name: 'Saja',    email: 'saja@universallimbs.com',    key: 'saja' },
  { initial: 'A', name: 'Ana',     email: 'ana@universallimbs.com',     key: 'ana' },
  { initial: 'M', name: 'Maria',   email: 'maria@universallimbs.com',   key: 'maria' }
];

const REMINDER_BODY = 'Hi,%0A%0AA%20friendly%20reminder%20from%20your%20team.%20The%20deadline%20is%20coming%20up%20and%20the%20team%20would%20love%20an%20update.%0A%0AIf%20you%20need%20help,%20please%20say%20so.%0A%0AThank%20you.';

// ===== MODEL: test rig parts =====
const PARTS = ['motor', 'cableCell', 'bowden', 'bed', 'wrist', 'hand', 'gripCell', 'daq', 'python'];

// ===== MODEL: download packages =====
const PACKAGES = [
  { key: 'bench',   href: 'testbench-architecture.webp', download: true,
    icon: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/>' },
  { key: 'base',    href: 'waacs-basis.png', download: true,
    icon: '<path d="M12 2v6m0 0 3-3m-3 3L9 5"/><rect x="3" y="12" width="18" height="9" rx="2"/><path d="M7 16h.01M11 16h6"/>' },
  { key: 'tracker', href: 'https://docs.google.com/spreadsheets/d/1Cf-Qrm9P4SmOiynSsROKjqrrjdEQIn6SukNvNQSpMGU/edit?usp=sharing',
    icon: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
  { key: 'survey',  href: 'prosthetic-user-survey.html',
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 15h6M9 11h2"/>' },
  { key: 'deck',    href: 'https://www.canva.com/design/DAHTNfcZ7mY/-mLW3MtJCuIdiUuWD4xeDQ/view',
    icon: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>' },
  { key: 'visuals', href: 'yale-multigrasp.png', download: true,
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>' }
];

// ===== MODEL: milestones =====
// Defaults carry an `i18n` prefix so their text follows the language. Once a user edits
// a milestone it stores literal text instead — authored text cannot be auto-translated.
const defaultMilestones = [
  { id: 1, i18n: 'ms.1', visualImg: 'yale-multigrasp.png', periods: { week: [2, 5], month: [0, 2], year: [0, 3] } },
  { id: 2, i18n: 'ms.2', visualImg: 'softfoot-pro.jpg',    periods: { week: [3, 6], month: [1, 4], year: [4, 7] } },
  { id: 3, i18n: 'ms.3', visualImg: 'waacs-basis.png',     periods: { week: [4, 6], month: [3, 4], year: [8, 11] } }
];

function getMilestones() {
  const saved = localStorage.getItem('ulf-milestones');
  if (!saved) return defaultMilestones;
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultMilestones;
  } catch (error) {
    return defaultMilestones;
  }
}

function saveMilestones(list) {
  localStorage.setItem('ulf-milestones', JSON.stringify(list));
}

/** Reads one milestone field, translating it when the milestone is a built-in. */
function msField(milestone, field) {
  if (milestone.i18n) return t(milestone.i18n + '.' + field);
  return milestone[field] || '';
}

const periodColumns = {
  week:  ['tl.mon', 'tl.tue', 'tl.wed', 'tl.thu', 'tl.fri', 'tl.sat', 'tl.sun'],
  month: ['tl.w1', 'tl.w2', 'tl.w3', 'tl.w4', 'tl.w5'],
  year:  ['tl.aug', 'tl.sep', 'tl.oct', 'tl.nov', 'tl.dec', 'tl.jan',
          'tl.feb', 'tl.mar', 'tl.apr', 'tl.may', 'tl.jun', 'tl.jul']
};

// ===== VIEW: team =====
function renderTeam() {
  const host = document.getElementById('teamGrid');
  if (!host) return;
  host.innerHTML = '';

  TEAM.forEach(member => {
    const card = document.createElement('article');
    card.className = 'team-member';

    const top = document.createElement('div');
    top.className = 'team-card-top';

    const photo = document.createElement('div');
    photo.className = 'team-photo';
    photo.textContent = member.initial;

    const bell = document.createElement('a');
    bell.className = 'bell-btn';
    bell.href = 'mailto:' + member.email + '?subject=Friendly%20R%26D%20reminder&body=' + REMINDER_BODY + '&cc=sahitya@universallimbs.com';
    bell.title = t('side.remind');
    bell.setAttribute('aria-label', t('side.remind'));
    bell.innerHTML = '<svg class="bell-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 17H9m9-2V10a6 6 0 0 0-12 0v5l-2 2h16l-2-2Zm-5 5a2 2 0 0 1-2 0"/></svg>';

    top.append(photo, bell);

    const name = document.createElement('div');
    name.className = 'team-name';
    name.textContent = member.name;

    const role = document.createElement('div');
    role.className = 'team-role';
    role.textContent = t('team.' + member.key + '.role');

    const exp = document.createElement('div');
    exp.className = 'team-experience';
    const expLabel = document.createElement('strong');
    expLabel.textContent = t('team.experience') + ' ';
    exp.append(expLabel, document.createTextNode(t('team.' + member.key + '.exp')));

    const dot = document.createElement('span');
    dot.className = 'info-dot';
    dot.textContent = 'i';
    const tip = document.createElement('span');
    tip.className = 'info-tip';
    tip.textContent = t('team.' + member.key + '.tip');
    dot.appendChild(tip);

    const actions = document.createElement('div');
    actions.className = 'team-actions';
    const assign = document.createElement('a');
    assign.className = 'mini-pill';
    assign.href = 'mailto:' + member.email + '?subject=R%26D%20task%20assignment&cc=sahitya@universallimbs.com';
    assign.textContent = t('team.assign');
    actions.appendChild(assign);

    card.append(top, name, role, exp, dot, actions);
    host.appendChild(card);
  });
}

// ===== VIEW: test rig parts =====
function renderParts() {
  const list = document.getElementById('processList');
  const grid = document.getElementById('partsGrid');

  if (list) {
    list.innerHTML = '';
    PARTS.forEach(key => {
      const item = document.createElement('div');
      item.className = 'process-item';
      const wrap = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = t('part.' + key);
      const desc = document.createElement('small');
      desc.textContent = t('part.' + key + '.d');
      wrap.append(title, desc);
      item.appendChild(wrap);
      list.appendChild(item);
    });
  }

  if (grid) {
    grid.innerHTML = '';
    PARTS.forEach(key => {
      const item = document.createElement('div');
      item.className = 'label-item';
      const label = document.createElement('span');
      label.textContent = t('part.' + key);
      item.appendChild(label);
      grid.appendChild(item);
    });
  }
}

// ===== VIEW: download cards =====
function renderDownloads() {
  const host = document.getElementById('downloadGrid');
  const select = document.getElementById('downloadPackage');
  if (!host) return;

  host.innerHTML = '';
  if (select) {
    select.innerHTML = '';
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = t('form.choosePackage');
    select.appendChild(blank);
  }

  PACKAGES.forEach(pkg => {
    const card = document.createElement('article');
    card.className = 'download-card';

    const top = document.createElement('div');
    top.className = 'dl-top';
    const icon = document.createElement('div');
    icon.className = 'dl-icon';
    icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + pkg.icon + '</svg>';
    const tag = document.createElement('span');
    tag.className = 'dl-tag';
    tag.textContent = t('dl.' + pkg.key + '.tag');
    top.append(icon, tag);

    const title = document.createElement('h3');
    title.textContent = t('dl.' + pkg.key + '.title');

    const body = document.createElement('p');
    body.textContent = t('dl.' + pkg.key + '.body');

    const meta = document.createElement('div');
    meta.className = 'dl-meta';
    ['m1', 'm2'].forEach(slot => {
      const chip = document.createElement('span');
      chip.textContent = t('dl.' + pkg.key + '.' + slot);
      meta.appendChild(chip);
    });

    const actions = document.createElement('div');
    actions.className = 'dl-actions';

    const get = document.createElement('a');
    get.className = 'pill primary';
    get.href = pkg.href;
    get.textContent = pkg.download ? t('dl.download') : t('dl.open');
    if (pkg.download) get.setAttribute('download', '');
    else { get.target = '_blank'; get.rel = 'noopener'; }

    const respond = document.createElement('button');
    respond.className = 'pill';
    respond.type = 'button';
    respond.dataset.response = pkg.key;
    respond.textContent = t('dl.respond');

    actions.append(get, respond);
    card.append(top, title, body, meta, actions);
    host.appendChild(card);

    if (select) {
      const option = document.createElement('option');
      option.value = pkg.key;                       // stable key, not display text
      option.textContent = t('dl.' + pkg.key + '.title');
      select.appendChild(option);
    }
  });
}

// ===== VIEW: gantt chart =====
function renderGantt(period) {
  const container = document.getElementById('gantt-' + period);
  if (!container) return;

  const columns = periodColumns[period];
  const milestones = getMilestones();
  const template = '140px repeat(' + columns.length + ', minmax(52px, 1fr))';

  const head = document.createElement('div');
  head.className = 'timeline-head';
  head.style.gridTemplateColumns = template;
  head.innerHTML = '<div></div>';
  head.firstChild.textContent = t('tl.milestone');
  columns.forEach(key => {
    const cell = document.createElement('div');
    cell.textContent = t(key);
    head.appendChild(cell);
  });

  const timeline = document.createElement('div');
  timeline.className = 'timeline';
  timeline.appendChild(head);

  milestones.forEach(milestone => {
    const [startRaw, endRaw] = milestone.periods[period] || [0, 0];
    const start = Math.max(0, Math.min(startRaw, columns.length - 1));
    const end = Math.max(start, Math.min(endRaw, columns.length - 1));

    const row = document.createElement('div');
    row.className = 'timeline-row';
    row.style.gridTemplateColumns = template;

    const label = document.createElement('div');
    label.className = 'milestone-label';
    label.style.gridArea = '1 / 1';
    const labelTitle = document.createElement('strong');
    labelTitle.textContent = msField(milestone, 'label');
    const labelRange = document.createElement('span');
    labelRange.textContent = msField(milestone, 'range');
    label.append(labelTitle, labelRange);
    row.appendChild(label);

    // Every cell is placed explicitly on row 1. Left to auto-placement they would
    // flow around the bar (which is explicitly placed) and spill onto a second row.
    for (let i = 0; i < columns.length; i += 1) {
      const cell = document.createElement('div');
      cell.className = 'month-cell';
      cell.style.gridArea = '1 / ' + (i + 2);
      row.appendChild(cell);
    }

    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.textContent = msField(milestone, 'title');
    bar.style.gridColumn = (start + 2) + ' / span ' + Math.max(1, end - start + 1);
    bar.style.gridRow = '1';

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'visual-dot';
    dot.setAttribute('aria-label', msField(milestone, 'visualTitle'));
    dot.addEventListener('click', () => {
      modalTitle.textContent = msField(milestone, 'visualTitle');
      modalImg.src = milestone.visualImg || '';
      modalImg.alt = msField(milestone, 'visualTitle');
      modalText.textContent = msField(milestone, 'visualText');
      openModal(visualModal);
    });
    bar.appendChild(dot);
    row.appendChild(bar);
    timeline.appendChild(row);
  });

  container.innerHTML = '';
  container.appendChild(timeline);
}

function renderAllGantt() {
  renderGantt('week');
  renderGantt('month');
  renderGantt('year');
}

// ===== MODEL: download responses (local receipts) =====
// The authoritative copy lives in the Workspace sheet. This is only the submitting
// device's own history, so a student can see what they already sent.
const RESPONSE_KEY = 'ulf-download-responses';

const STATUS_KEYS = {
  'not-started': 'form.statusNotStarted',
  'in-progress': 'form.statusProgress',
  'completed':   'form.statusDone',
  'blocked':     'form.statusBlocked',
  'stopped':     'form.statusStopped'
};

function getResponses() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RESPONSE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveResponse(entry) {
  const list = getResponses();
  // One row per package + team, so a resubmission updates rather than duplicates.
  const index = list.findIndex(item =>
    item.packageKey === entry.packageKey && item.organization === entry.organization);
  if (index >= 0) list[index] = entry; else list.push(entry);
  localStorage.setItem(RESPONSE_KEY, JSON.stringify(list));
}

function statusClass(statusKey) {
  if (statusKey === 'completed') return 'done';
  if (statusKey === 'in-progress') return 'progress';
  return 'open';
}

// ===== VIEW: response tracker =====
function renderResponses() {
  const host = document.getElementById('responseRows');
  if (!host) return;

  const list = getResponses();
  host.innerHTML = '';

  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'resp-row';
    const span = document.createElement('span');
    span.style.gridColumn = '1 / -1';
    span.textContent = t('dl.empty');
    empty.appendChild(span);
    host.appendChild(empty);
    return;
  }

  const locale = window.ulfI18n.current === 'pt' ? 'pt-BR' : 'en';

  list.forEach(entry => {
    const row = document.createElement('div');
    row.className = 'resp-row';

    const name = document.createElement('strong');
    name.textContent = t('dl.' + entry.packageKey + '.title');

    const team = document.createElement('span');
    team.textContent = entry.organization;

    const when = document.createElement('span');
    when.textContent = new Date(entry.submittedAt)
      .toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });

    const status = document.createElement('span');
    status.className = 'resp-status ' + statusClass(entry.statusKey);
    status.textContent = t(STATUS_KEYS[entry.statusKey] || 'form.choose');

    row.append(name, team, when, status);
    host.appendChild(row);
  });
}

// ===== PRESENTER: modals =====
function openModal(modal) {
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(modal) {
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
}

const visualModal = document.getElementById('visualModal');
const modalTitle = document.getElementById('modalTitle');
const modalImg = document.getElementById('modalImg');
const modalText = document.getElementById('modalText');

document.getElementById('modalClose').addEventListener('click', () => closeModal(visualModal));

document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(modal); });
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  document.querySelectorAll('.modal.active').forEach(closeModal);
});

// ===== PRESENTER: milestone editor =====
const milestoneEditorModal = document.getElementById('milestoneEditorModal');
const milestoneEditorFields = document.getElementById('milestoneEditorFields');
const milestoneEditorTabs = document.getElementById('milestoneEditorTabs');
let activeMilestoneTab = 0;

function field(label, name, value, type) {
  const wrap = document.createElement('label');
  const span = document.createElement('span');
  span.textContent = label;
  const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
  if (type && type !== 'textarea') input.type = type;
  input.name = name;
  input.value = value;                       // assigned, never interpolated into HTML
  wrap.append(span, input);
  return wrap;
}

function populateEditor() {
  milestoneEditorFields.innerHTML = '';
  milestoneEditorTabs.innerHTML = '';
  const milestones = getMilestones();

  milestones.forEach((milestone, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'editor-tab' + (index === activeMilestoneTab ? ' active' : '');
    tab.textContent = msField(milestone, 'label') || t('goal.milestone') + ' ' + (index + 1);
    tab.addEventListener('click', () => { activeMilestoneTab = index; populateEditor(); });
    milestoneEditorTabs.appendChild(tab);

    const panel = document.createElement('div');
    panel.className = 'editor-panel' + (index === activeMilestoneTab ? ' active' : '');

    const fieldset = document.createElement('fieldset');
    fieldset.className = 'editor-fieldset';
    const legend = document.createElement('legend');
    legend.textContent = t('goal.milestone') + ' ' + (index + 1);
    fieldset.appendChild(legend);

    fieldset.append(
      field(t('form.label'), 'label', msField(milestone, 'label')),
      field(t('form.range'), 'range', msField(milestone, 'range')),
      field(t('form.titleField'), 'title', msField(milestone, 'title')),
      field(t('form.visualTitle'), 'visualTitle', msField(milestone, 'visualTitle')),
      field(t('form.image'), 'visualImg', milestone.visualImg || ''),
      field(t('form.visualText'), 'visualText', msField(milestone, 'visualText'), 'textarea')
    );

    const grid = document.createElement('div');
    grid.className = 'editor-range-grid';
    [['form.weekStart', 'weekStart', milestone.periods.week[0]],
     ['form.weekEnd', 'weekEnd', milestone.periods.week[1]],
     ['form.monthStart', 'monthStart', milestone.periods.month[0]],
     ['form.monthEnd', 'monthEnd', milestone.periods.month[1]],
     ['form.yearStart', 'yearStart', milestone.periods.year[0]],
     ['form.yearEnd', 'yearEnd', milestone.periods.year[1]]
    ].forEach(([key, name, value]) => grid.appendChild(field(t(key), name, value, 'number')));

    fieldset.appendChild(grid);
    panel.appendChild(fieldset);
    milestoneEditorFields.appendChild(panel);
  });
}

document.getElementById('editMilestonesBtn').addEventListener('click', () => {
  activeMilestoneTab = 0;
  populateEditor();
  openModal(milestoneEditorModal);
});

document.getElementById('milestoneEditorClose').addEventListener('click', () => closeModal(milestoneEditorModal));

document.getElementById('milestoneEditorForm').addEventListener('submit', event => {
  event.preventDefault();
  const fieldsets = Array.from(milestoneEditorFields.querySelectorAll('fieldset'));

  const updated = fieldsets.map((fieldset, index) => {
    const data = new FormData(fieldset);
    const label = data.get('label') || t('goal.milestone') + ' ' + (index + 1);
    return {
      id: index + 1,
      label,
      range: data.get('range') || '',
      title: data.get('title') || label,
      visualTitle: data.get('visualTitle') || label,
      visualImg: data.get('visualImg') || '',
      visualText: data.get('visualText') || '',
      periods: {
        week:  [Number(data.get('weekStart') || 0), Number(data.get('weekEnd') || 0)],
        month: [Number(data.get('monthStart') || 0), Number(data.get('monthEnd') || 0)],
        year:  [Number(data.get('yearStart') || 0), Number(data.get('yearEnd') || 0)]
      }
    };
  });

  saveMilestones(updated);
  renderAllGantt();
  closeModal(milestoneEditorModal);
});

document.getElementById('addMilestoneBtn').addEventListener('click', () => {
  const current = getMilestones().map(m => ({
    id: m.id,
    label: msField(m, 'label'),
    range: msField(m, 'range'),
    title: msField(m, 'title'),
    visualTitle: msField(m, 'visualTitle'),
    visualImg: m.visualImg || '',
    visualText: msField(m, 'visualText'),
    periods: m.periods
  }));

  const next = current.length + 1;
  current.push({
    id: next,
    label: t('goal.milestone') + ' ' + next,
    range: '',
    title: t('goal.milestone') + ' ' + next,
    visualTitle: t('goal.milestone') + ' ' + next,
    visualImg: '',
    visualText: '',
    periods: { week: [0, 1], month: [0, 1], year: [0, 1] }
  });

  saveMilestones(current);
  activeMilestoneTab = current.length - 1;
  populateEditor();
});

// ===== PRESENTER: goal tabs =====
document.querySelectorAll('.time-tab').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.time-tab').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.goal-panel').forEach(panel => panel.classList.remove('active'));
    button.classList.add('active');
    document.getElementById('goal-' + button.dataset.goal).classList.add('active');
  });
});

// ===== PRESENTER: updates carousel =====
const slides = Array.from(document.querySelectorAll('.update-slide'));
const dotsBox = document.getElementById('updateDots');
let slideIndex = 0;

slides.forEach((slide, index) => {
  const dot = document.createElement('button');
  dot.className = 'update-dot' + (index === 0 ? ' active' : '');
  dot.type = 'button';
  dot.setAttribute('aria-label', String(index + 1));
  dot.addEventListener('click', () => showSlide(index));
  dotsBox.appendChild(dot);
});

function showSlide(index) {
  slideIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, n) => slide.classList.toggle('active', n === slideIndex));
  document.querySelectorAll('.update-dot').forEach((dot, n) => dot.classList.toggle('active', n === slideIndex));
}

document.getElementById('prevUpdate').addEventListener('click', () => showSlide(slideIndex - 1));
document.getElementById('nextUpdate').addEventListener('click', () => showSlide(slideIndex + 1));

// ===== PRESENTER: bell animation (delegated — cards are re-rendered) =====
document.addEventListener('click', event => {
  const bell = event.target.closest('.bell-btn, .side-bell');
  if (!bell) return;
  bell.classList.add('is-rung');
  setTimeout(() => bell.classList.remove('is-rung'), 1800);
});

// ===== PRESENTER: deliverable form =====
const deliverableModal = document.getElementById('deliverableModal');
const deliverableForm = document.getElementById('deliverableForm');
const deliverableStatus = document.getElementById('deliverableStatus');
const reviewerSelect = deliverableForm.elements.recipientEmail;
const otherReviewerField = document.getElementById('otherReviewerField');
const otherReviewerInput = deliverableForm.elements.otherReviewerEmail;

reviewerSelect.addEventListener('change', () => {
  const isOther = reviewerSelect.value === 'other';
  otherReviewerField.hidden = !isOther;
  otherReviewerInput.required = isOther;
  if (!isOther) otherReviewerInput.value = '';
});

document.getElementById('openDeliverableForm').addEventListener('click', () => {
  deliverableStatus.textContent = '';
  openModal(deliverableModal);
});

document.getElementById('deliverableClose').addEventListener('click', () => closeModal(deliverableModal));

/** Reads a File into base64, or returns null when no file was chosen. */
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Unable to read the selected file'));
    reader.readAsDataURL(file);
  });
}

deliverableForm.addEventListener('submit', async event => {
  event.preventDefault();

  if (!window.ulfSubmitConfigured()) {
    deliverableStatus.textContent = t('msg.notConfigured');
    return;
  }

  const data = new FormData(deliverableForm);
  const file = data.get('deliverableFile');
  if (!(file instanceof File) || !file.size) {
    deliverableStatus.textContent = t('msg.chooseFile');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    deliverableStatus.textContent = t('msg.tooLarge');
    return;
  }

  const payload = Object.fromEntries(data);
  delete payload.deliverableFile;
  payload.fileName = file.name;
  payload.fileType = file.type || 'application/octet-stream';
  payload.fileBase64 = await readFile(file);

  const button = deliverableForm.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  deliverableStatus.textContent = t('msg.sending');

  try {
    await window.ulfSubmit('deliverable', payload);
    deliverableStatus.textContent = t('msg.sent');
    deliverableForm.reset();
    otherReviewerField.hidden = true;
    otherReviewerInput.required = false;
  } catch (error) {
    deliverableStatus.textContent = error.message;
  } finally {
    if (button) button.disabled = false;
  }
});

// ===== PRESENTER: download response form =====
const downloadModal = document.getElementById('downloadModal');
const downloadForm = document.getElementById('downloadForm');
const downloadStatus = document.getElementById('downloadStatus');
const packageSelect = document.getElementById('downloadPackage');

function openDownloadForm(packageKey) {
  downloadStatus.textContent = '';
  if (packageKey) packageSelect.value = packageKey;
  openModal(downloadModal);
}

document.getElementById('openDownloadResponse').addEventListener('click', () => openDownloadForm(''));
document.getElementById('downloadClose').addEventListener('click', () => closeModal(downloadModal));

// Delegated: the cards are re-rendered on every language change.
document.addEventListener('click', event => {
  const button = event.target.closest('[data-response]');
  if (button) openDownloadForm(button.dataset.response);
});

downloadForm.addEventListener('submit', async event => {
  event.preventDefault();

  if (!window.ulfSubmitConfigured()) {
    downloadStatus.textContent = t('msg.notConfigured');
    return;
  }

  const data = new FormData(downloadForm);
  const payload = Object.fromEntries(data);
  const file = data.get('responseFile');
  delete payload.responseFile;

  // The supporting file is optional here, unlike the deliverable form.
  if (file instanceof File && file.size) {
    if (file.size > 10 * 1024 * 1024) {
      downloadStatus.textContent = t('msg.tooLarge');
      return;
    }
    payload.fileName = file.name;
    payload.fileType = file.type || 'application/octet-stream';
    payload.fileBase64 = await readFile(file);
  }

  // Send readable English to the sheet regardless of the UI language, so one
  // spreadsheet stays sortable across both. `.en()` and not `.t()`: `t()` would
  // resolve in whatever language the submitter happens to be reading.
  const packageKey = payload.packageName;
  const statusKey = payload.status;
  payload.packageName = window.ulfI18n.en('dl.' + packageKey + '.title');
  payload.status = window.ulfI18n.en(STATUS_KEYS[statusKey] || 'form.choose');
  payload.language = window.ulfI18n.current;

  const button = downloadForm.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  downloadStatus.textContent = t('msg.sendingResponse');

  try {
    await window.ulfSubmit('download', payload);
    saveResponse({
      packageKey:   packageKey,
      organization: payload.organization,
      statusKey:    statusKey,
      submittedAt:  new Date().toISOString()
    });
    renderResponses();
    downloadStatus.textContent = t('msg.responseSent');
    downloadForm.reset();
  } catch (error) {
    downloadStatus.textContent = error.message;
  } finally {
    if (button) button.disabled = false;
  }
});

// ===== VIEW: time-of-day greeting =====
function renderGreeting() {
  const host = document.getElementById('heroGreeting');
  if (!host) return;
  const hour = new Date().getHours();
  host.textContent = t(hour < 12 ? 'hero.morning' : hour < 17 ? 'hero.afternoon' : 'hero.evening');
}

// ===== boot =====
function renderAll() {
  renderGreeting();
  renderTeam();
  renderParts();
  renderDownloads();
  renderAllGantt();
  renderResponses();
}

window.ulfI18n.init();   // paints every data-i18n node before the first JS render
renderAll();

// Everything built in JS has to be rebuilt when the language changes.
document.addEventListener('ulf:languagechange', renderAll);
