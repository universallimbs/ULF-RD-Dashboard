// ULF R&D Dashboard — application script
// Organized as MVP: MODEL (data + persistence), VIEW (rendering), PRESENTER (event wiring / controllers).
// Kept in one file (not three) so load order and shared references stay simple and safe for a static site.

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

    const isYear2 = button.dataset.year === '2';
    document.querySelector('.top-year').textContent = isYear2 ? '2027' : '2026';

    if (isYear2) {
      document.querySelectorAll('.nav button').forEach(item => item.classList.remove('active'));
      document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
      document.getElementById('year2-empty').classList.add('active');
      window.scrollTo(0, 0);
    } else {
      activateView('dashboard');
    }
  });
});

// ===== MODEL: milestone data + persistence =====
const defaultMilestones = [
  {
    id: 1,
    label: 'Milestone 1',
    range: 'Aug—Nov 2026',
    title: 'Simplified Yalehand multigrasp',
    visualTitle: 'Milestone 1 · Yale Hand',
    visualImg: 'yale-multigrasp.png',
    visualText: 'Inspiration only. Study grasp modes and simplify the mechanical strategy for the MVP.',
    periods: {
      week: [2, 5],
      month: [0, 2],
      year: [0, 3]
    }
  },
  {
    id: 2,
    label: 'Milestone 2',
    range: 'Dec 2026—Mar 2027',
    title: 'Integrate SoftFoot Pro geometry',
    visualTitle: 'Milestone 2 · SoftFoot Pro',
    visualImg: 'softfoot-pro.jpg',
    visualText: 'Inspiration only. Translate passive adaptive geometry only if it makes the hand simpler and more useful.',
    periods: {
      week: [3, 6],
      month: [1, 4],
      year: [4, 7]
    }
  },
  {
    id: 3,
    label: 'Milestone 3',
    range: 'Apr—Jul 2027',
    title: 'External mechanical energy resource',
    visualTitle: 'Milestone 3 · Mechanical Energy',
    visualImg: 'waacs-basis.png',
    visualText: 'Placeholder visual. Explore purely mechanical energy assistance only.',
    periods: {
      week: [4, 6],
      month: [3, 4],
      year: [8, 11]
    }
  }
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

const periodMetadata = {
  week: { title: 'This week', columns: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  month: { title: 'This month', columns: ['W1', 'W2', 'W3', 'W4', 'W5'] },
  year: { title: 'The year', columns: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'] }
};

// ===== VIEW: gantt chart rendering =====
function renderGantt(period) {
  const container = document.getElementById('gantt-' + period);
  if (!container) return;

  const config = periodMetadata[period];
  const milestones = getMilestones();

  const head = document.createElement('div');
  head.className = 'timeline-head';
  head.style.gridTemplateColumns = '140px repeat(' + config.columns.length + ', minmax(52px, 1fr))';
  head.innerHTML = '<div>Milestone</div>' + config.columns.map(label => '<div>' + label + '</div>').join('');

  const timeline = document.createElement('div');
  timeline.className = 'timeline';
  timeline.setAttribute('aria-label', config.title + ' milestone timeline');
  timeline.appendChild(head);

  milestones.forEach((milestone) => {
    const [startRaw, endRaw] = milestone.periods[period] || [0, 0];
    const start = Math.max(0, Math.min(startRaw, config.columns.length - 1));
    const end = Math.max(start, Math.min(endRaw, config.columns.length - 1));
    const row = document.createElement('div');
    row.className = 'timeline-row';
    row.style.gridTemplateColumns = '140px repeat(' + config.columns.length + ', minmax(52px, 1fr))';

    const label = document.createElement('div');
    label.className = 'milestone-label';
    const labelTitle = document.createElement('strong');
    labelTitle.textContent = milestone.label;
    const labelRange = document.createElement('span');
    labelRange.textContent = milestone.range;
    label.append(labelTitle, labelRange);
    row.appendChild(label);

    for (let i = 0; i < config.columns.length; i += 1) {
      const cell = document.createElement('div');
      cell.className = 'month-cell';
      row.appendChild(cell);
    }

    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.textContent = milestone.title;
    bar.style.gridColumn = (start + 2) + ' / span ' + (Math.max(1, end - start + 1));
    bar.style.gridRow = '1';

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'visual-dot';
    dot.dataset.modalTitle = milestone.visualTitle;
    dot.dataset.modalImg = milestone.visualImg;
    dot.dataset.modalText = milestone.visualText;
    dot.addEventListener('click', () => {
      modalTitle.textContent = dot.dataset.modalTitle;
      modalImg.src = dot.dataset.modalImg;
      modalText.textContent = dot.dataset.modalText;
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    });
    bar.appendChild(dot);
    row.appendChild(bar);

    timeline.appendChild(row);
  });

  container.innerHTML = '';
  container.appendChild(timeline);
}

// ===== PRESENTER: milestone editor controller =====
const milestoneEditorModal = document.getElementById('milestoneEditorModal');
const milestoneEditorFields = document.getElementById('milestoneEditorFields');
const milestoneEditorTabs = document.getElementById('milestoneEditorTabs');
let activeMilestoneTab = 0;

function populateEditor() {
  milestoneEditorFields.innerHTML = '';
  milestoneEditorTabs.innerHTML = '';
  const milestones = getMilestones();

  milestones.forEach((milestone, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'editor-tab' + (index === activeMilestoneTab ? ' active' : '');
    tab.textContent = milestone.label || 'Milestone ' + (index + 1);
    tab.addEventListener('click', () => {
      activeMilestoneTab = index;
      populateEditor();
    });
    milestoneEditorTabs.appendChild(tab);

    const panel = document.createElement('div');
    panel.className = 'editor-panel' + (index === activeMilestoneTab ? ' active' : '');

    const fieldset = document.createElement('fieldset');
    fieldset.className = 'editor-fieldset';
    fieldset.innerHTML = `
      <legend>Milestone ${index + 1}</legend>
      <label>
        <span>Label</span>
        <input name="label" value="${milestone.label.replace(/"/g, '&quot;')}" />
      </label>
      <label>
        <span>Range</span>
        <input name="range" value="${milestone.range.replace(/"/g, '&quot;')}" />
      </label>
      <label>
        <span>Title</span>
        <input name="title" value="${milestone.title.replace(/"/g, '&quot;')}" />
      </label>
      <label>
        <span>Visual title</span>
        <input name="visualTitle" value="${milestone.visualTitle.replace(/"/g, '&quot;')}" />
      </label>
      <label>
        <span>Image</span>
        <input name="visualImg" value="${milestone.visualImg.replace(/"/g, '&quot;')}" />
      </label>
      <label>
        <span>Visual text</span>
        <textarea name="visualText">${milestone.visualText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
      </label>
      <div class="editor-range-grid">
        <label><span>Week start</span><input name="weekStart" type="number" value="${milestone.periods.week[0]}" /></label>
        <label><span>Week end</span><input name="weekEnd" type="number" value="${milestone.periods.week[1]}" /></label>
        <label><span>Month start</span><input name="monthStart" type="number" value="${milestone.periods.month[0]}" /></label>
        <label><span>Month end</span><input name="monthEnd" type="number" value="${milestone.periods.month[1]}" /></label>
        <label><span>Year start</span><input name="yearStart" type="number" value="${milestone.periods.year[0]}" /></label>
        <label><span>Year end</span><input name="yearEnd" type="number" value="${milestone.periods.year[1]}" /></label>
      </div>
    `;
    panel.appendChild(fieldset);
    milestoneEditorFields.appendChild(panel);
  });
}

const editBtn = document.getElementById('editMilestonesBtn'); if (editBtn) editBtn.addEventListener('click', () => {
  activeMilestoneTab = 0;
  populateEditor();
  milestoneEditorModal.classList.add('active');
  milestoneEditorModal.setAttribute('aria-hidden', 'false');
});

document.getElementById('milestoneEditorClose').addEventListener('click', () => {
  milestoneEditorModal.classList.remove('active');
  milestoneEditorModal.setAttribute('aria-hidden', 'true');
});

milestoneEditorModal.addEventListener('click', event => {
  if (event.target === milestoneEditorModal) {
    milestoneEditorModal.classList.remove('active');
    milestoneEditorModal.setAttribute('aria-hidden', 'true');
  }
});

document.getElementById('milestoneEditorForm').addEventListener('submit', event => {
  event.preventDefault();

  const fieldsets = Array.from(milestoneEditorFields.querySelectorAll('fieldset'));
  const updated = fieldsets.map((fieldset, index) => {
    const formData = new FormData(fieldset);
    const label = formData.get('label') || `Milestone ${index + 1}`;
    const range = formData.get('range') || '';
    const title = formData.get('title') || label;
    const visualTitle = formData.get('visualTitle') || title;
    const visualImg = formData.get('visualImg') || '';
    const visualText = formData.get('visualText') || '';

    return {
      id: index + 1,
      label,
      range,
      title,
      visualTitle,
      visualImg,
      visualText,
      periods: {
        week: [Number(formData.get('weekStart') || 0), Number(formData.get('weekEnd') || 0)],
        month: [Number(formData.get('monthStart') || 0), Number(formData.get('monthEnd') || 0)],
        year: [Number(formData.get('yearStart') || 0), Number(formData.get('yearEnd') || 0)]
      }
    };
  });

  saveMilestones(updated);
  renderGantt('week');
  renderGantt('month');
  renderGantt('year');
  milestoneEditorModal.classList.remove('active');
  milestoneEditorModal.setAttribute('aria-hidden', 'true');
});

document.getElementById('addMilestoneBtn').addEventListener('click', () => {
  const current = getMilestones();
  const nextIndex = current.length + 1;
  current.push({
    id: nextIndex,
    label: 'Milestone ' + nextIndex,
    range: 'Add period',
    title: 'New milestone item',
    visualTitle: 'New milestone',
    visualImg: '',
    visualText: 'Add a reference visual if needed.',
    periods: { week: [0, 1], month: [0, 1], year: [0, 1] }
  });
  saveMilestones(current);
  activeMilestoneTab = current.length - 1;
  populateEditor();
});

// ===== VIEW: initial render + tab wiring =====
function renderAllGantt() {
  renderGantt('week');
  renderGantt('month');
  renderGantt('year');
}

renderAllGantt();

document.querySelectorAll('.time-tab').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.time-tab').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.goal-panel').forEach(panel => panel.classList.remove('active'));
    button.classList.add('active');
    document.getElementById('goal-' + button.dataset.goal).classList.add('active');
  });
});

document.querySelectorAll('.resource-tab').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.resource-tab').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.resource-panel').forEach(panel => panel.classList.remove('active'));
    button.classList.add('active');
    document.getElementById('res-' + button.dataset.resource).classList.add('active');
  });
});

document.querySelectorAll('.lang-btn').forEach(button => {
  button.addEventListener('click', () => {
    const lang = button.dataset.lang;
    document.querySelectorAll('.lang-btn').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    document.querySelectorAll('.lang-block').forEach(block => {
      block.classList.toggle('active', block.dataset.langBlock === lang);
    });
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

// ===== PRESENTER: visual reference modal =====
const modal = document.getElementById('visualModal');
const modalTitle = document.getElementById('modalTitle');
const modalImg = document.getElementById('modalImg');
const modalText = document.getElementById('modalText');

document.querySelectorAll('.visual-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    modalTitle.textContent = dot.dataset.modalTitle;
    modalImg.src = dot.dataset.modalImg;
    modalText.textContent = dot.dataset.modalText;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  });
});

document.getElementById('modalClose').addEventListener('click', () => {
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
});

modal.addEventListener('click', event => {
  if (event.target === modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
});



document.querySelectorAll('.bell-btn, .side-bell').forEach(button => {
  button.addEventListener('click', () => {
    button.classList.add('is-rung');
    setTimeout(() => {
      button.classList.remove('is-rung');
    }, 1800);
  });
});

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
  deliverableModal.classList.add('active');
  deliverableModal.setAttribute('aria-hidden', 'false');
});

function closeDeliverableForm() {
  deliverableModal.classList.remove('active');
  deliverableModal.setAttribute('aria-hidden', 'true');
}

document.getElementById('deliverableClose').addEventListener('click', closeDeliverableForm);
deliverableModal.addEventListener('click', event => {
  if (event.target === deliverableModal) closeDeliverableForm();
});

deliverableForm.addEventListener('submit', async event => {
  event.preventDefault();

  if (!window.ulfSubmitConfigured()) {
    deliverableStatus.textContent = 'Submissions are not configured yet. Set submissionEndpoint in assets/js/config.js.';
    return;
  }

  const submittedForm = new FormData(deliverableForm);
  const file = submittedForm.get('deliverableFile');
  if (!(file instanceof File) || !file.size) {
    deliverableStatus.textContent = 'Choose a deliverable file to continue.';
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    deliverableStatus.textContent = 'The selected file is larger than the 10 MB limit.';
    return;
  }

  const payload = Object.fromEntries(submittedForm);
  delete payload.deliverableFile;
  payload.fileName = file.name;
  payload.fileType = file.type || 'application/octet-stream';
  payload.fileBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Unable to read the selected file'));
    reader.readAsDataURL(file);
  });

  const submitButton = deliverableForm.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  deliverableStatus.textContent = 'Sending deliverable...';

  try {
    await window.ulfSubmit('deliverable', payload);
    deliverableStatus.textContent = 'Deliverable sent. The reviewer has been emailed and you will receive a receipt.';
    deliverableForm.reset();
    otherReviewerField.hidden = true;
    otherReviewerInput.required = false;
  } catch (error) {
    deliverableStatus.textContent = error.message;
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});
