import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Default CRA import
import App from './App';
import reportWebVitals from './reportWebVitals'; // Default CRA import

// Main application root
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Stagewise toolbar integration (development only)
if (process.env.NODE_ENV === 'development') {
  try {
    // Import the toolbar dynamically to prevent inclusion in production builds
    import('@stagewise/toolbar-react').then(({ StagewiseToolbar }) => {
      // Create configuration
      const stagewiseConfig = {
        plugins: []
      };

      // Create a separate container for the toolbar
      const toolbarContainer = document.createElement('div');
      toolbarContainer.id = 'stagewise-toolbar-root';
      document.body.appendChild(toolbarContainer);

      // Create a separate React root for the toolbar
      const toolbarRoot = ReactDOM.createRoot(toolbarContainer);
      toolbarRoot.render(<StagewiseToolbar config={stagewiseConfig} />);
    });
  } catch (error) {
    console.error('Failed to initialize Stagewise toolbar:', error);
  }
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 