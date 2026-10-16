(function(){
const id=n=>document.getElementById('id_'+n),$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const RW='^(0[1-9]|[12][0-9]|3[0-6])([LRC])?$',AN=n=>'^[A-Z0-9]{0,'+n+'}$',P='^[\\x20-\\x7E]{0,255}$',RM='use 01–36 + L/R/C',RV='^(P2000|M\\d{4}|\\d{1,4})$',CL='^(FEW|SCT|BKN|OVC)\\d{3}(CB|TCU)?$',WGS='^(VC)?[-+]?(MI|BC|PR|DR|BL|SH|TS|FZ)?(DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PO|SQ|FC|SS|DS)*$',SV='^\\d{4}(N|NE|E|SE|S|SW|W|NW)( \\d{4}(N|NE|E|SE|S|SW|W|NW))?$',TD='^-?\\d{1,2}(\\.\\d)?$',PR='^\\d{1,4}(\\.\\d)?$';
const RWT='Runway 01–36 with optional L/R/C · e.g. 19L · active only when visibility ≤ 1500 m';
const RVT='RVR in metres · e.g. 0325 · P2000 if above 2000 m · M0050 if below the instrument minimum · active only when visibility ≤ 1500 m';
/* weather codes: KEY:present(ww):past(W):priority — one merged table */
const WG=new RegExp(WGS),WX={};'FU:04:4:30 HZ:05:4:40 DU:06::25 SA:07::24 PO:09:3:23 BR:10:4:50 BCFG:41:4:56 MIFG:12:4:57 FG:45:4:59 PRFG:44:4:58 VCFG:40:4:40 FZFG:49:4:60 -DZ:51:5:63 DZ:53:5:64 +DZ:55:5:65 -FZDZ:54:: FZDZ:55:5: +FZDZ:56:: DZRA:57:: +DZRA:58:: -RA:61:6:73 RA:63:6:74 +RA:65:6:75 -FZRA:64::67 FZRA:65:6:68 +FZRA:66::69 -RASN:68:: RASN:69:6: +RASN:69:: -SN:70:7:70 SN:71:7:71 +SN:73:7:72 -SG:74:: SG:75:7: +SG:76:: -PL:75:: PL:76:7: +PL:77:: -IC:78:: IC:79:7: +IC:79:: -SHRA:80:8:83 SHRA:81:8:84 +SHRA:82:8:85 -SHSN:85::80 SHSN:86:8:81 +SHSN:87::82 SHGR:88:8: SHGS:88:: SHPL:89:: VCSH:16::16 TS:17:9:90 VCTS:13:9: TSRA:95:9:99 +TSRA:97:9:100 -TSRA:95::98 TSGR:96:9:97 TSSN:93::96 TSPL:94::95 -TSSN:93:: -TSGR:96:: SQ:38::22 FC:19::21 SS:10:3: DS:11:3: BLSN:36:3: BLSA:35:3: BLDU:34:3: VA:14::20 CLR::1:1 NSC::1: NCD::1:'.split(' ').forEach(t=>{const[k,w,p,r]=t.split(':');WX[k]={w,p,r:+r||0}});window.MARS_WX=WX;
const wxTop=s=>{let b='',sc=-1;s.split(/\s+/).forEach(g=>{const x=WX[g];if(x&&x.w){const c=x.r*100+(+x.w);if(c>sc){sc=c;b=x.w}}});return b};
const L=[
['metar_date','Date',10,'',1,'','',0,'','DD/MM/YYYY · e.g. 16/10/2026 · follows Data Date & Time'],
['metar_time','Time (UTC)',4,'',1,'','',0,'','HHMM in UTC · e.g. 0600 · follows Data Date & Time'],
['metar_cca','CCA',3,'',0,'^CC[A-Z]$','',1,'CCA–CCZ','Correction indicator CCA–CCZ · leave blank if this is not a correction'],
['wind','Wind (2 min avg)',5,'',1,'^(00000|VRB\\d{2}|(0[1-9]|[12]\\d|3[0-6])0\\d{2})$','',1,'dddff · direction 010–360 in 10° steps','5 characters dddff · e.g. 12005 · VRB03 · 00000 · direction to nearest 10°'],
['wind_maximum','Max wind',3,'KT',0,'^\\d{1,3}$','',0,'digits only','Gust speed in knots, digits only · e.g. 15'],
['wind_10','Wind (10 min avg)',5,'',0,'^(00000|VRB\\d{2}|(0[1-9]|[12]\\d|3[0-6])0\\d{2})$','',1,'dddff · direction 010–360 in 10° steps','Optional · 10-min mean wind, 5 characters dddff · e.g. 12005 · VRB03 · 00000 · direction to nearest 10°'],
['wind_maximum_10','Max wind',3,'KT',0,'^\\d{1,3}$','',0,'digits only','10-min gust speed in knots, digits only · e.g. 15'],
['visibility','Visibility',4,'m',1,'^\\d{4}$','',0,'4 digits','4 digits, metres · e.g. 4000 · 9999 for 10 km or more'],
['sector_visibility','Sector visibility',14,'',0,SV,'',1,'e.g. 2000SE or 1400SW 6000N','Lowest visibility + compass point · e.g. 2000SE · a second sector after a space · e.g. 1400SW 6000N'],
['weather','Weather',30,'',0,'^[\\x20-\\x7E]{0,30}$','',1,'max 30 chars','METAR weather groups, max 3 groups · e.g. +SHRA BR · mandatory when visibility ≤ 5000 m'],
['significant_weather','Significant weather',2,'',0,'^\\d{2}$','',0,'2 digits','Significant weather code, 2 digits · e.g. 63 · filled from Weather, change it if needed'],
['present_weather','Present weather',2,'CODE',0,'^\\d{2}$','00',0,'2 digits','Present weather code (ww), 2 digits · e.g. 05 · filled from Weather, change it if needed'],
['past_weather','Past weather',2,'CODE',0,'^\\d{1,2}$','0',0,'1–2 digits','Past weather code (W), digits only · e.g. 6 for rain that has ended'],
['active_rwy_1','RWY 1',3,'',0,RW,'',1,RM,RWT],['rvr_1','RVR 1',5,'m',0,RV,'',1,'0325 · P2000 · M0050',RVT],
['active_rwy_2','RWY 2',3,'',0,RW,'',1,RM,RWT],['rvr_2','RVR 2',5,'m',0,RV,'',1,'0325 · P2000 · M0050',RVT],
['active_rwy_3','RWY 3',3,'',0,RW,'',1,RM,RWT],['rvr_3','RVR 3',5,'m',0,RV,'',1,'0325 · P2000 · M0050',RVT],
['active_rwy_4','RWY 4',3,'',0,RW,'',1,RM,RWT],['rvr_4','RVR 4',5,'m',0,RV,'',1,'0325 · P2000 · M0050',RVT],
['vertical_cloud','Vertical vis.',5,'',0,'^VV(\\d{3}|///)$','',1,'VV003 or VV///','VV + 3 digits in 100 ft · e.g. VV003 · VV/// when it cannot be assessed'],
['cloud_1','Cloud 1',9,'',0,'^(NSC|SKC|(FEW|SCT|BKN|OVC)\\d{3}(CB|TCU)?)$','NSC',1,'e.g. FEW020 · NSC','Amount + height in 100 ft (+CB/TCU) · e.g. FEW020 · NSC if no significant cloud'],
['cloud_2','Cloud 2',9,'',0,CL,'',1,'e.g. SCT025CB','Amount + height in 100 ft (+CB/TCU) · e.g. SCT025CB'],
['cloud_3','Cloud 3',9,'',0,CL,'',1,'e.g. BKN100','Amount + height in 100 ft (+CB/TCU) · e.g. BKN100'],
['cloud_4','Cloud 4',9,'',0,CL,'',1,'e.g. FEW030TCU','Extra layer only for CB / TCU · e.g. FEW030TCU'],
['individual_cloud','Individual cloud layer',20,'',0,AN(20),'0',1,'max 20','Individual layer code string, max 20 characters · e.g. 3602019025'],
['total_cloud','Total cloud',1,'OKTA',0,'^[0-8]?$','0',0,'0–8','Total cloud in okta, one digit 0–8 · e.g. 4'],
['temperature','Temperature',5,'°C',1,TD,'',0,'e.g. 32.9','Air temperature, one decimal · e.g. 32.9 · -2.5'],
['dewpoint','Dew point',5,'°C',1,TD,'',0,'e.g. 23.7','Dew point, one decimal · e.g. 23.7 · must not exceed temperature'],
['qnh','QNH',6,'hPa',1,PR,'',0,'e.g. 1002.1','Pressure, one decimal · e.g. 1002.1'],
['qfe','QFE',6,'hPa',1,PR,'',0,'e.g. 0998.2','Pressure, one decimal · e.g. 0998.2 · must not exceed QNH'],
['trend','Trend',255,'',0,P,'NOSIG',1,'printable chars only','BECMG / TEMPO / NOSIG with groups if needed · e.g. BECMG FM1200 4000 HZ'],
['remarks','Remarks',200,'',0,'','',0,'','Free text · e.g. CB TO N/NW'],
['remarks1','Remarks 1',255,'',0,P,'',0,'printable chars only','Free text, printable characters only'],
['remarks2','Remarks 2',255,'',0,P,'DISPLAYED ON RWY 10',0,'printable chars only','Free text · e.g. DISPLAYED ON RWY 10'],
['remarks3','Remarks 3',255,'',0,P,'',0,'printable chars only','Free text, printable characters only']
];
const F={};L.forEach(f=>F[f[0]]=f);
$$('[data-f]').forEach(el=>{const n=el.dataset.f,f=F[n],u=el.dataset.u!==undefined?el.dataset.u:f[3];
 el.className=(el.className+' cell'+(f[4]?' rq':'')).trim();
 el.dataset.tip=f[9];if(f[6])el.dataset.def=f[6];
 el.innerHTML=`<div class="cl"><label for="id_${n}">${f[1]}</label><em class="er"></em></div><div class="cv"><input type="text" name="${n}" id="id_${n}" maxlength="${f[2]}" autocomplete="off" spellcheck="false"${f[4]?' required':''}>${u?`<span class="u">${u}</span>`:''}${el.dataset.ic?`<svg class="ic ic2"><use href="#i-${el.dataset.ic}"/></svg>`:''}</div>`});
$$('.cell,.fc').forEach(c=>c.addEventListener('mousedown',e=>{if(e.target.closest('input,textarea,button,label,select'))return;const i=c.querySelector('input[type=text],textarea');if(i&&!i.disabled){e.preventDefault();i.focus()}}));

const tip=$('#tip');let cur=null,tm=0;
function hideTip(){clearTimeout(tm);cur=null;tip.classList.remove('on')}
function showTip(c){
 const l=c.querySelector('label'),b=document.createElement('b'),s=document.createElement('span');
 b.textContent=l?l.textContent:'';s.textContent=c.dataset.tip;tip.replaceChildren(b,s);
 if(c.dataset.def){const d=document.createElement('em');d.textContent='Left blank → '+c.dataset.def;tip.append(d)}
 tip.classList.add('on');
 const r=c.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;
 let x=Math.min(Math.max(8,r.left),innerWidth-w-8),y=r.bottom+8;if(y+h>innerHeight-8)y=r.top-h-8;
 tip.style.left=x+'px';tip.style.top=y+'px'}
document.addEventListener('mouseover',e=>{const c=e.target.closest&&e.target.closest('[data-tip]');if(c===cur)return;clearTimeout(tm);tip.classList.remove('on');cur=c;if(c)tm=setTimeout(()=>showTip(c),800)});
document.addEventListener('mouseout',e=>{if(!e.relatedTarget)hideTip()});
window.addEventListener('scroll',hideTip,true);
document.addEventListener('mousedown',hideTip);

const p2=n=>String(n).padStart(2,'0'),val=n=>(id(n).value||'').trim(),E={};
const MN=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MF=['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmt=d=>`${p2(d.getUTCDate())}/${p2(d.getUTCMonth()+1)}/${d.getUTCFullYear()} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())} UTC`;
const tick=()=>{const d=new Date();$('#clk').textContent=d.toISOString().substr(11,8);$('#clkd').textContent=p2(d.getUTCDate())+' '+MN[d.getUTCMonth()]+' '+d.getUTCFullYear()};tick();setInterval(tick,1000);
const parseDT=s=>{const m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);return m?Date.UTC(+m[3],m[2]-1,+m[1],+m[4],+m[5]):null};
function dt2f(){const t=parseDT(id('data_datetime').value);if(t===null)return;const d=new Date(t);id('metar_date').value=`${p2(d.getUTCDate())}/${p2(d.getUTCMonth()+1)}/${d.getUTCFullYear()}`;id('metar_time').value=p2(d.getUTCHours())+p2(d.getUTCMinutes())}
function f2dt(){const d=val('metar_date').split('/'),t=val('metar_time');if(d.length==3&&t.length==4)id('data_datetime').value=fmt(new Date(Date.UTC(+d[2],d[1]-1,+d[0],+t.slice(0,2),+t.slice(2))))}
function setNow(){id('data_datetime').value=fmt(new Date());dt2f()}
$('#nowBtn').onclick=setNow;id('data_datetime').addEventListener('change',dt2f);
['metar_date','metar_time'].forEach(n=>id(n).addEventListener('change',f2dt));
window.addEventListener('pageshow',e=>{if(e.persisted)setNow()});

function show(){const a=Object.keys(E).filter(k=>E[k]);$('#msg').textContent=a.length?a.length+' field'+(a.length>1?'s':'')+' need attention':''}
function err(n,m){const c=id(n).closest('.cell,.fc');c.classList.toggle('bad',!!m);const e=c.querySelector('.er');if(e){e.textContent=m||'';e.title=m||'';e.classList.remove('ok')}E[n]=m;show()}
const vis=()=>parseInt(val('visibility'),10);
function vf(n){const f=F[n],v=val(n),V=vis();let m='';
 if(n=='weather'){if(!isNaN(V)&&V<=5000&&!v)m='mandatory (vis ≤ 5000)'}
 else if(n=='active_rwy_1'){if(!isNaN(V)&&V<=1500&&!v)m='mandatory (vis ≤ 1500)'}
 else if(/^active_rwy_[234]$/.test(n)){if(!isNaN(V)&&V<=1500&&val('rvr_'+n.slice(-1))&&!v)m='needed with RVR '+n.slice(-1)}
 else if(f[4]&&!v)m='required';
 if(!m&&v&&f[5]&&!new RegExp(f[5]).test(v))m=f[8]||'invalid';
 if(!m&&n=='weather'&&v.split(/\s+/).some(g=>!WG.test(g)))m='unknown weather group';
 err(n,m);return!m}
function cross(){let ok=true;
 ['dewpoint','qfe','cloud_4','vertical_cloud','wind_maximum','wind_maximum_10','weather'].forEach(n=>{if(E[n]&&/^(exceeds|4th|VV replaces|10 kt|max 3)/.test(E[n]))err(n,'')});
 const T=parseFloat(val('temperature')),D=parseFloat(val('dewpoint')),N=parseFloat(val('qnh')),Q=parseFloat(val('qfe'));
 if(!isNaN(T)&&!isNaN(D)&&D>T){err('dewpoint','exceeds temperature');ok=false}
 if(!isNaN(N)&&!isNaN(Q)&&Q>N){err('qfe','exceeds QNH');ok=false}
 [['wind','wind_maximum'],['wind_10','wind_maximum_10']].forEach(([wn,gn])=>{const g=parseInt(val(gn),10),w=val(wn).match(/^(?:\d{3}|VRB)(\d{2})$/);
 if(!isNaN(g)&&w&&g-(+w[1])<10){err(gn,'10 kt or more above mean ('+(+w[1])+')');ok=false}});
 const cl=[1,2,3,4].map(k=>val('cloud_'+k)).filter(Boolean);
 if(cl.filter(x=>!/(CB|TCU)$/.test(x)).length>3){err('cloud_4','4th layer only for CB / TCU');ok=false}
 if(val('vertical_cloud')&&cl.length){err('vertical_cloud','VV replaces cloud groups');ok=false}
 const wg=val('weather').split(/\s+/).filter(Boolean);
 if(wg.length>3){err('weather','max 3 groups');ok=false}
 return ok}
function rwy(){const V=vis(),on=!isNaN(V)&&V<=1500;['active_rwy_1','rvr_1','active_rwy_2','rvr_2','active_rwy_3','rvr_3','active_rwy_4','rvr_4'].forEach(n=>{const i=id(n);i.disabled=!on;i.closest('.cell').classList.toggle('off',!on);if(!on){i.value='';err(n,'')}})}
function cavok(){const c=val('visibility')=='9999'&&!['cloud_1','cloud_2','cloud_3','cloud_4'].some(n=>val(n));
 id('weather').closest('.cell').classList.toggle('off',c);
 const e=id('visibility').closest('.cell').querySelector('.er');if(!E.visibility){e.textContent=c?'CAVOK':'';e.classList.toggle('ok',c)}}
Object.keys(F).forEach(n=>{const el=id(n);
 el.addEventListener('input',()=>{if(F[n][7])el.value=el.value.toUpperCase();if(n=='visibility')rwy();cavok()});
 el.addEventListener('blur',()=>{vf(n);cross()})});
function autoWx(){const c=wxTop(val('weather'));['significant_weather','present_weather'].forEach(n=>{const i=id(n);if(i.value===(i.dataset.a||'')){i.value=c;i.dataset.a=c;if(E[n])err(n,'')}})}
id('weather').addEventListener('input',autoWx);

function timeErr(){const t=parseDT(val('data_datetime')),sp=$('[name=metar_specification]:checked').value,now=Date.now();let m='';
 if(t!==null){if(sp=='METAR'){if(t<now-30*6e4)m='>30 min in the past';else if(t>now+20*6e4)m='>20 min in the future'}else if(t<now-10*6e4)m='>10 min before now'}
 return m}
$('#mf').addEventListener('submit',e=>{e.preventDefault();let ok=true;
 const m=timeErr();err('data_datetime',m);if(m)ok=false;
 const o=val('tower_met_officer');err('tower_met_officer',o?'':'required');if(!o)ok=false;
 Object.keys(F).forEach(n=>{if(!vf(n))ok=false});if(!cross())ok=false;
 if(!ok){show();const b=$('.cell.bad input,.fc.bad input');b&&b.focus();return}
 SS.set('md_pend','1');location.hash='#review'});
$('#mf').addEventListener('reset',()=>setTimeout(()=>{Object.keys(E).forEach(k=>err(k,''));['significant_weather','present_weather'].forEach(n=>{id(n).dataset.a=''});rwy();cavok()},0));

const nav=$$('#sg-metar a');
const mark=k=>nav.forEach(a=>a.classList.toggle('on',a.dataset.k==k));
nav.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();let i=id(a.dataset.k);
 if(i.disabled)i=id('visibility');
 i.scrollIntoView({block:'nearest'});i.focus();i.select&&i.select();mark(a.dataset.k)}));
const KM={dewpoint:'temperature',qfe:'qnh',remarks1:'remarks',remarks2:'remarks',remarks3:'remarks'};
document.addEventListener('focusin',e=>{const n=(e.target.id||'').replace(/^id_/,''),c=e.target.closest&&e.target.closest('[data-k]'),k=nav.some(a=>a.dataset.k==n)?n:KM[n]||(c&&c.dataset.k);if(k&&$('#sg-metar').offsetParent)mark(k)});

const dnav=$$('#sg-dash a');
function sec(x){document.body.dataset.sec=x;dnav.forEach(a=>a.classList.toggle('on',a.dataset.s==x));$('#main').scrollTop=0}
dnav.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();sec(a.dataset.s)}));
$$('.tile').forEach(t=>t.addEventListener('click',e=>{if(document.body.dataset.sec!=='all'||e.target.closest('a,button'))return;sec(t.id)}));

$('#logMonth').textContent='Showing '+MF[new Date().getMonth()]+' '+new Date().getFullYear();
$$('[data-log]').forEach(b=>b.addEventListener('click',()=>{
 const path='Log/Current Month/'+MF[new Date().getMonth()]+'_'+b.dataset.log+'.txt';
 window.open('generate_pdf.php?file='+encodeURIComponent(path),'_blank')}));

function stn(){const o=$('#id_station'),t=(o.options[o.selectedIndex]||{}).text||'',m=t.match(/\(([A-Za-z0-9]{3,4})\)/),ic=(m?m[1]:t).toUpperCase(),nm=t.replace(/\s*\(.*\)\s*/,'').trim();
 ['heroI','stI','sideI'].forEach(x=>$('#'+x).textContent=ic);['heroN','stN','sideN'].forEach(x=>$('#'+x).textContent=nm)}
$('#id_station').addEventListener('change',stn);stn();

const LS={get:k=>{try{return localStorage.getItem(k)}catch(_){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(_){}},del:k=>{try{localStorage.removeItem(k)}catch(_){}}};
const SS={get:k=>{try{return sessionStorage.getItem(k)}catch(_){return null}},set:(k,v)=>{try{sessionStorage.setItem(k,v)}catch(_){}},del:k=>{try{sessionStorage.removeItem(k)}catch(_){}}};
const ST={voga:{n:'AMS GOA',i:'VOGA',v:'44'},vakp:{n:'AMS KOLHAPUR',i:'VAKP',v:'45'}};
const DEF={voga:'voga',vakp:'vakp'};
try{JSON.parse(LS.get('md_stations')||'[]').forEach(x=>{if(x&&x.k&&!ST[x.k])ST[x.k]={n:x.n,i:x.i,v:x.v}})}catch(_){}
const saveCustom=()=>LS.set('md_stations',JSON.stringify(Object.keys(ST).filter(k=>!DEF[k]).map(k=>({k,n:ST[k].n,i:ST[k].i,v:ST[k].v}))));
function syncStations(){const s=$('#id_station'),c=s.value;
 s.replaceChildren(...Object.keys(ST).map(k=>{const o=document.createElement('option');o.value=ST[k].v;o.textContent=ST[k].n+' ('+ST[k].i+')';return o}));
 if([...s.options].some(o=>o.value==c))s.value=c;stn()}
syncStations();
const hs=s=>{let a=0xdeadbeef,b=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,2654435761);b=Math.imul(b^c,1597334677)}a=Math.imul(a^(a>>>16),2246822507)^Math.imul(b^(b>>>13),3266489909);b=Math.imul(b^(b>>>16),2246822507)^Math.imul(a^(a>>>13),3266489909);return(4294967296*(2097151&b)+(a>>>0)).toString(36)};
const acct=k=>{let o=null;try{o=JSON.parse(LS.get('md_cred_'+k))}catch(_){}return o&&o.u&&o.h?o:{u:k,h:DEF[k]!=null?hs('md|'+DEF[k]):'-'}};
const sk=()=>{const k=SS.get('md_sess');return ST[k]?k:null};
function applySess(){const k=sk();if(!k)return;const s=ST[k];$('#id_station').value=s.v;stn();$('#whoName').textContent='Welcome, '+acct(k).u;$('#whoStn').textContent=s.n+' ('+s.i+')'}

const pw=$('#pw'),pt=$('#pwToggle');
pt.addEventListener('click',()=>{const h=pw.type==='password';pw.type=h?'text':'password';pt.textContent=h?'Hide':'Show'});
$('#loginForm').addEventListener('submit',e=>{e.preventDefault();
 const u=$('#user').value.trim().toLowerCase(),p=pw.value;
 const k=Object.keys(ST).find(x=>{const a=acct(x);return a.u.toLowerCase()==u&&a.h==hs('md|'+p)});
 if(!k){$('#authErr').classList.remove('ok');$('#authErr').textContent='Incorrect username or password';pw.value='';pw.focus();return}
 $('#authErr').textContent='';SS.set('md_sess',k);$('#loginForm').reset();pw.type='password';pt.textContent='Show';
 sec('all');location.hash='#dashboard';route()});
const card=$('.auth-card'),ae=$('#authErr'),ade=$('#addErr'),fge=$('#fgErr');
const ADMIN={u:'admin',h:hs('md|admin')};
const adminOk=(u,p)=>u.trim().toLowerCase()==ADMIN.u&&hs('md|'+p)==ADMIN.h;
const MT={login:'LOGIN',add:'ADD AIRPORT',forgot:'RESET PASSWORD'},MF0={login:'#user',add:'#ad_au',forgot:'#fg_u'};
function mode(m){card.dataset.mode=m;$('#authTitle').textContent=MT[m];ae.textContent='';ae.classList.remove('ok');ade.textContent='';fge.textContent='';$(MF0[m]).focus()}
$('#goAdd').addEventListener('click',()=>mode('add'));
$('#goForgot').addEventListener('click',()=>mode('forgot'));
$$('[data-back]').forEach(b=>b.addEventListener('click',()=>mode('login')));
$('#ad_icao').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z]/g,'')});
$('#addForm').addEventListener('submit',e=>{e.preventDefault();
 const i=$('#ad_icao').value.trim().toUpperCase(),n=$('#ad_name').value.trim(),p=$('#ad_pw').value,c=$('#ad_pw2').value,k=i.toLowerCase();
 const bad=t=>{ade.textContent=t};
 if(!adminOk($('#ad_au').value,$('#ad_ap').value))return bad('Admin username or password is wrong');
 if(!/^[A-Z]{4}$/.test(i))return bad('ICAO code must be 4 letters');
 if(ST[k])return bad(i+' is already added');
 if(n.length<2)return bad('Enter the station name');
 if(p.length<4)return bad('Password needs at least 4 characters');
 if(p!=c)return bad('Passwords do not match');
 ST[k]={n,i,v:'c-'+k};saveCustom();LS.set('md_cred_'+k,JSON.stringify({u:k,h:hs('md|'+p)}));syncStations();
 $('#addForm').reset();mode('login');$('#user').value=k;pw.focus();ae.textContent=i+' added. Sign in with username '+k;ae.classList.add('ok')});
$('#fgForm').addEventListener('submit',e=>{e.preventDefault();
 const u=$('#fg_u').value.trim().toLowerCase(),p=$('#fg_p').value,c=$('#fg_p2').value,bad=t=>{fge.textContent=t};
 if(!adminOk($('#fg_au').value,$('#fg_ap').value))return bad('Admin username or password is wrong');
 const k=Object.keys(ST).find(x=>x==u||acct(x).u.toLowerCase()==u);
 if(!k)return bad('No airport found for this username');
 if(p.length<4)return bad('Password needs at least 4 characters');
 if(p!=c)return bad('Passwords do not match');
 LS.set('md_cred_'+k,JSON.stringify({u:acct(k).u,h:hs('md|'+p)}));
 $('#fgForm').reset();mode('login');$('#user').value=acct(k).u;pw.focus();ae.textContent='Password reset. Sign in with the new password';ae.classList.add('ok')});
$('#logoutBtn').addEventListener('click',()=>{SS.del('md_sess');location.hash='#login';route()});

const dlg=$('#acct'),acErr=$('#acErr');
const acMsg=(m,ok)=>{acErr.textContent=m;acErr.classList.toggle('ok',!!ok)};
$('#acctBtn').addEventListener('click',()=>{const k=sk();if(!k)return;$('#acForm').reset();$('#acU').value=acct(k).u;$('#acReset').style.display=DEF[k]?'':'none';acMsg('');dlg.showModal();$('#acCur').focus()});
$('#acCancel').addEventListener('click',()=>dlg.close());
$('#acReset').addEventListener('click',()=>{const k=sk();if(!k)return;LS.del('md_cred_'+k);$('#acU').value=acct(k).u;$('#acCur').value='';applySess();acMsg('Back to the temporary login for this station',1)});
$('#acForm').addEventListener('submit',e=>{e.preventDefault();const k=sk();if(!k)return;
 const cur=$('#acCur').value,u=$('#acU').value.trim(),p=$('#acP').value,c=$('#acC').value;
 if(hs('md|'+cur)!=acct(k).h)return acMsg('Current password is incorrect');
 if(!/^[A-Za-z0-9_.-]{3,20}$/.test(u))return acMsg('Username: 3–20 letters, digits, . _ -');
 if(Object.keys(ST).some(x=>x!=k&&acct(x).u.toLowerCase()==u.toLowerCase()))return acMsg('Username already used by another station');
 if(p&&p.length<4)return acMsg('Password needs at least 4 characters');
 if(p!=c)return acMsg('Passwords do not match');
 LS.set('md_cred_'+k,JSON.stringify({u,h:p?hs('md|'+p):acct(k).h}));applySess();acMsg('Saved in this browser',1);setTimeout(()=>dlg.close(),900)});

let pv='';
function route(){
 const k=sk(),h=location.hash,v=({'#metar':'metar','#review':'review','#done':'done','#login':'login'})[h]||'dash';
 if(!k&&v!='login'){location.hash='#login';return}
 if(k&&v=='login'){location.hash='#dashboard';return}
 if(v=='review'&&!SS.get('md_pend')){location.hash='#metar';return}
 if(v=='done'&&!SS.get('md_last')){location.hash='#metar';return}
 if(v=='metar')SS.del('md_pend');
 document.body.dataset.view=v;
 const tv=v=='review'||v=='done'?'metar':v;
 $$('.tabs a').forEach(a=>a.classList.toggle('on',a.dataset.v==tv));
 $('#main').scrollTop=0;hideTip();
 if(v=='login'){$('#id_station').classList.remove('lock');setTimeout(()=>mode('login'),0)}
 else{applySess();$('#id_station').classList.add('lock');if(v=='metar'&&pv!='review')setNow();
  if(window.MARS_VIEW&&MARS_VIEW[v])MARS_VIEW[v]()}
 pv=v;fitL()}
window.addEventListener('hashchange',route);
/* fit METAR form in one screen (no scroll) at any browser size */
function fit(){const m=$('#main'),vw=document.body.dataset.view;
 $$('.view').forEach(x=>{x.style.cssText=''});
 if(!/^(metar|review|done)$/.test(vw)||innerWidth<=900)return;
 const v=$('#v-'+vw),cs=getComputedStyle(m),aH=m.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom),aW=m.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
 const z=Math.min(1,aH/v.scrollHeight,aW/v.scrollWidth);if(z>=.999)return;
 const q=Math.floor(z*1000)/1000-.003;
 if(CSS.supports('zoom','.5'))v.style.zoom=q;
 else{v.style.cssText+=`;flex:none;width:${aW/q}px;height:${aH/q}px;transform:scale(${q});transform-origin:0 0`}}
let ft=0;const fitL=()=>{cancelAnimationFrame(ft);ft=requestAnimationFrame(fit)};
window.addEventListener('resize',fitL);window.addEventListener('load',fitL);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitL);


window.MARS={F,val,setNow,timeErr,route,fit:fitL,SS,LS,sk,ST};
setNow();rwy();cavok();route();
})();
