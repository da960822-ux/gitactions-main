/** Original, short brass-and-bell fanfare; the graph exists only after the sound button is pressed. */
export function createFinaleAudio(){
 let context:AudioContext|undefined,master:GainNode|undefined,enabled=false,disposed=false,generation=0;
 const voices=new Set<OscillatorNode>();
 const stop=()=>{for(const voice of voices){try{voice.stop();}catch{/* Already ended. */}}voices.clear();};
 const visibility=()=>{if(!context)return;if(document.hidden){stop();void context.suspend().catch(()=>{});}else if(enabled)void context.resume().catch(()=>{});};
 document.addEventListener('visibilitychange',visibility);
 return{
  async enable(){
   const request=++generation;
   if(disposed)return false;
   try{
    if(!context){
     const Constructor=window.AudioContext??(window as Window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
     if(!Constructor)return false;
     context=new Constructor();master=context.createGain();master.gain.value=.4;master.connect(context.destination);
    }
    await context.resume();
    if(disposed||request!==generation)return false;
    enabled=context.state==='running';return enabled;
   }catch{return false;}
  },
  play(){
   if(disposed||!enabled||!context||!master||context.state!=='running'||document.hidden)return;
   const now=context.currentTime;stop();
   const notes=[0,0,7,12,16,19,24];
   notes.forEach((note,index)=>{
    const oscillator=context!.createOscillator(),gain=context!.createGain(),start=now+index*.14,duration=index===notes.length-1?.65:.22;
    oscillator.type=index===notes.length-1?'triangle':'sawtooth';
    oscillator.frequency.setValueAtTime(261.63*2**(note/12),start);
    gain.gain.setValueAtTime(.0001,start);gain.gain.linearRampToValueAtTime(.18,start+.025);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    oscillator.connect(gain);gain.connect(master!);voices.add(oscillator);
    oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
    oscillator.start(start);oscillator.stop(start+duration+.01);
   });
  },
  disable(){enabled=false;generation++;stop();if(context)void context.suspend().catch(()=>{});},
  dispose(){if(disposed)return;disposed=true;enabled=false;generation++;stop();document.removeEventListener('visibilitychange',visibility);master?.disconnect();if(context)void context.close().catch(()=>{});},
 };
}
