import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LandingPreview } from './LandingPreview';
import './preview.css';
createRoot(document.getElementById('preview-root')!).render(<StrictMode><LandingPreview /></StrictMode>);
