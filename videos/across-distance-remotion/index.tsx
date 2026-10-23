import {Composition, registerRoot} from 'remotion';
import {GiftIntro} from './GiftIntro';
const Root=()=> <Composition id="GiftIntro" component={GiftIntro} width={1920} height={1080} fps={30} durationInFrames={108}/>;
registerRoot(Root);
