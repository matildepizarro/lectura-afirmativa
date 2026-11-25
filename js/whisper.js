// Whisper local con Transformers.js (WebGPU si existe, si no WASM). Actualiza la versión si hace falta.
const TF='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2';
let asr=null,cur='',node,src,zg,timer,buf=[],busy=false,pos=0,last=0,lg='spanish',cbk=null,dirty=false;
async function dec(force){if(busy||!asr||buf.length<8000)return null;const W=Float32Array.from(buf.slice(-16000*5));
 if(!force){let s=0;const t=W.slice(-24000);for(const v of t)s+=v*v;if(Math.sqrt(s/t.length)<.002){if(!dirty)return null;dirty=false}else dirty=true}
 busy=true;try{let st=-1;for(let i=0;i+1600<=W.length;i+=1600){let q=0;for(let j=i;j<i+1600;j++)q+=W[j]*W[j];if(Math.sqrt(q/1600)>.0015){st=Math.max(0,i-3200);break}}
  if(st<0)return null;const w=W.slice(st);if(w.length<6400)return null;let pk=0;for(const v of w)pk=Math.max(pk,Math.abs(v));if(pk>0){const k=Math.min(30,.9/pk);for(let i=0;i<w.length;i++)w[i]*=k}
  const o=await asr(w,{language:lg,task:'transcribe'}),tx=o.text.replace(/[\[\(].*?[\]\)]/g,' ').trim();return tx?tx.split(/\s+/):null}catch(x){console.warn(x);return null}finally{busy=false}}
window.Whisper={
 async load(model,onp){if(asr&&cur===model)return;const{pipeline}=await import(TF),gpu=!!navigator.gpu;
  asr=await pipeline('automatic-speech-recognition',model,{device:gpu?'webgpu':'wasm',dtype:gpu?{encoder_model:'fp32',decoder_model_merged:'q4'}:'q8',
   progress_callback:p=>{if(p.status==='progress')onp(Math.round(p.progress))}});cur=model},
 async start(stream,lang,cb,ac){this.stop();lg=lang;cbk=cb;dirty=false;await ac.audioWorklet.addModule('js/pcm-worklet.js');
  const r=ac.sampleRate/16000;buf=[];pos=0;last=0;src=ac.createMediaStreamSource(stream);node=new AudioWorkletNode(ac,'pcm');src.connect(node);zg=ac.createGain();zg.gain.value=0;node.connect(zg);zg.connect(ac.destination);
  node.port.onmessage=e=>{const c=e.data,a=new Float32Array(c.length+1);a[0]=last;a.set(c,1);last=c[c.length-1];
   while(pos<a.length-1){const i=pos|0,f=pos-i;buf.push(a[i]*(1-f)+a[i+1]*f);pos+=r}pos-=c.length;if(buf.length>16000*6)buf.splice(0,buf.length-16000*5)};
  timer=setInterval(async()=>{const x=await dec(false);if(x&&cbk)cbk(x)},700)},
 async flush(){for(let i=0;i<60&&busy;i++)await new Promise(r=>setTimeout(r,250));return await dec(true)},
 stop(){clearInterval(timer);try{node&&node.disconnect();src&&src.disconnect();zg&&zg.disconnect()}catch{}node=src=zg=null}};
