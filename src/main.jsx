import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
// Import the main scanner component
import App from './SolanaScanner.jsx';
import './index.css';

// Mount the React application into the #root element
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>,
);
