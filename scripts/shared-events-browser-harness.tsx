import { createRoot } from 'react-dom/client';
import { PostHeroPreview } from '../post-hero-preview/src/PostHeroPreview';
import '../post-hero-preview/src/preview.css';

// The actual product controls, network client and letter controller, with the expensive WebGL renderer omitted.
createRoot(document.getElementById('root')!).render(<PostHeroPreview renderScene={false}/>);
