// ULF R&D internal hub — application script
// MVP layout: MODEL (data), VIEW (rendering), PRESENTER (event wiring).
//
// Every list on the page is rendered from a key table rather than written into
// the markup, so a language switch can rebuild the whole page from one event.

const t = (key) => window.ulfI18n.t(key);

// ============================================================ MODEL: data

// Six people across two carousel pages of three.
const PEOPLE = [
  { name: 'Sahitya D', initial: 'S', due: 'dl1', prio: ['wk2', 'p1a', 'p1b'], blocked: true },
  { name: 'Nili U',    initial: 'N', due: 'dl2', prio: ['wk6', 'p2a', 'p2b'] },
  { name: 'Ganesh A',  initial: 'G', due: 'dl3', prio: ['wk5', 'p3a', 'p3b'] },
  { name: 'Rasna M',   initial: 'R', due: 'dl3', prio: ['wk7', 'wk4', 'wk3'] },
  { name: 'Walid',     initial: 'W', due: 'dl1', prio: ['wk1', 'p5a', 'p5b'] },
  { name: 'Nadine A',  initial: 'N', due: 'dl2', prio: ['wk8', 'p6a', 'p6b'] }
];
const PER_PAGE = 3;

// The five-step rail under the Overview card. `on` marks the live step.
const RAIL = [
  { name: 'gs1', state: 'gt1', note: 'gsDone1', on: true },
  { name: 'gs2', state: 'gt2' },
  { name: 'gs3', state: 'gt3' },
  { name: 'gs4', state: 'gt4' },
  { name: 'gs5', state: 'gt5' }
];

// Ten project phases. Only the first is live; the rest are open.
const PHASES = Array.from({ length: 10 }, (_, i) => ({
  n: i + 1,
  name: 's' + (i + 1),
  when: 'mon' + (i + 1),
  tag: i === 0 ? 'lgWaiting' : 'lgOpen',
  on: i === 0
}));

const REFERENCES = [
  { img: 'yale-multigrasp.png', name: 'hRefName', sub: 'hRefSub',
    href: 'https://www.eng.yale.edu/grablab/', link: 'refLink', alt: 'refAlt' },
  { img: 'softfoot-pro.jpg', name: 'hRef2Name', sub: 'hRef2Sub',
    href: 'https://www.iit.it/', link: 'refLink', alt: 'refAlt' }
];

const DOWNLOADS = [
  { label: 'd1', href: 'https://drive.google.com/drive/folders/14iGYmt91YZmHAzsnil6HtJv8Nu5YTF6X' },
  { label: 'd2', href: 'https://drive.google.com/drive/folders/14iGYmt91YZmHAzsnil6HtJv8Nu5YTF6X' },
  { label: 'd3', href: 'https://drive.google.com/drive/folders/14iGYmt91YZmHAzsnil6HtJv8Nu5YTF6X' }
];

const DRIVE = 'https://drive.google.com/drive/folders/14iGYmt91YZmHAzsnil6HtJv8Nu5YTF6X';
const SHEET = 'https://docs.google.com/spreadsheets/d/1Cf-Qrm9P4SmOiynSsROKjqrrjdEQIn6SukNvNQSpMGU/edit?usp=sharing';
const BUDGET = 'https://docs.google.com/spreadsheets/d/1GkG42z72UtrJ5_tYGXVXwijDe_5T6Ae6/edit?usp=drivesdk&rtpof=true&sd=true';

const LINKS = [
  { label: 'l1',  href: DRIVE },
  { label: 'cta', href: DRIVE },
  { label: 'l3',  href: DRIVE },
  { label: 'l4',  href: '#' },
  { label: 'l5',  href: BUDGET },
  { label: 'l6',  href: 'mailto:rnd@universallimbs.com' },
  { label: 'l7',  href: DRIVE },
  { label: 'l8',  href: SHEET },
  { label: 'l9',  href: '#' },
  { label: 'l10', href: '#' },
  { label: 'surveyLink', href: 'prosthetic-user-survey.html' }
];

const TEAM = [
  { name: 'Sahitya D', initial: 'S', role: 'r1', desc: 'x1', email: 'sahitya@universallimbs.com' },
  { name: 'Nili U',    initial: 'N', role: 'r2', desc: 'x2', email: 'nili@universallimbs.com' },
  { name: 'Ganesh A',  initial: 'G', role: 'r3', desc: 'x3', email: 'rnd@universallimbs.com' },
  { name: 'Maria',     initial: 'M', role: 'r4', desc: 'x4', email: 'maria@universallimbs.com' }
];

// Test-rig parts: the process list on the left and the labelled grid below
// both read this, so they can never drift apart.
const PARTS = ['motor', 'cableCell', 'bowden', 'bed', 'wrist', 'hand', 'gripCell', 'daq', 'python'];

const SYSTEM_FLOW = [
  ['part.actuator', 'part.cableCell', 'part.tendon'],
  ['part.hand', 'part.gripCell', 'part.daqLog']
];

const BRIEF = ['goal', 'concept', 'hardware', 'themes'];

const MINUTES = [
  { name: 'mm1', date: 'mm1date' },
  { name: 'mm2', date: 'mm2date' },
  { name: 'mm3', date: 'mm3date' },
  { name: 'mm4', date: 'mm4date' }
];

const TASKS = {
  today: [{ label: 'wk1', when: 'wk1d' }, { label: 'wk2', when: 'wk2d' }],
  week:  [{ label: 'wk3', when: 'wk3d' }, { label: 'wk4', when: 'wk4d' },
          { label: 'wk5', when: 'wk5d' }, { label: 'wk6', when: 'wk6d' }],
  month: [{ label: 'wk7', when: 'wk7d' }, { label: 'wk8', when: 'wk8d' }]
};

const TASK_LABEL = { today: 'rToday', week: 'rWeek', month: 'rMonth' };

// =========================================================== VIEW: helpers

/** Minimal element builder; text is always assigned, never interpolated. */
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

// ================================================== VIEW: priority board

let prioPage = 0;

function renderPriority() {
  const grid = document.getElementById('prioGrid');
  const dots = document.getElementById('prioDots');
  if (!grid) return;

  const pages = Math.ceil(PEOPLE.length / PER_PAGE);
  prioPage = (prioPage + pages) % pages;

  grid.innerHTML = '';
  PEOPLE.slice(prioPage * PER_PAGE, prioPage * PER_PAGE + PER_PAGE).forEach(person => {
    const card = el('article', 'person');
    card.appendChild(el('div', 'person-due', t(person.due)));

    const top = el('div', 'person-top');
    top.appendChild(el('div', 'avatar', person.initial));
    const who = el('div');
    who.appendChild(el('div', 'person-name', person.name));
    const help = el('a', 'person-help', t('helpOut'));
    help.href = 'mailto:rnd@universallimbs.com?subject=' + encodeURIComponent(person.name);
    who.appendChild(help);
    top.appendChild(who);
    card.appendChild(top);

    card.appendChild(el('div', 'eyebrow person-label', t('prio')));

    const list = el('div', 'prio');
    person.prio.forEach((key, i) => {
      const row = el('div', 'prio-row');
      row.appendChild(el('span', 'prio-num', String(i + 1)));
      const text = el('span', 'prio-text', t(key));
      if (i === 0 && person.blocked) text.appendChild(el('span', 'chip-blocked', t('blocked')));
      row.appendChild(text);
      list.appendChild(row);
    });
    card.appendChild(list);
    grid.appendChild(card);
  });

  dots.innerHTML = '';
  for (let i = 0; i < pages; i += 1) {
    const dot = el('button', 'dot' + (i === prioPage ? ' active' : ''));
    dot.type = 'button';
    dot.setAttribute('aria-label', String(i + 1));
    dot.addEventListener('click', () => { prioPage = i; renderPriority(); });
    dots.appendChild(dot);
  }
}

// ========================================================= VIEW: overview

let refIndex = 0;

function renderReference() {
  const slot = document.getElementById('refSlot');
  const dots = document.getElementById('refDots');
  if (!slot) return;

  refIndex = (refIndex + REFERENCES.length) % REFERENCES.length;
  const ref = REFERENCES[refIndex];

  slot.innerHTML = '';
  const img = el('img', 'shot');
  img.src = ref.img;
  img.alt = t(ref.alt);
  slot.appendChild(img);
  slot.appendChild(el('div', 'ref-name', t(ref.name)));
  slot.appendChild(el('div', 'ref-sub', t(ref.sub)));
  const link = el('a', 'shot-link', t(ref.link));
  link.href = ref.href;
  link.target = '_blank';
  link.rel = 'noopener';
  slot.appendChild(link);

  dots.innerHTML = '';
  REFERENCES.forEach((_, i) => {
    const dot = el('button', 'dot' + (i === refIndex ? ' active' : ''));
    dot.type = 'button';
    dot.setAttribute('aria-label', String(i + 1));
    dot.addEventListener('click', () => { refIndex = i; renderReference(); });
    dots.appendChild(dot);
  });
}

function renderRail() {
  const track = document.getElementById('railTrack');
  if (!track) return;
  track.innerHTML = '';

  RAIL.forEach(step => {
    const node = el('div', 'rail-step' + (step.on ? ' on' : ''));
    node.appendChild(el('span', 'rail-dot'));
    node.appendChild(el('div', 'rail-name', t(step.name)));
    if (step.note) node.appendChild(el('div', 'rail-sub', t(step.note)));
    if (step.on) node.appendChild(el('div', 'rail-tag', t(step.state)));
    else node.appendChild(el('div', 'rail-sub', t(step.state)));
    track.appendChild(node);
  });
}

// ==================================================== VIEW: project stage

function renderPhases() {
  const host = document.getElementById('phaseList');
  if (!host) return;
  host.innerHTML = '';

  PHASES.forEach(phase => {
    const row = el('div', 'phase' + (phase.on ? ' on' : ''));
    row.appendChild(el('div', 'phase-n', String(phase.n)));
    row.appendChild(el('span', 'phase-dot'));
    const mid = el('div');
    mid.appendChild(el('div', 'phase-name', t(phase.name)));
    mid.appendChild(el('div', 'phase-when', t(phase.when)));
    row.appendChild(mid);
    row.appendChild(el('div', 'phase-tag', t(phase.tag)));
    host.appendChild(row);
  });
}

// ============================================================ VIEW: tasks

let taskRange = 'today';

function renderTasks() {
  const host = document.getElementById('taskPanels');
  if (!host) return;
  host.innerHTML = '';

  Object.keys(TASKS).forEach(range => {
    const group = el('div', 'task-group' + (range === taskRange ? ' active' : ''));
    group.appendChild(el('div', 'eyebrow task-label', t(TASK_LABEL[range])));

    TASKS[range].forEach(item => {
      const row = el('div', 'task');
      row.appendChild(el('span', 'task-dot'));
      row.appendChild(el('div', null, t(item.label)));
      row.appendChild(el('div', 'task-when', t(item.when)));
      group.appendChild(row);
    });

    host.appendChild(group);
  });
}

// ====================================================== VIEW: simple tabs

function renderDownloads() {
  const host = document.getElementById('downloadList');
  if (!host) return;
  host.innerHTML = '';
  DOWNLOADS.forEach(item => {
    const row = el('a', 'row-item', t(item.label));
    row.href = item.href;
    row.target = '_blank';
    row.rel = 'noopener';
    row.appendChild(el('small', null, t('sendDrive')));
    host.appendChild(row);
  });
}

function renderLinks() {
  const host = document.getElementById('linkGrid');
  if (!host) return;
  host.innerHTML = '';
  LINKS.forEach(item => {
    const pill = el('a', 'link-pill', t(item.label));
    pill.href = item.href;
    if (item.href.indexOf('http') === 0) { pill.target = '_blank'; pill.rel = 'noopener'; }
    host.appendChild(pill);
  });
}

function renderTeam() {
  const host = document.getElementById('teamGrid');
  if (!host) return;
  host.innerHTML = '';

  TEAM.forEach(member => {
    const card = el('article', 'member');
    card.appendChild(el('div', 'member-photo', member.initial));
    card.appendChild(el('div', 'member-name', member.name));
    card.appendChild(el('div', 'member-role', t(member.role)));
    card.appendChild(el('div', 'member-desc', t(member.desc)));

    const links = el('div', 'member-links');
    const mail = el('a', 'member-link', 'Gmail');
    mail.href = 'mailto:' + member.email;
    links.appendChild(mail);
    const slack = el('a', 'member-link', 'Slack');
    slack.href = '#';
    links.appendChild(slack);
    card.appendChild(links);

    host.appendChild(card);
  });
}

function renderMinutes() {
  const host = document.getElementById('minsList');
  if (!host) return;
  host.innerHTML = '';
  MINUTES.forEach(item => {
    const row = el('div', 'min-row');
    row.appendChild(el('div', 'min-name', t(item.name)));
    row.appendChild(el('div', 'min-date', t(item.date)));
    host.appendChild(row);
  });
}

// ============================================ VIEW: university collaboration

function renderPortal() {
  const list = document.getElementById('processList');
  if (list) {
    list.innerHTML = '';
    PARTS.forEach(key => {
      const item = el('div', 'process-item');
      item.appendChild(el('strong', null, t('part.' + key)));
      item.appendChild(el('small', null, t('part.' + key + '.d')));
      list.appendChild(item);
    });
  }

  const grid = document.getElementById('partsGrid');
  if (grid) {
    grid.innerHTML = '';
    PARTS.forEach(key => grid.appendChild(el('div', 'part-item', t('part.' + key))));
  }

  const flow = document.getElementById('systemFlow');
  if (flow) {
    flow.innerHTML = '';
    SYSTEM_FLOW.forEach(steps => {
      const row = el('div', 'flow-row');
      steps.forEach((key, i) => {
        if (i) row.appendChild(el('div', 'flow-arrow', '→'));
        row.appendChild(el('div', 'flow-item', t(key)));
      });
      flow.appendChild(row);
    });
  }

  const brief = document.getElementById('briefGrid');
  if (brief) {
    brief.innerHTML = '';
    BRIEF.forEach(key => {
      const card = el('article', 'brief-card');
      card.appendChild(el('h4', null, t('brief.' + key)));
      card.appendChild(el('p', null, t('brief.' + key + '.d')));
      brief.appendChild(card);
    });
  }
}

// =========================================================== VIEW: clocks

const CITY_ZONES = {
  'America/Toronto': 'Toronto',
  'Europe/London': 'London',
  'Europe/Lisbon': 'Lisbon',
  'Asia/Kolkata': 'Bengaluru',
  'Asia/Amman': 'Amman'
};

/** "GMT-3" for a zone, derived rather than hardcoded so DST stays correct. */
function gmtLabel(zone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
    .formatToParts(new Date());
  const name = (parts.find(p => p.type === 'timeZoneName') || {}).value || 'GMT';
  return name.replace('GMT+00:00', 'GMT').replace(/:00$/, '').replace('GMT-0', 'GMT-').replace('GMT+0', 'GMT+');
}

function timeIn(zone) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: zone, hour: '2-digit', minute: '2-digit', hour12: true
  }).format(new Date()).toLowerCase();
}

function renderClocks() {
  const select = document.getElementById('citySelect');
  const zoneB = select ? select.value : 'America/Toronto';

  document.getElementById('clockA').textContent = timeIn('America/Sao_Paulo');
  document.getElementById('zoneA').textContent = gmtLabel('America/Sao_Paulo');
  document.getElementById('clockB').textContent = timeIn(zoneB);
  document.getElementById('zoneB').textContent = gmtLabel(zoneB);
}

// ======================================================= PRESENTER: wiring

document.querySelectorAll('#tabbar button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('#tabbar button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    button.classList.add('active');
    document.getElementById('panel-' + button.dataset.panel).classList.add('active');
  });
});

document.getElementById('prioPrev').addEventListener('click', () => { prioPage -= 1; renderPriority(); });
document.getElementById('prioNext').addEventListener('click', () => { prioPage += 1; renderPriority(); });
document.getElementById('refPrev').addEventListener('click', () => { refIndex -= 1; renderReference(); });
document.getElementById('refNext').addEventListener('click', () => { refIndex += 1; renderReference(); });

document.querySelectorAll('#taskSeg button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('#taskSeg button').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    taskRange = button.dataset.range;
    renderTasks();
  });
});

document.getElementById('citySelect').addEventListener('change', renderClocks);

// ================================================== PRESENTER: file upload

const uploadForm = document.getElementById('uploadForm');
const uploadInput = document.getElementById('uploadInput');
const uploadStatus = document.getElementById('uploadStatus');
const dropZone = document.getElementById('dropZone');
const MAX_UPLOAD = 20 * 1024 * 1024;

document.getElementById('uploadPick').addEventListener('click', () => uploadInput.click());
uploadInput.addEventListener('change', () => { if (uploadInput.files[0]) sendUpload(uploadInput.files[0]); });

['dragenter', 'dragover'].forEach(evt => dropZone.addEventListener(evt, e => {
  e.preventDefault();
  dropZone.classList.add('dragover');
}));

['dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
}));

dropZone.addEventListener('drop', e => {
  const file = e.dataTransfer && e.dataTransfer.files[0];
  if (file) sendUpload(file);
});

async function sendUpload(file) {
  if (!window.ulfSubmitConfigured()) {
    uploadStatus.textContent = t('msgNotConfigured');
    return;
  }
  if (!file) {
    uploadStatus.textContent = t('msgPickFile');
    return;
  }
  if (file.size > MAX_UPLOAD) {
    uploadStatus.textContent = t('msgTooLarge');
    return;
  }
  if (uploadForm.elements.website.value) return;   // honeypot

  uploadStatus.textContent = t('msgSending');

  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(new Error('Unable to read the selected file'));
      reader.readAsDataURL(file);
    });

    await window.ulfSubmit('upload', {
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileBase64: base64,
      language: window.ulfI18n.current
    });

    uploadStatus.textContent = t('msgSent');
    uploadForm.reset();
  } catch (error) {
    uploadStatus.textContent = error.message;
  }
}

// ============================================ PRESENTER: deliverable form

const deliverableModal = document.getElementById('deliverableModal');
const deliverableForm = document.getElementById('deliverableForm');
const deliverableStatus = document.getElementById('deliverableStatus');
const reviewerSelect = deliverableForm.elements.recipientEmail;
const otherReviewerField = document.getElementById('otherReviewerField');
const otherReviewerInput = deliverableForm.elements.otherReviewerEmail;

function openModal(modal) { modal.classList.add('active'); modal.setAttribute('aria-hidden', 'false'); }
function closeModal(modal) { modal.classList.remove('active'); modal.setAttribute('aria-hidden', 'true'); }

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

deliverableModal.addEventListener('click', event => {
  if (event.target === deliverableModal) closeModal(deliverableModal);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') document.querySelectorAll('.modal.active').forEach(closeModal);
});

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
  payload.language = window.ulfI18n.current;
  payload.fileBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Unable to read the selected file'));
    reader.readAsDataURL(file);
  });

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

// ===================================================================== boot

function renderAll() {
  renderPriority();
  renderReference();
  renderRail();
  renderPhases();
  renderTasks();
  renderDownloads();
  renderLinks();
  renderTeam();
  renderMinutes();
  renderPortal();
  renderClocks();
}

window.ulfI18n.init();     // paints every data-i18n node before the first render
renderAll();

document.addEventListener('ulf:languagechange', renderAll);
setInterval(renderClocks, 30000);
