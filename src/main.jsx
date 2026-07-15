import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { RoleContextProvider } from './context/RoleContext.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <RoleContextProvider>
        <App />
      </RoleContextProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
