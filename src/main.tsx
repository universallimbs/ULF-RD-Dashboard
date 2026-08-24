import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import AsanaProjectView from './components/AsanaProjectView';

const rootElement = document.getElementById('asana-react-root');
if (rootElement) {
  document.body.classList.add('react-ready');
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <AsanaProjectView />
    </React.StrictMode>
  );
}
