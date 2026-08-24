// Optional local preview server.
//
// The dashboard is a static site again: both forms POST straight to the Apps
// Script web app, so nothing here needs hosting and there are no /api routes to
// proxy. This exists only so `npm start` gives you the same pretty URLs as
// production (/ and /survey). Any static file server works instead.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8000;

// Never hand out project internals just because they sit in the repo root.
const BLOCKED = [/^\/\./, /^\/src\//, /^\/node_modules\//, /\.(gs|ts|tsx|json|lock|md|mdc)$/i];

app.use((req, res, next) => {
  if (BLOCKED.some(pattern => pattern.test(req.path))) return res.status(404).send('Not found');
  next();
});

app.use(express.static(__dirname, { dotfiles: 'deny', index: false }));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/survey', (req, res) => res.sendFile(path.join(__dirname, 'prosthetic-user-survey.html')));

app.listen(PORT, () => console.log(`Preview at http://localhost:${PORT}/`));
