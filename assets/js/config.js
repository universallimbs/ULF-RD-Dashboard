// ULF R&D Dashboard — front-end configuration.
//
// submissionEndpoint is the /exec URL of the Apps Script web app in
// google-apps-script.gs (Deploy -> New deployment -> Web app -> copy the URL).
// It is a public URL by design: the browser only ever sends a reviewer *id*,
// and Apps Script resolves that to a real address on its own side.
//
// googleClientId is the OAuth Web client ID from Google Cloud Console
// (Credentials -> the "ULF Dashboard Web" client). It is not a secret — an
// OAuth client ID is designed to be visible in client-side code, the same way
// this file is already public — it must just match GOOGLE_CLIENT_ID in the
// Apps Script's script properties, or token verification there will fail.
//
// Leave either empty and the dashboard will say so plainly instead of failing silently.
window.ULF_CONFIG = {
  submissionEndpoint: 'https://script.google.com/macros/s/AKfycbwPz09TJNL1LdCM-w82CDAHeQZgyNWnmpRkvanF8_NmgwEN86Ypj_ue1_FFvAMe4S4pgA/exec',
  googleClientId: '68022485034-00kbdjtg3q2te8h7edu5kji0n929kljl.apps.googleusercontent.com'
};
