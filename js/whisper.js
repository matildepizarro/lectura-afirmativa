// Whisper local con Transformers.js (WebGPU si existe, si no WASM). Actualiza la versión si hace falta.
const TF='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2';
let asr=null,cur='',node,src,timer,buf=[],busy=false,pos=0,last=0;
window.Whisper={
 async load(model,onp){if(asr&&cur===model)return;const{pipeline}=await import(TF),gpu=!!navigator.gpu;
  asr=await pipeline('automatic-speech-recognition',model,{device:gpu?'webgpu':'wasm',dtype:gpu?{encoder_model:'fp32',decoder_model_merged:'q4'}:'q8',
   progress_callback:p=>{if(p.status==='progress')onp(Math.round(p.progress))}});cur=model},
 async start(stream,lang,cb,ac){this.stop();await ac.audioWorklet.addModule('js/pcm-worklet.js');
  const r=ac.sampleRate/16000;buf=[];pos=0;last=0;src=ac.createMediaStreamSource(stream);node=new AudioWorkletNode(ac,'pcm');src.connect(node);
  node.port.onmessage=e=>{const c=e.data,a=new Float32Array(c.length+1);a[0]=last;a.set(c,1);last=c[c.length-1];
   while(pos<a.length-1){const i=pos|0,f=pos-i;buf.push(a[i]*(1-f)+a[i+1]*f);pos+=r}pos-=c.length;if(buf.length>16000*6)buf.splice(0,buf.length-16000*5)};
  timer=setInterval(async()=>{if(busy||!asr||buf.length<8000)return;const w=Float32Array.from(buf.slice(-16000*5));let s=0;const t=w.slice(-8000);for(const v of t)s+=v*v;
   if(Math.sqrt(s/t.length)<.008)return;busy=true;try{const o=await asr(w,{language:lang,task:'transcribe'});cb(o.text.trim().split(/\s+/))}catch(x){console.warn(x)}busy=false},900)},
 stop(){clearInterval(timer);try{node&&node.disconnect();src&&src.disconnect()}catch{}node=src=null}};
