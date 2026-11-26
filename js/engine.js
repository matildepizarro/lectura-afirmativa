// Motor avanzado de voz: SwiftF0 (tono y voz con tono) + Silero VAD, ambos con ONNX Runtime Web (WASM, sin servidor).
// SwiftF0 (c) Lars Nieradzik, MIT · Silero VAD (c) Silero Team, MIT · ONNX Runtime Web 1.22.0
const ORT='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/',HOP=256,LEFT=11,LOOK=4,FMIN=60,FMAX=450;
const cat=(a,b)=>{const r=new Float32Array(a.length+b.length);r.set(a);r.set(b,a.length);return r};
export class Engine{
 constructor(ort,sw,sv){this.ort=ort;this.sw=sw;this.sv=sv;this.reset()}
 reset(){this.b=new Float32Array(0);this.base=0;this.em=0;this.vb=new Float32Array(0);this.cx=new Float32Array(64);this.st=new Float32Array(256);this.vn=0;this.speech=false;this.n=0;this.out={f:[],v:[]};this.q=Promise.resolve();this.pend=0}
 push(c,ta){this.n+=c.length;this.b=cat(this.b,c);this.vb=cat(this.vb,c);if(this.pend>6)return;const N=this.n;this.pend++;this.q=this.q.then(()=>this.step(ta,N)).catch(e=>console.warn('Adv',e)).then(()=>{this.pend--})}
 async step(ta,N){const T=this.ort.Tensor,tm=s=>ta-(N-s)/16,avail=this.base+Math.floor(this.b.length/HOP),last=avail-LOOK,first=this.em;
  if(last>first){const left=Math.max(this.base,first-LEFT),w=this.b.slice((left-this.base)*HOP,avail*HOP);
   const o=await this.sw.run({audio:new T('float32',w,[1,w.length]),fmin:new T('float32',Float32Array.of(FMIN),[]),fmax:new T('float32',Float32Array.of(FMAX),[])}),P=o.pitch.data,C=o.confidence.data;
   for(let k=first;k<last;k++){const j=k-left;let pk=0;for(let i=0;i<HOP;i++)pk=Math.max(pk,Math.abs(w[j*HOP+i]));this.out.f.push({t:tm(k*HOP+HOP/2),f:Number(P[j]),c:pk<1e-3?0:C[j]})}
   this.em=last;const nb=Math.max(this.base,last-LEFT);if(nb>this.base){this.b=this.b.slice((nb-this.base)*HOP);this.base=nb}}
  while(this.vb.length>=512){const x=new Float32Array(576);x.set(this.cx);x.set(this.vb.subarray(0,512),64);this.cx=x.slice(512);this.vb=this.vb.slice(512);
   const o=await this.sv.run({input:new T('float32',x,[1,576]),state:new T('float32',this.st,[2,1,128]),sr:new T('int64',BigInt64Array.of(16000n),[])});
   this.st=Float32Array.from(o.stateN.data);const p=o.output.data[0];if(p>=.5)this.speech=true;else if(p<.35)this.speech=false;
   this.out.v.push({t:tm(this.vn+256),p,s:this.speech});this.vn+=512}}
 drain(){const o=this.out;this.out={f:[],v:[]};return o}}
if(typeof window!=='undefined'){let eng=null,node,zg;
 window.Adv={on:false,get speech(){return eng?eng.speech:false},
  async load(onp){if(eng)return;const ort=await import(ORT+'ort.wasm.min.mjs');ort.env.wasm.wasmPaths=ORT;ort.env.wasm.numThreads=1;
   const get=async u=>{const r=await fetch(u);if(!r.ok)throw new Error('no se pudo descargar '+u);return new Uint8Array(await r.arrayBuffer())},o={executionProviders:['wasm']};
   onp(10);const a=await get('models/swiftf0.onnx');onp(40);const b=await get('models/silero_vad.onnx');onp(70);
   eng=new Engine(ort,await ort.InferenceSession.create(a,o),await ort.InferenceSession.create(b,o));onp(100)},
  async start(stream,ac,from){this.stop();await ac.audioWorklet.addModule('js/pcm-worklet.js');eng.reset();const r=ac.sampleRate/16000;let pos=0,last=0,acc=[];
   node=new AudioWorkletNode(ac,'pcm');(from||ac.createMediaStreamSource(stream)).connect(node);zg=ac.createGain();zg.gain.value=0;node.connect(zg);zg.connect(ac.destination);
   node.port.onmessage=e=>{const c=e.data,a=new Float32Array(c.length+1);a[0]=last;a.set(c,1);last=c[c.length-1];while(pos<a.length-1){const i=pos|0,f=pos-i;acc.push(a[i]*(1-f)+a[i+1]*f);pos+=r}pos-=c.length;if(acc.length>=256){eng.push(Float32Array.from(acc),performance.now());acc=[]}};this.on=true},
  drain(){return eng&&this.on?eng.drain():{f:[],v:[]}},
  stop(){this.on=false;try{node&&node.disconnect();zg&&zg.disconnect()}catch{}node=zg=null}}}
