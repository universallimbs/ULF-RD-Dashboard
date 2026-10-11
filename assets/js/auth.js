// ULF R&D Dashboard — Google Sign-In + role-based access control.
//
// This file only ever decides what the UI *shows*. The real gate is in
// google-apps-script.gs: every Finance data request carries the Google ID
// token this file obtained, and Apps Script re-verifies it and the caller's
// role itself before returning anything. A member (or anyone un-approved)
// forcing a hidden tab open in devtools gets no real data either way —
// loadFinanceData() below is simply never called for them, and even if it
// were, the backend would refuse it.
(function () {
  'use strict';

  const ROLE_TABS = {
    admin:  ['rd', 'pr', 'finance', 'ulf'],
    member: ['rd', 'pr']
  };

  const state = { idToken: null, email: '', role: null };

  function pt() {
    const btn = document.querySelector('.lang button[data-lang="pt"]');
    return Boolean(btn && btn.classList.contains('active'));
  }

  function authStrings() {
    return pt()
      ? {
          notAuthorized: 'A sua conta (%email%) ainda não tem acesso. Peça a um administrador para a adicionar à folha de utilizadores.',
          signinError: 'Não foi possível verificar a sessão. Tente novamente.',
          loadError: 'Não foi possível carregar o Google Sign-In. Atualize a página.',
          financeOnly: 'A secção Financeira só está disponível para administradores.'
        }
      : {
          notAuthorized: 'Your account (%email%) is not authorized yet. Ask an administrator to add you to the Users sheet.',
          signinError: 'We could not verify your sign-in. Please try again.',
          loadError: 'Could not load Google Sign-In. Please refresh the page.',
          financeOnly: 'The Finance tab is only available to administrators.'
        };
  }

  function el(id) { return document.getElementById(id); }

  function showGateMessage(text, isError) {
    const msg = el('authMsg');
    msg.textContent = text || '';
    msg.hidden = !text;
    msg.classList.toggle('err', Boolean(isError));
  }

  function showGate() {
    el('appWrap').hidden = true;
    el('authGate').hidden = false;
  }

  function showApp() {
    el('authGate').hidden = true;
    el('appWrap').hidden = false;
    // #appWrap is display:none until this point, so any earlier offsetHeight
    // measurement (the carousel's initial go(0) at page load) read 0 — the
    // viewport only recovered once some other tab click happened to
    // re-measure it after this point. Re-measure now that it's actually
    // visible, so R&D (the default tab) is correct without needing a click.
    if (window.ULF_CAROUSEL) window.ULF_CAROUSEL.sizeViewport();

    // Warm the 3D viewer's assets in the background, off the critical sign-in
    // path, so the Live tab is usually already loaded by the time someone
    // clicks it instead of starting a ~600KB fetch right then.
    const prefetch = () => { if (window.ULF_LIVE) window.ULF_LIVE.ensureAssets().catch(() => {}); };
    if (window.requestIdleCallback) requestIdleCallback(prefetch, { timeout: 4000 });
    else setTimeout(prefetch, 1500);
  }

  function applyRole(role) {
    const allowed = ROLE_TABS[role] || [];
    document.querySelectorAll('.department').forEach((btn) => {
      const page = btn.dataset.page;
      const ok = allowed.indexOf(page) !== -1;
      btn.hidden = !ok;
      if (!ok && btn.classList.contains('active')) {
        btn.classList.remove('active');
        const section = document.getElementById(page);
        if (section) section.classList.remove('active');
        const first = document.querySelector('.department:not([hidden])');
        if (first) {
          first.classList.add('active');
          const firstSection = document.getElementById(first.dataset.page);
          if (firstSection) firstSection.classList.add('active');
        }
      }
    });

    if (role === 'admin') {
      loadFinanceData();
    } else {
      const note = el('finNote');
      if (note) note.textContent = authStrings().financeOnly;
      const asof = el('finAsof');
      if (asof) asof.textContent = '';
    }
  }

  function renderAccountBar(result) {
    el('acctEmail').textContent = result.email;
    const roleEl = el('acctRole');
    roleEl.textContent = result.role === 'admin' ? 'Admin' : 'Member';
    roleEl.classList.toggle('admin', result.role === 'admin');
    const manage = el('manageLink');
    if (result.manageUrl) {
      manage.href = result.manageUrl;
      manage.hidden = false;
    } else {
      manage.hidden = true;
    }
    el('accountBar').hidden = false;
  }

  function loadFinanceData() {
    if (!state.idToken) return;
    window.ulfSubmit('financeData', { idToken: state.idToken })
      .then((data) => { if (window.ULF_FIN) window.ULF_FIN.renderFinance(data); })
      .catch((error) => {
        // Previously only finNote was updated on failure, leaving finAsof
        // stuck on its static "Loading tracker…" placeholder forever.
        if (window.ULF_FIN) window.ULF_FIN.showFinanceError(error.message || authStrings().signinError);
      });
  }

  function handleCredentialResponse(response) {
    showGateMessage('');
    window.ulfSubmit('whoAmI', { idToken: response.credential })
      .then((result) => {
        if (!result.role) {
          state.idToken = null;
          showGateMessage(authStrings().notAuthorized.replace('%email%', result.email), true);
          return;
        }
        state.idToken = response.credential;
        state.email = result.email;
        state.role = result.role;
        renderAccountBar(result);
        applyRole(result.role);
        showApp();
      })
      .catch((error) => {
        state.idToken = null;
        showGateMessage(error.message || authStrings().signinError, true);
      });
  }

  function signOut() {
    try { if (window.google) google.accounts.id.disableAutoSelect(); } catch (error) { /* not loaded */ }
    state.idToken = null; state.email = ''; state.role = null;
    el('accountBar').hidden = true;
    showGateMessage('');
    showGate();
  }

  function whenGisReady(callback, tries) {
    tries = tries || 0;
    if (window.google && google.accounts && google.accounts.id) { callback(); return; }
    if (tries > 100) { showGateMessage(authStrings().loadError, true); return; }
    setTimeout(() => whenGisReady(callback, tries + 1), 100);
  }

  function init() {
    const clientId = (window.ULF_CONFIG || {}).googleClientId || '';
    if (!clientId) {
      showGateMessage('Sign-in is not configured yet. Set googleClientId in assets/js/config.js.', true);
      return;
    }
    whenGisReady(() => {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: true
      });
      google.accounts.id.renderButton(el('gsiButton'), { theme: 'outline', size: 'large', width: '280' });
    });
  }

  // For any future feature (e.g. wiring the Upload panel to handleUpload,
  // which now requires a signed-in account) that needs to attach the current
  // session's token to a request.
  window.ULF_AUTH = {
    getIdToken: () => state.idToken,
    getRole: () => state.role
  };

  el('signOutBtn').addEventListener('click', signOut);
  init();
}());
