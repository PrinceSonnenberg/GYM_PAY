
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './components/ThemeProvider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <DataProvider>
      <HashRouter>
        <ThemeProvider><App /></ThemeProvider>
      </HashRouter>
    </DataProvider>
  </React.StrictMode>
);
