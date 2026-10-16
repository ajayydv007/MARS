(function(){
'use strict';
const M=window.MARS;if(!M)return;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const p2=n=>String(n).padStart(2,'0'),p4=n=>String(n).padStart(4,'0');
const el=n=>document.getElementById('id_'+n);
const gv=n=>{const e=el(n);return e&&!e.disabled?String(e.value||'').trim():''};
const mf=$('#mf'),SS=M.SS;

/* ---- settings ------------------------------------------------------------
   WIND_SRC : which wind goes into the METAR string ('wind' = 2 min, 'wind_10' = 10 min)
   DEMO     : no server (file:// or ?demo) -> submit is simulated, nothing is posted
   PRINT    : print page names, ICAO is appended  e.g. print_two_VOGA.php          */
const WIND_SRC='wind';
const DEMO=location.protocol==='file:'||/[?&]demo\b/.test(location.search);
const PRINT={two:i=>'print_two_'+i+'.php',one:i=>'print_one_'+i+'.php'};

const icao=()=>(($('#stI')||{}).textContent||'----').trim();
const stName=()=>(($('#stN')||{}).textContent||'').trim();
const spec=()=>{const r=$('[name=metar_specification]:checked');return r?r.value:'METAR'};
const enc=x=>{const r=Math.round(parseFloat(x));return(r<0?'M':'')+p2(Math.abs(r))};

/* typed value, or the form's own default for blank + enabled fields (same as on submit) */
function vals(){const o={};
 Object.keys(M.F).forEach(n=>{const e=el(n);let v=gv(n);
  if(!v&&e&&!e.disabled&&M.F[n][6]&&!(n==='cloud_1'&&gv('vertical_cloud')))v=M.F[n][6];o[n]=v});
 return o}

function build(){
 const v=vals(),T=[],d=v.metar_date.split('/'),tm=v.metar_time;
 T.push([spec(),'c-id']);T.push([icao(),'c-id']);
 T.push([d.length===3&&tm.length===4?d[0]+tm+'Z':'------Z','c-id']);
 if(v.metar_cca)T.push([v.metar_cca,'c-cca']);
 const gk=WIND_SRC==='wind'?'wind_maximum':'wind_maximum_10',g=v[gk];
 T.push([v[WIND_SRC]+(g?'G'+p2(+g||0):'')+'KT','c-wind']);
 const typedCloud=[1,2,3,4].some(k=>gv('cloud_'+k)),cav=v.visibility==='9999'&&!typedCloud&&!gv('weather')&&!gv('vertical_cloud');
 if(cav)T.push(['CAVOK','c-vis']);
 else{
  T.push([v.visibility,'c-vis']);
  if(v.sector_visibility)T.push([v.sector_visibility,'c-vis']);
  [1,2,3,4].forEach(k=>{const r=v['active_rwy_'+k],x=v['rvr_'+k];if(r&&x)T.push(['R'+r+'/'+(/^[PM]/.test(x)?x:p4(x)),'c-rvr'])});
  v.weather.split(/\s+/).filter(Boolean).forEach(x=>T.push([x,'c-wx']));
  if(v.vertical_cloud)T.push([v.vertical_cloud,'c-cld']);
  else if(typedCloud)[1,2,3,4].forEach(k=>{if(gv('cloud_'+k))T.push([gv('cloud_'+k),'c-cld'])});
  else T.push(['NSC','c-cld']);
 }
 const t=v.temperature,dp=v.dewpoint,q=v.qnh;
 T.push([enc(t)+'/'+enc(dp),'c-tmp']);
 T.push(['Q'+p4(Math.floor(parseFloat(q))),'c-tmp']);
 T.push([v.trend||'NOSIG','c-trd']);
 /* remarks are NOT part of the METAR message: kept out of the string, shown separately */
 const rm=['remarks','remarks1','remarks2','remarks3'].map(n=>v[n]).filter(Boolean);
 return{T,str:T.map(x=>x[0]).join(' ')+'=',v,rm}
}
const strHTML=T=>T.map(([x,c])=>'<span class="tk '+c+'">'+esc(x)+'</span>').join('')+'<span class="eq">=</span>';

/* ---- review page ---------------------------------------------------------- */
const kv=(l,val,x)=>'<div class="kv'+(x?' x':'')+(val?'':' e')+'"><small>'+esc(l)+'</small><b>'+(val?esc(val):'—')+'</b></div>';
function head(p,sp){$('#'+p+'I').textContent=icao();$('#'+p+'N').textContent=stName();const b=$('#'+p+'T');b.textContent=sp;b.classList.toggle('speci',sp==='SPECI')}
function renderReview(){
 const m=build(),v=m.v;head('rv',spec());
 $('#rvStr').innerHTML=strHTML(m.T);
 const w10=v.wind_10?v.wind_10+(v.wind_maximum_10?'G'+p2(+v.wind_maximum_10||0):'')+'KT':'';
 $('#rvKv').innerHTML=[
  kv('Station',icao()+' · '+stName()),kv('Type',spec()),kv('Data date & time (UTC)',gv('data_datetime').replace(' UTC','')),kv('Tower Met Officer',gv('tower_met_officer')),
  kv('Wind 2 min avg',v.wind+(v.wind_maximum?'G'+p2(+v.wind_maximum||0):'')+'KT',1),kv('Wind 10 min avg',w10,1),kv('Significant weather',v.significant_weather,1),kv('Present weather',v.present_weather,1),
  kv('Past weather',v.past_weather,1),kv('QFE (hPa)',v.qfe,1),kv('Total cloud (okta)',v.total_cloud,1),kv('Individual cloud',v.individual_cloud,1)
 ].join('')+(m.rm.length?'<div class="kv x" style="grid-column:1/-1"><small>Remarks (not part of the METAR)</small><b>'+esc(m.rm.join(' · '))+'</b></div>':'')+(gv('metar_state_note')?'<div class="kv" style="grid-column:1/-1"><small>Notes</small><b>'+esc(gv('metar_state_note'))+'</b></div>':'');
 $('#rvErr').hidden=true;$('#rvErr').textContent='';
 const b=$('#rvSubmit');b.disabled=false;b.classList.remove('busy');
}
$('#rvBack').addEventListener('click',()=>{location.hash='#metar'});

async function send(){
 const b=$('#rvSubmit'),er=$('#rvErr'),fail=t=>{er.textContent=t;er.hidden=false;b.disabled=false;b.classList.remove('busy');M.fit()};
 er.hidden=true;
 const te=M.timeErr();
 if(te)return fail('The data time is '+te+'. Press BACK and use NOW or correct the time. Your entries are kept.');
 b.disabled=true;b.classList.add('busy');
 const m=build(),fd=new FormData(mf);
 Object.keys(M.F).forEach(n=>{const e=el(n);if(e&&!e.disabled&&!String(fd.get(n)||'').trim()&&M.F[n][6]&&!(n==='cloud_1'&&gv('vertical_cloud')))fd.set(n,M.F[n][6])});
 fd.set('submit_metar','');
 try{
  if(DEMO)await new Promise(r=>setTimeout(r,500));
  else{const r=await fetch(mf.getAttribute('action'),{method:'POST',body:fd,credentials:'same-origin'});
   if(!r.ok)throw new Error('server replied '+r.status+(r.statusText?' '+r.statusText:''))}
 }catch(e){return fail('Not submitted: '+(e.message||'network error')+'. Your entries are kept. Press SUBMIT to try again or BACK to edit.')}
 const rec={str:m.str,icao:icao(),name:stName(),type:spec(),dt:gv('data_datetime'),sent:Date.now(),demo:DEMO,officer:gv('tower_met_officer'),html:strHTML(m.T)};
 SS.set('md_last',JSON.stringify(rec));SS.del('md_pend');
 /* keep every value for the next report (most stay same for ~30 min): only time is refreshed, CCA is cleared */
 const cc=el('metar_cca');if(cc)cc.value='';
 M.setNow();save();
 location.hash='#done';
}
$('#rvSubmit').addEventListener('click',send);

/* ---- success page --------------------------------------------------------- */
const last=()=>{try{return JSON.parse(SS.get('md_last'))}catch(_){return null}};
function renderDone(){
 const r=last();if(!r){location.hash='#metar';return}
 head('dn',r.type);
 $('#dnH').textContent=r.type+' submitted successfully';
 const u=new Date(r.sent);
 $('#dnSub').textContent=r.icao+' · '+r.type+' · data time '+r.dt+' · sent '+p2(u.getUTCHours())+':'+p2(u.getUTCMinutes())+':'+p2(u.getUTCSeconds())+' UTC · by '+(r.officer||'—');
 $('#dnStr').innerHTML=r.html;
 $('#dnDemo').hidden=!r.demo;
 $('#dnP2').href=PRINT.two(r.icao);$('#dnP1').href=PRINT.one(r.icao);
 $('#dnCopy span').textContent='Copy';
}
$('#dnCopy').addEventListener('click',()=>{const r=last();if(!r)return;const done=()=>{$('#dnCopy span').textContent='Copied'};
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(r.str).then(done,()=>{});
 else{const t=document.createElement('textarea');t.value=r.str;document.body.append(t);t.select();try{document.execCommand('copy');done()}catch(_){}t.remove()}});

/* ---- dashboard: last submitted line --------------------------------------- */
function renderLast(){const r=last(),p=$('#lastMetar');if(!p)return;
 if(r&&r.icao===icao()){p.textContent='Last submitted: '+r.str;p.hidden=false}else p.hidden=true}

window.MARS_VIEW={review:renderReview,done:renderDone,dash:renderLast};

/* ---- keep what was typed (survives reload, BACK, tab switch) -------------- */
const TIME=['data_datetime','metar_date','metar_time'];
let st=0;
function save(){clearTimeout(st);
 if(!SS.get('md_sess'))return;
 const v={};[...mf.elements].forEach(e=>{if(!e.name||e.name==='station'||/^(submit|reset|button)$/.test(e.type))return;
  if(e.type==='radio'){if(e.checked)v[e.name]=e.value}else v[e.name]=e.value});
 SS.set('md_draft',JSON.stringify({t:Date.now(),v}))}
const saveL=()=>{clearTimeout(st);st=setTimeout(save,150)};
mf.addEventListener('input',saveL);mf.addEventListener('change',saveL);
window.addEventListener('pagehide',save);
mf.addEventListener('reset',()=>{clearTimeout(st);SS.del('md_draft')});
$('#logoutBtn').addEventListener('click',()=>{clearTimeout(st);['md_draft','md_pend','md_last'].forEach(k=>SS.del(k))});

(function restore(){let d=null;try{d=JSON.parse(SS.get('md_draft'))}catch(_){}
 if(!d||!d.v)return;
 const fresh=Date.now()-d.t<6e5,fire=e=>e.dispatchEvent(new Event('input',{bubbles:true}));
 const put=n=>{if(TIME.includes(n)&&!fresh)return;const e=mf.elements[n];if(!e||e.disabled||d.v[n]===undefined)return;e.value=d.v[n];if(e.tagName)fire(e)};
 put('visibility');                       /* unlocks / locks the RVR fields first */
 Object.keys(d.v).forEach(n=>{if(n!=='visibility')put(n)});
 /* the form's own change handlers only listen to 'change' for the date pair */
})();

{const v=document.body.dataset.view;if(window.MARS_VIEW[v])window.MARS_VIEW[v]();M.fit()}
})();
