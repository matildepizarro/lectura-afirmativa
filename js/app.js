
const $=s=>document.querySelector(s),el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
let LV={},fr=[],WT=null,fp=0,curP=null,lastF=0,an2,b2,gU=.01,nf=0,vp=0;
const S={lv:'palabras',ix:0,tm:69+12*Math.log2(Math.sqrt(180*220)/440),range:6*Math.log2(220/180),sens:6,floor:.002,run:false};
const NN=['Do','Do♯','Re','Re♯','Mi','Fa','Fa♯','Sol','Sol♯','La','La♯','Si'];
const nm=m=>NN[m%12]+(Math.floor(m/12)-1),fq=m=>440*2**((m-69)/12);
let ctx,stream,an,buf,raf,words=[],cw=0,cs=0,rec,sess=0,hold,cal=null,hist=[],lastV=0,gate=.012,gN,flat=[],wst=[],g=0,armed=true,trace=[],wordT=[],t0=0,bad=0,test=null,tests=[],P={dip:.62,rise:1.3,gap:110,sil:350},det;
const AC=()=>{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();if(ctx.state=='suspended')ctx.resume();return ctx};
// ---- silabeo
const V='aeiouáéíóúü',INS=['pl','pr','bl','br','fl','fr','cl','cr','gl','gr','tr','dr','ch','ll','rr','kr','kl'];
function syl(w){const l=w.toLowerCase(),isV=k=>(V.includes(l[k])||(l[k]=='y'&&k>0&&k==l.length-1))&&!(l[k]=='u'&&(l[k-1]=='q'||(l[k-1]=='g'&&'eiéí'.includes(l[k+1]||'')))),wk=c=>'iuüy'.includes(c);
 const nu=[];let i=0;while(i<l.length){if(isV(i)){const s=i++;while(i<l.length&&isV(i)){const a=l[i-1],b=l[i];if((wk(a)||wk(b))&&a!=b)i++;else break}nu.push([s,i])}else i++}
 if(nu.length<2)return[w];const cuts=[0];
 for(let j=0;j<nu.length-1;j++){const e=nu[j][1],c=l.slice(e,nu[j+1][0]),n=c.length;cuts.push(e+(n<=1?0:n==2?(INS.includes(c)?0:1):n==3?(INS.includes(c.slice(1))?1:2):2))}
 cuts.push(w.length);return cuts.slice(1).map((e,k)=>w.slice(cuts[k],e)).filter(Boolean)}
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/h/g,'').replace(/v/g,'b').replace(/z/g,'s').replace(/c([ei])/g,'s$1').replace(/qu/g,'k').replace(/c/g,'k').replace(/ll/g,'y').replace(/rr/g,'r').replace(/g([ei])/g,'j$1').replace(/w/g,'u').replace(/[^a-zñ0-9]/g,'').replace(/([aeiou])d([aeiou])/g,'$1$2').replace(/([aeiou])d$/,'$1').replace(/s$/,'');
const stress=(w,sy)=>{if(sy.length<2)return 0;const i=sy.findIndex(s=>/[áéíóú]/i.test(s));if(i>=0)return i;return /[aeiouns]$/i.test(w)?sy.length-2:sy.length-1};
class Det{constructor(p){this.p=p;this.reset()}reset(){this.env=0;this.pk=0;this.dip=false;this.vl=0;this.last=-1e9;this.lv=-1e9;this.arm=true}
 push(t,rms,gate){const p=this.p;this.env=this.env*.6+rms*.4;const e=this.env,v=rms>gate;if(v)this.lv=t;if(e>this.pk)this.pk=e;else this.pk*=.99;
  if(!this.dip&&this.pk>gate*1.4&&e<this.pk*p.dip){this.dip=true;this.vl=e}
  if(this.dip){this.vl=Math.min(this.vl,e);if(e>this.vl*p.rise+gate*.15&&e>gate&&t-this.last>p.gap){this.dip=false;this.pk=e;this.last=t;return true}}
  if(t-this.lv>p.sil){this.dip=false;this.pk=0;this.arm=true}
  if(this.arm&&v&&e>gate){this.arm=false;this.last=t;return true}return false}}
det=new Det(P);
function lev(a,b){const d=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]==b[j-1]?0:1));p=t}}return d[b.length]}
const sim=(a,b)=>!b||a==b||lev(a,b)<=Math.floor(Math.max(a.length,b.length)/3)||(Math.min(a.length,b.length)>=3&&(a.startsWith(b)||b.startsWith(a)));
// ---- UI nivel/lectura
function tabs(){const t=$('#tabs');t.innerHTML='';for(const k in LV){const b=el('button','tab'+(k==S.lv?' on':''),LV[k].t);b.onclick=()=>{stop();S.lv=k;S.ix=0;tabs();items()};t.append(b)}$('#desc').textContent=LV[S.lv].d}
function items(){const c=$('#chips');c.innerHTML='';LV[S.lv].i.forEach((it,n)=>{const b=el('button','chip'+(n==S.ix?' on':''),it.x);b.onclick=()=>{stop();S.ix=n;items()};c.append(b)});load()}
function load(){const it=LV[S.lv].i[S.ix],R=$('#reader');const nw=it.x.trim().split(/\s+/).length;R.className=S.lv=='mios'?(nw<=1?'big':nw<=8?'mid':'txt'):LV[S.lv].c;R.innerHTML='';$('#sum').classList.add('hid');$('#hd').textContent='';
 const tg=$('#tag');tg.classList.toggle('hid',!it.g);tg.textContent=it.g||'';
 words=it.x.split(/\s+/).map(w=>{const m=w.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u),c0=m[2]||w,sy=c0.includes('-')?c0.split('-').filter(Boolean):syl(c0),core=c0.includes('-')?sy.join(''):c0;return{pre:m[1],post:m[3],sy,st:stress(core,sy),n:norm(core),d:sy.map(()=>[]),e:[]}});
 flat=[];words.forEach((w,wi)=>{wst[wi]=flat.length;const ws=el('span','w');if(w.pre)ws.append(w.pre);w.sy.forEach((s,si)=>{const e=el('span','s'+(w.sy.length>1&&si==w.st?' st':''),s);w.e.push(e);flat.push([wi,si]);ws.append(e)});if(w.post)ws.append(w.post);ws.onclick=()=>jump(wi);R.append(ws,' ')});
 g=0;armed=true;trace=[];fr=[];fp=0;WT=null;wordT=[];t0=performance.now();det.reset();setCur(0,0)}
function setCur(w,s){document.querySelectorAll('.s.act').forEach(e=>e.classList.remove('act'));cw=w;cs=s;if(w<words.length){const e=words[w].e[s];e.classList.add('act');if(S.run)e.scrollIntoView({block:'nearest',behavior:'smooth'})}}
const med=a=>{const b=[...a].sort((x,y)=>x-y);return b[b.length>>1]};
const cls=(a)=>{if(a.length<3)return'';const st=12*Math.log2(med(a)/fq(S.tm));return Math.abs(st)<=S.range?'ok':st<0?'lo':'hi'};
function paint(w,s,fin){const e=words[w].e[s];e.classList.remove('ok','lo','hi');const c=cls(words[w].d[s]);if(c)e.classList.add(c);if(fin)e.classList.add('done')}
function goG(n){n=Math.max(g,Math.min(n,flat.length));const k=n-g;if(k>1&&g<flat.length){const[w0,s0]=flat[g],pool=[...words[w0].d[s0]];if(pool.length>=k){const z=Math.floor(pool.length/k);for(let i=0;i<k;i++){const[w,s]=flat[g+i];words[w].d[s]=pool.slice(i*z,i==k-1?undefined:(i+1)*z)}}}for(let i=g;i<n;i++){const[w,s]=flat[i];paint(w,s,1);if(wordT[w]==null)wordT[w]=performance.now()-t0}g=n;if(n>=flat.length){setCur(words.length,0);finish()}else{const[w,s]=flat[n];if(wordT[w]==null)wordT[w]=performance.now()-t0;setCur(w,s)}}
function advance(to){goG(to<words.length?wst[to]:flat.length)}
function jump(w){if(rec&&S.run){try{rec.abort()}catch{}}sess=w;words.forEach((x,i)=>x.e.forEach(e=>{if(i>=w)e.classList.remove('done','ok','lo','hi')}));g=wst[w];armed=true;det.reset();setCur(w,0)}
// ---- audio
const micErr=e=>({NotAllowedError:'El permiso del micrófono está bloqueado. Toca el candado junto a la dirección, permite el micrófono y recarga la página.',NotFoundError:'No encuentro ningún micrófono conectado.',NotReadableError:'Otra aplicación está usando el micrófono. Ciérrala e inténtalo de nuevo.',SecurityError:'El navegador bloqueó el micrófono. Abre la página directamente con su dirección https://, sin vistas previas ni marcos.'}[e&&e.name]||'No pude acceder al micrófono ('+((e&&e.name)||'error')+').');
async function openMic(){stop(1);const id=$('#dev').value,au={echoCancellation:false,noiseSuppression:$('#ns2').checked,autoGainControl:false};
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){msg('Este navegador no permite usar el micrófono aquí. Abre la página con https:// en Chrome, Edge, Firefox o Safari.');return false}
 const get=a=>navigator.mediaDevices.getUserMedia({audio:a});
 try{try{stream=await get(id&&id!='def'?{...au,deviceId:{exact:id}}:au)}catch(e){if(e.name=='OverconstrainedError'||e.name=='NotFoundError')stream=await get(au);else throw e}}catch(e){console.warn(e);msg(micErr(e));return false}
 AC();const src=ctx.createMediaStreamSource(stream);gN=ctx.createGain();gN.gain.value=+$('#gain').value;an=ctx.createAnalyser();an.fftSize=2048;src.connect(gN);gN.connect(an);buf=new Float32Array(2048);const hp=ctx.createBiquadFilter(),lp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=80;lp.type='lowpass';lp.frequency.value=4000;an2=ctx.createAnalyser();an2.fftSize=2048;b2=new Float32Array(2048);gN.connect(hp);hp.connect(lp);lp.connect(an2);cancelAnimationFrame(raf);loop();if(S.adv)advStart();await devs();return true}
async function devs(){const cur=$('#dev').value,l=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind=='audioinput'),s=$('#dev');s.innerHTML='';{const o0=el('option','','Predeterminado');o0.value='';s.append(o0)}l.forEach((d,i)=>{const o=el('option','',d.label||'Micrófono '+(i+1));o.value=d.deviceId;s.append(o)});if(cur&&l.some(d=>d.deviceId==cur))s.value=cur}
function detect(b,sr,th=.15){const n=b.length,mx=Math.min(Math.floor(sr/75),n>>1),mn=Math.floor(sr/450),d=new Float32Array(mx+2);
 for(let t=1;t<=mx;t++){let s=0;for(let i=0;i<n-mx;i++){const x=b[i]-b[i+t];s+=x*x}d[t]=s}
 let run=0;for(let t=1;t<=mx;t++){run+=d[t];d[t]=d[t]*t/(run||1)}
 for(let t=mn;t<mx;t++)if(d[t]<th){while(t+1<mx&&d[t+1]<d[t])t++;const a=d[t-1],c=d[t+1],sh=(a-c)/(2*(a-2*d[t]+c))||0;return sr/(t+sh)}return-1}
function setGate(){gate=gU=Math.max(.0015,S.floor*(1+(11-S.sens)*.5));$('#gt').style.left=Math.min(1,gate/.15)*100+'%'}
function loop(){raf=requestAnimationFrame(loop);an.getFloatTimeDomainData(buf);an2.getFloatTimeDomainData(b2);let s=0;for(const v of b2)s+=v*v;const rms=Math.sqrt(s/b2.length),now=performance.now();
 $('#lv').style.width=Math.min(1,rms/.15)*100+'%';let f=-1;const A0=!!(window.Adv&&Adv.on);if(A0)for(const p of Adv.drain().f){p.tn=now;curP=p;if(S.run&&fr.length){const tr=p.t-t0;while(fp<fr.length-1&&fr[fp+1][0]<=tr)fp++;if(fr[fp]&&fr[fp][0]<=tr+20)fr[fp][2]=(p.c>=.5&&p.f>=60&&p.f<=450)?p.f:0}}
 const adv=A0&&!(rms>gate*3&&(!curP||now-curP.tn>2500));
 if(cal&&cal.ph=='n')cal.n.push(rms);
 if(adv){const p=curP;if(p&&now-p.tn<90&&p.c>=.5&&p.f>=60&&p.f<=450)f=p.f;if(Adv.speech||rms>gate)lastV=now}
 else if(rms>(cal&&cal.ph=='v'?S.floor*2:gate*(now-lastF<250?.6:1))){f=detect(buf,ctx.sampleRate,now-lastF<250?.3:.15);lastV=now;if(f>0&&hist.length>2&&Math.abs(12*Math.log2(f/med(hist)))>6){if(++bad<4)f=-1;else{bad=0;hist=[]}}else bad=0}
 const vf=f>0;if(vf)lastF=now;const sp=adv?(Adv.speech||rms>gate*3):true,feat0=(vf||now-lastF<180)?rms:rms*.6,feat=sp?feat0:0;if(test)test.tr.push([now-test.t,feat]);nf=nf?(rms<nf?nf*.9+rms*.1:(vf?nf:nf*.995+rms*.005)):rms;if(vf)vp=Math.max(rms,vp*.998);if(!cal)gate=Math.max(nf*2.2,Math.min(gU,vp>0?vp*.4:nf*6));
 if(f>0){hist.push(f);if(hist.length>5)hist.shift();const m=med(hist),st=12*Math.log2(m/fq(S.tm)),mi=Math.round(69+12*Math.log2(m/440));
  $('#nn').textContent=nm(mi);$('#nf').textContent=m.toFixed(0)+' Hz · '+(st>=0?'+':'')+st.toFixed(1)+' st';
  const ok=Math.abs(st)<=S.range;$('#ns').textContent=ok?'En tu rango':st<0?'Más grave':'Más agudo';$('#ns').style.color=ok?'var(--ok)':st<0?'var(--lo)':'var(--hi)';
  const nd=$('#needle');nd.style.opacity=1;nd.style.left=(50+Math.max(-S.sp,Math.min(S.sp,st))/S.sp*50)+'%';
  if(cal&&cal.ph=='v')cal.f.push(m);
  if(S.run&&cw<words.length){words[cw].d[cs].push(m);paint(cw,cs);trace.push([now-t0,st])}}
 else if(now-lastV>350){hist=[];$('#needle').style.opacity=.25;$('#nn').textContent='—';$('#nf').textContent='Sin voz detectada';$('#ns').textContent='—';$('#ns').style.color=''}
 // sílabas por energía
 if(S.run&&cw<words.length){fr.push([now-t0,feat,adv?0:(f>0?med(hist):0),adv?1:0]);if(det.push(now,feat,gate)){if(armed)armed=false;else if(g<flat.length-1&&(!S.strict||flat[g+1][0]==flat[g][0]))goG(g+1)}
  
  
  const lw=words[words.length-1];if(!S.strict&&((g>=flat.length-1&&lw.d[lw.sy.length-1].length>2&&now-lastV>550)||(words.length==1&&now-lastV>700&&words[0].d.reduce((a,x)=>a+x.length,0)>5)))goG(flat.length)}
 if(cal)calTick(now)}
// ---- calibración
function calibrate(){if(!stream){msg('Primero permite el micrófono.');return}cal={ph:'n',t:performance.now(),n:[],f:[]};$('#useC').classList.add('hid');$('#calm').textContent='Silencio 2 segundos…'}
function calTick(now){const dt=now-cal.t;if(cal.ph=='n'&&dt>2000){S.floor=Math.max(.001,cal.n.reduce((a,b)=>a+b,0)/cal.n.length);setGate();cal.ph='v';cal.t=now;$('#calm').textContent='Ahora di “aaa” a un volumen y tono cómodos (3 s)…'}
 else if(cal.ph=='v'&&dt>3000){const f=cal.f;let t='Ruido de ambiente medido. No detecté voz: intenta de nuevo más cerca del micrófono.';
  if(f.length>10){const m=med(f),mi=Math.round(69+12*Math.log2(m/440));t='Tu tono cómodo: '+nm(mi)+' (~'+m.toFixed(0)+' Hz). Umbral ajustado.';const b=$('#useC');b.textContent='Usar '+nm(mi)+' como nota guía';b.classList.remove('hid');b.onclick=()=>{setTarget(mi);b.classList.add('hid')}}
  $('#calm').textContent=t;cal=null}}
// ---- reconocimiento
function startSROld(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){msg('Este navegador no tiene reconocimiento de voz. Usa Chrome o Edge, o avanza con el botón “Palabra”.');return}
 rec=new SR();rec.lang='es-CL';rec.continuous=true;rec.interimResults=true;sess=cw;
 rec.onresult=e=>{const hw=[];for(let i=0;i<e.results.length;i++)hw.push(...e.results[i][0].transcript.trim().split(/\s+/));let p=sess;for(const h of hw){const hn=norm(h);if(!hn)continue;for(let k=p;k<Math.min(p+3,words.length);k++)if(sim(hn,words[k].n)){p=k+1;break}}if(p>cw)advance(p)};
 rec.onend=()=>{if(S.run){sess=cw;try{rec.start()}catch{}}};rec.onerror=e=>{if(e.error=='not-allowed')msg('Permiso de reconocimiento de voz denegado.');else if(S.local&&(e.error=='language-not-supported'||e.error=='service-not-allowed')){S.local=false;$('#loc').checked=false;try{rec.processLocally=false}catch{}msg('El reconocimiento en el dispositivo no está disponible; uso el del navegador.')}else if(e.error=='phrases-not-supported'){try{rec.phrases=[]}catch{}}else if(e.error=='network')msg('El reconocimiento del navegador necesita internet. Prueba Whisper local.')};try{rec.start()}catch{}}
async function start(){if(!stream&&!(await openMic()))return;if(cw>=words.length)load();S.run=true;det.reset();armed=true;$('#go').textContent='■ Detener';$('#go').classList.add('rec');msg('Escuchando… lee a tu ritmo.');startSR()}
function stop(keep){window.Whisper&&Whisper.stop();if(S.run){S.run=false;try{rec&&rec.abort()}catch{}}$('#go').textContent='▶ Comenzar a leer';$('#go').classList.remove('rec');if(!keep){}else{window.Adv&&Adv.stop();cancelAnimationFrame(raf);stream&&stream.getTracks().forEach(t=>t.stop());stream=null}}
function finish(){S.run=false;align();try{rec.abort()}catch{}$('#go').textContent='▶ Comenzar a leer';$('#go').classList.remove('rec');msg('¡Terminaste! Mira tu resumen.');drawCv();
 let tot=0,ok=0,lo=[],hi=[];words.forEach(w=>w.sy.forEach((s,i)=>{const c=cls(w.d[i]);if(!c)return;tot++;if(c=='ok')ok++;else(c=='lo'?lo:hi).push(s)}));
 const b=$('#sumb');b.innerHTML='';b.append(el('div','note',tot?Math.round(ok/tot*100)+'% en tu rango':'Sin datos de tono'));b.append(el('div','sub',tot+' sílabas con voz detectada'));
 const grp=(t,a,c)=>{if(!a.length)return;b.append(el('div','sub','\n'+t));const d=el('div','hard');a.forEach(x=>{const p=el('span','pill',x);p.style.color=c;d.append(p)});b.append(d)};
 grp('Sílabas más graves que tu rango','lo'&&lo,'var(--lo)');grp('Sílabas más agudas que tu rango','hi'&&hi,'var(--hi)');
 b.append(el('div','sub','Estas sílabas son pistas para practicar, no errores. Repite despacio y compara.'));$('#sum').classList.remove('hid');if($('#auto').checked&&S.ix<LV[S.lv].i.length-1){msg('Muy bien: '+(tot?Math.round(ok/tot*100)+'% en tu rango. ':'')+'Pasando al siguiente…');setTimeout(()=>{if(!$('#auto').checked||S.run)return;S.ix++;items();start()},2600)}}
const msg=t=>$('#msg').textContent=t;
// ---- alineación final: picos de intensidad en dB con prominencia (de Jong & Wempe 2009); por palabra si Whisper da tiempos
function fit(W,i0,i1){const v=q=>q[3]?q[1]*(q[2]>0?1:.4):q[1],N=W.sy.length,ix=[];for(let i=i0;i<=i1;i++)if(fr[i]&&v(fr[i])>gate*.7)ix.push(i);if(ix.length<Math.max(3,N*2))return;
 const a=ix[0],b=ix[ix.length-1],e=[];for(let i=a;i<=b;i++){let t=0,c=0;for(let k=Math.max(a,i-2);k<=Math.min(b,i+2);k++){t+=v(fr[k]);c++}e.push(20*Math.log10(t/c+1e-6))}
 const top=Math.max(...e),pk=[];for(let i=1;i<e.length-1;i++)if(e[i]>=e[i-1]&&e[i]>e[i+1]&&e[i]>top-25){let lm=e[i],rm=e[i];for(let l=i-1;l>=0&&e[l]<=e[i];l--)lm=Math.min(lm,e[l]);for(let r=i+1;r<e.length&&e[r]<=e[i];r++)rm=Math.min(rm,e[r]);const pr=e[i]-Math.max(lm,rm);if(pr>=1)pk.push([i,pr])}
 pk.sort((x,y)=>y[1]-x[1]);const sel=[];for(const q of pk){if(sel.length>=N)break;if(sel.every(z=>Math.abs(z-q[0])>=4))sel.push(q[0])}
 if(sel.length<Math.ceil(N*.6))return;sel.sort((x,y)=>x-y);const cut=[0];for(let k=0;k<sel.length-1;k++){let m=sel[k];for(let i=sel[k];i<=sel[k+1];i++)if(e[i]<e[m])m=i;cut.push(m)}cut.push(e.length);
 const R=cut.slice(1).map((c,k)=>[cut[k],c]);while(R.length<N){let k=0;R.forEach((r,j)=>{if(r[1]-r[0]>R[k][1]-R[k][0])k=j});const[r0,r1]=R[k],mid=(r0+r1)>>1;R.splice(k,1,[r0,mid],[mid,r1])}
 R.forEach(([r0,r1],si)=>{const d=[];for(let i=r0;i<r1;i++){const m=fr[a+i][2];if(m>0)d.push(m)}W.d[si]=d;paint(words.indexOf(W),si,1)})}
function align(){if(words.length==1){if(fr.length>7)fit(words[0],0,fr.length-1);return}
 if(!WT||!WT.tm)return;let p=0;words.forEach(W=>{for(let j=p;j<WT.tok.length;j++)if(sim(norm(WT.tok[j]),W.n)){p=j+1;const s=WT.tm[j][0]-t0-100,en=WT.tm[j][1]-t0+100;const i0=fr.findIndex(q=>q[0]>=s);let i1=-1;for(let i=fr.length-1;i>=0;i--)if(fr[i][0]<=en){i1=i;break}if(i0>=0&&i1>i0)fit(W,i0,i1);break}})}
// ---- piano
const BANDS={fem:[180,220],masc:[100,140],andro:[150,180]};
function setBand(lo,hi,keep){lo=Math.max(60,Math.min(+lo||180,900));hi=Math.max(lo*1.03,Math.min(+hi||lo*1.2,1000));S.range=Math.max(.25,6*Math.log2(hi/lo));setTarget(69+12*Math.log2(Math.sqrt(lo*hi)/440),keep)}
function setTarget(m,keep){S.tm=m;const r=Math.round(m);S.lo=fq(m-S.range);S.hi=fq(m+S.range);S.sp=Math.max(6,S.range*1.5);if(!keep)$('#band').value='custom';
 $('#tn').textContent=nm(r)+' · '+Math.round(S.lo)+'–'+Math.round(S.hi)+' Hz';$('#lo').value=Math.round(S.lo);$('#hi').value=Math.round(S.hi);$('#range').value=Math.min(6,S.range);
 document.querySelectorAll('#piano [data-m]').forEach(k=>{const d=+k.dataset.m;k.classList.toggle('t',d==r);k.classList.toggle('r',d!=r&&Math.abs(d-m)<=S.range)});
 const w=Math.min(100,S.range/S.sp*100);$('#zone').style.left=50-w/2+'%';$('#zone').style.width=w+'%';$('#rv').textContent='±'+S.range.toFixed(1)+' st';if(hold)holdOff(),holdOn()}
function piano(f){AC();const t=ctx.currentTime;[1,2,3,4].forEach((h,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f*h;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.24/(h**1.3),t+.01);g.gain.exponentialRampToValueAtTime(.0008,t+2.4/(1+i*.4));o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+2.5)})}
function holdOn(){AC();const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=fq(S.tm);g.gain.value=.07;o.connect(g).connect(ctx.destination);o.start();hold={o};$('#hold').textContent='■ Detener guía'}
function holdOff(){if(hold){hold.o.stop();hold=null}$('#hold').textContent='〰 Sostener guía'}
(function(){const p=$('#piano'),W=[0,2,4,5,7,9,11];let wc=0;const bl=[];for(let m=48;m<72;m++){if(W.includes(m%12)){const k=el('button','k',m%12==0?nm(m):'');k.dataset.m=m;k.onclick=()=>{setTarget(m);piano(fq(m))};p.append(k);wc++}else bl.push([m,wc])}
 bl.forEach(([m,w])=>{const k=el('button','bk');k.dataset.m=m;k.style.left=(w/14*100-2.6)+'%';k.onclick=()=>{setTarget(m);piano(fq(m))};p.append(k)})})();
function drawCv(){const c=$('#cv'),x=c.getContext('2d'),W=c.width,H=c.height;x.clearRect(0,0,W,H);if(trace.length<3)return;const T=trace[trace.length-1][0]||1,Y=s=>H/2-Math.max(-8,Math.min(8,s))/8*(H/2-6),X=t=>t/T*(W-10)+5;
 x.fillStyle='rgba(19,163,127,.22)';x.fillRect(0,Y(S.range),W,Y(-S.range)-Y(S.range));x.strokeStyle='rgba(127,120,200,.4)';wordT.forEach(t=>{if(t==null)return;x.beginPath();x.moveTo(X(t),0);x.lineTo(X(t),H);x.stroke()});
 x.lineWidth=2.5;x.strokeStyle='#6d5efc';x.beginPath();let pt=-1e9;trace.forEach(([t,s])=>{if(t-pt>200)x.moveTo(X(t),Y(s));else x.lineTo(X(t),Y(s));pt=t});x.stroke()}
async function localOK(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR||!SR.available)return false;try{const o={langs:[$('#lang').value],processLocally:true},a=await SR.available(o);if(a==='downloadable'&&SR.install)await SR.install(o);return a!=='unavailable'}catch{return false}}
function startSR(){if($('#eng').value=='whisper')return startWhisper();const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){msg('Este navegador no tiene reconocimiento de voz. Usa Chrome o Edge; el seguimiento por audio sigue activo.');return}
 rec=new SR();rec.lang=$('#lang').value;rec.continuous=true;rec.interimResults=true;sess=cw;try{if(S.local&&window.SpeechRecognitionPhrase)rec.phrases=words.slice(0,60).map(w=>new SpeechRecognitionPhrase(w.sy.join(''),6))}catch{}if(S.local){try{rec.processLocally=true}catch{}}
 rec.onresult=e=>{const hw=[];let fin=0;for(let i=0;i<e.results.length;i++){const r=e.results[i];hw.push(...r[0].transcript.trim().split(/\s+/));if(r.isFinal)fin=hw.length}$('#hd').textContent='Escuché: '+hw.join(' ');
  let p=sess,pf=sess;hw.forEach((h,j)=>{const hn=norm(h);if(!hn)return;for(let k=p;k<Math.min(p+3,words.length);k++)if(sim(hn,words[k].n)){p=k+1;if(j<fin)pf=p;break}});
  if(!S.run||!flat.length)return;const cur=flat[Math.min(g,flat.length-1)][0];
  if(pf>cur){armed=false;goG(pf<words.length?wst[pf]:flat.length)}else if(p-1>cur){armed=false;goG(wst[p-1])}
  else if(p>sess&&cur>p+3){g=wst[p+3];det.reset();setCur(...flat[g])}};
 rec.onend=()=>{if(S.run){sess=cw;setTimeout(go,60)}};rec.onerror=e=>{if(e.error=='not-allowed')msg('Permiso de reconocimiento de voz denegado.');else if(S.local&&(e.error=='language-not-supported'||e.error=='service-not-allowed')){S.local=false;$('#loc').checked=false;try{rec.processLocally=false}catch{}msg('El reconocimiento en el dispositivo no está disponible; uso el del navegador.')}else if(e.error=='phrases-not-supported'){try{rec.phrases=[]}catch{}}else if(e.error=='network')msg('El reconocimiento del navegador necesita internet. Prueba Whisper local.')};
 const go=()=>{const t=!S.noTrack&&$('#dev').value&&stream?stream.getAudioTracks()[0]:undefined;try{t?rec.start(t):rec.start()}catch{try{rec.start()}catch{}}};go()}
// ---- prueba previa
const TW=['mañana','valiente','orgullo','bienvenida','respiro','nombre'];let ti=0;
function twUI(){const c=$('#tw');c.innerHTML='';TW.forEach((w,i)=>{const b=el('button','chip'+(i==ti?' on':''),w);b.onclick=()=>{ti=i;twUI()};c.append(b)});$('#twd').textContent=syl(TW[ti]).join(' · ')}
const nucs=(tr,p)=>{const d=new Det(p),o=[];tr.forEach(([t,r])=>{if(d.push(t,r,gate))o.push(t)});return o};
function drawTest(tr,nuc){const c=$('#tc'),x=c.getContext('2d'),W=c.width,H=c.height;x.clearRect(0,0,W,H);if(!tr.length)return;const T=tr[tr.length-1][0],mx=Math.max(.05,...tr.map(a=>a[1]));x.strokeStyle='#6d5efc';x.lineWidth=2;x.beginPath();tr.forEach(([t,r],i)=>{const X=t/T*W,Y=H-4-r/mx*(H-8);i?x.lineTo(X,Y):x.moveTo(X,Y)});x.stroke();x.fillStyle='#ff6fb5';nuc.forEach(t=>{x.beginPath();x.arc(t/T*W,10,5,0,7);x.fill()});x.strokeStyle='#f2683c';const gy=H-4-gate/mx*(H-8);x.beginPath();x.moveTo(0,gy);x.lineTo(W,gy);x.stroke()}
async function webHear(w,useTrack,ms){const SR=window.SpeechRecognition||window.webkitSpeechRecognition,o={heard:'',err:'',ev:[]};if(!SR)return o;
 const r=new SR();r.lang=$('#lang').value;r.interimResults=true;r.maxAlternatives=3;try{if(S.local&&window.SpeechRecognitionPhrase)r.phrases=[new SpeechRecognitionPhrase(w,8)]}catch{}
 let end;const endP=new Promise(x=>end=x);['audiostart','speechstart','nomatch'].forEach(n=>r.addEventListener(n,()=>o.ev.push(n)));r.addEventListener('end',()=>end());
 r.onerror=e=>{o.err=e.error;if(S.local&&(e.error=='language-not-supported'||e.error=='service-not-allowed')){S.local=false;$('#loc').checked=false}};
 r.onresult=e=>{if(!o.ev.includes('result'))o.ev.push('result');o.heard=[...e.results].map(x=>x[0].transcript).join(' ')};
 try{if(S.local)r.processLocally=true}catch{}
 try{useTrack?r.start(stream.getAudioTracks()[0]):r.start()}catch{try{r.start()}catch{o.err='start'}}
 await new Promise(x=>setTimeout(x,ms));try{r.stop()}catch{}await Promise.race([endP,new Promise(x=>setTimeout(x,4000))]);return o}
async function tryWord(){if(!stream&&!(await openMic()))return;if(S.run)stop();const w=TW[ti],n=syl(w).length;test={t:performance.now(),tr:[]};let heard='',rerr='',WH=$('#eng').value=='whisper';
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition,sl=x=>new Promise(r=>setTimeout(r,x));let ev=[];$('#tgo').disabled=true;
 if(WH){try{$('#tm').textContent='Cargando Whisper…';await Whisper.load($('#wm').value,q=>$('#tm').textContent='Cargando modelo… '+q+'%');await Whisper.start(stream,'spanish',x=>{heard=x.join(' ')},ctx)}catch(e){console.warn(e);rerr='whisper'}
  $('#tm').textContent='Escuchando… di “'+w+'” con calma';test.t=performance.now();test.tr=[];await sl(3000);
  if(!rerr){$('#tm').textContent='Reconociendo…';const fr=await Whisper.flush();if(fr)heard=fr.join(' ');ev=['whisper '+JSON.stringify(Whisper.info())];Whisper.stop()}}
 else{$('#tm').textContent='Escuchando… di “'+w+'” con calma';test.t=performance.now();test.tr=[];let h={heard:'',err:'',ev:[]};
  if(SR){h=await webHear(w,!S.noTrack&&!!$('#dev').value,3000);if(!h.heard&&!h.err&&!h.ev.includes('audiostart')&&!h.ev.includes('speechstart')){$('#tm').textContent='El navegador no captó audio; reintento con el micrófono predeterminado. Di “'+w+'” de nuevo…';test.t=performance.now();test.tr=[];h=await webHear(w,false,3000);if(h.heard)S.noTrack=true}}else await sl(3000);
  heard=h.heard;rerr=h.err;ev=h.ev}
 const tr=test.tr;test=null;$('#tgo').disabled=false;
 {const rs=tr.map(a=>a[1]),pk=Math.max(0,...rs),nz=[...rs].sort((a,b)=>a-b)[Math.floor(rs.length*.2)]||0,mul=1+(11-S.sens)*.5;
 if(pk<Math.max(.004,nz*2.5)){$('#tm').textContent='No detecté voz: acerca el micrófono o sube la ganancia y vuelve a probar.';return}
 if(pk<gate*3){S.floor=Math.max(.001,Math.max(pk/3,nz*1.8)/mul);setGate()}}
 tests.push({tr,n});let best=P,bs=1e9;for(const dip of[.45,.55,.62,.7,.8])for(const rise of[1.15,1.3,1.5,1.8]){const p={...P,dip,rise},s=tests.reduce((a,t)=>a+Math.abs(nucs(t.tr,p).length-t.n),0)+Math.abs(dip-.62)*.1+Math.abs(rise-1.3)*.05;if(s<bs){bs=s;best=p}}
 P=best;det=new Det(P);const nuc=nucs(tr,P);drawTest(tr,nuc);const hn=norm(heard),sp=hn&&sim(hn,norm(w));
 $('#tm').textContent=(nuc.length==n?'✓ Sílabas: detecté '+n+' de '+n+'. ':'Detecté '+nuc.length+' de '+n+' sílabas; ajusté la sensibilidad, repite para afinar. ')+((SR||WH)?(heard?'Reconocimiento: “'+heard.trim()+'” '+(sp?'✓':'✗'):(rerr?'Reconocimiento falló ('+rerr+')'+(rerr=='network'?': necesita internet; usa Whisper local.':rerr=='not-allowed'?': permiso denegado.':rerr=='language-not-supported'?': desactivé el modo en el dispositivo, repite la prueba.':'.'):'Reconocimiento: no escuché nada'+(ev.length?' (señales: '+ev.join(', ')+')':'')+'. Prueba cambiar de motor.')):'')}
// ---- eventos
$('#go').onclick=()=>S.run?(stop(),msg('Práctica detenida.')):start();
$('#next').onclick=()=>{if(cw<words.length)advance(cw+1)};
$('#prev').onclick=()=>jump(Math.max(0,cw-1));
$('#reset').onclick=()=>{stop();load()};
$('#play').onclick=()=>piano(fq(S.tm));
$('#hold').onclick=()=>hold?holdOff():holdOn();
$('#range').oninput=e=>{S.range=+e.target.value;setTarget(S.tm)};
$('#sens').oninput=e=>{S.sens=+e.target.value;$('#sv').textContent=S.sens+'/10';setGate()};
$('#perm').onclick=async()=>{if(await openMic())$('#perm').textContent='Micrófono activo ✓'};
$('#dev').onchange=()=>{if(stream)openMic()};
$('#cal').onclick=calibrate;
document.addEventListener('keydown',e=>{if(e.key=='ArrowRight')$('#next').click()});
$('#tgo').onclick=tryWord;$('#gain').oninput=e=>{if(gN)gN.gain.value=+e.target.value;$('#gv').textContent=e.target.value+'×'};$('#ns2').onchange=()=>{if(stream)openMic()};
$('#loc').onchange=async e=>{S.local=false;if(e.target.checked){S.local=await localOK();$('#mnote').textContent=S.local?'Reconocimiento en el dispositivo activo ✓':'Tu navegador no ofrece reconocimiento local para este idioma.';if(!S.local)e.target.checked=false}};
loadSettings();twUI();fetch('data/ejercicios.json').then(r=>r.json()).then(j=>{LV=j;S.lv=Object.keys(LV)[0];try{$('#mine').value=JSON.parse(localStorage.getItem('va2c')||'[]').join('\n')}catch{}mine()});setTarget(S.tm,true);$('#sv').textContent=S.sens+'/10';setGate();

// ---- Whisper local (js/whisper.js) y emparejamiento de palabras
function applyHeard(hw,fin,s0){let p=s0,pf=s0;hw.forEach((h,j)=>{const hn=norm(h);if(!hn)return;for(let k=p;k<Math.min(p+3,words.length);k++)if(sim(hn,words[k].n)){p=k+1;if(j<fin)pf=p;break}});
 if(!S.run||!flat.length)return;const cur=flat[Math.min(g,flat.length-1)][0];
 if(pf>cur){armed=false;goG(pf<words.length?wst[pf]:flat.length)}else if(p-1>cur){armed=false;goG(wst[p-1])}}
async function startWhisper(){msg('Cargando Whisper (la primera vez descarga el modelo; luego queda en caché)…');
 try{await Whisper.load($('#wm').value,p=>msg('Cargando modelo… '+p+'%'))}catch(e){console.warn(e);msg('No pude cargar Whisper ('+e.message+'). Uso el reconocimiento del navegador.');$('#eng').value='web';return startSR()}
 if(!S.run)return;msg('Escuchando con Whisper local… lee a tu ritmo.');
 Whisper.start(stream,'spanish',hw=>{WT=hw.tm?{tok:[...hw],tm:hw.tm}:null;$('#hd').textContent='Escuché: '+hw.join(' ');applyHeard(hw,hw.length,Math.max(0,flat[Math.min(g,flat.length-1)][0]-2))},ctx)}
// ---- ajustes guardados y exportación
function saveSettings(){try{localStorage.setItem('va2',JSON.stringify({tm:S.tm,range:S.range,sens:S.sens,floor:S.floor,P,lang:$('#lang').value,eng:$('#eng').value,wm:$('#wm').value,gain:$('#gain').value,band:$('#band').value,strict:!!S.strict,adv:!!S.adv}))}catch{}}
function loadSettings(){try{const j=JSON.parse(localStorage.getItem('va2')||'{}');S.tm=j.tm??S.tm;S.range=j.range??S.range;S.sens=j.sens??S.sens;S.floor=j.floor??S.floor;if(j.P){P={...P,...j.P};det=new Det(P)}
 $('#range').value=S.range;$('#sens').value=S.sens;S.strict=!!j.strict;$('#strict').checked=S.strict;S.adv=!!j.adv;$('#adv').checked=S.adv;for(const k of['lang','eng','wm','gain','band'])if(j[k]!=null)$('#'+k).value=j[k]}catch{}
 setInterval(saveSettings,3000)}
$('#exp').onclick=()=>{const rows=[['palabra','silaba','tonica','hz_mediana','semitonos_vs_guia','estado']];
 words.forEach(w=>w.sy.forEach((s,i)=>{const d=w.d[i],c=cls(d),m=d.length>2?med(d):0;rows.push([w.sy.join(''),s,i==w.st?'si':'',m?m.toFixed(1):'',m?(12*Math.log2(m/fq(S.tm))).toFixed(2):'',c=='ok'?'en rango':c=='lo'?'mas grave':c=='hi'?'mas agudo':'sin datos'])}));
 rows.unshift(['nota_guia',nm(Math.round(S.tm)),'banda_hz',Math.round(S.lo)+'-'+Math.round(S.hi)]);
 const a=el('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.join(';')).join('\n')],{type:'text/csv'}));a.download='sesion-voz-'+new Date().toISOString().slice(0,10)+'.csv';a.click()};

// ---- bandas editables y textos propios
$('#band').onchange=e=>{const b=BANDS[e.target.value];if(b)setBand(b[0],b[1],1)};
$('#lo').onchange=$('#hi').onchange=()=>setBand($('#lo').value,$('#hi').value);
function mine(save){const L=$('#mine').value.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,60);
 if(save)try{localStorage.setItem('va2c',JSON.stringify(L))}catch{}
 stop();if(L.length)LV.mios={t:'5 · Mis textos',c:'mid',d:'Tus propias palabras, frases y textos. Para definir tú las sílabas, sepáralas con guiones (ma-ña-na).',i:L.map(x=>({x}))};else delete LV.mios;
 if(save&&L.length){S.lv='mios';S.ix=0}if(!LV[S.lv])S.lv=Object.keys(LV)[0];if(!LV[S.lv])return;S.ix=Math.min(S.ix,LV[S.lv].i.length-1);tabs();items()}
$('#mineSave').onclick=()=>mine(1);$('#mineClear').onclick=()=>{$('#mine').value='';mine(1)};
$('#strict').onchange=e=>{S.strict=e.target.checked};

// ---- escuchar, precarga de Whisper y tema
$('#say').onclick=()=>{try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(LV[S.lv].i[S.ix].x);u.lang=$('#lang').value;u.rate=.8;speechSynthesis.speak(u)}catch{}};
const pre=()=>{if($('#eng').value!='whisper'||!window.Whisper)return;$('#mnote').textContent='Descargando modelo de Whisper…';Whisper.load($('#wm').value,q=>$('#mnote').textContent='Descargando modelo… '+q+'%').then(()=>$('#mnote').textContent='Whisper listo ✓ (queda guardado en tu navegador)').catch(e=>$('#mnote').textContent='No pude cargar Whisper: '+(e.message||e))};
$('#eng').addEventListener('change',pre);$('#wm').addEventListener('change',pre);
$('#theme').onclick=()=>{const d=document.documentElement,dk=d.dataset.theme?d.dataset.theme=='dark':matchMedia('(prefers-color-scheme: dark)').matches;d.dataset.theme=dk?'light':'dark';try{localStorage.setItem('vat',d.dataset.theme)}catch{}};

// ---- motor avanzado (SwiftF0 + Silero VAD)
async function advStart(){if(!S.adv||!stream||!window.Adv)return;const n=$('#mnote');try{n.textContent='Cargando motor avanzado…';await Adv.load(p=>n.textContent='Descargando motor avanzado… '+p+'%');await Adv.start(stream,ctx,gN);n.textContent='Motor avanzado activo ✓ (SwiftF0 + Silero VAD)'}catch(e){console.warn(e);S.adv=false;$('#adv').checked=false;n.textContent='No pude cargar el motor avanzado ('+(e.message||e)+'). Sigo con el motor básico.'}}
$('#adv').onchange=e=>{S.adv=e.target.checked;saveSettings();const n=$('#mnote');if(S.adv){if(stream)advStart();else n.textContent='El motor avanzado se activará al permitir el micrófono.'}else{window.Adv&&Adv.stop();n.textContent='Motor básico activo.'}};
