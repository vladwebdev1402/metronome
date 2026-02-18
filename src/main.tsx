import { createRoot } from 'react-dom/client';
import { appStarted } from 'app/model';
import { App } from './app';

appStarted();

createRoot(document.getElementById('root')!).render(<App />);
