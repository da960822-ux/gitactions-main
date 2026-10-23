import React from 'react';
import { createRoot } from 'react-dom/client';
import { PostHeroPreview } from './PostHeroPreview';
import './preview.css';
document.body.style.margin='0';
createRoot(document.getElementById('root')!).render(<React.StrictMode><PostHeroPreview /></React.StrictMode>);
