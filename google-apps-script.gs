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
 *        DOWNLOAD_SHEET_ID             id of the download-responses Google Sheet
 *        DELIVERABLE_PARENT_FOLDER_ID  Drive folder submissions are filed under
 *                                      (the R&D folder works: 14iGYmt91YZmHAzsnil6HtJv8Nu5YTF6X)
 *        REVIEWERS_JSON                see reviewerTemplate() at the bottom
 *        FALLBACK_REVIEWER_EMAIL       gets "Other" and any misrouted submission
 *        GOOGLE_CLIENT_ID              the OAuth Web client ID from Google Cloud
 *                                      Console — must match the one in assets/js/config.js
 *        USERS_SHEET_ID                id of the Sheet with an "email" / "role" tab
 *                                      named "Users" (role is "admin" or "member")
 *        FINANCE_SHEET_ID              id of the Finance Tracker Google Sheet
 *        FINANCE_SHEET_GID             numeric gid of its "Tracker" tab (from its URL)
 *        PARTS_SHEET_ID                id of a Google Sheet to hold Part Number Standard
 *                                      status edits (made from the Live tab). Any sheet
 *                                      works — a "PartStatus" tab is created in it
 *                                      automatically the first time someone edits a status.
 *      Optional: ALLOWED_MAIL_DOMAINS (default universallimbs.com — also doubles as the
 *                "automatic member" Workspace domain list, see resolveRole() below),
 *                DAILY_SUBMISSION_CAP, ACK_SUBMITTERS
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
 * ROLE-BASED ACCESS (Finance tab, every web-app submission action, and everything resolveRole() gates)
 *   This project is the INTERNAL dashboard's backend only. The patient-facing
 *   survey (prosthetic-user-survey.html) belongs to the public main ULF
 *   website, not this dashboard, and has no action here — if that page's real,
 *   live version needs a backend, it must get its own separate Apps Script
 *   deployment and its own submissionEndpoint, never this one. (That file still
 *   lives in this repo and currently points its config at the same
 *   submissionEndpoint as the dashboard; pointing it at *this* deployment would
 *   break it, by design, since survey is intentionally absent below.)
 *
 *   Every remaining submission action (deliverable/download/upload) requires a
 *   signed-in, approved account (member or admin). None of them are called by
 *   any page in this repo today, so leaving them open under an
 *   "Execute as: Me" deployment would let an unauthenticated request file
 *   Drive uploads and send email through the deploying account for no reason.
 *   External university collaborators have their own, separate, isolated path:
 *   the Google Form -> onFormSubmit trigger below, which never goes through
 *   doPost and carries Google Form's own abuse protections.
 *
 *   whoAmI is necessarily reachable without an approved role already in place
 *   — that's the check that determines approval, so it can't itself require
 *   being pre-approved. It only ever returns the caller's own email/role,
 *   resolved from a cryptographically verified token, never arbitrary data.
 *   doGet is also reachable without auth, but only ever returns a
 *   non-identifying list of which script properties are missing, for
 *   diagnosing setup — no user, financial, or Sheet data.
 *
 *   The browser never decides who sees Finance data — it only decides which tabs
 *   to *show*, which is cosmetic. The real gate is here: every request carries a
 *   Google Sign-In ID token, this file verifies it against Google (tokeninfo
 *   endpoint, no library needed) to get a trustworthy email address — the
 *   browser's own claim of who it is is never trusted — and resolveRole()
 *   turns that into a role:
 *     - "admin" in the Users sheet always wins, any domain.
 *     - "member" in the Users sheet approves an external (non-Workspace) account.
 *     - unlisted but on an ALLOWED_MAIL_DOMAINS domain (default
 *       universallimbs.com) -> member automatically, no Users row needed.
 *     - unlisted and off-domain -> denied.
 *   A "member" (or anyone unapproved) calling financeData directly — bypassing
 *   the UI entirely — gets the same rejection the hidden tab implies.
 *   IMPORTANT: once this is live, turn OFF "Publish to web" on the Finance
 *   Tracker sheet — that old CSV link bypasses this check completely.
 *
 * NOTE ON STATUS CODES
 *   ContentService cannot set an HTTP status, so every response is 200 and the
 *   real outcome is the `ok` field in the JSON body. Clients must check the body.
 */

const PROPS = PropertiesService.getScriptProperties();

const P_DELIV_SHEET   = 'DELIVERABLE_SHEET_ID';
const P_DOWNLOAD_SHEET = 'DOWNLOAD_SHEET_ID';
const P_DRIVE_PARENT  = 'DELIVERABLE_PARENT_FOLDER_ID';
const P_REVIEWERS     = 'REVIEWERS_JSON';
const P_FALLBACK      = 'FALLBACK_REVIEWER_EMAIL';
const P_DOMAINS       = 'ALLOWED_MAIL_DOMAINS';
const P_DAILY_CAP     = 'DAILY_SUBMISSION_CAP';
const P_ACK           = 'ACK_SUBMITTERS';
const P_FORM_ID       = 'FORM_ID';

const P_GOOGLE_CLIENT_ID = 'GOOGLE_CLIENT_ID';
const P_USERS_SHEET      = 'USERS_SHEET_ID';
const P_FIN_SHEET        = 'FINANCE_SHEET_ID';
const P_FIN_GID          = 'FINANCE_SHEET_GID';
const P_PARTS_SHEET      = 'PARTS_SHEET_ID';

const ROLE_ADMIN  = 'admin';
const ROLE_MEMBER = 'member';

const MAX_FILE_BYTES    = 10 * 1024 * 1024;   // matches the 10 MB limit in the UI
const UPLOAD_MAX_BYTES  = 20 * 1024 * 1024;   // the Upload panel advertises 20 MB
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
  try {
    const request = parseRequest(event);
    throttle();

    // Read-only calls: no write lock needed, kept fast. partStatus carries no
    // secret data (the Live tab already shows every part publicly) so, unlike
    // financeData, it needs no auth check.
    if (request.type === 'whoAmI')      return json({ ok: true, result: handleWhoAmI(request.payload) });
    if (request.type === 'financeData') return json({ ok: true, result: handleFinanceData(request.payload) });
    if (request.type === 'partStatus')  return json({ ok: true, result: handlePartStatus() });

    return withLock(function () {
      if (request.type === 'deliverable')      return json({ ok: true, result: handleDeliverable(request.payload) });
      if (request.type === 'download')         return json({ ok: true, result: handleDownload(request.payload) });
      if (request.type === 'upload')           return json({ ok: true, result: handleUpload(request.payload) });
      if (request.type === 'updatePartStatus') return json({ ok: true, result: handleUpdatePartStatus(request.payload) });
      throw new PublicError('Unsupported submission type.');
    });
  } catch (error) {
    logFailure(error, event);
    return json({
      ok: false,
      error: error && error.isPublic ? error.message
                                     : 'We could not record this submission. Please contact the R&D team.'
    });
  }
}

function withLock(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return json({ ok: false, error: 'The form is busy. Please try again in a moment.' });
  }
  try {
    return fn();
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
  // Not called by any live page today — nothing public needs this open, and
  // "Execute as: Me" means an unauthenticated hit here could file Drive
  // uploads and send email under your account. External collaborators should
  // use the Google Form (onFormSubmit below), which is a separate, isolated
  // path with its own abuse protections.
  const user = verifyIdToken(payload.idToken);
  if (!resolveRole(user.email)) throw new PublicError('You do not have access to submit here.');
  return doHandleDeliverable(payload);
}

/** The deliverable pipeline itself, separated out so selfTest() can exercise it directly. */
function doHandleDeliverable(payload) {
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

/**
 * A bare file drop from the hub's Upload panel.
 *
 * Deliberately thin: no reviewer routing and no required metadata, because the
 * panel asks for none. The file lands in Uploads/<yyyy-MM>/ and the coordinator
 * is told it arrived. The 20 MB ceiling here is the real one — the client-side
 * check in app.js is only there to fail fast.
 */
function handleUpload(payload) {
  // Unlike deliverable/survey/download (intentionally public — external
  // collaborators without ULF accounts), the Upload panel is an internal
  // dashboard feature with no documented external use case, so it requires a
  // signed-in, approved account (either role) rather than being open to anyone.
  const user = verifyIdToken(payload.idToken);
  if (!resolveRole(user.email)) throw new PublicError('You do not have access to upload files here.');

  if (!payload.fileBase64 || !payload.fileName) throw new PublicError('No file was received.');

  const bytes = Utilities.base64Decode(payload.fileBase64);
  if (bytes.length > UPLOAD_MAX_BYTES) throw new PublicError('The file is larger than the 20 MB limit.');

  const blob = Utilities.newBlob(bytes, payload.fileType || 'application/octet-stream',
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd') + '_' + payload.fileName);
  const file = submissionFolder('Uploads').createFile(blob);

  const coordinator = PROPS.getProperty(P_FALLBACK);
  if (coordinator && MailApp.getRemainingDailyQuota() > 1) {
    const html = '<p>A file was uploaded from the R&amp;D hub.</p>'
      + '<table cellpadding="4" style="border-collapse:collapse">'
      + rowRaw('File', '<a href="' + encodeURI(file.getUrl()) + '">' + escapeHtml(file.getName()) + '</a>')
      + row('Size', Math.round(bytes.length / 1024) + ' KB')
      + row('Language', payload.language || '')
      + '</table>';
    MailApp.sendEmail(coordinator, '[ULF upload] ' + file.getName(), htmlToText(html),
                      { htmlBody: html, name: 'ULF R&D Hub' });
  }

  return { fileUrl: file.getUrl() };
}

/**
 * A university team reporting back on a package they downloaded.
 *
 * Differs from a deliverable in two ways: the file is optional (most responses
 * are status text only), and there is no reviewer picker — these always go to
 * the collaboration coordinator, because the point is programme-level tracking.
 */
function handleDownload(payload) {
  // Same reasoning as handleDeliverable — unused by any live page today.
  const user = verifyIdToken(payload.idToken);
  if (!resolveRole(user.email)) throw new PublicError('You do not have access to submit here.');

  const required = ['packageName', 'submitterName', 'organization', 'status', 'workDone'];
  const missing = required.filter(field => !String(payload[field] || '').trim());
  if (missing.length) throw new PublicError('Please complete every required field.');

  const saved = payload.fileBase64
    ? saveSubmissionFile(payload, 'Responses', [payload.organization, payload.packageName])
    : null;

  const record = {
    submittedAt:    new Date(),
    packageName:    payload.packageName,
    submitterName:  payload.submitterName,
    submitterEmail: payload.submitterEmail || '',
    organization:   payload.organization,
    status:         payload.status,
    workDone:       payload.workDone,
    findings:       payload.findings || '',
    needs:          payload.needs || '',
    language:       payload.language || '',
    fileName:       saved ? saved.name : '',
    fileUrl:        saved ? saved.url : ''
  };

  appendKeyedRow(sheetFor(P_DOWNLOAD_SHEET, 'Download responses'), record);
  mailDownloadResponse(record);

  return { recorded: true, fileUrl: record.fileUrl };
}

// ------------------------------------------------------- authentication & roles

/**
 * Who the browser says it is, resolved into a role it cannot forge.
 *
 * Returns role: null for a signed-in-but-unapproved account rather than
 * throwing, so the dashboard can show "not authorized yet" instead of a
 * generic error. manageUrl is only included for admins, and points at the
 * Users sheet directly — there is no in-app role editor, the sheet IS the
 * editor, so this is the one thing worth handing back.
 */
function handleWhoAmI(payload) {
  const user = verifyIdToken(payload.idToken);
  const role = resolveRole(user.email);
  const result = { email: user.email, role: role || null };
  if (role === ROLE_ADMIN) {
    const sheetId = PROPS.getProperty(P_USERS_SHEET);
    if (sheetId) result.manageUrl = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/edit';
  }
  return result;
}

/**
 * The actual Finance gate. Hiding the tab in the UI is cosmetic only — this is
 * what stops a member (or anyone else) from getting the figures by calling the
 * endpoint directly, with or without the dashboard loaded at all.
 */
function handleFinanceData(payload) {
  const user = verifyIdToken(payload.idToken);
  const role = resolveRole(user.email);
  if (role !== ROLE_ADMIN) throw new PublicError('You do not have access to Finance data.');
  return readFinanceData();
}

/**
 * Current "in progress" / "not started" status for every Part Number Standard
 * code the Live tab's status column has ever had edited. Codes with no row
 * yet are simply absent from the result — the dashboard keeps showing its
 * own built-in default for those until someone edits them. No auth required:
 * this is the same wip/not-wip information the hardcoded diagram already
 * shows to anyone who opens the Live tab.
 */
function handlePartStatus() {
  return { statuses: readPartStatuses() };
}

/**
 * Edits one part's status from the Live tab's Part Number Standard table.
 * Requires a signed-in, approved account (member or admin) — same bar as the
 * Upload panel — since unlike the read this is a write, but it is not
 * Finance-sensitive data, so any approved team member (not only admins) may
 * record progress.
 */
function handleUpdatePartStatus(payload) {
  const user = verifyIdToken(payload.idToken);
  if (!resolveRole(user.email)) throw new PublicError('You do not have access to update part status.');

  const code = String(payload.code || '').trim().toUpperCase();
  if (!/^[A-Z]{2,6}$/.test(code)) throw new PublicError('Unknown part code.');
  const wip = Boolean(payload.wip);

  upsertPartStatus(code, wip, user.email);
  return { code: code, wip: wip };
}

/** Opens (or lazily creates) the "PartStatus" tab, or null if not configured yet. */
function openPartsSheet() {
  const id = PROPS.getProperty(P_PARTS_SHEET);
  if (!id) return null;
  const book = SpreadsheetApp.openById(id);
  return book.getSheetByName('PartStatus') || book.insertSheet('PartStatus');
}

function readPartStatuses() {
  const sheet = openPartsSheet();
  if (!sheet || sheet.getLastRow() < 2) return {};
  const width = sheet.getLastColumn();
  const rows = sheet.getRange(1, 1, sheet.getLastRow(), width).getValues();
  const header = rows[0].map(function (h) { return String(h || '').trim().toLowerCase(); });
  const codeCol = header.indexOf('code');
  const wipCol = header.indexOf('wip');
  if (codeCol === -1 || wipCol === -1) return {};

  const out = {};
  for (let i = 1; i < rows.length; i++) {
    const code = String(rows[i][codeCol] || '').trim().toUpperCase();
    if (code) out[code] = Boolean(rows[i][wipCol]);
  }
  return out;
}

/** Updates the row for `code` in place, or appends one if this is its first edit. */
function upsertPartStatus(code, wip, email) {
  const sheet = openPartsSheet();
  if (!sheet) throw new PublicError('Part status storage is not configured yet. Please contact an administrator.');

  const header = ['code', 'wip', 'updatedBy', 'updatedAt'];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  const record = [code, wip, email, new Date()];
  const existingRows = sheet.getLastRow() - 1;
  const codes = existingRows > 0 ? sheet.getRange(2, 1, existingRows, 1).getValues() : [];
  const rowIndex = codes.findIndex(function (r) { return String(r[0] || '').trim().toUpperCase() === code; });

  if (rowIndex === -1) sheet.appendRow(record);
  else sheet.getRange(rowIndex + 2, 1, 1, record.length).setValues([record]);
}

/**
 * The access policy, applied to an already-verified email (never a
 * browser-supplied one — see verifyIdToken):
 *   1. Listed as "admin" in the Users sheet -> admin, no matter the domain.
 *      Admin always wins, even over a workspace account that would otherwise
 *      default to member.
 *   2. Listed as "member" in the Users sheet -> member. This is how an
 *      approved external (non-workspace) Gmail account gets in at all.
 *   3. Not listed, but the email's domain is one of ALLOWED_MAIL_DOMAINS
 *      (defaults to universallimbs.com) -> member automatically. Every
 *      verified Workspace account gets in without needing a Users row.
 *   4. Anything else (an external account with no Users row) -> null,
 *      denied. The sheet is the only way in for non-Workspace accounts.
 */
function resolveRole(email) {
  // The Users sheet grants admin and approves external accounts, but a
  // verified Workspace account's default member access should not depend on
  // that sheet being reachable — so a lookup problem here falls through to
  // the domain check below instead of denying every sign-in.
  let sheetRole = null;
  try {
    sheetRole = getUserRole(email);
  } catch (error) {
    console.error('Users sheet lookup failed (' + error.message + '); falling back to domain default for ' + email);
  }
  if (sheetRole === ROLE_ADMIN) return ROLE_ADMIN;
  if (sheetRole === ROLE_MEMBER) return ROLE_MEMBER;

  const domain = String(email || '').split('@')[1] || '';
  if (allowedDomains().indexOf(domain.toLowerCase()) !== -1) return ROLE_MEMBER;

  return null;
}

/**
 * Verifies a Google Identity Services ID token the browser just received at
 * sign-in. Uses Google's own tokeninfo endpoint rather than a JWT library —
 * one UrlFetchApp call, no crypto code to maintain. Low-volume use (one check
 * per sign-in, not per click) is exactly what Google documents this for.
 */
function verifyIdToken(idToken) {
  if (!idToken) throw new PublicError('Please sign in with Google first.');
  const clientId = PROPS.getProperty(P_GOOGLE_CLIENT_ID);
  if (!clientId) throw new PublicError('Sign-in is not configured yet. Please contact an administrator.');

  const response = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  );
  if (response.getResponseCode() !== 200) {
    throw new PublicError('Your session has expired. Please sign in again.');
  }

  let claims;
  try { claims = JSON.parse(response.getContentText()); } catch (error) {
    throw new PublicError('Your session could not be verified. Please sign in again.');
  }

  // tokeninfo already refuses a 200 for a token that fails signature, issuer
  // or expiry checks — these are re-checked explicitly anyway so the security
  // property is visible in this file's code, not just implied by trusting the
  // endpoint's behavior.
  if (claims.iss !== 'https://accounts.google.com' && claims.iss !== 'accounts.google.com') {
    throw new PublicError('Your session could not be verified. Please sign in again.');
  }
  if (claims.aud !== clientId) {
    throw new PublicError('Your session could not be verified. Please sign in again.');
  }
  const exp = Number(claims.exp || 0);
  if (!exp || exp * 1000 <= Date.now()) {
    throw new PublicError('Your session has expired. Please sign in again.');
  }
  if (claims.email_verified !== 'true' && claims.email_verified !== true) {
    throw new PublicError('Your Google account email is not verified.');
  }
  return { email: String(claims.email || '').toLowerCase(), name: claims.name || claims.email };
}

/** Looks an already-verified email up in the Users sheet. Null = not approved. */
function getUserRole(email) {
  const sheetId = PROPS.getProperty(P_USERS_SHEET);
  if (!sheetId) throw new PublicError('User roles are not configured yet. Please contact an administrator.');
  const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Users');
  if (!sheet) throw new PublicError('User roles are not configured yet. Please contact an administrator.');

  const values = sheet.getDataRange().getValues();
  if (!values.length) return null;
  const header = values[0].map(function (h) { return String(h || '').trim().toLowerCase(); });
  const emailCol = header.indexOf('email');
  const roleCol = header.indexOf('role');
  if (emailCol === -1 || roleCol === -1) return null;

  const target = String(email || '').toLowerCase();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][emailCol] || '').trim().toLowerCase() === target) {
      const role = String(values[i][roleCol] || '').trim().toLowerCase();
      return (role === ROLE_ADMIN || role === ROLE_MEMBER) ? role : null;
    }
  }
  return null;
}

/**
 * Reads the Finance Tracker sheet directly (not its old public CSV link) and
 * returns plain JSON the dashboard can render without fetching or parsing
 * anything itself.
 *
 * fundsAvailable/spentToDate/breakdown are intentionally always null/empty —
 * there is no hardcoded placeholder data here any more (there used to be, via
 * a script property). Those headline figures will come from a live Google
 * Sheets reporting copy synced from an Excel workbook once that pipeline
 * exists; until then the dashboard shows "not yet available" rather than a
 * fabricated number. The "by branch" table below is already a real, live
 * read of the existing Tracker sheet, unaffected by this.
 */
function readFinanceData() {
  const sheetId = PROPS.getProperty(P_FIN_SHEET);
  if (!sheetId) throw new PublicError('Finance data is not configured yet. Please contact an administrator.');
  const book = SpreadsheetApp.openById(sheetId);
  const gid = Number(PROPS.getProperty(P_FIN_GID) || 0);
  const sheet = book.getSheets().filter(function (s) { return s.getSheetId() === gid; })[0] || book.getSheets()[0];

  const rows = sheet.getDataRange().getValues();
  const headIdx = rows.findIndex(function (r) { return /branch/i.test(String(r[0] || '')); });
  if (headIdx === -1) throw new PublicError('Finance tracker sheet is missing its "Branch" header row.');

  const num = function (v) { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; };
  const asof = rows.slice(0, headIdx).map(function (r) { return r[0]; }).filter(Boolean)[0] || '';
  const byBranch = rows.slice(headIdx + 1)
    .filter(function (r) { return String(r[0] || '').trim() && !/^total$/i.test(String(r[0]).trim()); })
    .map(function (r) {
      return [r[0], num(r[1]), num(r[2]), num(r[3]), num(r[4]), String(r[5] || '').trim() === '' ? '' : num(r[5])];
    });

  return { asof: asof, byBranch: byBranch, fundsAvailable: null, spentToDate: null, breakdown: [] };
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

function mailDownloadResponse(record) {
  requireMailQuota();
  const coordinator = PROPS.getProperty(P_FALLBACK);
  if (!coordinator) return;   // nothing to notify; the sheet row is still the record

  const subject = '[ULF response] ' + record.packageName + ' — ' + record.status + ' (' + record.organization + ')';
  const lines = [
    row('Package', record.packageName),
    row('Team', record.organization),
    row('Submitter', record.submitterName + (record.submitterEmail ? ' <' + record.submitterEmail + '>' : '')),
    row('Status', record.status)
  ];
  if (record.fileUrl) {
    lines.push(rowRaw('File', '<a href="' + encodeURI(record.fileUrl) + '">' + escapeHtml(record.fileName) + '</a>'));
  }

  const html = '<p>A university team reported back on a download package.</p>'
    + '<table cellpadding="4" style="border-collapse:collapse">' + lines.join('') + '</table>'
    + '<p><strong>What they did</strong><br>' + escapeHtml(record.workDone).replace(/\n/g, '<br>') + '</p>'
    + (record.findings ? '<p><strong>Findings</strong><br>' + escapeHtml(record.findings).replace(/\n/g, '<br>') + '</p>' : '')
    + (record.needs ? '<p><strong>What they need next</strong><br>' + escapeHtml(record.needs).replace(/\n/g, '<br>') + '</p>' : '')
    + '<p style="color:#666;font-size:12px">Sent by the ULF R&amp;D dashboard.</p>';

  const options = { htmlBody: html, name: 'ULF R&D Dashboard' };
  if (record.submitterEmail) options.replyTo = record.submitterEmail;
  MailApp.sendEmail(coordinator, subject, htmlToText(html), options);
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
  const saved = saveSubmissionFile(payload, 'Deliverables',
    [payload.organization, payload.taskName, payload.version]);
  saved.file.setDescription([payload.organization, payload.taskName, payload.version,
                             'submitted by ' + payload.submitterName].join(' | '));
  return saved;
}

/**
 * Writes one uploaded file into <parent>/<kind>/<yyyy-MM>/ and returns its handles.
 * `slugParts` only shapes the filename, so each submission type can name its own
 * files without needing its own copy of the decode / size / folder logic.
 */
function saveSubmissionFile(payload, kind, slugParts) {
  const bytes = Utilities.base64Decode(payload.fileBase64);
  if (bytes.length > MAX_FILE_BYTES) throw new PublicError('The file is larger than the 10 MB limit.');

  const blob = Utilities.newBlob(bytes, payload.fileType || 'application/octet-stream',
                                 buildFileName(payload, slugParts, kind));
  const folder = submissionFolder(kind);
  const file = folder.createFile(blob);

  return {
    file: file,
    name: file.getName(),
    url: file.getUrl(),
    folderPath: kind + '/' + folder.getName()
  };
}

/** Keeps Drive sortable and collision-free: 2026-08-22_uni_task_v1.2.pdf */
function buildFileName(payload, slugParts, kind) {
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const original = String(payload.fileName);
  const dot = original.lastIndexOf('.');
  const extension = dot > 0 ? original.slice(dot) : '';
  const slug = (slugParts || [])
    .map(part => String(part || '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    .filter(Boolean).join('_').slice(0, 90);
  return stamp + '_' + (slug || String(kind || 'submission').toLowerCase()) + extension;
}

function submissionFolder(kind) {
  const parentId = PROPS.getProperty(P_DRIVE_PARENT);
  if (!parentId) throw new PublicError('File storage is not configured yet. Please contact the R&D team.');
  const month = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');
  return childFolder(childFolder(DriveApp.getFolderById(parentId), kind), month);
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

  [[P_DELIV_SHEET, 'deliverable sheet'],
   [P_DOWNLOAD_SHEET, 'download responses sheet'],
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

  if (!PROPS.getProperty(P_GOOGLE_CLIENT_ID)) problems.push('Missing script property GOOGLE_CLIENT_ID — sign-in will fail.');
  if (!PROPS.getProperty(P_USERS_SHEET)) problems.push('Missing script property USERS_SHEET_ID — no one can be granted admin, and external (non-Workspace) accounts cannot be approved.');
  if (!PROPS.getProperty(P_FIN_SHEET)) problems.push('Missing script property FINANCE_SHEET_ID — the Finance tab will error for admins.');
  if (!PROPS.getProperty(P_PARTS_SHEET)) problems.push('Missing script property PARTS_SHEET_ID — editing Part Number Standard status on the Live tab will fail (viewing still shows the built-in defaults).');

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

/**
 * Run this in the Apps Script editor (Run -> selfTestRoles) to check the
 * access policy against real addresses WITHOUT needing a live Google sign-in.
 * Requires USERS_SHEET_ID (and ideally ALLOWED_MAIL_DOMAINS) to already be
 * set. Edit the `cases` list below to match whoever you want to check.
 */
function selfTestRoles() {
  const cases = [
    'rasna@universallimbs.com',
    'vlmantha13@gmail.com',
    'someone-unlisted@gmail.com',
    'random-person@universallimbs.com'
  ];
  cases.forEach(function (email) {
    console.log(email + ' -> ' + (resolveRole(email) || 'DENIED'));
  });
}

/**
 * Run this in the Apps Script editor (Run -> selfTestFinance) to see exactly
 * what the Finance tab would receive, without needing a live sign-in. Calls
 * readFinanceData() directly, bypassing the role check in handleFinanceData()
 * — safe here since this only runs when you deliberately execute it from the
 * editor. If the sheet's shape doesn't match what's expected, this throws the
 * exact same error the dashboard would show, so you can fix the sheet (not
 * the code) if that's the actual problem.
 */
function selfTestFinance() {
  const result = readFinanceData();
  console.log(JSON.stringify(result, null, 2));
  return result;
}

/** Files a fake deliverable end to end so you can verify Drive/Sheet/mail wiring.
 * Calls doHandleDeliverable() directly (skipping the auth check in
 * handleDeliverable()) since this runs as a developer in the Apps Script
 * editor, not through doPost, and has no ID token to present.
 */
function selfTest() {
  const result = doHandleDeliverable({
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
