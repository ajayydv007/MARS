(function(){
'use strict';
const $=s=>document.querySelector(s);
const real=n=>document.getElementById('id_'+n);
const gv=n=>{const e=real(n);return e?String(e.value||'').trim():''};
const p2=n=>String(n).padStart(2,'0');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sp=()=>{const r=document.querySelector('[name=metar_specification]:checked');return r?r.value:'METAR'};

/* colour themes follow the palette already used on the form panels */
const TH={
 rep:['#274690','#dbe4f7','#eef2fb'],wind:['#2563eb','#c9dcfb','#e2ecfd'],vis:['#16a34a','#cdf0dc','#e4f8ec'],
 wx:['#ea7a0c','#fcdcb8','#fdeedd'],rvr:['#1f3f8f','#d3def0','#eaf0fb'],cld:['#1d6bf3','#d3e0f5','#eaf1fd'],
 tmp:['#15803d','#bfe6c9','#e3f6e8'],trd:['#d9480f','#f6d7b8','#fef1e4'],spc:['#e11d2e','#fbcfcf','#fde5e5'],off:['#2a4a8f','#dbe4f1','#eef2fa']
};
/* blank-field defaults applied by the form on submit */
const DF={present_weather:'00',past_weather:'0',cloud_1:'NSC',individual_cloud:'0',total_cloud:'0',trend:'NOSIG',remarks2:'DISPLAYED ON RWY 10'};

/* ------------------------------------------------------------------ SOP content */
const S=[
{id:'type',g:'Report',t:'METAR / SPECI',ic:'plane',th:'spc',f:[],code:'METAR | SPECI',
 rules:[
  '<b>METAR</b> = routine report, every <b>30 min</b> (at :00 and :30 UTC).',
  '<b>SPECI</b> = special report when a criterion below is crossed. India stopped issuing SPECI from <b>15 Nov 2015</b> because METAR is half-hourly.',
  '<b>Local special</b> reports go to ATC at once, even for an improvement.',
  '<b>Deterioration</b> → send immediately. <b>Improvement</b> → send only after it has held <b>10 min</b>.',
  'One element worse and another better → send <b>one</b> report, treated as a deterioration.'],
 tbl:{h:['Element','Issue a special report when…'],r:[
  ['Wind','Direction changes by 60° or more (mean 10 kt or more) · speed changes by 10 kt or more · gust rises by 10 kt or more (mean 15 kt or more)'],
  ['Visibility','Crosses <b>800 · 1500 · 3000 · 5000</b> m'],
  ['RVR','Crosses <b>150 · 350 · 600 · 800</b> m'],
  ['Cloud (BKN/OVC base)','Crosses <b>30 · 60 · 150 · 300 · 450</b> m (100 · 200 · 500 · 1000 · 1500 ft) · a layer below 1500 ft changes SCT ↔ BKN'],
  ['Vertical visibility','Crosses <b>30 · 60 · 150 · 300</b> m'],
  ['Weather','<b>Start / end / intensity change:</b> FZ precip, moderate-heavy precip, TS with precip, DS, SS, FC · <b>Start / end:</b> IC, FZFG, DR / BL, TS without precip, SQ'],
  ['Temperature','Rises by 2 °C or more since the last report'],
  ['Additional report (local)','Visibility crosses <b>550 · 1200 · 2000 · 2500 · 4000</b> m · cloud base (more than half the sky) crosses <b>90 / 120</b> m (300 / 400 ft)']]}},

{id:'dt',g:'Report',t:'Data Date & Time',ic:'cal',th:'rep',f:['data_datetime'],code:'DD/MM/YYYY HH:mm UTC',
 rules:[
  'Always <b>UTC</b>. Tap <b>NOW</b> to fill the current UTC time.',
  'METAR time is <b>:00</b> or <b>:30</b> of the observation hour.',
  'Allowed window: METAR from <b>30 min before</b> to <b>20 min after</b> now · SPECI up to <b>10 min</b> back.',
  'Date and Time boxes follow this box automatically — and the other way round.'],
 ex:[['16/10/2026 10:30 UTC','time group <b>161030Z</b> (16th, 1030 UTC)']]},

{id:'date',g:'Report',t:'Date',ic:'cal',th:'rep',f:['metar_date'],code:'DD/MM/YYYY',
 rules:[
  'Follows Data Date &amp; Time automatically.',
  'The day of the month becomes the first two digits of the time group (<code>DD</code>hhmmZ).'],
 ex:[['16/10/2026','day <b>16</b> → 16hhmmZ']]},

{id:'time',g:'Report',t:'Time (UTC)',ic:'clock',th:'rep',f:['metar_time'],code:'HHMM',
 rules:[
  '4 digits, 24-hour, <b>UTC</b>.',
  'Becomes hhmm + <b>Z</b> in the time group.',
  'METAR minutes are <b>00</b> or <b>30</b>.'],
 ex:[['0600','06:00 UTC → ddhhmm<b>Z</b> = 160600Z']]},

{id:'cca',g:'Report',t:'CCA',ic:'msg',th:'rep',f:['metar_cca'],code:'CCA – CCZ',
 rules:[
  'Fill <b>only</b> when this report <b>corrects</b> an earlier one — otherwise leave it blank.',
  'Format <b>CCA–CCZ</b>: first correction CCA, next CCB, and so on.',
  'Send the corrected report <b>immediately</b> after the error is found.',
  'The correction word sits with the code name / time group. NIL is not used in India.'],
 ex:[['CCA','first correction of this observation']]},

{id:'wind',g:'Wind',t:'Wind',ic:'wind',th:'wind',f:['wind'],code:'dddff KT',
 rules:[
  '<b>dddff</b> — direction in 3 digits (true, nearest <b>10°</b>) + speed in 2 digits. <b>KT</b> is added by the system.',
  'Mean of the last <b>10 min</b>. After a marked change (30° or more at 10 kt or more, or a 10 kt speed change) lasting 2 min or more, average only <b>after</b> the change.',
  'Below 100° → leading 0 · north = <b>360</b> · speed below 10 → leading 0.',
  '<b>Calm</b> (under 1 kt) → <b>00000</b>.',
  '<b>VRB</b> when mean is under 3 kt (VRB02). At higher speed only if direction varies by 180° or more, or no single direction exists (e.g. TS overhead).',
  'Direction varies 60° to 179° at 3 kt or more → give both extremes clockwise: <code>31015KT 280V020</code>.'],
 ex:[['12005','from 120°, 5 kt'],['36012','from north, 12 kt'],['VRB02','variable, 2 kt'],['00000','calm']],
 note:'Wind instrument out? Read the wind sock for direction and use the Beaufort scale for speed. Never estimate gusts.'},

{id:'gust',g:'Wind',t:'Max Wind (gust)',ic:'wind',th:'wind',f:['wind_maximum'],code:'G gg KT',
 rules:[
  'Add a gust <b>only</b> when the maximum speed exceeds the mean by <b>10 kt or more</b>.',
  'Gust = highest <b>3-second</b> average in the last 10 min.',
  'Digits only — <b>G</b> and <b>KT</b> are added automatically.',
  'No gust → leave blank.'],
 ex:[['30','with wind 31015 → <b>31015G30KT</b>']]},

{id:'vis',g:'Visibility',t:'Visibility',ic:'eye',th:'vis',f:['visibility'],code:'VVVV (metres)',
 rules:[
  '<b>4 digits</b>, metres — report the <b>lowest</b> visibility around the point of observation.',
  'Steps: <b>under 800 m</b> → 50 m · <b>800–4999 m</b> → 100 m · <b>5–9 km</b> → 1 km · <b>10 km or more</b> → <b>9999</b>.',
  'Value not on a step → <b>round down</b> (4350 → 4300 · 5800 → 5000).',
  'Judge by eye with the visibility landmarks / polar diagram (day and night).',
  '<b>CAVOK</b> needs all three: vis 10 km or more, no cloud of operational significance, no significant weather.'],
 ex:[['4000','4 km'],['0600','600 m'],['9999','10 km or more']],
 link:'Visibility 5000 m or less → Weather becomes mandatory · 1500 m or less → RVR boxes unlock.'},

{id:'sector',g:'Visibility',t:'Sector Visibility',ic:'eye',th:'vis',f:['sector_visibility'],code:'VVVV + direction',
 rules:[
  'Only for a <b>marked</b> variation: lowest visibility under 5000 m <b>and</b> another direction differs by 50% of it or more.',
  'Give the lowest visibility followed by one of 8 compass points: <b>N NE E SE S SW W NW</b>.',
  'Lowest seen in several directions → give the most operationally significant one.',
  'Lowest under 1500 m and another direction above 5000 m → also give that maximum visibility + direction.'],
 ex:[['2000SE','2000 m toward south-east'],['1400SW 6000N','1400 m SW and 6 km N']],
 note:'Type the second (maximum visibility) sector after a space, e.g. 1400SW 6000N.'},

{id:'weather',g:'Weather',t:'Weather',ic:'rain',th:'wx',f:['weather'],code:'w′w′ · max 3 groups',
 rules:[
  '<b>Order:</b> intensity → descriptor → phenomenon, no spaces — heavy shower of rain = <code>+SHRA</code>.',
  'Intensity (<b>–</b> light, <b>+</b> heavy, none = moderate) only for precipitation, showers / TS with precipitation, DS and SS.',
  'Max <b>3 groups</b>. Several precipitation types in one group — dominant first.',
  '<b>BR</b> = vis 1000–5000 m · <b>FG</b> = vis under 1000 m · <b>HZ FU DU SA</b> only when vis is reduced to 5000 m or less.',
  '<b>TS</b> = thunder heard or lightning seen at the aerodrome in the last 10 min. It ends only after 10 min with no thunder.',
  '<b>GR</b> hail 5 mm or more (smaller = GS) · <b>SQ</b> sudden rise of 16 kt or more to 22 kt or more for 1 min · <b>VC</b> = near, not at, the aerodrome.'],
 ex:[['+SHRA','heavy shower of rain'],['TSRA','thunderstorm with moderate rain'],['BR','mist · vis 1000–5000 m'],['VCTS','thunderstorm in the vicinity']],
 chips:[['RA','Rain'],['DZ','Drizzle'],['SH','Showers'],['TS','Thunderstorm'],['FG','Fog'],['BR','Mist'],['HZ','Haze'],['FU','Smoke'],['DU','Dust'],['SA','Sand'],['DS','Dust storm'],['SS','Sand storm'],['SQ','Squall'],['FC','Funnel cloud'],['GR','Hail'],['GS','Small hail'],['VC','Vicinity'],['MI','Shallow'],['BC','Patches'],['PR','Partial'],['FZ','Freezing'],['BL','Blowing'],['DR','Low drifting']],
 link:'Mandatory when visibility is 5000 m or less. With CAVOK leave it blank.'},

{id:'wxc',g:'Weather',t:'Weather Codes',ic:'warn',th:'wx',f:['significant_weather','present_weather','past_weather'],code:'2-digit weather codes',
 rules:[
  'Every weather code is <b>2 digits at most</b>: <b>Significant weather</b> and <b>Present weather</b> use 2 digits (05, 63, 95), <b>Past weather</b> takes 1 or 2 digits (6).',
  '<b>Significant</b> and <b>Present</b> are filled automatically from the Weather box — the group with the highest priority is used (thunderstorm → showers → rain → snow → drizzle → fog → mist → haze). You can overwrite either box.',
  '<b>Present</b> blank → <b>00</b> · <b>Past</b> blank → <b>0</b> · <b>Significant</b> stays empty when there is no weather.',
  '<b>Past weather</b> is the weather that occurred in the last hour but has ended now. Look the phenomenon up below: rain that has stopped → <b>6</b>, fog → <b>4</b>, thunderstorm → <b>9</b>.',
  'Intensity changes the code: light, moderate and heavy rain are <b>61 · 63 · 65</b>; light, moderate and heavy shower of rain are <b>80 · 81 · 82</b>.',
  'The codes are not part of the METAR text — they are kept in the record only.'],
 ex:[['RA','present <b>63</b> · past <b>6</b>'],['+SHRA','present <b>82</b> · past <b>8</b>'],['TSRA','present <b>95</b> · past <b>9</b>'],['HZ','present <b>05</b> · past <b>4</b>'],['BR','present <b>10</b> · past <b>4</b>']],
 link:'Weather box empty → Present becomes 00 and Past becomes 0 when you submit.'},

{id:'rvr',g:'RVR',t:'RVR',ic:'road',th:'rvr',f:['active_rwy_1','rvr_1','active_rwy_2','rvr_2','active_rwy_3','rvr_3','active_rwy_4','rvr_4'],code:'R rr / vvvv',
 rules:[
  'Report RVR when visibility <b>or</b> RVR is below <b>1500 m</b>. These boxes unlock when visibility is 1500 m or less.',
  '<code>R24/1100</code> = runway / RVR in metres. Up to <b>4 runways</b>, touchdown-zone value for each.',
  'Steps: under 400 m → <b>25 m</b> · 400–800 m → <b>50 m</b> · above 800 m → <b>100 m</b>. Round <b>down</b>.',
  'Above 2000 m → type <b>P2000</b> · below the instrument minimum → type <b>M</b> + the minimum, 4 digits (<b>M0050</b>). The boxes accept both.',
  'Instrument RVR is a <b>10-min mean</b> for METAR; after a marked change use only the values after it.',
  'RVR 1500–2000 m is supplementary — not sent internationally (goes in RMK).',
  'No instrument and visibility 1500 m or less → <b>manual RVR</b>: count runway edge lights (60 m apart) from the observing point and read the calibrated table.'],
 ex:[['1100','runway 24 → R24/1100'],['P2000','more than 2000 m → R24/P2000'],['M0050','below the minimum → R24/M0050']]},

{id:'clouds',g:'Clouds',t:'Clouds',ic:'cloud',th:'cld',f:['cloud_1','cloud_2','cloud_3','cloud_4'],code:'NsNsNs hshshs',
 rules:[
  'Amount: <b>FEW</b> 1–2 · <b>SCT</b> 3–4 · <b>BKN</b> 5–7 · <b>OVC</b> 8 okta. Then height in 100 ft, 3 digits: <code>SCT018</code> = 1800 ft.',
  'Cloud type only for <b>CB</b> and <b>TCU</b> (FEW010CB). CB and TCU on one base → report <b>CB</b>, amounts added.',
  'Layers in <b>ascending</b> order, <b>max 3</b>: lowest layer (any amount) · next above 2/8 · next above 4/8.',
  '<b>CB / TCU</b> is reported whenever seen, even as an extra layer — so a <b>4th box</b> is allowed only for a CB / TCU layer.',
  'No significant cloud and CAVOK not usable → <b>NSC</b> (blank Cloud 1 becomes NSC).',
  '<b>Significant</b> cloud: base below 5000 ft (1500 m) or the highest MSA, or CB / TCU at any height.'],
 ex:[['SCT018','3–4 okta at 1800 ft'],['FEW010CB','1–2 okta cumulonimbus at 1000 ft'],['FEW030TCU','extra 4th layer — only CB / TCU'],['NSC','no significant cloud']]},

{id:'vv',g:'Clouds',t:'Vertical Visibility',ic:'cloud',th:'cld',f:['vertical_cloud'],code:'VV hhh',
 rules:[
  'Sky obscured and cloud cannot be assessed → <b>VV</b> + height in 100 ft: <code>VV003</code> = 300 ft (90 m).',
  'Vertical visibility cannot be assessed → type <b>VV///</b>.',
  'It <b>replaces</b> the cloud groups — leave Cloud 1–4 blank when VV is given.',
  'Height is in hundreds of feet, 3 digits: 90 m = <b>VV003</b>, 150 m = <b>VV005</b>.'],
 ex:[['VV003','vertical visibility 300 ft'],['VV///','vertical visibility cannot be assessed']]},

{id:'cldx',g:'Clouds',t:'Total Cloud',ic:'cloud',th:'cld',f:['individual_cloud','total_cloud'],code:'record fields',
 rules:[
  '<b>Total cloud</b> — overall sky cover in okta, one digit <b>0–8</b>: 0 = clear sky, 8 = completely covered. Blank → 0.',
  '<b>Individual cloud layer</b> — the layer code string for the record, letters and digits, up to 20 characters. Blank → 0.',
  'These two boxes are record fields. They are not printed in the METAR text.'],
 ex:[['4','4 okta of sky covered'],['3602019025','layer code string, 10 characters']]},

{id:'temp',g:'Temperature & Pressure',t:'Temperature',ic:'therm',th:'tmp',f:['temperature'],code:'T′T′',
 rules:[
  'Report in <b>whole °C</b>, nearest degree. Exactly <b>.5 rounds up</b> (9.5 → 10).',
  'Below 0 → prefix <b>M</b> (–9.5 → M09).',
  'The box takes one decimal (e.g. 32.9); the report carries the rounded value.',
  'Instrument down? Use a <b>sling psychrometer</b> and the hygrometric tables.'],
 ex:[['32.9','→ <b>33</b>'],['9.5','→ <b>10</b>'],['-2.5','→ <b>M02</b>'],['-9.5','→ <b>M09</b>']]},

{id:'dew',g:'Temperature & Pressure',t:'Dew Point',ic:'therm',th:'tmp',f:['dewpoint'],code:'TdTd',
 rules:[
  'Same rounding as temperature: <b>.5 up</b>, <b>M</b> below 0.',
  'Must <b>not exceed</b> the air temperature.',
  'Reported as one group: <code>10/03</code> = air 10, dew point 3 (from 9.5 and 3.3).',
  'Instrument down? Get the dew point from dry- and wet-bulb readings with the hygrometric tables.'],
 ex:[['3.3','→ <b>03</b> · with air 9.5 → <b>10/03</b>']]},

{id:'qnh',g:'Temperature & Pressure',t:'QNH',ic:'gauge',th:'tmp',f:['qnh'],code:'Q PPPP',
 rules:[
  'Round <b>down</b> to a whole hPa → <b>Q</b> + 4 digits: 995.6 → <code>Q0995</code> · 1002.1 → <code>Q1002</code>.',
  'The box takes one decimal (e.g. 1002.1).',
  'Instrument down? Use the digital / aneroid barometer, a nearby station value with its known correction, or the portable Met kit.'],
 ex:[['995.6','→ <b>Q0995</b>'],['1002.1','→ <b>Q1002</b>']]},

{id:'qfe',g:'Temperature & Pressure',t:'QFE',ic:'gauge',th:'tmp',f:['qfe'],code:'local reports only',
 rules:[
  'QFE goes only in <b>local</b> routine / special reports — <b>not</b> in the METAR sent outside.',
  'Must <b>not exceed</b> QNH.',
  'One decimal, e.g. 0998.2.',
  'Same back-up sources as QNH.'],
 ex:[['0998.2','QFE 998.2 hPa (local reports)']]},

{id:'trend',g:'Trend & Remarks',t:'Trend',ic:'chart',th:'trd',f:['trend'],code:'NOSIG | BECMG | TEMPO',
 rules:[
  'Added to the METAR, valid for <b>2 hours</b>. No significant change → <b>NOSIG</b> (blank = NOSIG).',
  '<b>BECMG</b> — change to new conditions at a regular or irregular rate. Add <b>FM</b> / <b>TL</b> / <b>AT</b> + time.',
  '<b>TEMPO</b> — fluctuations each under 1 hour and together under half the period. Add FM / TL + time.',
  'Give only the elements that change. If cloud changes, give <b>all</b> cloud groups.',
  'Visibility reduced → also name the cause: 750 m in fog → <code>0700 FG</code>.',
  'Weather: max 3 phenomena; the end of a phenomenon is <b>NSW</b>.'],
 tbl:{h:['Element','A trend is needed when…'],r:[
  ['Wind','Direction changes by 60° or more (mean 10 kt or more) · speed changes by 10 kt or more'],
  ['Visibility','Changes to or passes <b>150 · 350 · 600 · 800 · 1500 · 3000 · 5000</b> m'],
  ['Cloud','BKN / OVC base passes <b>30 · 60 · 150 · 300 · 450</b> m (100 · 200 · 500 · 1000 · 1500 ft) · SCT ↔ BKN below 1500 ft'],
  ['Vertical visibility','Passes <b>30 · 60 · 150 · 300</b> m'],
  ['Weather','<b>Start / end / intensity:</b> FZ precip, moderate-heavy precip, TS with precip, DS, SS · <b>Start / end:</b> IC, FZFG, DR / BL, TS, SQ, FC']]},
 ex:[['NOSIG','no significant change in the next 2 h'],['BECMG FM1200 4000 HZ','from 1200 visibility falls to 4000 m in haze'],['TEMPO FM1100 TL1200 2000 TSRA','between 1100 and 1200 a temporary 2000 m in thunderstorm with rain']]},

{id:'rmk',g:'Trend & Remarks',t:'Remarks',ic:'msg',th:'trd',f:['remarks','remarks1','remarks2','remarks3'],code:'RMK …',
 rules:[
  'The section after <b>RMK</b> carries national information — it is <b>not</b> sent internationally.',
  'Free text, printable characters only.',
  'Supplementary items: CB / TS location, recent weather (<b>RERA · RETS · RESHRA · REFZRA</b> …), wind shear, hail, squalls, dust / sand storm.',
  'RVR 1500–2000 m is reported here as supplementary information.'],
 ex:[['CB TO N/NW','cumulonimbus seen north to north-west'],['DISPLAYED ON RWY 10','default text of Remarks 2']]},

{id:'off',g:'Observer',t:'Tower Met Officer',ic:'user',th:'off',f:['tower_met_officer','metar_state_note'],code:'name / initials',
 rules:[
  '<b>Required</b> — name or initials, max 50 characters.',
  '<b>Notes</b> are internal and not part of the METAR message.',
  'Duty of the Tower Met Officer: watch the weather continuously, report significant changes at once, and send a <b>corrected report immediately</b> on finding an error.']}
];

const OV=[
 {t:'Time & date',ic:'cal',th:'rep',s:'dt',secs:['dt','date','time'],l:'UTC · METAR at :00 and :30'},
 {t:'METAR / SPECI',ic:'plane',th:'spc',s:'type',secs:['type'],l:'SPECI on criteria · improvement after 10 min'},
 {t:'CCA',ic:'msg',th:'rep',s:'cca',secs:['cca'],l:'Only for a correction · send at once'},
 {t:'Wind',ic:'wind',th:'wind',s:'wind',secs:['wind','gust'],l:'dddff KT · 10-min mean · gust if 10 kt above mean'},
 {t:'Visibility',ic:'eye',th:'vis',s:'vis',secs:['vis','sector'],l:'Lowest · 50 m / 100 m / 1 km steps · round down'},
 {t:'Weather',ic:'rain',th:'wx',s:'weather',secs:['weather','wxc'],l:'Intensity + descriptor + phenomenon · max 3'},
 {t:'RVR',ic:'road',th:'rvr',s:'rvr',secs:['rvr'],l:'Vis 1500 m or less · R24/1100 · 25 / 50 / 100 m'},
 {t:'Clouds',ic:'cloud',th:'cld',s:'clouds',secs:['clouds','vv','cldx'],l:'FEW SCT BKN OVC + height · CB / TCU only · NSC'},
 {t:'Temp & Dew',ic:'therm',th:'tmp',s:'temp',secs:['temp','dew'],l:'Whole °C · .5 rounds up · M = minus'},
 {t:'QNH / QFE',ic:'gauge',th:'tmp',s:'qnh',secs:['qnh','qfe'],l:'Q + 4 digits · round down · QFE local only'},
 {t:'Trend',ic:'chart',th:'trd',s:'trend',secs:['trend'],l:'NOSIG / BECMG / TEMPO · valid 2 h'},
 {t:'Remarks',ic:'msg',th:'trd',s:'rmk',secs:['rmk'],l:'National use · not sent abroad'},
 {t:'Tower Met Officer',ic:'user',th:'off',s:'off',secs:['off'],l:'Name required · correct errors at once'}
];

/* weather-code quick table, built from the one merged table in app.js */
(function(){const W=window.MARS_WX||{};S.find(x=>x.id==='wxc').chips=Object.keys(W).filter(k=>W[k].w||W[k].p).map(k=>[k,(W[k].w||'—')+' · '+(W[k].p||'—')]);S.find(x=>x.id==='wxc').chipsT='Group → present code · past code'})();
const byId={},f2s={};
S.forEach(s=>{byId[s.id]=s;s.f.forEach(n=>f2s[n]=s.id)});

/* ------------------------------------------------------------------ live checks (pure: they never touch the form) */
const enc=x=>{const r=Math.round(parseFloat(x));return(r<0?'M':'')+p2(Math.abs(r))};
const cloudsFilled=()=>[1,2,3,4].some(k=>gv('cloud_'+k));
const isCavok=()=>gv('visibility')==='9999'&&!cloudsFilled();
const OPT=m=>['empty',m||'Optional'],REQ=()=>['req','Required — not filled yet'];

function chk(n){
 const e=real(n);if(!e)return['empty',''];
 const v=String(e.value||'').trim();
 if(e.disabled)return['off','Locked — opens when visibility is 1500 m or less'];
 const V=parseInt(gv('visibility'),10),hasV=!isNaN(V);
 const blankDef=()=>DF[n]?['empty','Blank → '+DF[n]]:null;
 let m;
 switch(n){
 case'data_datetime':{
  if(!v)return REQ();
  m=v.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if(!m)return['bad','Use DD/MM/YYYY HH:mm UTC'];
  const t=Date.UTC(+m[3],m[2]-1,+m[1],+m[4],+m[5]),now=Date.now();
  if(sp()==='METAR'){
   if(t<now-30*6e4)return['bad','More than 30 min in the past — tap NOW'];
   if(t>now+20*6e4)return['bad','More than 20 min in the future'];
   if(+m[5]!==0&&+m[5]!==30)return['warn','METAR is issued at :00 and :30'];
  }else if(t<now-10*6e4)return['bad','SPECI: more than 10 min before now'];
  return['ok',m[1]+m[4]+m[5]+'Z · '+m[4]+':'+m[5]+' UTC'];}
 case'metar_date':
  if(!v)return REQ();
  m=v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(!m)return['bad','Use DD/MM/YYYY'];
  return['ok','Day '+m[1]];
 case'metar_time':
  if(!v)return REQ();
  if(!/^([01]\d|2[0-3])[0-5]\d$/.test(v))return['bad','4 digits HHMM, 0000–2359'];
  if(sp()==='METAR'&&!/^\d{2}(00|30)$/.test(v))return['warn','METAR is issued at :00 and :30'];
  return['ok',v.slice(0,2)+':'+v.slice(2)+' UTC'];
 case'metar_cca':
  if(!v)return OPT('Blank unless this report is a correction');
  return/^CC[A-Z]$/.test(v)?['ok','Correction '+v]:['bad','Use CCA – CCZ'];
 case'wind':{
  if(!v)return REQ();
  if(!/^[A-Z0-9]{5}$/.test(v))return['bad','5 characters needed (dddff)'];
  if(v==='00000')return['ok','Calm'];
  m=v.match(/^VRB(\d{2})$/);
  if(m)return+m[1]>=3?['warn','VRB above 2 kt only if direction varies 180° or more']:['ok','Variable · '+(+m[1])+' kt'];
  m=v.match(/^(\d{3})(\d{2})$/);
  if(!m)return['bad','Use dddff, e.g. 12005'];
  const d=+m[1],s=+m[2];
  if(d<10||d>360)return['bad','Direction 010–360 (north = 360)'];
  if(d%10)return['warn','Round direction to the nearest 10°'];
  if(s===0)return['warn','Speed 00 — report calm as 00000'];
  return['ok',d+'° · '+s+' kt'];}
 case'wind_maximum':{
  if(!v)return OPT('Only if gust is 10 kt or more above the mean');
  if(!/^\d{1,3}$/.test(v))return['bad','Digits only'];
  const w=gv('wind').match(/^(?:\d{3}|VRB)(\d{2})$/),mean=w?+w[1]:NaN;
  if(!isNaN(mean)&&+v-mean<10)return['bad','Gust must be 10 kt or more above the mean ('+mean+')'];
  return['ok','G'+p2(+v)+'KT'];}
 case'visibility':{
  if(!v)return REQ();
  if(!/^\d{4}$/.test(v))return['bad','4 digits, metres'];
  const x=+v;
  if(x===9999)return['ok','10 km or more'+(isCavok()?' · CAVOK':'')];
  if(x<800&&x%50)return['warn','Round down to '+p4(x-x%50)+' (50 m steps)'];
  if(x>=800&&x<5000&&x%100)return['warn','Round down to '+p4(x-x%100)+' (100 m steps)'];
  if(x>=5000&&x%1000)return['warn','Round down to '+p4(x-x%1000)+' (1 km steps)'];
  return['ok',(x>=1000?x/1000+' km':x+' m')+(x<=1500?' · RVR boxes open':x<=5000?' · weather mandatory':'')];}
 case'sector_visibility':
  if(!v)return OPT('Only for a marked directional variation');
  return/^\d{4}(N|NE|E|SE|S|SW|W|NW)( \d{4}(N|NE|E|SE|S|SW|W|NW))?$/.test(v)?['ok','Lowest visibility toward '+v.slice(4).split(' ')[0]]:['warn','Use 4 digits + compass point, e.g. 2000SE or 1400SW 6000N'];
 case'weather':{
  if(!v){
   if(isCavok())return['ok','CAVOK — leave blank'];
   if(hasV&&V<=5000)return['bad','Mandatory when visibility is 5000 m or less'];
   return OPT('Optional when visibility is above 5000 m');}
  const t=v.split(/\s+/);
  if(t.length>3)return['bad','Max 3 groups'];
  for(const w of t){
   if(/FG/.test(w)&&!/(MI|BC|PR|VC)FG/.test(w)&&hasV&&V>=1000)return['warn','FG needs visibility under 1000 m (else BR / MIFG / BCFG)'];
   if(w==='BR'&&hasV&&(V<1000||V>5000))return['warn','BR needs visibility 1000–5000 m'];
   if(/^(HZ|FU|DU|SA)$/.test(w)&&hasV&&V>5000)return['warn',w+' only when visibility is 5000 m or less'];}
  return['ok',t.length+' group'+(t.length>1?'s':'')];}
 case'significant_weather':case'present_weather':case'past_weather':
  if(!v)return blankDef()||OPT();
  return(n==='past_weather'?/^\d{1,2}$/:/^\d{2}$/).test(v)?['ok','Code '+v]:['bad',n==='past_weather'?'1 or 2 digits':'2 digits, e.g. 05'];
 case'active_rwy_1':case'active_rwy_2':case'active_rwy_3':case'active_rwy_4':{
  const k=n.slice(-1);
  if(!v){
   if(k==='1'&&hasV&&V<=1500)return['bad','Mandatory when visibility is 1500 m or less'];
   if(k!=='1'&&gv('rvr_'+k))return['bad','Runway needed with RVR '+k];
   return OPT();}
  return/^(0[1-9]|[12]\d|3[0-6])[LRC]?$/.test(v)?['ok','Runway '+v]:['bad','Use 01–36 + L / R / C'];}
 case'rvr_1':case'rvr_2':case'rvr_3':case'rvr_4':{
  const k=n.slice(-1);
  if(!v)return OPT();
  if(!/^(P2000|M\d{4}|\d{1,4})$/.test(v))return['bad','Digits, P2000 or M + 4 digits'];
  if(v==='P2000')return['ok','R'+(gv('active_rwy_'+k)||'––')+'/P2000 · above 2000 m'];
  if(v[0]==='M')return['ok','R'+(gv('active_rwy_'+k)||'––')+'/'+v+' · below the instrument minimum'];
  const x=+v;
  if(x>2000)return['warn','Above 2000 m type P2000'];
  const st=x<400?25:x<=800?50:100;
  if(x%st)return['warn','Round down to '+p4(x-x%st)+' ('+st+' m steps)'];
  return['ok','R'+(gv('active_rwy_'+k)||'––')+'/'+p4(x)];}
 case'vertical_cloud':
  if(!v)return OPT('Only when the sky is obscured');
  m=v.match(/^VV(\d{3}|\/\/\/)$/);
  if(m&&cloudsFilled())return['bad','VV replaces the cloud groups'];
  return m?['ok',m[1]==='///'?'Vertical visibility not assessable':'Vertical visibility '+(+m[1]*100)+' ft']:['warn','Use VVhhh, e.g. VV003'];
 case'cloud_1':case'cloud_2':case'cloud_3':case'cloud_4':{
  const k=+n.slice(-1);
  if(!v)return k===1?['empty','Blank → NSC'+(isCavok()?' (CAVOK)':'')]:OPT();
  if(k===1&&/^(NSC|SKC)$/.test(v))return['ok',v==='NSC'?'No significant cloud':'Sky clear'];
  m=v.match(/^(FEW|SCT|BKN|OVC)(\d{3})(CB|TCU)?$/);
  if(!m)return['warn','Use amount + 3-digit height, e.g. SCT018 / FEW020CB'];
  const h=+m[2];
  for(let j=1;j<k;j++){
   const pm=gv('cloud_'+j).match(/^(?:FEW|SCT|BKN|OVC)(\d{3})/);
   if(!gv('cloud_'+j))return['warn','Fill Cloud '+j+' first'];
   if(pm&&+pm[1]>h)return['warn','Layers go in ascending height'];}
  if(k===4&&[1,2,3,4].map(j=>gv('cloud_'+j)).filter(x=>x&&!/(CB|TCU)$/.test(x)).length>3)return['bad','4th layer only for CB / TCU'];
  if(k===2&&m[1]==='FEW'&&!m[3])return['warn','2nd layer must be above 2/8 (SCT or more) unless CB / TCU'];
  if(k>=3&&(m[1]==='FEW'||m[1]==='SCT')&&!m[3])return['warn','Next layer must be above 4/8 (BKN / OVC) unless CB / TCU'];
  return['ok',{FEW:'1–2',SCT:'3–4',BKN:'5–7',OVC:'8'}[m[1]]+' okta at '+(h*100)+' ft'+(m[3]?' · '+m[3]:'')];}
 case'individual_cloud':
  if(!v)return blankDef();
  return/^[A-Z0-9]{1,20}$/.test(v)?['ok','Recorded']:['bad','Letters / digits, max 20'];
 case'total_cloud':
  if(!v)return blankDef();
  return/^[0-8]$/.test(v)?['ok',v+' okta']:['bad','One digit 0–8'];
 case'temperature':case'dewpoint':{
  if(!v)return REQ();
  if(!/^-?\d{1,2}(\.\d)?$/.test(v))return['bad','Number with one decimal, e.g. 32.9'];
  if(n==='dewpoint'){const T=parseFloat(gv('temperature')),D=parseFloat(v);if(!isNaN(T)&&D>T)return['bad','Exceeds temperature'];}
  return['ok','Reported as '+enc(v)];}
 case'qnh':
  if(!v)return REQ();
  if(!/^\d{1,4}(\.\d)?$/.test(v))return['bad','Number with one decimal, e.g. 1002.1'];
  return['ok','Reported as Q'+p4(Math.floor(parseFloat(v)))];
 case'qfe':{
  if(!v)return REQ();
  if(!/^\d{1,4}(\.\d)?$/.test(v))return['bad','Number with one decimal, e.g. 0998.2'];
  const N=parseFloat(gv('qnh'));
  if(!isNaN(N)&&parseFloat(v)>N)return['bad','Exceeds QNH'];
  return['ok','Local reports only'];}
 case'trend':
  if(!v)return['empty','Blank → NOSIG'];
  if(!/^[\x20-\x7E]*$/.test(v))return['bad','Printable characters only'];
  if(!/^(NOSIG|BECMG|TEMPO)(\s|$)/.test(v.toUpperCase()))return['warn','Start with NOSIG, BECMG or TEMPO'];
  if(/^NOSIG\s+\S/i.test(v))return['warn','NOSIG stands alone'];
  return['ok',v.toUpperCase().split(/\s+/)[0]];
 case'remarks':case'remarks1':case'remarks2':case'remarks3':
  if(!v)return n==='remarks2'?blankDef():OPT();
  return/^[\x20-\x7E]*$/.test(v)?['ok','Free text']:['bad','Printable characters only'];
 case'tower_met_officer':
  return v?['ok','Recorded']:REQ();
 case'metar_state_note':
  return v?['ok','Internal note']:OPT('Internal — not part of the message');
 }
 return['empty',''];
}
function p4(n){return String(n).padStart(4,'0')}

const RANK={bad:4,warn:3,req:2,ok:1,empty:0,off:-1};
const LBL={ok:'OK',warn:'Check',bad:'Fix',req:'To fill',empty:'Optional',off:'Locked'};
function agg(list){
 let best='off';
 list.forEach(s=>{if(RANK[s]>RANK[best])best=s});
 return best;
}
function secStatus(id,R){
 const s=byId[id];if(!s.f.length)return'ok';
 return agg(s.f.map(n=>R[n][0]));
}

/* ------------------------------------------------------------------ live METAR preview */
function tokens(){
 const T=[],d=gv('metar_date').split('/'),tm=gv('metar_time'),okT=d.length===3&&tm.length===4;
 T.push([sp(),'type']);
 T.push([(($('#stI')||{}).textContent||'----').trim(),'dt']);
 T.push([okT?d[0]+tm+'Z':'DDhhmmZ','dt',okT?'':'ph']);
 if(gv('metar_cca'))T.push([gv('metar_cca'),'cca']);
 const w=gv('wind'),g=gv('wind_maximum');
 T.push([w?w+(g?'G'+p2(+g||0):'')+'KT':'dddffKT','wind',w?'':'ph']);
 const cav=isCavok()&&!gv('weather');
 if(cav)T.push(['CAVOK','vis']);
 else{
  const v=gv('visibility');
  T.push([v||'VVVV','vis',v?'':'ph']);
  if(gv('sector_visibility'))T.push([gv('sector_visibility'),'sector']);
  [1,2,3,4].forEach(k=>{const r=gv('active_rwy_'+k),x=gv('rvr_'+k);if(r&&x)T.push(['R'+r+'/'+(/^[PM]/.test(x)?x:p4(x)),'rvr'])});
  gv('weather').split(/\s+/).filter(Boolean).forEach(x=>T.push([x,'weather']));
  const vv=gv('vertical_cloud');
  if(vv)T.push([vv,'vv']);
  else if(cloudsFilled())[1,2,3,4].forEach(k=>{if(gv('cloud_'+k))T.push([gv('cloud_'+k),'clouds'])});
  else T.push(['NSC','clouds','df']);
 }
 const t=gv('temperature'),dp=gv('dewpoint');
 T.push([t&&dp&&!isNaN(parseFloat(t))&&!isNaN(parseFloat(dp))?enc(t)+'/'+enc(dp):'TT/TdTd','temp',t&&dp?'':'ph']);
 const q=gv('qnh');
 T.push([q&&!isNaN(parseFloat(q))?'Q'+p4(Math.floor(parseFloat(q))):'QPPPP','qnh',q?'':'ph']);
 const tr=gv('trend');
 T.push([tr||'NOSIG','trend',tr?'':'df']);
 const rm=['remarks','remarks1','remarks2','remarks3'].map(gv).filter(Boolean);
 if(rm.length){T.push(['RMK','rmk']);T.push([rm.join(' '),'rmk'])}
 return T;
}
function pvHTML(){
 return tokens().map(([x,k,c])=>{
  const s=byId[k],th=TH[s.th];
  return'<button type="button" class="sop-tk'+(c?' '+c:'')+'" data-jump="'+k+'" style="--g:'+th[0]+'" title="'+esc(s.t)+'">'+esc(x)+'</button>';
 }).join('');
}

/* ------------------------------------------------------------------ rendering */
const dlg=$('#sop'),nav=$('#sopNav'),main=$('#sopMain');
if(!dlg||!nav||!main)return;
let cur='ov',last=null,timer=0,cache={};
const ic=(n,x)=>'<svg class="ic"'+(n==='cloud'?' style="fill:currentColor"':'')+(x||'')+'><use href="#i-'+n+'"/></svg>';
const thv=t=>{const c=TH[t];return'--g:'+c[0]+';--c1:'+c[1]+';--c2:'+c[2]};

function buildNav(){
 let h='<button type="button" class="sop-i ov" data-s="ov">'+ic('home')+'<span>Overview</span><i class="sop-d"></i></button>',g='';
 S.forEach(s=>{
  if(s.g!==g){g=s.g;h+='<div class="sop-gt">'+esc(g)+'</div>'}
  h+='<button type="button" class="sop-i" data-s="'+s.id+'" style="--g:'+TH[s.th][0]+'">'+ic(s.ic)+'<span>'+esc(s.t)+'</span><i class="sop-d"></i></button>';
 });
 nav.innerHTML=h;
}
function labelOf(n){
 const l=document.querySelector('label[for="id_'+n+'"]');
 return l?l.textContent.replace(/\s*\*$/,'').trim():n;
}
function unitOf(n){
 const r=real(n),u=r&&r.closest('.cv')?r.closest('.cv').querySelector('.u'):null;
 return u?u.textContent.trim():'';
}
function mirrorHTML(n){
 const r=real(n),t=r.tagName==='TEXTAREA',ml=r.maxLength>0?' maxlength="'+r.maxLength+'"':'',u=unitOf(n);
 return'<div class="sf" data-n="'+n+'"><label for="sop_'+n+'">'+esc(labelOf(n))+'</label><div class="sfi">'+
  (t?'<textarea id="sop_'+n+'" rows="2"'+ml+' spellcheck="false"></textarea>':'<input id="sop_'+n+'" type="text"'+ml+' autocomplete="off" spellcheck="false">')+
  (u?'<span class="sfu">'+esc(u)+'</span>':'')+(n==='data_datetime'?'<button type="button" class="now" data-now>NOW</button>':'')+
  '</div><div class="sfm"></div></div>';
}
function secHTML(s){
 const st='style="'+thv(s.th)+'"';
 let h='<div class="sop-sh" '+st+'><div class="sop-sic">'+ic(s.ic)+'</div><div class="sop-sx"><h3>'+esc(s.t)+'</h3><div class="sop-meta"><span class="sop-code">'+esc(s.code)+'</span>'+'</div></div><span class="sop-sb" id="sopSb"></span></div>';
 h+='<div class="sop-g" '+st+'><div class="sop-col">';
 if(s.id==='type'){
  h+='<div class="sop-c"><div class="sop-ct">Report type <span>synced with the form</span></div><div class="sop-seg" id="sopSeg"><button type="button" data-ty="METAR">METAR</button><button type="button" data-ty="SPECI">SPECI</button></div></div>';
 }else if(s.f.length){
  const many=s.f.length>2;
  h+='<div class="sop-c"><div class="sop-ct">Your entry <span>live · synced with the form</span></div><div class="sop-ef'+(many?' two':'')+'">'+s.f.map(mirrorHTML).join('')+'</div><button type="button" class="sop-go" data-go>Go to field '+ic('go')+'</button></div>';
 }
 if(s.ex)h+='<div class="sop-c"><div class="sop-ct">Examples</div><div class="sop-x">'+s.ex.map(e=>'<div class="xr"><code>'+esc(e[0])+'</code><span>'+e[1]+'</span></div>').join('')+'</div></div>';
 h+='</div><div class="sop-col"><div class="sop-c"><div class="sop-ct">Rules</div><ul class="sop-r">'+s.rules.map(r=>'<li>'+r+'</li>').join('')+'</ul></div>';
 if(s.link)h+='<div class="sop-note lk">'+ic('link')+'<span>'+s.link+'</span></div>';
 if(s.note)h+='<div class="sop-note">'+ic('warn')+'<span>'+s.note+'</span></div>';
 h+='</div>';
 if(s.chips)h+='<div class="sop-c wide"><div class="sop-ct">'+(s.chipsT||'Quick codes')+'</div><div class="sop-chs">'+s.chips.map(c=>'<span><b>'+c[0]+'</b>'+c[1]+'</span>').join('')+'</div></div>';
 if(s.tbl)h+='<div class="sop-c wide"><div class="sop-ct">Quick reference</div><div class="sop-tw"><table class="sop-t"><thead><tr>'+s.tbl.h.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+s.tbl.r.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></div>';
 return h+'</div>';
}
function ovHTML(){
 let h='<div class="sop-oh"><h3>Overview</h3><p>Every rule at a glance — tap a card or a token to open its details.</p></div>';
 h+='<div class="sop-c sop-pvc" style="--g:#0b2a5b"><div class="sop-ct">Live METAR preview <span>built live from your form</span></div><div class="sop-pv" id="sopPv"></div>'+
  '<div class="sop-leg"><span><i class="sop-d" data-s="ok"></i>OK</span><span><i class="sop-d" data-s="warn"></i>Check</span><span><i class="sop-d" data-s="bad"></i>Fix</span><span><i class="sop-d" data-s="req"></i>To fill</span></div></div>';
 h+='<div class="sop-og">'+OV.map((o,i)=>'<button type="button" class="sop-oc" data-jump="'+o.s+'" data-o="'+i+'" style="'+thv(o.th)+'"><span class="oi">'+ic(o.ic)+'</span><span class="ot"><b>'+esc(o.t)+'</b><span>'+esc(o.l)+'</span></span><i class="sop-d"></i></button>').join('')+'</div>';
 return h;
}
function show(id){
 cur=byId[id]?id:'ov';cache={};
 main.innerHTML=cur==='ov'?ovHTML():secHTML(byId[cur]);
 main.scrollTop=0;
 [...nav.children].forEach(b=>{if(b.dataset.s)b.classList.toggle('on',b.dataset.s===cur)});
 const on=nav.querySelector('.on');if(on&&on.scrollIntoView)on.scrollIntoView({block:'nearest'});
 refresh();
}

function setDot(el,s){if(el&&el.dataset.s!==s)el.dataset.s=s}
function refresh(){
 const R={};
 S.forEach(s=>s.f.forEach(n=>{R[n]=chk(n)}));
 const SS={};S.forEach(s=>{SS[s.id]=secStatus(s.id,R)});
 [...nav.querySelectorAll('.sop-i')].forEach(b=>{
  const id=b.dataset.s;
  setDot(b.querySelector('.sop-d'),id==='ov'?agg(S.map(s=>SS[s.id])):SS[id]);
 });
 const stn=$('#sopStn'),ty=$('#sopTyp');
 if(stn)stn.textContent=(($('#stI')||{}).textContent||'').trim()+' · '+(($('#stN')||{}).textContent||'').trim();
 if(ty)ty.textContent=sp();
 if(cur==='ov'){
  const pv=$('#sopPv');if(pv){const h=pvHTML();if(cache.pv!==h){pv.innerHTML=h;cache.pv=h}}
  main.querySelectorAll('.sop-oc').forEach(c=>{const o=OV[+c.dataset.o];setDot(c.querySelector('.sop-d'),agg(o.secs.map(x=>SS[x])))});
  return;
 }
 const s=byId[cur],sb=$('#sopSb');
 if(sb){
  const x=SS[cur];sb.dataset.s=x;
  sb.textContent=s.f.length?LBL[x]:'Reference';
  if(!s.f.length)sb.dataset.s='ref';
 }
 main.querySelectorAll('.sf').forEach(f=>{
  const n=f.dataset.n,r=real(n),i=f.querySelector('input,textarea'),m=f.querySelector('.sfm');
  if(!r||!i)return;
  if(i.value!==r.value&&!(document.activeElement===i&&i.value.toUpperCase()===r.value))i.value=r.value;
  if(i.disabled!==r.disabled)i.disabled=r.disabled;
  const ph=DF[n]||'';if(i.placeholder!==ph)i.placeholder=ph;
  const x=R[n];
  if(f.dataset.s!==x[0])f.dataset.s=x[0];
  if(m.textContent!==x[1])m.textContent=x[1];
 });
 const seg=$('#sopSeg');
 if(seg)seg.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.ty===sp()));
}

/* ------------------------------------------------------------------ two-way sync: popup box -> real form field */
function push(i,type){
 const f=i.closest('.sf');if(!f)return;
 const r=real(f.dataset.n);if(!r||r.disabled)return;
 if(type==='input'){
  r.value=i.value;
  r.dispatchEvent(new Event('input',{bubbles:true}));
  if(r.value!==i.value){const p=i.selectionStart;i.value=r.value;try{i.setSelectionRange(p,p)}catch(_){}}
 }else if(type==='change')r.dispatchEvent(new Event('change',{bubbles:true}));
 else if(type==='blur')r.dispatchEvent(new Event('blur'));
 refresh();
}
main.addEventListener('input',e=>{if(e.target.closest('.sf'))push(e.target,'input')});
main.addEventListener('change',e=>{if(e.target.closest('.sf'))push(e.target,'change')});
main.addEventListener('focusout',e=>{if(e.target.closest&&e.target.closest('.sf'))push(e.target,'blur')});
main.addEventListener('click',e=>{
 const j=e.target.closest('[data-jump]');if(j){show(j.dataset.jump);return}
 if(e.target.closest('[data-go]')){goField();return}
 if(e.target.closest('[data-now]')){const b=$('#nowBtn');if(b)b.click();refresh();return}
 const t=e.target.closest('[data-ty]');
 if(t){const r=document.querySelector('[name=metar_specification][value="'+t.dataset.ty+'"]');if(r){r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}))}refresh()}
});
nav.addEventListener('click',e=>{const b=e.target.closest('.sop-i');if(b)show(b.dataset.s)});
nav.addEventListener('keydown',e=>{
 if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
 const b=[...nav.querySelectorAll('.sop-i')],i=b.indexOf(document.activeElement);if(i<0)return;
 e.preventDefault();const n=b[Math.min(b.length-1,Math.max(0,i+(e.key==='ArrowDown'?1:-1)))];n.focus();show(n.dataset.s);
});

function goField(){
 const s=byId[cur];if(!s)return;
 let n=s.f.find(x=>real(x)&&!real(x).disabled)||'visibility';
 dlg.close();
 const r=real(n);
 if(r){r.scrollIntoView({block:'nearest'});r.focus();if(r.select)r.select()}
}

/* ------------------------------------------------------------------ open / close */
function open(){
 if(!nav.children.length)buildNav();
 show(last&&f2s[last]?f2s[last]:cur);
 if(!dlg.open)dlg.showModal();
 clearInterval(timer);timer=setInterval(refresh,400);
}
dlg.addEventListener('close',()=>clearInterval(timer));
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
$('#sopClose').addEventListener('click',()=>dlg.close());
['#sopBtn','#sopFoot'].forEach(q=>{const b=$(q);if(b)b.addEventListener('click',open)});
document.addEventListener('focusin',e=>{const n=(e.target.id||'').replace(/^id_/,'');if(f2s[n])last=n});
})();
