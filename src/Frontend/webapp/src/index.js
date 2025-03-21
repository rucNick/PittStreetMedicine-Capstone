import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { performKeyExchange } from './security/ecdhClient';

// Create a loading overlay instead of replacing the entire body
const loadingOverlay = document.createElement('div');
loadingOverlay.id = 'security-loading-overlay';
loadingOverlay.style.position = 'fixed';
loadingOverlay.style.top = '0';
loadingOverlay.style.left = '0';
loadingOverlay.style.width = '100%';
loadingOverlay.style.height = '100%';
loadingOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
loadingOverlay.style.display = 'flex';
loadingOverlay.style.justifyContent = 'center';
loadingOverlay.style.alignItems = 'center';
loadingOverlay.style.zIndex = '9999';
loadingOverlay.style.fontFamily = 'Arial, sans-serif';

loadingOverlay.innerHTML = `
  <div style="text-align: center; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
    <h2>Establishing secure connection...</h2>
    <div style="
      width: 40px;
      height: 40px;
      margin: 20px auto;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    "></div>
    <p>Please wait while we set up encryption.</p>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </div>
`;

// Add the overlay to the body without replacing existing content
document.body.appendChild(loadingOverlay);

// Initialize ECDH before rendering the app
console.log('Initializing secure connection before starting the app...');
performKeyExchange()
  .then(result => {
    console.log('Security initialization complete. Rendering app...');
    
    // Store the session ID in localStorage for future use
    if (result.success) {
      localStorage.setItem('ecdh_session_id', result.sessionId);
    }
    
    // Remove the loading overlay
    document.body.removeChild(loadingOverlay);
    
    // Render the app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <App securityInitialized={result.success} />
      </React.StrictMode>
    );
    
    reportWebVitals();
  })
  .catch(error => {
    console.error('Fatal error during security initialization:', error);
    
    // Remove the loading overlay
    if (document.body.contains(loadingOverlay)) {
      document.body.removeChild(loadingOverlay);
    }
    
    // Create error message overlay
    const errorOverlay = document.createElement('div');
    errorOverlay.style.position = 'fixed';
    errorOverlay.style.top = '0';
    errorOverlay.style.left = '0';
    errorOverlay.style.width = '100%';
    errorOverlay.style.height = '100%';
    errorOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    errorOverlay.style.display = 'flex';
    errorOverlay.style.justifyContent = 'center';
    errorOverlay.style.alignItems = 'center';
    errorOverlay.style.zIndex = '9999';
    errorOverlay.style.fontFamily = 'Arial, sans-serif';
    
    errorOverlay.innerHTML = `
      <div style="text-align: center; padding: 30px; background-color: white; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); max-width: 500px;">
        <h2 style="color: #e74c3c; margin-top: 0;">Security Error</h2>
        <p>Failed to establish a secure connection.</p>
        <p style="background-color: #f8d7da; padding: 10px; border-radius: 4px; margin: 20px 0; color: #721c24;">
          ${error.message || 'Unknown error'}
        </p>
        <button onclick="window.location.reload()" style="
          padding: 10px 20px;
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        ">Retry</button>
      </div>
    `;
    
    // Add the error overlay to the body
    document.body.appendChild(errorOverlay);
    
    // Still try to render the app with securityInitialized=false
    try {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(
        <React.StrictMode>
          <App securityInitialized={false} />
        </React.StrictMode>
      );
    } catch (renderError) {
      console.error('Failed to render app after security error:', renderError);
    }
  });