// ULF R&D Dashboard — front-end configuration.
//
// submissionEndpoint is the /exec URL of the Apps Script web app in
// google-apps-script.gs (Deploy -> New deployment -> Web app -> copy the URL).
// It is a public URL by design: the browser only ever sends a reviewer *id*,
// and Apps Script resolves that to a real address on its own side.
//
// Leave it empty and both forms will say so plainly instead of failing silently.
window.ULF_CONFIG = {
  submissionEndpoint: ''
};
