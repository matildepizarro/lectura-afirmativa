
const $=s=>document.querySelector(s),el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
let LV={};
const S={lv:'palabras',ix:0,tm:57,range:2,sens:6,floor:.004,run:false};
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
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/h/g,'').replace(/v/g,'b').replace(/z/g,'s').replace(/c([ei])/g,'s$1').replace(/qu/g,'k').replace(/c/g,'k').replace(/ll/g,'y').replace(/[^a-zñ0-9]/g,'');
const stress=(w,sy)=>{if(sy.length<2)return 0;const i=sy.findIndex(s=>/[áéíóú]/i.test(s));if(i>=0)return i;return /[aeiouns]$/i.test(w)?sy.length-2:sy.length-1};
class Det{constructor(p){this.p=p;this.reset()}reset(){this.env=0;this.pk=0;this.dip=false;this.vl=0;this.last=-1e9;this.lv=-1e9;this.arm=true}
 push(t,rms,gate){const p=this.p;this.env=this.env*.6+rms*.4;const e=this.env,v=rms>gate;if(v)this.lv=t;if(e>this.pk)this.pk=e;else this.pk*=.99;
  if(!this.dip&&this.pk>gate*1.4&&e<this.pk*p.dip){this.dip=true;this.vl=e}
  if(this.dip){this.vl=Math.min(this.vl,e);if(e>this.vl*p.rise+gate*.15&&e>gate&&t-this.last>p.gap){this.dip=false;this.pk=e;this.last=t;return true}}
  if(t-this.lv>p.sil){this.dip=false;this.pk=0;this.arm=true}
  if(this.arm&&v&&e>gate){this.arm=false;this.last=t;return true}return false}}
det=new Det(P);
function lev(a,b){const d=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]==b[j-1]?0:1));p=t}}return d[b.length]}
const sim=(a,b)=>!b||a==b||lev(a,b)<=Math.floor(Math.max(a.length,b.length)/4);
// ---- UI nivel/lectura
function tabs(){const t=$('#tabs');t.innerHTML='';for(const k in LV){const b=el('button','tab'+(k==S.lv?' on':''),LV[k].t);b.onclick=()=>{stop();S.lv=k;S.ix=0;tabs();items()};t.append(b)}$('#desc').textContent=LV[S.lv].d}
function items(){const c=$('#chips');c.innerHTML='';LV[S.lv].i.forEach((it,n)=>{const b=el('button','chip'+(n==S.ix?' on':''),it.x);b.onclick=()=>{stop();S.ix=n;items()};c.append(b)});load()}
function load(){const it=LV[S.lv].i[S.ix],R=$('#reader');R.className=LV[S.lv].c;R.innerHTML='';$('#sum').classList.add('hid');
 const tg=$('#tag');tg.classList.toggle('hid',!it.g);tg.textContent=it.g||'';
 words=it.x.split(/\s+/).map(w=>{const m=w.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u),core=m[2]||w,sy=syl(core);return{pre:m[1],post:m[3],sy,st:stress(core,sy),n:norm(core),d:sy.map(()=>[]),e:[]}});
 flat=[];words.forEach((w,wi)=>{wst[wi]=flat.length;const ws=el('span','w');if(w.pre)ws.append(w.pre);w.sy.forEach((s,si)=>{const e=el('span','s'+(w.sy.length>1&&si==w.st?' st':''),s);w.e.push(e);flat.push([wi,si]);ws.append(e)});if(w.post)ws.append(w.post);ws.onclick=()=>jump(wi);R.append(ws,' ')});
 g=0;armed=true;trace=[];wordT=[];t0=performance.now();det.reset();setCur(0,0)}
function setCur(w,s){document.querySelectorAll('.s.act').forEach(e=>e.classList.remove('act'));cw=w;cs=s;if(w<words.length){const e=words[w].e[s];e.classList.add('act');if(S.run)e.scrollIntoView({block:'nearest',behavior:'smooth'})}}
const med=a=>{const b=[...a].sort((x,y)=>x-y);return b[b.length>>1]};
const cls=(a)=>{if(a.length<3)return'';const st=12*Math.log2(med(a)/fq(S.tm));return Math.abs(st)<=S.range?'ok':st<0?'lo':'hi'};
function paint(w,s,fin){const e=words[w].e[s];e.classList.remove('ok','lo','hi');const c=cls(words[w].d[s]);if(c)e.classList.add(c);if(fin)e.classList.add('done')}
function goG(n){n=Math.max(g,Math.min(n,flat.length));for(let i=g;i<n;i++){const[w,s]=flat[i];paint(w,s,1);if(wordT[w]==null)wordT[w]=performance.now()-t0}g=n;if(n>=flat.length){setCur(words.length,0);finish()}else{const[w,s]=flat[n];if(wordT[w]==null)wordT[w]=performance.now()-t0;setCur(w,s)}}
function advance(to){goG(to<words.length?wst[to]:flat.length)}
function jump(w){if(rec&&S.run){try{rec.abort()}catch{}}sess=w;words.forEach((x,i)=>x.e.forEach(e=>{if(i>=w)e.classList.remove('done','ok','lo','hi')}));g=wst[w];armed=true;det.reset();setCur(w,0)}
// ---- audio
async function openMic(){stop(1);const id=$('#dev').value;try{stream=await navigator.mediaDevices.getUserMedia({audio:{deviceId:id&&id!='def'?{exact:id}:undefined,echoCancellation:false,noiseSuppression:$('#ns2').checked,autoGainControl:false}})}catch(e){msg('No pude acceder al micrófono. Revisa los permisos del navegador.');return false}
 AC();const src=ctx.createMediaStreamSource(stream);gN=ctx.createGain();gN.gain.value=+$('#gain').value;an=ctx.createAnalyser();an.fftSize=2048;src.connect(gN);gN.connect(an);buf=new Float32Array(2048);cancelAnimationFrame(raf);loop();await devs();return true}
async function devs(){const cur=$('#dev').value,l=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind=='audioinput'),s=$('#dev');s.innerHTML='';l.forEach((d,i)=>{const o=el('option','',d.label||'Micrófono '+(i+1));o.value=d.deviceId;s.append(o)});if(cur&&l.some(d=>d.deviceId==cur))s.value=cur}
function detect(b,sr){const n=b.length,mx=Math.min(Math.floor(sr/75),n>>1),mn=Math.floor(sr/450),d=new Float32Array(mx+2);
 for(let t=1;t<=mx;t++){let s=0;for(let i=0;i<n-mx;i++){const x=b[i]-b[i+t];s+=x*x}d[t]=s}
 let run=0;for(let t=1;t<=mx;t++){run+=d[t];d[t]=d[t]*t/(run||1)}
 for(let t=mn;t<mx;t++)if(d[t]<.15){while(t+1<mx&&d[t+1]<d[t])t++;const a=d[t-1],c=d[t+1],sh=(a-c)/(2*(a-2*d[t]+c))||0;return sr/(t+sh)}return-1}
function setGate(){gate=Math.max(.003,S.floor*(1+(11-S.sens)*.5));$('#gt').style.left=Math.min(1,gate/.15)*100+'%'}
function loop(){raf=requestAnimationFrame(loop);an.getFloatTimeDomainData(buf);let s=0;for(const v of buf)s+=v*v;const rms=Math.sqrt(s/buf.length),now=performance.now();
 $('#lv').style.width=Math.min(1,rms/.15)*100+'%';let f=-1;
 if(cal&&cal.ph=='n')cal.n.push(rms);if(test)test.tr.push([now-test.t,rms]);
 if(rms>(cal&&cal.ph=='v'?S.floor*2:gate)){f=detect(buf,ctx.sampleRate);lastV=now;if(f>0&&hist.length>2&&Math.abs(12*Math.log2(f/med(hist)))>6){if(++bad<4)f=-1;else{bad=0;hist=[]}}else bad=0}
 if(f>0){hist.push(f);if(hist.length>5)hist.shift();const m=med(hist),st=12*Math.log2(m/fq(S.tm)),mi=Math.round(69+12*Math.log2(m/440));
  $('#nn').textContent=nm(mi);$('#nf').textContent=m.toFixed(0)+' Hz · '+(st>=0?'+':'')+st.toFixed(1)+' st';
  const ok=Math.abs(st)<=S.range;$('#ns').textContent=ok?'En tu rango':st<0?'Más grave':'Más agudo';$('#ns').style.color=ok?'var(--ok)':st<0?'var(--lo)':'var(--hi)';
  const nd=$('#needle');nd.style.opacity=1;nd.style.left=(50+Math.max(-6,Math.min(6,st))/6*50)+'%';
  if(cal&&cal.ph=='v')cal.f.push(m);
  if(S.run&&cw<words.length){words[cw].d[cs].push(m);paint(cw,cs);trace.push([now-t0,st])}}
 else if(now-lastV>350){hist=[];$('#needle').style.opacity=.25;$('#nn').textContent='—';$('#nf').textContent='Sin voz detectada';$('#ns').textContent='—';$('#ns').style.color=''}
 // sílabas por energía
 if(S.run&&cw<words.length){if(det.push(now,rms,gate)){if(armed)armed=false;else if(g<flat.length-1)goG(g+1)}
  
  
  const lw=words[words.length-1];if(g>=flat.length-1&&lw.d[lw.sy.length-1].length>4&&now-lastV>1200)goG(flat.length)}
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
 rec.onend=()=>{if(S.run){sess=cw;try{rec.start()}catch{}}};rec.onerror=e=>{if(e.error=='not-allowed')msg('Permiso de reconocimiento de voz denegado.')};try{rec.start()}catch{}}
async function start(){if(!stream&&!(await openMic()))return;if(cw>=words.length)load();S.run=true;det.reset();armed=true;$('#go').textContent='■ Detener';$('#go').classList.add('rec');msg('Escuchando… lee a tu ritmo.');startSR()}
function stop(keep){window.Whisper&&Whisper.stop();if(S.run){S.run=false;try{rec&&rec.abort()}catch{}}$('#go').textContent='▶ Comenzar a leer';$('#go').classList.remove('rec');if(!keep){}else{cancelAnimationFrame(raf);stream&&stream.getTracks().forEach(t=>t.stop());stream=null}}
function finish(){S.run=false;try{rec.abort()}catch{}$('#go').textContent='▶ Comenzar a leer';$('#go').classList.remove('rec');msg('¡Terminaste! Mira tu resumen.');drawCv();
 let tot=0,ok=0,lo=[],hi=[];words.forEach(w=>w.sy.forEach((s,i)=>{const c=cls(w.d[i]);if(!c)return;tot++;if(c=='ok')ok++;else(c=='lo'?lo:hi).push(s)}));
 const b=$('#sumb');b.innerHTML='';b.append(el('div','note',tot?Math.round(ok/tot*100)+'% en tu rango':'Sin datos de tono'));b.append(el('div','sub',tot+' sílabas con voz detectada'));
 const grp=(t,a,c)=>{if(!a.length)return;b.append(el('div','sub','\n'+t));const d=el('div','hard');a.forEach(x=>{const p=el('span','pill',x);p.style.color=c;d.append(p)});b.append(d)};
 grp('Sílabas más graves que tu rango','lo'&&lo,'var(--lo)');grp('Sílabas más agudas que tu rango','hi'&&hi,'var(--hi)');
 b.append(el('div','sub','Estas sílabas son pistas para practicar, no errores. Repite despacio y compara.'));$('#sum').classList.remove('hid');if($('#auto').checked&&S.ix<LV[S.lv].i.length-1){msg('Muy bien: '+(tot?Math.round(ok/tot*100)+'% en tu rango. ':'')+'Pasando al siguiente…');setTimeout(()=>{if(!$('#auto').checked||S.run)return;S.ix++;items();start()},2600)}}
const msg=t=>$('#msg').textContent=t;
// ---- piano
function setTarget(m){S.tm=m;$('#tn').textContent=nm(m)+' · '+fq(m).toFixed(0)+' Hz';document.querySelectorAll('#piano [data-m]').forEach(k=>{const d=+k.dataset.m;k.classList.toggle('t',d==m);k.classList.toggle('r',d!=m&&Math.abs(d-m)<=S.range)});const w=S.range/6*100;$('#zone').style.left=50-w/2+'%';$('#zone').style.width=w+'%';$('#rv').textContent='±'+S.range+' st';if(hold)holdOff(),holdOn()}
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
 rec=new SR();rec.lang=$('#lang').value;rec.continuous=true;rec.interimResults=true;sess=cw;if(S.local){try{rec.processLocally=true}catch{}}
 rec.onresult=e=>{const hw=[];let fin=0;for(let i=0;i<e.results.length;i++){const r=e.results[i];hw.push(...r[0].transcript.trim().split(/\s+/));if(r.isFinal)fin=hw.length}
  let p=sess,pf=sess;hw.forEach((h,j)=>{const hn=norm(h);if(!hn)return;for(let k=p;k<Math.min(p+3,words.length);k++)if(sim(hn,words[k].n)){p=k+1;if(j<fin)pf=p;break}});
  if(!S.run||!flat.length)return;const cur=flat[Math.min(g,flat.length-1)][0];
  if(pf>cur){armed=false;goG(pf<words.length?wst[pf]:flat.length)}else if(p-1>cur){armed=false;goG(wst[p-1])}
  else if(p>sess&&cur>p+3){g=wst[p+3];det.reset();setCur(...flat[g])}};
 rec.onend=()=>{if(S.run){sess=cw;setTimeout(go,60)}};rec.onerror=e=>{if(e.error=='not-allowed')msg('Permiso de reconocimiento de voz denegado.')};
 const go=()=>{const t=stream&&stream.getAudioTracks()[0];try{rec.start(t)}catch{try{rec.start()}catch{}}};go()}
// ---- prueba previa
const TW=['mañana','valiente','orgullo','bienvenida','respiro','nombre'];let ti=0;
function twUI(){const c=$('#tw');c.innerHTML='';TW.forEach((w,i)=>{const b=el('button','chip'+(i==ti?' on':''),w);b.onclick=()=>{ti=i;twUI()};c.append(b)});$('#twd').textContent=syl(TW[ti]).join(' · ')}
const nucs=(tr,p)=>{const d=new Det(p),o=[];tr.forEach(([t,r])=>{if(d.push(t,r,gate))o.push(t)});return o};
function drawTest(tr,nuc){const c=$('#tc'),x=c.getContext('2d'),W=c.width,H=c.height;x.clearRect(0,0,W,H);if(!tr.length)return;const T=tr[tr.length-1][0],mx=Math.max(.05,...tr.map(a=>a[1]));x.strokeStyle='#6d5efc';x.lineWidth=2;x.beginPath();tr.forEach(([t,r],i)=>{const X=t/T*W,Y=H-4-r/mx*(H-8);i?x.lineTo(X,Y):x.moveTo(X,Y)});x.stroke();x.fillStyle='#ff6fb5';nuc.forEach(t=>{x.beginPath();x.arc(t/T*W,10,5,0,7);x.fill()});x.strokeStyle='#f2683c';const gy=H-4-gate/mx*(H-8);x.beginPath();x.moveTo(0,gy);x.lineTo(W,gy);x.stroke()}
async function tryWord(){if(!stream&&!(await openMic()))return;if(S.run)stop();const w=TW[ti],n=syl(w).length;test={t:performance.now(),tr:[]};let heard='';
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let r2;if(SR){r2=new SR();r2.lang=$('#lang').value;r2.interimResults=true;r2.onresult=e=>{heard=[...e.results].map(x=>x[0].transcript).join(' ')};try{if(S.local)r2.processLocally=true;try{r2.start(stream.getAudioTracks()[0])}catch{r2.start()}}catch{}}
 $('#tgo').disabled=true;$('#tm').textContent='Escuchando… di “'+w+'” con calma';await new Promise(r=>setTimeout(r,3000));try{r2&&r2.stop()}catch{}
 const tr=test.tr;test=null;$('#tgo').disabled=false;
 if(Math.max(0,...tr.map(a=>a[1]))<gate){$('#tm').textContent='No detecté voz: acerca el micrófono o sube la ganancia y vuelve a probar.';return}
 tests.push({tr,n});let best=P,bs=1e9;for(const dip of[.45,.55,.62,.7,.8])for(const rise of[1.15,1.3,1.5,1.8]){const p={...P,dip,rise},s=tests.reduce((a,t)=>a+Math.abs(nucs(t.tr,p).length-t.n),0)+Math.abs(dip-.62)*.1+Math.abs(rise-1.3)*.05;if(s<bs){bs=s;best=p}}
 P=best;det=new Det(P);const nuc=nucs(tr,P);drawTest(tr,nuc);const hn=norm(heard),sp=hn&&sim(hn,norm(w));
 $('#tm').textContent=(nuc.length==n?'✓ Sílabas: detecté '+n+' de '+n+'. ':'Detecté '+nuc.length+' de '+n+' sílabas; ajusté la sensibilidad, repite para afinar. ')+(SR?(heard?'Reconocimiento: “'+heard.trim()+'” '+(sp?'✓':'✗'):'Reconocimiento: no escuché nada.'):'')}
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
loadSettings();twUI();fetch('data/ejercicios.json').then(r=>r.json()).then(j=>{LV=j;S.lv=Object.keys(LV)[0];tabs();items()});setTarget(S.tm);$('#sv').textContent=S.sens+'/10';setGate();

// ---- Whisper local (js/whisper.js) y emparejamiento de palabras
function applyHeard(hw,fin,s0){let p=s0,pf=s0;hw.forEach((h,j)=>{const hn=norm(h);if(!hn)return;for(let k=p;k<Math.min(p+3,words.length);k++)if(sim(hn,words[k].n)){p=k+1;if(j<fin)pf=p;break}});
 if(!S.run||!flat.length)return;const cur=flat[Math.min(g,flat.length-1)][0];
 if(pf>cur){armed=false;goG(pf<words.length?wst[pf]:flat.length)}else if(p-1>cur){armed=false;goG(wst[p-1])}}
async function startWhisper(){msg('Cargando Whisper (la primera vez descarga el modelo; luego queda en caché)…');
 try{await Whisper.load($('#wm').value,p=>msg('Cargando modelo… '+p+'%'))}catch(e){console.warn(e);msg('No pude cargar Whisper ('+e.message+'). Uso el reconocimiento del navegador.');$('#eng').value='web';return startSR()}
 if(!S.run)return;msg('Escuchando con Whisper local… lee a tu ritmo.');
 Whisper.start(stream,'spanish',hw=>applyHeard(hw,0,Math.max(0,flat[Math.min(g,flat.length-1)][0]-2)),ctx)}
// ---- ajustes guardados y exportación
function saveSettings(){try{localStorage.setItem('va',JSON.stringify({tm:S.tm,range:S.range,sens:S.sens,floor:S.floor,P,lang:$('#lang').value,eng:$('#eng').value,wm:$('#wm').value,gain:$('#gain').value}))}catch{}}
function loadSettings(){try{const j=JSON.parse(localStorage.getItem('va')||'{}');S.tm=j.tm??S.tm;S.range=j.range??S.range;S.sens=j.sens??S.sens;S.floor=j.floor??S.floor;if(j.P){P={...P,...j.P};det=new Det(P)}
 $('#range').value=S.range;$('#sens').value=S.sens;for(const k of['lang','eng','wm','gain'])if(j[k]!=null)$('#'+k).value=j[k]}catch{}
 setInterval(saveSettings,3000)}
$('#exp').onclick=()=>{const rows=[['palabra','silaba','tonica','hz_mediana','semitonos_vs_guia','estado']];
 words.forEach(w=>w.sy.forEach((s,i)=>{const d=w.d[i],c=cls(d),m=d.length>2?med(d):0;rows.push([w.sy.join(''),s,i==w.st?'si':'',m?m.toFixed(1):'',m?(12*Math.log2(m/fq(S.tm))).toFixed(2):'',c=='ok'?'en rango':c=='lo'?'mas grave':c=='hi'?'mas agudo':'sin datos'])}));
 rows.unshift(['nota_guia',nm(S.tm),'rango_st',S.range]);
 const a=el('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.join(';')).join('\n')],{type:'text/csv'}));a.download='sesion-voz-'+new Date().toISOString().slice(0,10)+'.csv';a.click()};
