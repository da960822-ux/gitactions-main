import { createRoot } from 'react-dom/client';
import { PostHeroPreview } from '../src/landing/story/PostHeroPreview';
import '../src/landing/story/preview.css';

// The actual product controls, network client and letter controller, with the expensive WebGL renderer omitted.
createRoot(document.getElementById('root')!).render(<PostHeroPreview renderScene={false}/>);
