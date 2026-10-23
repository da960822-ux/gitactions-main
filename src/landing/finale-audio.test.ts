import {afterEach,expect,it,vi} from 'vitest';
import {createFinaleAudio} from './finale-audio';
afterEach(()=>vi.unstubAllGlobals());
function fixture(){
 const voices:{start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>}[]=[],listeners=new Map<string,()=>void>();
 const gain=()=>({gain:{value:0,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()},connect:vi.fn(),disconnect:vi.fn()});
 const context={state:'suspended',currentTime:0,destination:{},createGain:vi.fn(gain),createOscillator:vi.fn(()=>{const o={type:'',frequency:{setValueAtTime:vi.fn()},connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),onended:null};voices.push(o);return o;}),resume:vi.fn(async()=>{context.state='running';}),suspend:vi.fn(async()=>{context.state='suspended';}),close:vi.fn(async()=>{context.state='closed';})};
 const Constructor=vi.fn(function(){return context;});
 vi.stubGlobal('window',{AudioContext:Constructor});
 vi.stubGlobal('document',{hidden:false,addEventListener:(name:string,fn:()=>void)=>listeners.set(name,fn),removeEventListener:(name:string)=>listeners.delete(name)});
 return{audio:createFinaleAudio(),context,voices,listeners,Constructor};
}
it('requires an explicit gesture, bounds the final fanfare and replaces a replay',async()=>{
 const f=fixture();f.audio.play();expect(f.Constructor).not.toHaveBeenCalled();
 expect(await f.audio.enable()).toBe(true);f.audio.play();expect(f.voices).toHaveLength(7);
 f.audio.play();expect(f.voices).toHaveLength(14);
 f.context.currentTime=2;f.audio.play();expect(f.voices).toHaveLength(21);
 for(const voice of f.voices){expect(voice.start.mock.calls[0][0]).toBeGreaterThanOrEqual(0);expect(voice.stop.mock.calls[0][0]).toBeLessThan(4);}
 f.audio.disable();const count=f.voices.length;f.audio.play();expect(f.voices).toHaveLength(count);f.audio.dispose();
});
it('stops sound when hidden and releases its graph once',async()=>{
 const f=fixture();await f.audio.enable();f.audio.play();
 Object.assign(document,{hidden:true});f.listeners.get('visibilitychange')!();expect(f.context.suspend).toHaveBeenCalled();
 f.audio.play();expect(f.voices).toHaveLength(7);f.audio.dispose();f.audio.dispose();expect(f.context.close).toHaveBeenCalledTimes(1);expect(f.listeners.size).toBe(0);
});
it('degrades silently when Web Audio is unavailable',async()=>{
 vi.stubGlobal('document',{addEventListener:vi.fn(),removeEventListener:vi.fn()});vi.stubGlobal('window',{});
 const audio=createFinaleAudio();expect(await audio.enable()).toBe(false);audio.play();audio.dispose();
});
