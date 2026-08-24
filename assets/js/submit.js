// Shared submission transport for the dashboard and the survey page.
// Classic script (not a module) so the standalone survey page can reuse it.
(function () {
  'use strict';

  function endpoint() {
    return (window.ULF_CONFIG || {}).submissionEndpoint || '';
  }

  /**
   * POSTs one submission to the Apps Script web app and resolves with its result.
   *
   * Two Apps Script quirks are handled here:
   *  - Content-Type must stay text/plain so this is a CORS "simple request".
   *    An application/json body triggers a preflight, and Apps Script web apps
   *    cannot answer OPTIONS, so the browser would block it outright.
   *  - Apps Script can never set an HTTP status code; every reply is 200. The
   *    real outcome is the `ok` field in the body, so checking response.ok
   *    would report failures as successes.
   */
  async function ulfSubmit(type, payload) {
    const url = endpoint();
    if (!url) throw new Error('Submissions are not configured yet. Set submissionEndpoint in assets/js/config.js.');

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ type: type, payload: payload })
      });
    } catch (error) {
      throw new Error('No connection to the submission service. Please check your network and try again.');
    }

    let body = null;
    try { body = await response.json(); } catch (error) { /* fall through */ }
    if (!body) throw new Error('The submission service returned an unreadable response. Please try again.');
    if (body.ok !== true) throw new Error(body.error || 'The submission was not recorded. Please try again.');
    return body.result || {};
  }

  window.ulfSubmit = ulfSubmit;
  window.ulfSubmitConfigured = function () { return Boolean(endpoint()); };
}());
