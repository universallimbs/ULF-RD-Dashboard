/**
 * ULF R&D Dashboard — submission backend
 * ======================================
 * Runs entirely inside Google Workspace (Apps Script + Drive + Sheets + Gmail).
 * There is no server to host and no Google Cloud project involved, so it costs
 * nothing on the Workspace for Nonprofits plan.
 *
 *   browser (GitHub Pages or localhost, static files only)
 *     -> POST to this web app's /exec URL
 *          -> validate + throttle
 *          -> save the uploaded file into Drive
 *          -> append a row to a Google Sheet
 *          -> email the chosen reviewer   (address NEVER comes from the browser)
 *          -> email the submitter a receipt
 *
 * SETUP (once)
 *   1. script.google.com -> New project -> paste this file in.
 *   2. Project Settings -> Script properties. Add:
 *        DELIVERABLE_SHEET_ID          id of the deliverables Google Sheet
 *        SURVEY_SHEET_ID               id of the survey Google Sheet
 *        DELIVERABLE_PARENT_FOLDER_ID  Drive folder submissions are filed under
 *                                      (the R&D folder works: 14iGYmt91YZmHAzsnil6HtJv8Nu5YTF6X)
 *        REVIEWERS_JSON                see reviewerTemplate() at the bottom
 *        FALLBACK_REVIEWER_EMAIL       gets "Other" and any misrouted submission
 *      Optional: ALLOWED_MAIL_DOMAINS, DAILY_SUBMISSION_CAP, ACK_SUBMITTERS
 *   3. Run setup() once and read the execution log. It lists whatever is still
 *      missing or malformed instead of failing at submit time.
 *   4. Deploy -> New deployment -> Web app
 *        Execute as:     Me
 *        Who has access: Anyone
 *      Paste the /exec URL into assets/js/config.js in the dashboard repo.
 *
 * WHY THERE IS NO SHARED SECRET ANY MORE
 *   The dashboard is a static site, so anything it knows is public. The old
 *   SUBMISSION_SECRET only ever protected the browser -> Express -> here hop.
 *   With the Express server gone the secret would sit in readable JavaScript and
 *   protect nothing. The control that actually matters is enforced below instead:
 *   the browser sends a reviewer *id*, never an address, so this endpoint can
 *   only mail people on its own allowlist. It cannot be used as an open relay.
 *
 * NOTE ON STATUS CODES
 *   ContentService cannot set an HTTP status, so every response is 200 and the
 *   real outcome is the `ok` field in the JSON body. Clients must check the body.
 */

const PROPS = PropertiesService.getScriptProperties();

const P_SURVEY_SHEET  = 'SURVEY_SHEET_ID';
const P_DELIV_SHEET   = 'DELIVERABLE_SHEET_ID';
const P_DRIVE_PARENT  = 'DELIVERABLE_PARENT_FOLDER_ID';
const P_REVIEWERS     = 'REVIEWERS_JSON';
const P_FALLBACK      = 'FALLBACK_REVIEWER_EMAIL';
const P_DOMAINS       = 'ALLOWED_MAIL_DOMAINS';
const P_DAILY_CAP     = 'DAILY_SUBMISSION_CAP';
const P_ACK           = 'ACK_SUBMITTERS';
const P_FORM_ID       = 'FORM_ID';

const MAX_FILE_BYTES    = 10 * 1024 * 1024;   // matches the 10 MB limit in the UI
const DEFAULT_DAILY_CAP = 200;
const PER_MINUTE_CAP    = 10;
const DEFAULT_DOMAINS   = 'universallimbs.com';

/** Error whose message is safe to show a submitter. */
function PublicError(message) { this.message = message; this.isPublic = true; }
PublicError.prototype = Object.create(Error.prototype);

// ---------------------------------------------------------------- entry points

function doGet() {
  const report = configReport();
  return json({ ok: report.ready, service: 'ULF R&D submissions', problems: report.problems });
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return json({ ok: false, error: 'The form is busy. Please try again in a moment.' });
  }
  try {
    const request = parseRequest(event);
    throttle();

    if (request.type === 'deliverable') return json({ ok: true, result: handleDeliverable(request.payload) });
    if (request.type === 'survey')      return json({ ok: true, result: handleSurvey(request.payload) });
    throw new PublicError('Unsupported submission type.');
  } catch (error) {
    logFailure(error, event);
    return json({
      ok: false,
      error: error && error.isPublic ? error.message
                                     : 'We could not record this submission. Please contact the R&D team.'
    });
  } finally {
    lock.releaseLock();
  }
}

function parseRequest(event) {
  if (!event || !event.postData || !event.postData.contents) throw new PublicError('Empty request.');
  let body;
  try {
    body = JSON.parse(event.postData.contents);
  } catch (error) {
    throw new PublicError('Malformed request.');
  }
  if (!body || typeof body !== 'object' || !body.payload) throw new PublicError('Malformed request.');
  // Honeypot: a real person never fills a field they cannot see.
  if (body.payload.website) throw new PublicError('Submission rejected.');
  return { type: String(body.type || ''), payload: body.payload };
}

// -------------------------------------------------------------------- handlers

function handleDeliverable(payload) {
  const required = ['submitterName', 'organization', 'taskName', 'submissionType',
                    'version', 'changes', 'recipientEmail', 'nextSteps', 'fileName', 'fileBase64'];
  const missing = required.filter(field => !String(payload[field] || '').trim());
  if (missing.length) throw new PublicError('Please complete every required field.');

  const reviewer = resolveReviewer(payload.recipientEmail);
  const saved = saveDeliverableFile(payload);

  // Give the reviewer direct access to the file, so the Drive link in the email
  // works even if they are not on the parent folder. Non-fatal if it is refused.
  try { saved.file.addViewer(reviewer.email); } catch (error) { /* domain policy */ }

  const record = {
    submittedAt:      new Date(),
    submitterName:    payload.submitterName,
    submitterEmail:   payload.submitterEmail || '',
    organization:     payload.organization,
    taskName:         payload.taskName,
    submissionType:   payload.submissionType,
    version:          payload.version,
    changes:          payload.changes,
    nextSteps:        payload.nextSteps,
    notes:            payload.notes || '',
    reviewerId:       reviewer.id,
    reviewerName:     reviewer.name,
    reviewerEmail:    reviewer.email,
    routingNote:      reviewer.note || '',
    requestedContact: payload.otherReviewerEmail || '',
    fileName:         saved.name,
    fileUrl:          saved.url,
    driveFolder:      saved.folderPath
  };

  appendKeyedRow(sheetFor(P_DELIV_SHEET, 'Deliverables'), record);
  mailReviewer(record);
  if (acknowledgementsEnabled() && record.submitterEmail) mailSubmitterReceipt(record);

  return { reviewer: reviewer.name, fileUrl: saved.url };
}

function handleSurvey(payload) {
  if (payload.consent !== true) throw new PublicError('Consent is required to submit the survey.');
  const record = Object.assign({ submittedAt: new Date() }, payload);
  delete record.website;
  appendKeyedRow(sheetFor(P_SURVEY_SHEET, 'Survey responses'), record);
  return { recorded: true };
}

// ------------------------------------------------------------------- reviewers

/**
 * Maps the id the browser sent to a real address held only on this side.
 * Anything unknown -- including the "Other" option -- goes to the coordinator
 * rather than to an address the submitter typed, so this cannot be abused to
 * mail arbitrary people. What they typed is still recorded in the sheet.
 */
function resolveReviewer(id) {
  const directory = reviewerDirectory();
  const domains = allowedDomains();
  const entry = directory[id];

  if (entry && isMailable(entry.email, domains)) {
    return { id: id, name: entry.name || id, email: entry.email };
  }

  const fallback = PROPS.getProperty(P_FALLBACK);
  if (!isMailable(fallback, domains)) {
    throw new PublicError('Reviewer routing is not configured yet. Please contact the R&D team.');
  }
  let note;
  if (id === 'other') note = 'Submitter chose "Other"; routed to the coordinator.';
  else if (entry)     note = 'Reviewer "' + id + '" has no usable address configured; routed to the coordinator.';
  else                note = 'Reviewer id "' + id + '" is not in the directory; routed to the coordinator.';

  return { id: id || 'unknown', name: 'R&D coordinator', email: fallback, note: note };
}

function reviewerDirectory() {
  const raw = PROPS.getProperty(P_REVIEWERS);
  if (!raw) return {};
  try { return JSON.parse(raw) || {}; } catch (error) { return {}; }
}

function allowedDomains() {
  return String(PROPS.getProperty(P_DOMAINS) || DEFAULT_DOMAINS)
    .split(',').map(domain => domain.trim().toLowerCase()).filter(Boolean);
}

function isMailable(address, domains) {
  if (!address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return false;
  const domain = String(address).split('@')[1].toLowerCase();
  return domains.indexOf(domain) !== -1;
}

// ------------------------------------------------------------------------ mail

function mailReviewer(record) {
  requireMailQuota();
  const subject = '[ULF deliverable] ' + record.taskName + ' — ' + record.version + ' (' + record.organization + ')';
  const lines = [
    row('Submitter', record.submitterName + (record.submitterEmail ? ' <' + record.submitterEmail + '>' : '')),
    row('Organization', record.organization),
    row('Task', record.taskName),
    row('Submission', record.submissionType + ' — ' + record.version),
    row('Expected next step', record.nextSteps),
    rowRaw('File', '<a href="' + encodeURI(record.fileUrl) + '">' + escapeHtml(record.fileName) + '</a>'),
    row('Filed under', record.driveFolder)
  ];
  const html = '<p>A university collaboration deliverable was submitted for your review.</p>'
    + '<table cellpadding="4" style="border-collapse:collapse">' + lines.join('') + '</table>'
    + '<p><strong>What changed</strong><br>' + escapeHtml(record.changes).replace(/\n/g, '<br>') + '</p>'
    + (record.notes ? '<p><strong>Notes</strong><br>' + escapeHtml(record.notes).replace(/\n/g, '<br>') + '</p>' : '')
    + (record.routingNote ? '<p style="color:#a15c00"><em>' + escapeHtml(record.routingNote) + '</em></p>' : '')
    + '<p style="color:#666;font-size:12px">Sent by the ULF R&amp;D dashboard.</p>';

  const options = { htmlBody: html, name: 'ULF R&D Dashboard' };
  if (record.submitterEmail) options.replyTo = record.submitterEmail;  // reply reaches the student
  MailApp.sendEmail(record.reviewerEmail, subject, htmlToText(html), options);
}

function mailSubmitterReceipt(record) {
  if (MailApp.getRemainingDailyQuota() < 1) return;   // reviewer mail is the priority
  const subject = 'We received your deliverable: ' + record.taskName + ' (' + record.version + ')';
  const html = '<p>Thank you — your submission reached the Universal Limbs R&amp;D team.</p>'
    + '<table cellpadding="4" style="border-collapse:collapse">'
    + row('Task', record.taskName) + row('Version', record.version)
    + row('File', record.fileName) + row('Reviewer', record.reviewerName)
    + '</table>'
    + '<p>The reviewer will follow up by email. You do not need to resubmit.</p>';
  MailApp.sendEmail(record.submitterEmail, subject, htmlToText(html), { htmlBody: html, name: 'ULF R&D Dashboard' });
}

function requireMailQuota() {
  if (MailApp.getRemainingDailyQuota() < 2) {
    throw new PublicError('The R&D mailbox has reached today’s sending limit. Please email the team directly.');
  }
}

/** Escapes the value — everything here is submitter-controlled text. */
function row(label, value) {
  return rowRaw(label, escapeHtml(value));
}

/** Only for markup this file builds itself, never for submitted values. */
function rowRaw(label, html) {
  return '<tr><td style="color:#666">' + label + '</td><td><strong>' + html + '</strong></td></tr>';
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function htmlToText(html) {
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|tr|table)>/gi, '\n')
             .replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s+/g, '\n').trim();
}

// ----------------------------------------------------------------- drive files

function saveDeliverableFile(payload) {
  const bytes = Utilities.base64Decode(payload.fileBase64);
  if (bytes.length > MAX_FILE_BYTES) throw new PublicError('The file is larger than the 10 MB limit.');

  const blob = Utilities.newBlob(bytes, payload.fileType || 'application/octet-stream', buildFileName(payload));
  const folder = deliverableFolder();
  const file = folder.createFile(blob);
  file.setDescription([payload.organization, payload.taskName, payload.version,
                       'submitted by ' + payload.submitterName].join(' | '));

  return {
    file: file,
    name: file.getName(),
    url: file.getUrl(),
    folderPath: 'Deliverables/' + folder.getName()
  };
}

/** Keeps Drive sortable and collision-free: 2026-08-22_uni_task_v1.2.pdf */
function buildFileName(payload) {
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const original = String(payload.fileName);
  const dot = original.lastIndexOf('.');
  const extension = dot > 0 ? original.slice(dot) : '';
  const slug = [payload.organization, payload.taskName, payload.version]
    .map(part => String(part || '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    .filter(Boolean).join('_').slice(0, 90);
  return stamp + '_' + (slug || 'deliverable') + extension;
}

function deliverableFolder() {
  const parentId = PROPS.getProperty(P_DRIVE_PARENT);
  if (!parentId) throw new PublicError('File storage is not configured yet. Please contact the R&D team.');
  const month = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');
  return childFolder(childFolder(DriveApp.getFolderById(parentId), 'Deliverables'), month);
}

function childFolder(parent, name) {
  const existing = parent.getFoldersByName(name);
  return existing.hasNext() ? existing.next() : parent.createFolder(name);
}

// ---------------------------------------------------------------------- sheets

/**
 * Returns our own tab inside the target spreadsheet, creating it if needed.
 *
 * Deliberately NOT getSheets()[0]: when the spreadsheet is linked to a Google
 * Form, sheet 0 is the Form Responses tab and Forms owns its columns. Writing
 * there gets shifted or overwritten whenever the Form changes.
 */
function sheetFor(propertyKey, tabName) {
  const id = PROPS.getProperty(propertyKey);
  if (!id) throw new PublicError(tabName + ' storage is not configured yet. Please contact the R&D team.');
  const book = SpreadsheetApp.openById(id);
  return book.getSheetByName(tabName) || book.insertSheet(tabName);
}

/**
 * Appends by column NAME, not by object key order, and adds a column for any
 * field it has not seen before. Without this, adding or reordering a form field
 * silently shifts every later row into the wrong columns.
 */
function appendKeyedRow(sheet, record) {
  const keys = Object.keys(record);
  const width = sheet.getLastColumn();
  let header = width ? sheet.getRange(1, 1, 1, width).getValues()[0].map(String).filter(Boolean) : [];

  if (!header.length) {
    header = keys;
    sheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else {
    const added = keys.filter(key => header.indexOf(key) === -1);
    if (added.length) {
      sheet.getRange(1, header.length + 1, 1, added.length).setValues([added]).setFontWeight('bold');
      header = header.concat(added);
    }
  }

  sheet.appendRow(header.map(key => formatValue(record[key])));
}

function formatValue(value) {
  if (value == null) return '';
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.join(', ');
  return typeof value === 'object' ? JSON.stringify(value) : value;
}

// -------------------------------------------------------------------- throttle

function throttle() {
  const cache = CacheService.getScriptCache();
  const minuteKey = 'rate-' + Math.floor(Date.now() / 60000);
  const perMinute = Number(cache.get(minuteKey) || 0) + 1;
  cache.put(minuteKey, String(perMinute), 180);
  if (perMinute > PER_MINUTE_CAP) {
    throw new PublicError('Too many submissions at once. Please try again in a minute.');
  }

  const dayKey = 'count-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const cap = Number(PROPS.getProperty(P_DAILY_CAP) || DEFAULT_DAILY_CAP);
  const perDay = Number(PROPS.getProperty(dayKey) || 0) + 1;
  PROPS.setProperty(dayKey, String(perDay));
  if (perDay > cap) {
    throw new PublicError('The form has reached its daily limit. Please email the R&D team directly.');
  }
}

function acknowledgementsEnabled() {
  return String(PROPS.getProperty(P_ACK) || 'true').toLowerCase() !== 'false';
}

function logFailure(error, event) {
  const type = event && event.postData ? String(event.postData.contents || '').slice(0, 200) : '(no body)';
  console.error('Submission failed: ' + (error && error.message) + ' | request head: ' + type);
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// ------------------------------------------------- google form intake (trigger)

/**
 * Installable trigger for the existing "Submit deliverable" Google Form.
 * Run installFormTrigger() once to attach it.
 *
 * This path is independent of the web app: the Form keeps writing its own
 * response row as usual, and this only adds the reviewer email on top. If a
 * field cannot be identified the whole response still goes to the coordinator,
 * so a response is never silently dropped.
 */
function onFormSubmit(event) {
  try {
    const answers = flattenNamedValues(event && event.namedValues);
    if (!answers || !Object.keys(answers).length) {
      console.warn('Form submit trigger fired with no namedValues.');
      return;
    }

    const reviewer = reviewerFromFormAnswer(findAnswer(answers, ['reviewer', 'send to', 'review by']));
    const submitterEmail = findAnswer(answers, ['your email', 'email address', 'e-mail', 'email']);
    const task = findAnswer(answers, ['task']) || 'Deliverable';
    const version = findAnswer(answers, ['version']) || '';
    const org = findAnswer(answers, ['university', 'organization', 'organisation']) || '';

    mailFormResponse({
      reviewer: reviewer,
      subject: '[ULF deliverable] ' + task + (version ? ' — ' + version : '') + (org ? ' (' + org + ')' : ''),
      answers: answers,
      submitterEmail: isEmail(submitterEmail) ? submitterEmail : ''
    });
  } catch (error) {
    console.error('Form routing failed: ' + (error && error.message));
    notifyCoordinatorOfFailure(error, event);
  }
}

/** namedValues arrives as { "Question title": ["answer"] }. */
function flattenNamedValues(namedValues) {
  if (!namedValues) return null;
  const flat = {};
  Object.keys(namedValues).forEach(function (key) {
    const value = namedValues[key];
    const joined = Array.isArray(value) ? value.filter(String).join(', ') : String(value || '');
    if (String(key).trim() && joined.trim()) flat[String(key).trim()] = joined.trim();
  });
  return flat;
}

/** First answer whose question title contains any of these keywords. */
function findAnswer(answers, keywords) {
  const keys = Object.keys(answers);
  for (var k = 0; k < keywords.length; k++) {
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase().indexOf(keywords[k]) !== -1) return answers[keys[i]];
    }
  }
  return '';
}

/**
 * The Form stores reviewer choices as display text ("Saja Amro - Prosthetist"),
 * not as the ids the dashboard sends, so match on the configured name or id.
 */
function reviewerFromFormAnswer(answer) {
  const text = String(answer || '').toLowerCase();
  const directory = reviewerDirectory();
  const domains = allowedDomains();

  if (text) {
    const ids = Object.keys(directory);
    for (var i = 0; i < ids.length; i++) {
      const entry = directory[ids[i]];
      const name = String(entry && entry.name || '').toLowerCase();
      const matches = (name && text.indexOf(name) !== -1) || text.indexOf(ids[i].toLowerCase()) !== -1;
      if (matches && isMailable(entry.email, domains)) {
        return { id: ids[i], name: entry.name || ids[i], email: entry.email };
      }
    }
  }

  const fallback = PROPS.getProperty(P_FALLBACK);
  if (!isMailable(fallback, domains)) throw new Error('No usable FALLBACK_REVIEWER_EMAIL configured.');
  return {
    id: 'fallback', name: 'R&D coordinator', email: fallback,
    note: text ? 'Could not match "' + answer + '" to a configured reviewer; routed to the coordinator.'
               : 'The form response named no reviewer; routed to the coordinator.'
  };
}

/** Emails every question and answer, so nothing is lost to a mis-guessed field. */
function mailFormResponse(options) {
  requireMailQuota();
  const rows = Object.keys(options.answers)
    .map(function (question) { return row(question, options.answers[question]); })
    .join('');

  const html = '<p>A deliverable was submitted through the University Collaboration form.</p>'
    + '<table cellpadding="4" style="border-collapse:collapse">' + rows + '</table>'
    + (options.reviewer.note ? '<p style="color:#a15c00"><em>' + escapeHtml(options.reviewer.note) + '</em></p>' : '')
    + '<p style="color:#666;font-size:12px">Sent by the ULF R&amp;D dashboard.</p>';

  const mailOptions = { htmlBody: html, name: 'ULF R&D Dashboard' };
  if (options.submitterEmail) mailOptions.replyTo = options.submitterEmail;
  MailApp.sendEmail(options.reviewer.email, options.subject, htmlToText(html), mailOptions);
}

function notifyCoordinatorOfFailure(error, event) {
  const fallback = PROPS.getProperty(P_FALLBACK);
  if (!isMailable(fallback, allowedDomains())) return;
  try {
    MailApp.sendEmail(fallback, '[ULF] A form response could not be routed',
      'A deliverable form response arrived but could not be routed automatically.\n\n'
      + 'Error: ' + (error && error.message) + '\n\n'
      + 'Check the response sheet directly:\n'
      + JSON.stringify(event && event.namedValues || {}, null, 2));
  } catch (ignored) { /* nothing further we can do */ }
}

function isEmail(value) {
  return Boolean(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
}

/** Run once. Safe to re-run: it replaces the existing trigger rather than adding one. */
function installFormTrigger() {
  const id = PROPS.getProperty(P_DELIV_SHEET);
  if (!id) throw new Error('Set DELIVERABLE_SHEET_ID first.');

  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(trigger);
  });

  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(SpreadsheetApp.openById(id))
    .onFormSubmit()
    .create();

  console.log('Form-submit trigger installed on spreadsheet ' + id);
}

/**
 * Prints the Form's real question titles and the response sheet's header row.
 * Use this to confirm the keyword matching above is finding the right fields.
 */
function inspectForm() {
  const sheetId = PROPS.getProperty(P_DELIV_SHEET);
  if (sheetId) {
    const book = SpreadsheetApp.openById(sheetId);
    console.log('Spreadsheet: ' + book.getName());
    book.getSheets().forEach(function (sheet) {
      const width = sheet.getLastColumn();
      const header = width ? sheet.getRange(1, 1, 1, width).getValues()[0] : [];
      console.log('  tab "' + sheet.getName() + '" (' + sheet.getLastRow() + ' rows): '
        + JSON.stringify(header));
    });
  }

  const formId = PROPS.getProperty(P_FORM_ID);
  if (!formId) { console.log('\nSet FORM_ID to also list the Form questions.'); return; }
  const form = FormApp.openById(formId);
  console.log('\nForm: ' + form.getTitle());
  form.getItems().forEach(function (item, index) {
    console.log('  ' + (index + 1) + '. [' + item.getType() + '] ' + item.getTitle());
  });
}

// ------------------------------------------------------------- setup / testing

/** Run this once after filling in the script properties. Reads the log, changes nothing. */
function setup() {
  const report = configReport();
  console.log(report.ready ? 'Configuration looks complete.' : 'Configuration is incomplete:');
  report.problems.forEach(problem => console.log('  - ' + problem));
  console.log('Remaining email quota today: ' + MailApp.getRemainingDailyQuota());
  console.log('\nREVIEWERS_JSON template (edit the addresses, then paste into script properties):\n'
    + JSON.stringify(reviewerTemplate(), null, 2));
  return report;
}

function configReport() {
  const problems = [];
  const domains = allowedDomains();

  [[P_DELIV_SHEET, 'deliverable sheet'], [P_SURVEY_SHEET, 'survey sheet'],
   [P_DRIVE_PARENT, 'Drive parent folder']].forEach(function (pair) {
    if (!PROPS.getProperty(pair[0])) problems.push('Missing script property ' + pair[0] + ' (' + pair[1] + ').');
  });

  if (!isMailable(PROPS.getProperty(P_FALLBACK), domains)) {
    problems.push('FALLBACK_REVIEWER_EMAIL is missing or outside the allowed domains (' + domains.join(', ') + ').');
  }

  const directory = reviewerDirectory();
  const ids = Object.keys(directory);
  if (!ids.length) {
    problems.push('REVIEWERS_JSON is empty — every submission would fall back to the coordinator.');
  }
  Object.keys(reviewerTemplate()).forEach(function (id) {
    if (id === 'other') return;
    if (!directory[id]) problems.push('Reviewer "' + id + '" (in the dashboard dropdown) has no entry in REVIEWERS_JSON.');
    else if (!isMailable(directory[id].email, domains)) {
      problems.push('Reviewer "' + id + '" has no usable address; it would route to the coordinator.');
    }
  });

  const hasTrigger = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === 'onFormSubmit';
  });
  if (!hasTrigger) problems.push('No form-submit trigger installed — run installFormTrigger() if you use the Google Form.');

  return { ready: problems.length === 0, problems: problems };
}

/** The ids here must match the option values in the dashboard's reviewer dropdown. */
function reviewerTemplate() {
  return {
    'saja-amro':   { name: 'Saja Amro',   email: '', role: 'Prosthetist' },
    'nadine-arar': { name: 'Nadine Arar', email: '', role: 'Test Lead / Mentor' },
    'maria':       { name: 'Maria',       email: '', role: 'University Collaboration Lead' },
    'walid':       { name: 'Walid',       email: '', role: '3D CAD designer' },
    'ganesh':      { name: 'Ganesh',      email: '', role: '3D validator & simulator' },
    'nili':        { name: 'Nili',        email: '', role: 'Product Success' },
    'abhay':       { name: 'Abhay',       email: '', role: 'Researcher' },
    'matthew':     { name: 'Matthew',     email: '', role: 'Concept artist' }
  };
}

/** Files a fake deliverable end to end so you can verify Drive/Sheet/mail wiring. */
function selfTest() {
  const result = handleDeliverable({
    submitterName: 'Self test', submitterEmail: '', organization: 'ULF internal',
    taskName: 'Pipeline self test', submissionType: 'Concept', version: 'v0.0',
    changes: 'Automated self test — safe to delete.', nextSteps: 'Review',
    recipientEmail: 'other', notes: 'Generated by selfTest().',
    fileName: 'selftest.txt', fileType: 'text/plain',
    fileBase64: Utilities.base64Encode('ULF pipeline self test')
  });
  console.log(result);
  return result;
}
