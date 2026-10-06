import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@fontsource-variable/bricolage-grotesque';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          offset={20}
          toastOptions={{
            classNames: {
              toast: '!rounded-2xl !border !border-line !bg-paper !text-ink-900 !shadow-lift !font-sans',
              title: '!text-[13px] !font-semibold',
              description: '!text-[12.5px] !text-ink-500',
              actionButton: '!bg-ink-900 !rounded-full',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
