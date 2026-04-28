
'use strict';
/* ── Config (loaded from config.js via window.APP_CONFIG) ── */
const _cfg = window.APP_CONFIG || {};
const SUPABASE_URL     = _cfg.SUPABASE_URL     || '';
const SUPABASE_ANON_KEY= _cfg.SUPABASE_ANON_KEY|| '';
const LS_KEY           = _cfg.LS_KEY           || 'pondy_gps_v5';
const SESSION_KEY      = _cfg.SESSION_KEY      || 'pondy_session_v1';
if(!SUPABASE_URL || !SUPABASE_ANON_KEY){
  console.error('Missing config: copy config.example.js → config.js and fill in your keys.');
}

// 4052 streets


// ── State ──────────────────────────────────────────────
let session=null,allowedStreets=[],gpsData={};
let selectedId=null,nextPoint='S',pendingEnd=null,overwritePending=null;
let activeMuni='ALL',activeFilter='ALL',wardFilter='',streetSearch='';
let isSatellite=false,dbOk=false,undoStack=[];
let map,osmLayer,satLayer,markers={},polyline=null,searchPin=null,dataLayer=null;
let aGroups=[],aUsers=[];
// Geofences
let geofences=[],activeGfIds=new Set(),filterToGf=false;
let mainGfLayers={};
// Polygon module
let polyMap=null,drawnItems=null,drawnCoords=null;
// Measure ruler
let measureActive=false,measurePts=[],measureLayers=[];
// Ward dropdown
let allWardOpts=[],currentWardFilter='';

// ── Haversine distance ─────────────────────────────────
function haversine(lat1,lon1,lat2,lon2){
  const R=6371000,r=Math.PI/180;
  const dLat=(lat2-lat1)*r,dLon=(lon2-lon1)*r;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function fmtDist(m){return m<1000?Math.round(m)+' m':(m/1000).toFixed(2)+' km';}

// ── Crypto ─────────────────────────────────────────────
async function sha256(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');}

// ── Supabase ───────────────────────────────────────────
function sbH(ex={}){return{'apikey':SUPABASE_ANON_KEY,'Authorization':'Bearer '+SUPABASE_ANON_KEY,'Content-Type':'application/json',...ex};}
async function sbGet(t,q=''){const r=await fetch(`${SUPABASE_URL}/rest/v1/${t}?${q}`,{headers:sbH()});if(!r.ok)throw new Error(await r.text());return r.json();}
async function sbPost(t,body,pref=''){const r=await fetch(`${SUPABASE_URL}/rest/v1/${t}`,{method:'POST',headers:sbH(pref?{'Prefer':pref}:{}),body:JSON.stringify(body)});if(!r.ok)throw new Error(await r.text());return pref.includes('representation')?r.json():null;}
async function sbUpsert(body){const r=await fetch(`${SUPABASE_URL}/rest/v1/street_gps?on_conflict=street_id`,{method:'POST',headers:sbH({'Prefer':'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify(body)});if(!r.ok)throw new Error(await r.text());}
async function sbDel(t,q){const r=await fetch(`${SUPABASE_URL}/rest/v1/${t}?${q}`,{method:'DELETE',headers:sbH()});if(!r.ok)throw new Error(await r.text());}

// ── Auth ───────────────────────────────────────────────
async function doLogin(){
  const u=document.getElementById('login-user').value.trim(),p=document.getElementById('login-pass').value;
  const err=document.getElementById('login-err'),btn=document.getElementById('login-btn');
  if(!u||!p){err.textContent='Enter username and password';return;}
  btn.disabled=true;btn.textContent='Signing in…';err.textContent='';
  try{
    const h=await sha256(p);
    const rows=await sbGet('app_users',`select=id,username,full_name,group_id,role&username=eq.${encodeURIComponent(u)}&password_hash=eq.${h}&is_active=eq.true`);
    if(!rows.length){err.textContent='Invalid credentials';btn.disabled=false;btn.textContent='Sign In';return;}
    const usr=rows[0];
    let aw=null;
    if(usr.role!=='admin'&&usr.group_id){const w=await sbGet('group_wards',`group_id=eq.${usr.group_id}&select=municipality,ward_no`);aw=w;}
    session={user_id:usr.id,username:usr.username,full_name:usr.full_name||usr.username,group_id:usr.group_id,role:usr.role,allowed_wards:aw};
    localStorage.setItem(SESSION_KEY,JSON.stringify(session));
    startApp();
  }catch(e){err.textContent='Error: '+e.message;}
  btn.disabled=false;btn.textContent='Sign In';
}
async function checkFirstRun(){try{const r=await sbGet('app_users','select=id&limit=1');if(!r.length)document.getElementById('setup-link').style.display='block';}catch{}}
async function firstAdminSetup(){
  const u=prompt('Admin username:');if(!u)return;
  const p=prompt('Admin password:');if(!p)return;
  const fn=prompt('Full name:')||u;
  const h=await sha256(p);
  try{await sbPost('app_users',{username:u,password_hash:h,full_name:fn,role:'admin',is_active:true},'return=minimal');alert('Admin created! Sign in now.');}
  catch(e){alert('Error: '+e.message);}
}
function doLogout(){
  localStorage.removeItem(SESSION_KEY);session=null;
  document.getElementById('app-shell').style.display='none';
  document.getElementById('login-screen').classList.remove('hidden');
  ['login-user','login-pass'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('login-err').textContent='';
}

// ── Startup ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',async()=>{
  try{const s=localStorage.getItem(SESSION_KEY);if(s){session=JSON.parse(s);startApp();return;}}catch{}
  checkFirstRun();
  document.getElementById('login-pass').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
  document.getElementById('login-user').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('login-pass').focus();});
});

function startApp(){
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').style.display='flex';
  // Left nav user info
  const initials=(session.full_name||session.username||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  document.getElementById('ln-avatar').textContent=initials;
  document.getElementById('ln-uname').textContent=session.full_name||session.username;
  document.getElementById('ln-urole').textContent=session.role.toUpperCase();
  if(session.role==='admin'){document.getElementById('nav-admin').style.display='flex';const qa=document.getElementById('qa-admin-btn');if(qa)qa.style.display='flex';}
  if(session.role==='admin'||!session.allowed_wards?.length){allowedStreets=STREETS;}
  else{const ws=new Set(session.allowed_wards.map(w=>w.municipality+'|'+w.ward_no));allowedStreets=STREETS.filter(s=>ws.has(s.municipality+'|'+s.ward_no));}
  loadLS();
  if(!map){initMap();bindTopBar();bindSearchBar();bindSidebar();}
  buildMuniTabs();buildWardDropdown();renderList();updateProgress();
  syncSupabase();loadGeofences();
  navTo('dashboard');
  // Set today's date on dashboard
  const now=new Date();
  const todayStr=`${now.toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}`;
  const phDate=document.getElementById('ph-date');if(phDate)phDate.textContent=todayStr;
}

// ── LocalStorage ───────────────────────────────────────
function loadLS(){try{const d=JSON.parse(localStorage.getItem(LS_KEY)||'{}');const f={};Object.keys(d).forEach(k=>{f[+k]=d[k]});gpsData=f;}catch{gpsData={};}}
function saveLS(){try{localStorage.setItem(LS_KEY,JSON.stringify(gpsData));}catch{}}

// ── GPS Sync ───────────────────────────────────────────
function setDb(state,lbl){const el=document.getElementById('db-status');el.className=state;el.textContent=lbl;}
async function syncSupabase(){
  setDb('connecting','CONNECTING…');
  try{
    let off=0;
    while(true){const rows=await sbGet('street_gps',`select=*&limit=1000&offset=${off}`);rows.forEach(r=>{if(r.street_id!=null&&(r.start_lat!=null||r.mid_lat!=null||r.end_lat!=null))gpsData[+r.street_id]={start_lat:r.start_lat,start_lon:r.start_lon,mid_lat:r.mid_lat,mid_lon:r.mid_lon,end_lat:r.end_lat,end_lon:r.end_lon,updated_at:r.updated_at||null};});if(rows.length<1000)break;off+=1000;}
    saveLS();dbOk=true;setDb('ok','SUPABASE ✓');
    const st=document.getElementById('sb-sync-time');if(st)st.textContent='Synced '+new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true});
    renderList();updateProgress();refreshDataLayer();if(selectedId)refreshMarkers();
  }catch(e){console.error(e);setDb('error','DB ERROR');}
}
async function upsert(sid){
  if(!dbOk)return;
  const s=STREETS.find(x=>x.id===sid);if(!s)return;
  const d=gpsData[sid]||{};
  try{await sbUpsert({street_id:sid,municipality:s.municipality,constituency:s.constituency,ward_no:s.ward_no,ward_name:s.ward_name,street_name:s.street_name,start_lat:d.start_lat??null,start_lon:d.start_lon??null,mid_lat:d.mid_lat??null,mid_lon:d.mid_lon??null,end_lat:d.end_lat??null,end_lon:d.end_lon??null,updated_at:new Date().toISOString()});setDb('ok','SUPABASE ✓');}
  catch(e){console.error(e);setDb('error','SAVE FAILED');setTimeout(()=>{if(dbOk)setDb('ok','SUPABASE ✓');},3000);}
}

// ── Map ────────────────────────────────────────────────
function initMap(){
  map=L.map('map').setView([11.9416,79.8083],14);
  osmLayer=L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{attribution:'© OpenStreetMap © CARTO',subdomains:'abcd',maxZoom:21});
  satLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'© Esri',maxZoom:21});
  osmLayer.addTo(map);
  dataLayer=L.layerGroup().addTo(map);
  const dlBtn=document.getElementById('data-layer-btn');if(dlBtn)dlBtn.classList.add('active');
  map.on('mousemove',e=>{document.getElementById('map-coords').textContent=`LAT ${e.latlng.lat.toFixed(6)}  LON ${e.latlng.lng.toFixed(6)}  ZOOM ${map.getZoom()}`;});
  map.on('click',onMapClick);
  initMeasureTool();
}
function mkIcon(fill,lbl){
  const s=encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="${fill}" stroke="rgba(0,0,0,0.4)" stroke-width="1.5"/><circle cx="14" cy="14" r="7" fill="rgba(0,0,0,0.2)"/><text x="14" y="18.5" text-anchor="middle" fill="white" font-size="11" font-weight="700" font-family="Arial,sans-serif">${lbl}</text></svg>`);
  return L.divIcon({html:`<img src="data:image/svg+xml,${s}" width="28" height="38">`,className:'',iconSize:[28,38],iconAnchor:[14,38],popupAnchor:[0,-40]});
}
const ICONS={S:mkIcon('#2ecc71','S'),M:mkIcon('#f1c40f','M'),E:mkIcon('#e67e22','E'),X:mkIcon('#4da6ff','✦')};

function onMapClick(e){
  if(measureActive)return;
  // No street selected — clicking map does nothing (view mode)
  if(!selectedId)return;
  const{lat,lng}=e.latlng;
  // If street is fully mapped and no re-map in progress, deselect on empty click
  if(isDone(selectedId)&&nextPoint==='S'){
    overwritePending={lat,lng};
    document.getElementById('overwrite-overlay').classList.remove('hidden');
    return;
  }
  if(nextPoint==='S'){placePoint('S',lat,lng);nextPoint='M';}
  else if(nextPoint==='M'){placePoint('M',lat,lng);nextPoint='E';}
  else{pendingEnd={lat,lng};showSaveConfirm();}
}
function confirmRemap(){
  document.getElementById('overwrite-overlay').classList.add('hidden');
  if(!overwritePending||!selectedId)return;
  // Clear all existing points for this street then place new S
  undoStack.push({street_id:selectedId,prev:{...(gpsData[selectedId]||{})}});
  gpsData[selectedId]={};
  const{lat,lng}=overwritePending;
  overwritePending=null;
  placePoint('S',lat,lng);
  nextPoint='M';
  saveToSupabase(selectedId);
  updateSelPanel();updateHint();refreshMarkers();renderList();
}
function discardRemap(){
  document.getElementById('overwrite-overlay').classList.add('hidden');
  overwritePending=null;
}
function placePoint(pt,lat,lng){
  undoStack.push({street_id:selectedId,prev:{...(gpsData[selectedId]||{})}});
  if(!gpsData[selectedId])gpsData[selectedId]={};
  const d=gpsData[selectedId];
  if(pt==='S'){d.start_lat=lat;d.start_lon=lng;}
  else if(pt==='M'){d.mid_lat=lat;d.mid_lon=lng;}
  else{d.end_lat=lat;d.end_lon=lng;}
  saveLS();upsert(selectedId);refreshMarkers();refreshDataLayer();renderList();updateProgress();updateSelPanel();updateHint();
}

// ── Save Confirm ───────────────────────────────────────
function showSaveConfirm(){
  const s=STREETS.find(x=>x.id===selectedId);if(!s)return;
  const d=gpsData[selectedId]||{},p=pendingEnd;
  document.getElementById('cf-name').textContent=s.street_name;
  document.getElementById('cf-ward').textContent=`Ward ${s.ward_no} — ${s.ward_name} · ${s.municipality}`;
  const fmt=v=>v!=null?v.toFixed(6):'—';
  document.getElementById('cf-coords').innerHTML=`
    <div class="cf-row"><span class="cf-lbl s">S</span><span class="cf-val">${d.start_lat!=null?fmt(d.start_lat)+',  '+fmt(d.start_lon):'<span style="color:var(--dim);font-style:italic">not placed</span>'}</span></div>
    <div class="cf-row"><span class="cf-lbl m">M</span><span class="cf-val">${d.mid_lat!=null?fmt(d.mid_lat)+',  '+fmt(d.mid_lon):'<span style="color:var(--dim);font-style:italic">not placed</span>'}</span></div>
    <div class="cf-row"><span class="cf-lbl e">E</span><span class="cf-pend">${fmt(p.lat)},  ${fmt(p.lng)} <small style="color:var(--dim)">(pending)</small></span></div>`;
  document.getElementById('save-overlay').classList.remove('hidden');
}
function confirmSave(){
  document.getElementById('save-overlay').classList.add('hidden');
  if(!pendingEnd||!selectedId)return;
  placePoint('E',pendingEnd.lat,pendingEnd.lng);
  pendingEnd=null;nextPoint='S';
  showToast('✓ Saved!');setTimeout(autoAdvance,400);
}
function cancelSave(){
  document.getElementById('save-overlay').classList.add('hidden');
  pendingEnd=null;showToast('Cancelled — re-click to place END','warn');updateHint();
}

// ── All-data background layer (VIEW MODE) ──────────────
function refreshDataLayer(){
  if(!dataLayer)return;
  if(!_dataLayerVisible)return;
  dataLayer.clearLayers();
  Object.entries(gpsData).forEach(([idStr,d])=>{
    const id=+idStr;
    if(id===selectedId)return; // selected street shown as big draggable pins
    const s=STREETS.find(x=>x.id===id);if(!s)return;
    const hasS=d.start_lat!=null,hasM=d.mid_lat!=null,hasE=d.end_lat!=null;
    const pts=[];
    if(hasS)pts.push({lat:d.start_lat,lng:d.start_lon,color:'#2ecc71',lbl:'S'});
    if(hasM)pts.push({lat:d.mid_lat,  lng:d.mid_lon,  color:'#f1c40f',lbl:'M'});
    if(hasE)pts.push({lat:d.end_lat,  lng:d.end_lon,  color:'#e67e22',lbl:'E'});
    // build one popup per street (anchored to start, or first available point)
    const anchor=pts[0];if(!anchor)return;
    const status=`${hasS?'<span style="color:#2ecc71">S✓</span>':'<span style="color:#ccc">S</span>'} ${hasM?'<span style="color:#e6b800">M✓</span>':'<span style="color:#ccc">M</span>'} ${hasE?'<span style="color:#e67e22">E✓</span>':'<span style="color:#ccc">E</span>'}`;
    const popup=`<div style="font-family:'IBM Plex Mono',monospace;min-width:170px">
      <div style="font-weight:700;font-size:12px;margin-bottom:4px">${s.street_name}</div>
      <div style="font-size:10px;color:#6a80a0;margin-bottom:6px">Ward ${s.ward_no} · ${s.ward_name}</div>
      <div style="font-size:11px;margin-bottom:8px">${status}</div>
      <button onclick="selectStreetFromMap(${id})" style="width:100%;background:#2e7fd4;color:#fff;border:none;border-radius:6px;padding:5px 0;font-size:11px;font-family:inherit;cursor:pointer;font-weight:600">✏ Edit This Street</button>
    </div>`;
    pts.forEach((p,i)=>{
      const c=L.circleMarker([p.lat,p.lng],{radius:6,color:'rgba(0,0,0,0.3)',weight:1.5,fillColor:p.color,fillOpacity:0.9,interactive:true});
      if(i===0)c.bindPopup(popup,{maxWidth:220,className:'data-popup'});
      else c.on('click',()=>{
        // close other popups and open the anchor popup
        dataLayer.eachLayer(l=>{if(l.isPopupOpen&&l.isPopupOpen())l.closePopup();});
        dataLayer.eachLayer(l=>{if(l.getLatLng&&l.getLatLng().lat===anchor.lat&&l.getLatLng().lng===anchor.lng)l.openPopup();});
      });
      dataLayer.addLayer(c);
    });
  });
}
function selectStreetFromMap(id){
  // close any open popup first, then enter edit mode
  map.closePopup();
  selectStreet(id);
  // scroll to street in sidebar
  setTimeout(()=>{
    const el=document.querySelector(`.street-item.selected`);
    if(el)el.scrollIntoView({block:'nearest',behavior:'smooth'});
  },100);
}

// ── Markers ────────────────────────────────────────────
function refreshMarkers(){
  Object.values(markers).forEach(m=>{if(m)map.removeLayer(m)});markers={};
  if(polyline){map.removeLayer(polyline);polyline=null;}
  if(!selectedId)return;
  const d=gpsData[selectedId]||{},pts=[];
  const addM=(lat,lon,t)=>{
    const m=L.marker([lat,lon],{icon:ICONS[t],draggable:true}).addTo(map);
    m.bindPopup(`<b>${t==='S'?'START':t==='M'?'MID':'END'}</b><br>LAT: ${lat.toFixed(6)}<br>LON: ${lon.toFixed(6)}`);
    m.on('dragend',ev=>{
      const{lat:nl,lng:nln}=ev.target.getLatLng();
      undoStack.push({street_id:selectedId,prev:{...(gpsData[selectedId]||{})}});
      const dd=gpsData[selectedId]=gpsData[selectedId]||{};
      if(t==='S'){dd.start_lat=nl;dd.start_lon=nln;}
      else if(t==='M'){dd.mid_lat=nl;dd.mid_lon=nln;}
      else{dd.end_lat=nl;dd.end_lon=nln;}
      saveLS();upsert(selectedId);refreshMarkers();refreshDataLayer();renderList();updateProgress();updateSelPanel();
    });
    markers[t]=m;pts.push([lat,lon]);
  };
  if(d.start_lat!=null)addM(d.start_lat,d.start_lon,'S');
  if(d.mid_lat!=null)  addM(d.mid_lat,  d.mid_lon,  'M');
  if(d.end_lat!=null)  addM(d.end_lat,  d.end_lon,  'E');
  if(pts.length>=2)polyline=L.polyline(pts,{color:'#4da6ff',weight:2.5,dashArray:'7 9',opacity:0.7}).addTo(map);
  if(d.start_lat==null)nextPoint='S';
  else if(d.mid_lat==null)nextPoint='M';
  else if(d.end_lat==null)nextPoint='E';
  else nextPoint='S';
}

function deselectStreet(){
  selectedId=null;nextPoint='S';pendingEnd=null;overwritePending=null;
  refreshMarkers();refreshDataLayer();
  updateSelPanel();
  updateHint();
  renderList();
}
async function deleteStreetData(){
  if(!selectedId)return;
  const s=STREETS.find(x=>x.id===selectedId);
  if(!confirm(`Clear all GPS data for "${s?.street_name}"?\nThis cannot be undone.`))return;
  // push to undo stack before wiping
  undoStack.push({street_id:selectedId,prev:{...(gpsData[selectedId]||{})}});
  gpsData[selectedId]={start_lat:null,start_lon:null,mid_lat:null,mid_lon:null,end_lat:null,end_lon:null,updated_at:null};
  saveLS();
  // upsert all coords as null (uses same INSERT policy — no DELETE policy needed)
  try{
    await sbUpsert({street_id:selectedId,municipality:s?.municipality||'',constituency:s?.constituency||'',ward_no:s?.ward_no||'',ward_name:s?.ward_name||'',street_name:s?.street_name||'',start_lat:null,start_lon:null,mid_lat:null,mid_lon:null,end_lat:null,end_lon:null,updated_at:new Date().toISOString()});
    setDb('ok','SUPABASE ✓');
  }catch(e){console.error(e);setDb('error','CLEAR FAILED');}
  nextPoint='S';
  refreshMarkers();refreshDataLayer();updateSelPanel();updateHint();updateProgress();renderList();
  showToast('🗑 Cleared: '+s?.street_name);
}

function selectStreet(id){
  selectedId=id;refreshMarkers();refreshDataLayer();updateSelPanel();updateHint();renderList();
  const d=gpsData[id]||{},cs=[];
  if(d.start_lat!=null)cs.push([d.start_lat,d.start_lon]);
  if(d.mid_lat!=null)  cs.push([d.mid_lat,d.mid_lon]);
  if(d.end_lat!=null)  cs.push([d.end_lat,d.end_lon]);
  if(cs.length===1)map.flyTo(cs[0],Math.max(map.getZoom(),17),{duration:0.8});
  else if(cs.length>1)map.flyToBounds(L.latLngBounds(cs),{padding:[70,70],maxZoom:18,duration:0.8});
}
function autoAdvance(){const p=getFiltered().filter(s=>!isDone(s.id));if(p.length){selectStreet(p[0].id);showToast('▶ '+p[0].street_name);}}

function updateSelPanel(){
  const el=document.getElementById('sel-panel');
  if(!selectedId){el.classList.remove('show');return;}
  el.classList.add('show');
  const s=STREETS.find(x=>x.id===selectedId);if(!s)return;
  document.getElementById('sel-pname').textContent=s.street_name;
  document.getElementById('sel-pmeta').textContent=`Ward ${s.ward_no} · ${s.ward_name}\n${s.municipality}`;
  const d=gpsData[selectedId]||{},done=isDone(selectedId);
  const nx=document.getElementById('sel-pnext');
  if(done){nx.textContent='✓ ALL POINTS SAVED';nx.className='done';}
  else{const lbl={S:'▶ PLACE START',M:'▶ PLACE MID',E:'▶ PLACE END'},cls={S:'place-s',M:'place-m',E:'place-e'};nx.textContent=lbl[nextPoint];nx.className=cls[nextPoint];}
  let c='';
  if(d.start_lat!=null)c+=`S  ${d.start_lat.toFixed(5)}, ${d.start_lon.toFixed(5)}\n`;
  if(d.mid_lat!=null)  c+=`M  ${d.mid_lat.toFixed(5)}, ${d.mid_lon.toFixed(5)}\n`;
  if(d.end_lat!=null)  c+=`E  ${d.end_lat.toFixed(5)}, ${d.end_lon.toFixed(5)}`;
  document.getElementById('sel-pcoords').textContent=c;
  // ── Auto-measure S→M→E ──────────────────────────────
  const distEl=document.getElementById('sel-pdist');
  const hasS=d.start_lat!=null,hasM=d.mid_lat!=null,hasE=d.end_lat!=null;
  if(hasS&&hasM||hasM&&hasE||hasS&&hasE){
    let html='';
    if(hasS&&hasM){const sm=haversine(d.start_lat,d.start_lon,d.mid_lat,d.mid_lon);html+=`<div class="dist-row"><span class="dist-seg">S → M</span><span class="dist-val">${fmtDist(sm)}</span></div>`;}
    if(hasM&&hasE){const me=haversine(d.mid_lat,d.mid_lon,d.end_lat,d.end_lon);html+=`<div class="dist-row"><span class="dist-seg">M → E</span><span class="dist-val">${fmtDist(me)}</span></div>`;}
    if(hasS&&hasM&&hasE){
      const total=haversine(d.start_lat,d.start_lon,d.mid_lat,d.mid_lon)+haversine(d.mid_lat,d.mid_lon,d.end_lat,d.end_lon);
      html+=`<div class="dist-total"><span>Total Length</span><span class="dist-total-val">${fmtDist(total)}</span></div>`;
    } else if(hasS&&hasE&&!hasM){
      const se=haversine(d.start_lat,d.start_lon,d.end_lat,d.end_lon);
      html+=`<div class="dist-row"><span class="dist-seg">S → E</span><span class="dist-val">${fmtDist(se)}</span></div>`;
    }
    distEl.innerHTML=html;distEl.classList.add('show');
  }else{distEl.innerHTML='';distEl.classList.remove('show');}
  // show delete button if any point exists
  const delBtn=document.getElementById('sel-del-btn');
  if(delBtn){if(d.start_lat!=null||d.mid_lat!=null||d.end_lat!=null){delBtn.classList.add('show');}else{delBtn.classList.remove('show');}}
}
function updateHint(){
  const el=document.getElementById('placement-hint');
  if(!selectedId){el.textContent='Select a street from the sidebar to begin mapping';return;}
  const s=STREETS.find(x=>x.id===selectedId),n=s?`"${s.street_name}"`:'street';
  if(isDone(selectedId)){el.textContent='✓ All 3 points saved — click to overwrite START';return;}
  const lbl={S:'START',M:'MID',E:'END'};
  el.textContent=`Click map to place ${lbl[nextPoint]} point for ${n}`;
}

// ── Top Bar ────────────────────────────────────────────
function bindTopBar(){
  const undoBtn=document.getElementById('btn-undo');
  if(undoBtn)undoBtn.addEventListener('click',()=>{
    if(!undoStack.length){showToast('Nothing to undo','warn');return;}
    const{street_id,prev}=undoStack.pop();
    gpsData[street_id]=prev;
    if(Object.values(prev).every(v=>v==null))delete gpsData[street_id];
    saveLS();upsert(street_id);
    if(street_id===selectedId){refreshMarkers();updateSelPanel();updateHint();}
    refreshDataLayer();renderList();updateProgress();showToast('↩ Undo done');
  });
  const expBtn=document.getElementById('btn-export');
  if(expBtn)expBtn.addEventListener('click',exportExcel);
}

// ── Coord Search ───────────────────────────────────────
function bindSearchBar(){
  const inp=document.getElementById('coord-input'),btn=document.getElementById('coord-go'),fb=document.getElementById('coord-fb');
  function go(){
    const raw=inp.value.trim().replace(/[°′″'"]/g,'').replace(/[,;]+/g,' ').replace(/\s+/g,' ').trim();
    const pts=raw.split(' ').map(Number).filter(n=>!isNaN(n));
    if(pts.length<2){fb.textContent='✗ Invalid';fb.className='err';return;}
    const[lat,lon]=pts;
    if(lat<-90||lat>90||lon<-180||lon>180){fb.textContent='✗ Out of range';fb.className='err';return;}
    fb.textContent='✓ Flying…';fb.className='ok';
    if(searchPin)map.removeLayer(searchPin);
    searchPin=L.marker([lat,lon],{icon:ICONS.X}).addTo(map);
    searchPin.bindPopup(`<b>Search Pin</b><br>LAT: ${lat.toFixed(6)}<br>LON: ${lon.toFixed(6)}`).openPopup();
    map.flyTo([lat,lon],17,{duration:1.5});
    setTimeout(()=>{fb.textContent='';},4000);
  }
  btn.addEventListener('click',go);
  inp.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
}

// ── Muni Tabs ──────────────────────────────────────────
function buildMuniTabs(){
  const munis=[...new Set(allowedStreets.map(s=>s.municipality).filter(Boolean))];
  const wrap=document.getElementById('muni-tabs-wrap');
  if(munis.length<=1){wrap.style.display='none';return;}
  wrap.style.display='block';
  const c=document.getElementById('muni-tabs');c.innerHTML='';
  ['ALL',...munis].forEach(m=>{
    const cnt=m==='ALL'?allowedStreets.length:allowedStreets.filter(s=>s.municipality===m).length;
    const tab=document.createElement('div');tab.className='muni-tab'+(m===activeMuni?' active':'');
    tab.innerHTML=`${m}<span class="muni-badge">${cnt}</span>`;
    tab.addEventListener('click',()=>{activeMuni=m;document.querySelectorAll('.muni-tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');renderList();});
    c.appendChild(tab);
  });
}

// ── Searchable Ward Dropdown ───────────────────────────
function buildWardDropdown(){
  allWardOpts=[];
  const seen=new Map();
  allowedStreets.forEach(s=>{if(!seen.has(s.ward_no))seen.set(s.ward_no,{ward_no:s.ward_no,ward_name:s.ward_name,municipality:s.municipality});});
  allWardOpts=[{ward_no:'',ward_name:'All Wards',municipality:''},...[...seen.values()].sort((a,b)=>a.ward_no.localeCompare(b.ward_no,undefined,{numeric:true}))];
  renderWardOpts(allWardOpts);
}
function renderWardOpts(opts){
  const c=document.getElementById('ward-opts');c.innerHTML='';
  opts.forEach(w=>{
    const d=document.createElement('div');d.className='ward-opt'+(w.ward_no===currentWardFilter?' selected':'');
    d.textContent=w.ward_no?`Ward ${w.ward_no} — ${w.ward_name}`:w.ward_name;
    d.addEventListener('click',()=>{
      currentWardFilter=wardFilter=w.ward_no;
      document.getElementById('ward-trigger-text').textContent=w.ward_no?`Ward ${w.ward_no} — ${w.ward_name}`:'All Wards';
      closeWardMenu();renderList();
    });
    c.appendChild(d);
  });
}
function filterWardOpts(q){
  const f=q.toLowerCase();
  renderWardOpts(allWardOpts.filter(w=>!f||w.ward_name.toLowerCase().includes(f)||w.ward_no.includes(f)));
}
function toggleWardMenu(){
  const trigger=document.getElementById('ward-trigger'),menu=document.getElementById('ward-menu');
  const isOpen=menu.classList.contains('open');
  if(isOpen){closeWardMenu();}
  else{trigger.classList.add('open');menu.classList.add('open');document.getElementById('ward-search-inp').value='';filterWardOpts('');setTimeout(()=>document.getElementById('ward-search-inp').focus(),50);}
}
function closeWardMenu(){
  document.getElementById('ward-trigger').classList.remove('open');
  document.getElementById('ward-menu').classList.remove('open');
}
document.addEventListener('click',e=>{
  if(!document.getElementById('ward-filter-wrap').contains(e.target))closeWardMenu();
});

// ── Sidebar ────────────────────────────────────────────
function bindSidebar(){
  document.getElementById('street-search').addEventListener('input',e=>{streetSearch=e.target.value.toLowerCase();renderList();});
  document.querySelectorAll('.ftab').forEach(t=>t.addEventListener('click',()=>{activeFilter=t.dataset.f;document.querySelectorAll('.ftab').forEach(x=>x.classList.remove('active'));t.classList.add('active');renderList();}));
}
function isDone(id){const d=gpsData[id];return!!(d&&d.start_lat!=null&&d.mid_lat!=null&&d.end_lat!=null);}
function getFiltered(){
  return allowedStreets.filter(s=>{
    if(activeMuni!=='ALL'&&s.municipality!==activeMuni)return false;
    if(wardFilter&&s.ward_no!==wardFilter)return false;
    if(streetSearch&&!s.street_name.toLowerCase().includes(streetSearch))return false;
    if(activeFilter==='PENDING'&&isDone(s.id))return false;
    if(activeFilter==='DONE'&&!isDone(s.id))return false;
    if(filterToGf&&activeGfIds.size&&!isInActiveGf(s))return false;
    return true;
  });
}

// Point-in-polygon (ray casting)
function pip(lat,lng,poly){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
    if(((yi>lng)!==(yj>lng))&&(lat<(xj-xi)*(lng-yi)/(yj-yi)+xi))inside=!inside;
  }
  return inside;
}
function isInActiveGf(s){
  const d=gpsData[s.id]||{};
  const check=(lat,lng)=>{for(const id of activeGfIds){const g=geofences.find(x=>x.id===id);if(g&&pip(lat,lng,JSON.parse(g.geojson)))return true;}return false;};
  if(d.start_lat!=null&&check(d.start_lat,d.start_lon))return true;
  if(d.mid_lat!=null&&check(d.mid_lat,d.mid_lon))return true;
  if(d.end_lat!=null&&check(d.end_lat,d.end_lon))return true;
  return d.start_lat==null;
}

function renderList(){
  const con=document.getElementById('street-list'),fil=getFiltered();
  if(!fil.length){con.innerHTML='<div style="padding:24px 16px;text-align:center;color:var(--dim);font-size:12px;font-family:var(--mono)">No streets match filters</div>';return;}
  const grp={};
  fil.forEach(s=>{const k=s.ward_no+'||'+s.ward_name;(grp[k]=grp[k]||[]).push(s);});
  con.innerHTML='';
  Object.keys(grp).sort((a,b)=>a.split('||')[0].localeCompare(b.split('||')[0],undefined,{numeric:true})).forEach(k=>{
    const[wno,wname]=k.split('||');
    const h=document.createElement('div');h.className='ward-hdr';h.textContent=`Ward ${wno} — ${wname}`;con.appendChild(h);
    grp[k].forEach(s=>{
      const d=gpsData[s.id]||{},done=isDone(s.id);
      const it=document.createElement('div');
      it.className='street-item'+(done?' done':'')+(s.id===selectedId?' selected':'');
      it.innerHTML=`<div class="sdots"><div class="dot ${d.start_lat!=null?'s':''}"></div><div class="dot ${d.mid_lat!=null?'m':''}"></div><div class="dot ${d.end_lat!=null?'e':''}"></div></div><div class="si"><div class="sn">${s.street_name}</div><div class="sm">#${s.id} · ${s.municipality}</div></div>`;
      it.addEventListener('click',()=>{ if(s.id===selectedId){deselectStreet();}else{selectStreet(s.id);} });
      con.appendChild(it);
      if(s.id===selectedId)setTimeout(()=>it.scrollIntoView({block:'nearest',behavior:'smooth'}),60);
    });
  });
  const cS=allowedStreets.filter(s=>{const d=gpsData[s.id];return d&&d.start_lat!=null}).length;
  const cM=allowedStreets.filter(s=>{const d=gpsData[s.id];return d&&d.mid_lat!=null}).length;
  const cE=allowedStreets.filter(s=>{const d=gpsData[s.id];return d&&d.end_lat!=null}).length;
  const elS=document.getElementById('stat-s'),elM=document.getElementById('stat-m'),elE=document.getElementById('stat-e');
  if(elS)elS.textContent=cS;if(elM)elM.textContent=cM;if(elE)elE.textContent=cE;
}
function updateProgress(){
  const tot=allowedStreets.length;
  const done=allowedStreets.filter(s=>isDone(s.id)).length;
  const partial=allowedStreets.filter(s=>{const d=gpsData[s.id];return d&&(d.start_lat!=null||d.mid_lat!=null||d.end_lat!=null)&&!isDone(s.id);}).length;
  const pending=tot-done-partial;
  const pct=tot>0?Math.round(done/tot*100):0;
  // Update status bar
  const sb_done=document.getElementById('sb-done'),sb_partial=document.getElementById('sb-partial'),sb_pending=document.getElementById('sb-pending');
  const sb_pbar=document.getElementById('sb-pbar'),sb_pct=document.getElementById('sb-pct');
  if(sb_done)sb_done.textContent=done;
  if(sb_partial)sb_partial.textContent=partial;
  if(sb_pending)sb_pending.textContent=pending;
  if(sb_pbar)sb_pbar.style.width=pct+'%';
  if(sb_pct)sb_pct.textContent=pct+'%';
  // Update sidebar progress ring
  const ringFill=document.getElementById('sp-ring-fill'),pctTxt=document.getElementById('sp-pct-txt');
  if(ringFill)ringFill.setAttribute('stroke-dasharray',`${pct},100`);
  if(pctTxt)pctTxt.textContent=pct+'%';
  const spCounts=document.getElementById('sp-counts');if(spCounts)spCounts.textContent=`${done} / ${tot}`;
  const spPart=document.getElementById('sp-partial-cnt'),spPend=document.getElementById('sp-pending-cnt');
  if(spPart)spPart.textContent=`${partial} partial`;
  if(spPend)spPend.textContent=`${pending} pending`;
  updateDashboard(done,partial,pending,tot,pct);
}

// ── Navigation ─────────────────────────────────────────
let _currentPage='dashboard';
function navTo(section){
  // For map/measure/polygons route to map page or open polygon page
  if(section==='polygons'){openPoly();return;}
  if(section==='measure'){
    // go to map page, activate measure tab
    section='map';
    setTimeout(()=>{const t=document.getElementById('mmtab-measure');if(t)mapMode('measure',t);},100);
  }
  // Pages
  const pages=['dashboard','map','reports','admin'];
  pages.forEach(p=>{
    const el=document.getElementById('page-'+p);
    if(el){
      el.style.display=p===section?(p==='map'?'flex':'flex'):'none';
      if(p===section){el.classList.add('active');}else{el.classList.remove('active');}
    }
  });
  // Nav items
  document.querySelectorAll('.ln-item').forEach(el=>el.classList.remove('active'));
  const navId=section==='map'?'nav-map':section==='reports'?'nav-reports':section==='admin'?'nav-admin':section==='dashboard'?'nav-dashboard':null;
  if(navId){const navEl=document.getElementById(navId);if(navEl)navEl.classList.add('active');}
  _currentPage=section;
  // Side effects
  if(section==='map'){
    setTimeout(()=>{if(map)map.invalidateSize();},120);
    const activeTab=document.querySelector('.mmtab.active');
    if(!activeTab){const first=document.getElementById('mmtab-gps');if(first)first.classList.add('active');}
  }
  if(section==='reports'){
    const inp=document.getElementById('report-date');
    if(inp&&!inp.value){
      const now=new Date();
      inp.value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    }
    populateRptDateList();loadReportPreview();
  }
  if(section==='admin'){loadAdminData();}
}

// ── Map mode tabs ──────────────────────────────────────
function mapMode(mode,el){
  document.querySelectorAll('.mmtab').forEach(t=>t.classList.remove('active'));
  if(el)el.classList.add('active');
  if(mode==='polygons'){openPoly();return;}
  if(mode==='measure'){if(!measureActive)toggleMeasure();}
  else{if(measureActive)clearMeasure();}
}

// ── Toggle all-data background layer ──────────────────
let _dataLayerVisible=true;
function toggleDataLayer(){
  const btn=document.getElementById('data-layer-btn');
  _dataLayerVisible=!_dataLayerVisible;
  if(_dataLayerVisible){
    if(dataLayer)dataLayer.addTo(map);
    refreshDataLayer();
    if(btn){btn.textContent='◉ All Data';btn.classList.remove('off');btn.classList.add('active');}
  }else{
    if(dataLayer)map.removeLayer(dataLayer);
    if(btn){btn.textContent='○ All Data';btn.classList.add('off');btn.classList.remove('active');}
  }
}

// ── Toggle satellite (called from HTML onclick) ────────
function toggleSatView(){
  isSatellite=!isSatellite;const btn=document.getElementById('sat-toggle');
  if(isSatellite){map.removeLayer(osmLayer);satLayer.addTo(map);btn.classList.add('active');btn.textContent='◎ Street Map';}
  else{map.removeLayer(satLayer);osmLayer.addTo(map);btn.classList.remove('active');btn.textContent='◉ Satellite';}
}

// ── Login tab switch ───────────────────────────────────
function lsTab(name,el){
  document.querySelectorAll('.ls-tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');
  document.getElementById('ls-signin-pane').style.display=name==='signin'?'block':'none';
  document.getElementById('ls-create-pane').style.display=name==='create'?'block':'none';
}

// ── Dashboard ──────────────────────────────────────────
function updateDashboard(done,partial,pending,tot,pct){
  // Stat cards
  const sc_done=document.getElementById('sc-done'),sc_partial=document.getElementById('sc-partial'),sc_pending=document.getElementById('sc-pending');
  if(sc_done)sc_done.textContent=done;if(sc_partial)sc_partial.textContent=partial;if(sc_pending)sc_pending.textContent=pending;
  const scDonePct=document.getElementById('sc-done-pct');if(scDonePct)scDonePct.textContent=pct+'% complete';
  // Overall progress card
  const opPct=document.getElementById('op-pct'),opBar=document.getElementById('op-bar'),opCounts=document.getElementById('op-counts');
  if(opPct)opPct.textContent=pct+'%';
  if(opBar)opBar.style.width=pct+'%';
  if(opCounts)opCounts.textContent=`${done} / ${tot} streets`;
  // Donut chart
  const donutEl=document.getElementById('muni-donut'),donutPct=document.getElementById('donut-pct');
  if(donutEl&&tot>0){
    const donePct=Math.round(done/tot*100),partPct=Math.round(partial/tot*100),pendPct=100-donePct-partPct;
    const d1=donePct,d2=partPct,d3=pendPct;
    donutEl.style.background=`conic-gradient(#22c55e 0% ${d1}%, #f59e0b ${d1}% ${d1+d2}%, #e2e8f0 ${d1+d2}% 100%)`;
    donutEl.style.borderRadius='50%';
    if(donutPct)donutPct.textContent=donePct+'%';
  }
  const dsComp=document.getElementById('ds-comp'),dsPart=document.getElementById('ds-part'),dsPend=document.getElementById('ds-pend');
  if(dsComp&&tot>0)dsComp.textContent=Math.round(done/tot*100)+'%';
  if(dsPart&&tot>0)dsPart.textContent=Math.round(partial/tot*100)+'%';
  if(dsPend&&tot>0)dsPend.textContent=Math.round(pending/tot*100)+'%';
  // Ward chart
  renderWardChart();
  // Today's activity
  renderTodayActivity();
}

function renderWardChart(){
  const container=document.getElementById('ward-chart');if(!container)return;
  const wardMap={};
  allowedStreets.forEach(s=>{
    const k=s.ward_no+'|'+s.ward_name;
    if(!wardMap[k])wardMap[k]={no:s.ward_no,name:s.ward_name,total:0,done:0};
    wardMap[k].total++;
    if(isDone(s.id))wardMap[k].done++;
  });
  const wards=Object.values(wardMap).sort((a,b)=>a.no.localeCompare(b.no,undefined,{numeric:true})).slice(0,10);
  container.innerHTML=wards.map(w=>{
    const pct=w.total>0?Math.round(w.done/w.total*100):0;
    return `<div class="wc-row"><span class="wc-lbl" title="Ward ${w.no} — ${w.name}">Ward ${w.no}</span><div class="wc-bar-wrap"><div class="wc-bar" style="width:${pct}%"></div></div><span class="wc-pct">${pct}%</span></div>`;
  }).join('');
}

function renderTodayActivity(){
  const container=document.getElementById('activity-list'),sub=document.getElementById('dash-today-sub'),qaTodayLbl=document.getElementById('qa-today-lbl');
  if(!container)return;
  const now=new Date();
  const todayStr=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const rows=STREETS.filter(s=>{
    if(!allowedStreets.find(a=>a.id===s.id))return false;
    const d=gpsData[s.id];if(!d||!d.updated_at)return false;
    const saved=new Date(d.updated_at);
    const localDate=`${saved.getFullYear()}-${String(saved.getMonth()+1).padStart(2,'0')}-${String(saved.getDate()).padStart(2,'0')}`;
    return localDate===todayStr;
  });
  rows.sort((a,b)=>{
    const ta=new Date(gpsData[a.id]?.updated_at||0),tb=new Date(gpsData[b.id]?.updated_at||0);
    return tb-ta;
  });
  if(sub)sub.textContent=`${rows.length} street${rows.length!==1?'s':''} updated today`;
  if(qaTodayLbl)qaTodayLbl.textContent=`${rows.length} mapped today`;
  if(!rows.length){container.innerHTML='<div class="act-empty">No activity yet today</div>';return;}
  container.innerHTML=rows.slice(0,10).map(s=>{
    const d=gpsData[s.id]||{};
    const done=isDone(s.id);
    const color=done?'#22c55e':'#f59e0b';
    const saved=new Date(d.updated_at);
    const timeStr=saved.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true});
    return `<div class="act-item"><div class="act-dot" style="background:${color}"></div><span class="act-name">${s.street_name}</span><span class="act-time">${timeStr}</span></div>`;
  }).join('');
}

// ── Reports page helpers ───────────────────────────────
function populateRptDateList(){
  const container=document.getElementById('rpt-date-list');if(!container)return;
  const dateCounts={};
  Object.values(gpsData).forEach(d=>{
    if(!d.updated_at)return;
    const saved=new Date(d.updated_at);
    const key=`${saved.getFullYear()}-${String(saved.getMonth()+1).padStart(2,'0')}-${String(saved.getDate()).padStart(2,'0')}`;
    dateCounts[key]=(dateCounts[key]||0)+1;
  });
  const dates=Object.keys(dateCounts).sort().reverse().slice(0,20);
  if(!dates.length){container.innerHTML='<div style="padding:12px 16px;font-size:12px;color:#94a3b8">No mapped data yet</div>';return;}
  const current=document.getElementById('report-date')?.value;
  container.innerHTML=dates.map(d=>{
    const dt=new Date(d+'T00:00:00');
    const lbl=dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
    return `<div class="rpt-date-item${d===current?' active':''}" onclick="selectRptDate('${d}',this)">${lbl}<span class="rpt-date-cnt">${dateCounts[d]}</span></div>`;
  }).join('');
}
function selectRptDate(dateStr,el){
  document.querySelectorAll('.rpt-date-item').forEach(x=>x.classList.remove('active'));
  if(el)el.classList.add('active');
  const inp=document.getElementById('report-date');if(inp)inp.value=dateStr;
  loadReportPreview();
}
function rptDateShift(dir){
  const inp=document.getElementById('report-date');if(!inp||!inp.value)return;
  const d=new Date(inp.value+'T00:00:00');d.setDate(d.getDate()+dir);
  inp.value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  loadReportPreview();
}
let _rptFilter='all';
function setRptFilter(f,el){
  _rptFilter=f;
  document.querySelectorAll('.rft').forEach(x=>x.classList.remove('active'));
  if(el)el.classList.add('active');
  filterRptTable(document.getElementById('rpt-search')?.value||'');
}
function filterRptTable(q){
  const rows=document.querySelectorAll('#report-tbody tr[data-status]');
  const ql=q.toLowerCase();
  rows.forEach(r=>{
    const st=r.dataset.status,nm=r.dataset.name||'';
    const matchQ=!ql||nm.toLowerCase().includes(ql);
    const matchF=_rptFilter==='all'||(_rptFilter==='full'&&st==='full')||(_rptFilter==='part'&&st==='part');
    r.style.display=matchQ&&matchF?'':'none';
  });
}

// ── Admin page helpers ─────────────────────────────────
function showAddUserForm(){
  const f=document.getElementById('add-user-form');if(f)f.style.display=f.style.display==='none'?'block':'none';
}
function showAddGroupForm(){
  const f=document.getElementById('add-group-form');if(f)f.style.display=f.style.display==='none'?'block':'none';
}

// ── Toast ──────────────────────────────────────────────
let _tt=null;
function showToast(msg,type=''){const el=document.getElementById('toast');el.textContent=msg;el.className='show'+(type?' '+type:'');clearTimeout(_tt);_tt=setTimeout(()=>el.classList.remove('show'),2800);}

// ── Geofences ──────────────────────────────────────────
async function loadGeofences(){
  try{geofences=await sbGet('geofences','select=*&order=id');renderGfPanel();renderGfList();updateMainGfLayers();}
  catch(e){console.error('Geofences:',e);}
}
function renderGfPanel(){
  const el=document.getElementById('gf-panel-list');
  if(!geofences.length){el.innerHTML='<div class="gf-empty">No zones yet.<br>Open ◇ Polygons to create one.</div>';return;}
  el.innerHTML='';
  geofences.forEach(g=>{
    const item=document.createElement('div');item.className='gf-panel-item'+(activeGfIds.has(g.id)?' active-gf':'');
    item.innerHTML=`<span class="gf-swatch" style="background:${g.color}"></span><span class="gf-panel-name">${g.name}</span><span class="gf-eye">${activeGfIds.has(g.id)?'👁':'○'}</span>`;
    item.addEventListener('click',()=>{
      if(activeGfIds.has(g.id))activeGfIds.delete(g.id);else activeGfIds.add(g.id);
      item.classList.toggle('active-gf');
      updateMainGfLayers();if(filterToGf)renderList();
    });
    el.appendChild(item);
  });
}
function toggleGfPanel(){
  const btn=document.getElementById('gf-btn'),panel=document.getElementById('gf-panel');
  const open=panel.classList.contains('open');
  if(open){panel.classList.remove('open');btn.classList.remove('active');}
  else{panel.classList.add('open');btn.classList.add('active');}
}
function onGfFilterChange(){filterToGf=document.getElementById('gf-filter-check').checked;renderList();}
function updateMainGfLayers(){
  Object.values(mainGfLayers).forEach(l=>map.removeLayer(l));mainGfLayers={};
  geofences.filter(g=>activeGfIds.has(g.id)).forEach(g=>{
    try{
      const coords=JSON.parse(g.geojson);
      const poly=L.polygon(coords,{color:g.color,weight:2,fillOpacity:0.07,dashArray:'6 5'}).addTo(map);
      poly.bindTooltip(g.name,{permanent:false,className:'leaflet-tooltip'});
      mainGfLayers[g.id]=poly;
    }catch{}
  });
}

// ── Admin Panel ────────────────────────────────────────
function openAdmin(){document.getElementById('admin-overlay').classList.remove('hidden');loadAdminData();}
function closeAdmin(){document.getElementById('admin-overlay').classList.add('hidden');}
function aTab(name,el){
  // works for both old .atab and new .adm-tab
  document.querySelectorAll('.atab,.adm-tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');
  document.querySelectorAll('.asec').forEach(s=>s.classList.remove('active'));
  document.getElementById('asec-'+name).classList.add('active');
}
function aMsg(msg,type='ok'){const el=document.getElementById('amsg');el.textContent=msg;el.className='amsg '+type;el.style.display='block';setTimeout(()=>{el.style.display='none';},3500);}
async function loadAdminData(){
  try{[aGroups,aUsers]=await Promise.all([sbGet('app_groups','select=id,group_name&order=id'),sbGet('app_users','select=id,username,full_name,role,group_id,is_active&order=id')]);renderUT();renderGT();popGrpSels();}
  catch(e){aMsg('Load error: '+e.message,'err');}
}
function renderUT(){
  const tb=document.getElementById('utbody');if(!tb)return;
  const adm_cnt=document.getElementById('adm-user-count');if(adm_cnt)adm_cnt.textContent=aUsers.length;
  tb.innerHTML='';
  const _avatarColors=['#3b82f6','#8b5cf6','#22c55e','#f59e0b','#ef4444','#06b6d4'];
  aUsers.forEach(u=>{
    const g=aGroups.find(x=>x.id===u.group_id);
    const initials=(u.full_name||u.username||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
    const avatarBg=_avatarColors[(u.id||0)%_avatarColors.length];
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><div style="display:flex;align-items:center;gap:10px"><div style="width:32px;height:32px;border-radius:50%;background:${avatarBg};color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${initials}</div><div><div style="font-weight:600">${u.full_name||u.username}</div><div style="font-size:11px;color:#94a3b8">${u.username}</div></div></div></td><td style="font-size:12px;color:#64748b">${u.username}</td><td><span class="rbadge ${u.role}">${u.role}</span></td><td style="font-size:12px;color:#64748b">${g?g.group_name:'—'}</td><td><button class="icobtn" onclick="deleteUser(${u.id},'${u.username}')">🗑</button></td>`;
    tb.appendChild(tr);
  });
}
function renderGT(){
  const tb=document.getElementById('gtbody');if(!tb)return;
  const adm_grp=document.getElementById('adm-group-count');if(adm_grp)adm_grp.textContent=aGroups.length;
  tb.innerHTML='';
  aGroups.forEach(g=>{
    const mem=aUsers.filter(u=>u.group_id===g.id).length;
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><b>${g.group_name}</b></td><td>${mem}</td><td><button class="icobtn" onclick="deleteGroup(${g.id},'${g.group_name}')">🗑</button></td>`;
    tb.appendChild(tr);
  });
}
function popGrpSels(){['nu-g','wa-g'].forEach(id=>{const sel=document.getElementById(id);const cur=sel.value;sel.innerHTML=id==='nu-g'?'<option value="">No Group</option>':'<option value="">— choose group —</option>';aGroups.forEach(g=>{const o=document.createElement('option');o.value=g.id;o.textContent=g.group_name;sel.appendChild(o);});if(cur)sel.value=cur;});}
async function createUser(){
  const u=document.getElementById('nu-u').value.trim(),fn=document.getElementById('nu-fn').value.trim(),p=document.getElementById('nu-p').value,role=document.getElementById('nu-r').value,gid=document.getElementById('nu-g').value||null;
  if(!u||!p){aMsg('Username and password required','err');return;}
  try{const h=await sha256(p);await sbPost('app_users',{username:u,password_hash:h,full_name:fn||u,role,group_id:gid?+gid:null,is_active:true},'return=minimal');aMsg(`User "${u}" created`);['nu-u','nu-fn','nu-p'].forEach(id=>document.getElementById(id).value='');await loadAdminData();}
  catch(e){aMsg('Error: '+e.message,'err');}
}
async function deleteUser(id,uname){if(!confirm(`Delete user "${uname}"?`))return;try{await sbDel('app_users',`id=eq.${id}`);aMsg('User deleted');await loadAdminData();}catch(e){aMsg('Error: '+e.message,'err');}}
async function createGroup(){const name=document.getElementById('ng-n').value.trim();if(!name){aMsg('Enter group name','err');return;}try{await sbPost('app_groups',{group_name:name},'return=minimal');aMsg(`Group "${name}" created`);document.getElementById('ng-n').value='';await loadAdminData();}catch(e){aMsg('Error: '+e.message,'err');}}
async function deleteGroup(id,name){if(!confirm(`Delete group "${name}"?`))return;try{await sbDel('app_groups',`id=eq.${id}`);aMsg('Group deleted');await loadAdminData();}catch(e){aMsg('Error: '+e.message,'err');}}
async function loadWardAssign(){
  const gid=document.getElementById('wa-g').value,grid=document.getElementById('ward-grid'),btn=document.getElementById('wa-save-btn');
  if(!gid){grid.innerHTML='<div style="color:var(--dim);font-size:12px;padding:12px;grid-column:1/-1">Select a group above</div>';btn.style.display='none';return;}
  btn.style.display='inline-block';
  grid.innerHTML='<div style="color:var(--dim);font-size:12px;padding:12px;grid-column:1/-1">Loading…</div>';
  try{
    const assigned=await sbGet('group_wards',`group_id=eq.${gid}&select=municipality,ward_no`);
    const aSet=new Set(assigned.map(w=>w.municipality+'|'+w.ward_no));
    const wm=new Map();
    STREETS.forEach(s=>{const k=s.municipality+'|'+s.ward_no;if(!wm.has(k))wm.set(k,{municipality:s.municipality,ward_no:s.ward_no,ward_name:s.ward_name});});
    grid.innerHTML='';
    [...wm.entries()].sort((a,b)=>{const[am,aw]=a[0].split('|');const[bm,bw]=b[0].split('|');return am.localeCompare(bm)||aw.localeCompare(bw,undefined,{numeric:true});}).forEach(([k,w])=>{
      const lbl=document.createElement('label');lbl.className='wcb';
      lbl.innerHTML=`<input type="checkbox" ${aSet.has(k)?'checked':''} data-key="${k}" data-muni="${w.municipality}" data-ward="${w.ward_no}"><span class="wcb-lbl">Ward ${w.ward_no} — ${w.ward_name}<br><span class="wcb-muni">${w.municipality}</span></span>`;
      grid.appendChild(lbl);
    });
  }catch(e){grid.innerHTML='<div style="color:var(--red);font-size:12px;padding:12px;grid-column:1/-1">Error: '+e.message+'</div>';}
}
async function saveWardAssign(){
  const gid=document.getElementById('wa-g').value;if(!gid)return;
  const checks=document.querySelectorAll('#ward-grid input[type=checkbox]');
  const sel=[...checks].filter(c=>c.checked).map(c=>({group_id:+gid,municipality:c.dataset.muni,ward_no:c.dataset.ward}));
  try{await sbDel('group_wards',`group_id=eq.${gid}`);if(sel.length){const r=await fetch(`${SUPABASE_URL}/rest/v1/group_wards`,{method:'POST',headers:sbH({'Prefer':'return=minimal'}),body:JSON.stringify(sel)});if(!r.ok)throw new Error(await r.text());}aMsg(`Saved ${sel.length} wards`);}
  catch(e){aMsg('Error: '+e.message,'err');}
}

// ── Polygon / Geofence Module ──────────────────────────
function openPoly(){
  document.getElementById('poly-page').classList.add('show');
  if(!polyMap)initPolyMap();
  setTimeout(()=>polyMap.invalidateSize(),120);
  renderGfList();
}
function closePoly(){document.getElementById('poly-page').classList.remove('show');}

function initPolyMap(){
  polyMap=L.map('poly-map').setView([11.9416,79.8083],14);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:21,attribution:'© CARTO'}).addTo(polyMap);
  drawnItems=new L.FeatureGroup().addTo(polyMap);
  const drawCtrl=new L.Control.Draw({
    edit:{featureGroup:drawnItems,edit:{selectedPathOptions:{maintainColor:true}}},
    draw:{polygon:{allowIntersection:false,showArea:true,shapeOptions:{color:'#a78bfa',fillOpacity:0.15}},polyline:false,rectangle:{shapeOptions:{color:'#a78bfa',fillOpacity:0.15}},circle:false,circlemarker:false,marker:false}
  });
  polyMap.addControl(drawCtrl);
  polyMap.on('draw:created',e=>{
    drawnItems.clearLayers();drawnItems.addLayer(e.layer);
    let coords=[];
    if(e.layerType==='polygon'){coords=e.layer.getLatLngs()[0].map(ll=>[ll.lat,ll.lng]);}
    else if(e.layerType==='rectangle'){coords=e.layer.getLatLngs()[0].map(ll=>[ll.lat,ll.lng]);}
    drawnCoords=coords;
    document.getElementById('poly-save-form').classList.add('show');
    document.getElementById('poly-status').textContent=`Polygon ready (${coords.length} vertices). Name it and save.`;
    document.getElementById('draw-poly-btn').classList.remove('active');
  });
  polyMap.on('draw:drawstart',()=>{
    document.getElementById('poly-status').textContent='Click to add vertices. Double-click to finish the polygon.';
    document.getElementById('draw-poly-btn').classList.add('active');
  });
  polyMap.on('draw:drawstop',()=>{document.getElementById('draw-poly-btn').classList.remove('active');});
}

function startDrawPolygon(){
  if(!polyMap)return;
  new L.Draw.Polygon(polyMap,{allowIntersection:false,showArea:true,shapeOptions:{color:'#a78bfa',fillOpacity:0.15}}).enable();
}

function renderGfList(){
  const badge=document.getElementById('gf-count-badge');
  const container=document.getElementById('gf-cards');
  if(badge)badge.textContent=geofences.length+' zone'+(geofences.length!==1?'s':'');
  if(!geofences.length){
    container.innerHTML='<div class="gf-empty-state"><div class="gf-empty-icon">◇</div>No geofences yet.<br>Draw a polygon on the map<br>or upload a KML file.</div>';
    return;
  }
  container.innerHTML='';
  geofences.forEach((g,i)=>{
    const d=g.created_at?new Date(g.created_at):null;
    const dateStr=d?d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—';
    const yearStr=d?d.getFullYear():'';
    const card=document.createElement('div');
    card.className='gf-card';
    card.innerHTML=`
      <div class="gf-card-si">${i+1}</div>
      <div class="gf-card-main">
        <div class="gf-card-name">
          <span class="gf-card-dot" style="background:${g.color}"></span>
          <span title="${g.name}">${g.name}</span>
        </div>
        <div class="gf-card-date">${dateStr} ${yearStr}</div>
      </div>
      <div class="gf-card-date-col">${dateStr}<br><span style="color:var(--dim);font-size:9px">${yearStr}</span></div>
      <div class="gf-card-actions">
        <button class="gf-icon-btn" onclick="event.stopPropagation();editGeofence(${g.id})" title="Edit geofence">✎</button>
        <button class="gf-icon-btn del-btn" onclick="event.stopPropagation();deleteGeofence(${g.id})" title="Delete geofence">🗑</button>
      </div>`;
    card.addEventListener('click',()=>{
      try{
        const coords=JSON.parse(g.geojson);
        drawnItems.clearLayers();
        const poly=L.polygon(coords,{color:g.color,fillOpacity:0.18,weight:2});
        drawnItems.addLayer(poly);
        polyMap.fitBounds(poly.getBounds(),{padding:[50,50]});
        document.getElementById('poly-status').textContent=`Viewing: "${g.name}" — ${coords.length} vertices`;
        container.querySelectorAll('.gf-card').forEach(c=>c.classList.remove('active-card'));
        card.classList.add('active-card');
      }catch{}
    });
    container.appendChild(card);
  });
}

function editGeofence(id){
  const g=geofences.find(x=>x.id===id);if(!g)return;
  document.getElementById('gf-edit-id').value=id;
  document.getElementById('gf-edit-name').value=g.name;
  document.getElementById('gf-edit-color').value=g.color||'#ff6b35';
  document.getElementById('gf-edit-overlay').classList.add('show');
}
function closeGfEdit(){document.getElementById('gf-edit-overlay').classList.remove('show');}
async function saveGfEdit(){
  const id=+document.getElementById('gf-edit-id').value;
  const name=document.getElementById('gf-edit-name').value.trim();
  const color=document.getElementById('gf-edit-color').value;
  if(!name){showToast('Name cannot be empty','warn');return;}
  try{
    const r=await fetch(`${SUPABASE_URL}/rest/v1/geofences?id=eq.${id}`,{method:'PATCH',headers:sbH({'Prefer':'return=minimal'}),body:JSON.stringify({name,color})});
    if(!r.ok)throw new Error(await r.text());
    closeGfEdit();
    await loadGeofences();
    updateMainGfLayers();
    showToast('✓ Geofence updated');
  }catch(e){showToast('Error: '+e.message,'err2');}
}

async function saveGeofence(){
  const name=document.getElementById('poly-name').value.trim();
  const color=document.getElementById('poly-color').value;
  if(!name){showToast('Enter a name','warn');return;}
  if(!drawnCoords||!drawnCoords.length){showToast('Draw a polygon first','warn');return;}
  try{
    await sbPost('geofences',{name,color,geojson:JSON.stringify(drawnCoords)},'return=minimal');
    document.getElementById('poly-save-form').classList.remove('show');
    document.getElementById('poly-name').value='';
    drawnItems.clearLayers();drawnCoords=null;
    await loadGeofences();showToast('✓ Geofence "'+name+'" saved!');
    document.getElementById('poly-status').textContent='Geofence saved. Draw another or upload a KML file.';
  }catch(e){showToast('Error: '+e.message,'err2');}
}

function clearDrawing(){
  if(drawnItems)drawnItems.clearLayers();
  drawnCoords=null;
  document.getElementById('poly-save-form').classList.remove('show');
  document.getElementById('poly-name').value='';
  document.getElementById('poly-status').textContent='Drawing cleared. Click "Draw Polygon" to start again.';
  document.getElementById('draw-poly-btn').classList.remove('active');
}

async function deleteGeofence(id){
  if(!confirm('Delete this geofence?'))return;
  try{await sbDel('geofences',`id=eq.${id}`);activeGfIds.delete(id);await loadGeofences();updateMainGfLayers();showToast('Deleted');}
  catch(e){showToast('Error: '+e.message,'err2');}
}

// KML Upload & Parse
function handleKML(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const polys=parseKML(ev.target.result);
    if(!polys.length){showToast('No polygons found in KML','warn');return;}
    const p=polys[0];drawnItems.clearLayers();
    const poly=L.polygon(p.points,{color:'#a78bfa',fillOpacity:0.15});
    drawnItems.addLayer(poly);polyMap.fitBounds(poly.getBounds(),{padding:[40,40]});
    drawnCoords=p.points;
    document.getElementById('poly-name').value=p.name;
    document.getElementById('poly-save-form').classList.add('show');
    document.getElementById('poly-status').textContent=`KML loaded: "${p.name}" (${p.points.length} vertices)${polys.length>1?' — '+polys.length+' polygons found, showing first':''}`;
    showToast(`KML: "${p.name}" loaded`);
  };
  reader.readAsText(file);
  input.value='';
}
function parseKML(kml){
  const doc=new DOMParser().parseFromString(kml,'text/xml');const results=[];
  doc.querySelectorAll('Placemark').forEach(pm=>{
    const name=pm.querySelector('name')?.textContent||'Polygon';
    pm.querySelectorAll('coordinates').forEach(ce=>{
      const pts=ce.textContent.trim().split(/\s+/).filter(Boolean).map(c=>{
        const p=c.split(',').map(parseFloat);return[p[1],p[0]];
      }).filter(p=>!isNaN(p[0])&&!isNaN(p[1]));
      if(pts.length>=3)results.push({name,points:pts});
    });
  });
  return results;
}

// ── Lazy-load SheetJS ──────────────────────────────────
function loadXLSX(){
  return new Promise((res,rej)=>{
    if(typeof XLSX!=='undefined'){res();return;}
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload=res;s.onerror=()=>rej(new Error('Failed to load SheetJS'));
    document.head.appendChild(s);
  });
}

// ── Daily Report ───────────────────────────────────────
function openReport(){navTo('reports');}
function closeReport(){/* no-op: reports is a page now */}

function getReportRows(dateStr){
  // dateStr = "YYYY-MM-DD"
  return STREETS.filter(s=>{
    if(!allowedStreets.find(a=>a.id===s.id))return false;
    const d=gpsData[s.id];
    if(!d||!d.updated_at)return false;
    // compare date portion in local time
    const saved=new Date(d.updated_at);
    const localDate=`${saved.getFullYear()}-${String(saved.getMonth()+1).padStart(2,'0')}-${String(saved.getDate()).padStart(2,'0')}`;
    return localDate===dateStr;
  });
}

function loadReportPreview(){
  const dateStr=document.getElementById('report-date')?.value;
  if(!dateStr)return;
  const rows=getReportRows(dateStr);
  const full=rows.filter(s=>{const d=gpsData[s.id]||{};return d.start_lat!=null&&d.mid_lat!=null&&d.end_lat!=null;}).length;
  const part=rows.length-full;

  // Update date heading
  const dateBig=document.getElementById('rpt-date-big');
  const dateSub=document.getElementById('rpt-streets-sub');
  if(dateBig){const dt=new Date(dateStr+'T00:00:00');dateBig.textContent=dt.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});}
  if(dateSub)dateSub.textContent=rows.length===0?'No data for this date':`${rows.length} street${rows.length!==1?'s':''} mapped — ${full} complete, ${part} partial`;

  // Summary nums
  const sumNums=document.getElementById('rpt-summary-nums');
  if(sumNums&&rows.length>0)sumNums.innerHTML=`<div class="rsn-item"><div class="rsn-val">${rows.length}</div><div class="rsn-lbl">Total</div></div><div class="rsn-item"><div class="rsn-val" style="color:#22c55e">${full}</div><div class="rsn-lbl">Complete</div></div><div class="rsn-item"><div class="rsn-val" style="color:#f59e0b">${part}</div><div class="rsn-lbl">Partial</div></div>`;
  else if(sumNums)sumNums.innerHTML='';

  // table body
  const tbody=document.getElementById('report-tbody');
  if(!tbody)return;
  if(rows.length===0){
    tbody.innerHTML='<tr><td colspan="7" class="rpt-empty">No streets were mapped on '+dateStr+'</td></tr>';
    return;
  }
  const dot=(v,cls)=>`<span class="report-dot ${v!=null?cls:'n'}"></span>`;
  tbody.innerHTML=rows.map((s,i)=>{
    const d=gpsData[s.id]||{};
    const hasS=d.start_lat!=null,hasM=d.mid_lat!=null,hasE=d.end_lat!=null;
    let totalM=0;
    if(hasS&&hasM)totalM+=haversine(d.start_lat,d.start_lon,d.mid_lat,d.mid_lon);
    if(hasM&&hasE)totalM+=haversine(d.mid_lat,d.mid_lon,d.end_lat,d.end_lon);
    else if(hasS&&hasE&&!hasM)totalM+=haversine(d.start_lat,d.start_lon,d.end_lat,d.end_lon);
    const lenStr=totalM>0?`<span class="report-len">${fmtDist(totalM)}</span>`:'—';
    const saved=new Date(d.updated_at);
    const timeStr=saved.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true});
    const isDoneSt=hasS&&hasM&&hasE;
    const status=isDoneSt?'<span class="report-status-full">FULL</span>':'<span class="report-status-part">PART</span>';
    const stKey=isDoneSt?'full':'part';
    return `<tr data-status="${stKey}" data-name="${s.street_name}">
      <td style="font-size:11px;color:#94a3b8">W${s.ward_no}</td>
      <td><b>${s.street_name}</b></td>
      <td style="font-size:11px;color:#94a3b8">${s.municipality}</td>
      <td>${status}</td>
      <td style="text-align:center">${dot(hasS?1:null,'s')} ${dot(hasM?1:null,'m')} ${dot(hasE?1:null,'e')}</td>
      <td>${lenStr}</td>
      <td class="report-time">${timeStr}</td>
    </tr>`;
  }).join('');
  // Reapply filter
  filterRptTable(document.getElementById('rpt-search')?.value||'');
}

async function exportReport(){
  const dateStr=document.getElementById('report-date').value;
  if(!dateStr){showToast('Pick a date first','err2');return;}
  try{await loadXLSX();}catch(e){showToast('SheetJS load failed','err2');return;}
  const rows=getReportRows(dateStr);
  if(rows.length===0){showToast('No data for '+dateStr,'err2');return;}

  const wb=XLSX.utils.book_new(),ws={};
  const C=['A','B','C','D','E','F','G','H','I','J','K','L','M'];
  const H1=['#','MUNICIPALITY','WARD NO','WARD NAME','NAME OF THE STREET','START GPS','','MID GPS','','END GPS','','TOTAL LENGTH','SAVED AT'];
  const H2=['','','','','','LATITUDE','LONGITUDE','LATITUDE','LONGITUDE','LATITUDE','LONGITUDE','(metres)',''];
  const mh=(v,rgb)=>({v,t:'s',s:{font:{bold:true},fill:{patternType:'solid',fgColor:{rgb}},alignment:{horizontal:'center',vertical:'center'}}});
  H1.forEach((v,i)=>{if(v)ws[C[i]+'1']=mh(v,i===11?'FF4472C4':i===12?'FF70AD47':'FFB8B8B8');});
  H2.forEach((v,i)=>{if(v){const rgb=i<=6?'FF92D050':i<=8?'FFFFFF00':i===11?'FFD6E4F0':i===12?'FFE2EFDA':'FFFF8888';ws[C[i]+'2']=mh(v,rgb);}});

  rows.forEach((s,idx)=>{
    const R=String(idx+3),d=gpsData[s.id]||{};
    ws['A'+R]={v:idx+1,t:'n'};
    ws['B'+R]={v:s.municipality||'',t:'s'};
    ws['C'+R]={v:s.ward_no||'',t:'s'};
    ws['D'+R]={v:s.ward_name||'',t:'s'};
    ws['E'+R]={v:s.street_name||'',t:'s'};
    const nc=v=>v!=null?{v,t:'n',z:'0.000000'}:{v:'',t:'s'};
    ws['F'+R]=nc(d.start_lat);ws['G'+R]=nc(d.start_lon);
    ws['H'+R]=nc(d.mid_lat);ws['I'+R]=nc(d.mid_lon);
    ws['J'+R]=nc(d.end_lat);ws['K'+R]=nc(d.end_lon);
    const hasS=d.start_lat!=null,hasM=d.mid_lat!=null,hasE=d.end_lat!=null;
    let totalM=0;
    if(hasS&&hasM)totalM+=haversine(d.start_lat,d.start_lon,d.mid_lat,d.mid_lon);
    if(hasM&&hasE)totalM+=haversine(d.mid_lat,d.mid_lon,d.end_lat,d.end_lon);
    else if(hasS&&hasE&&!hasM)totalM+=haversine(d.start_lat,d.start_lon,d.end_lat,d.end_lon);
    ws['L'+R]=totalM>0?{v:Math.round(totalM),t:'n'}:{v:'',t:'s'};
    ws['M'+R]=d.updated_at?{v:new Date(d.updated_at).toLocaleString('en-IN'),t:'s'}:{v:'',t:'s'};
  });

  const lastRow=rows.length+2;
  ws['!ref']=`A1:M${lastRow}`;
  ws['!merges']=[
    {s:{r:0,c:0},e:{r:1,c:0}},{s:{r:0,c:1},e:{r:1,c:1}},{s:{r:0,c:2},e:{r:1,c:2}},
    {s:{r:0,c:3},e:{r:1,c:3}},{s:{r:0,c:4},e:{r:1,c:4}},
    {s:{r:0,c:5},e:{r:0,c:6}},{s:{r:0,c:7},e:{r:0,c:8}},{s:{r:0,c:9},e:{r:0,c:10}},
    {s:{r:0,c:11},e:{r:1,c:11}},{s:{r:0,c:12},e:{r:1,c:12}}
  ];
  ws['!cols']=[{wch:5},{wch:16},{wch:9},{wch:18},{wch:32},{wch:13},{wch:13},{wch:13},{wch:13},{wch:13},{wch:13},{wch:12},{wch:18}];
  XLSX.utils.book_append_sheet(wb,ws,`Report ${dateStr}`);
  XLSX.writeFile(wb,`field_report_${dateStr}.xlsx`);
  showToast(`✓ Exported ${rows.length} streets for ${dateStr}`);
}

// ── Excel Export ───────────────────────────────────────
async function exportExcel(){
  try{await loadXLSX();}catch(e){showToast('SheetJS load failed','err2');return;}
  const wb=XLSX.utils.book_new(),ws={};
  const C=['A','B','C','D','E','F','G','H','I','J','K','L'];
  const H1=['MUNICIPALITY','CONSITUENCY','WARD NO','WARD NAME','NAME OF THE STREET','START GPS','','MID GPS','','END GPS','','TOTAL LENGTH'];
  const H2=['','','','','','LATITUDE','LONGTITUDE','LATITUDE','LONGITUDE','LATITUDE','LONGITUDE','(metres)'];
  const mh=(v,rgb)=>({v,t:'s',s:{font:{bold:true},fill:{patternType:'solid',fgColor:{rgb}},alignment:{horizontal:'center',vertical:'center'}}});
  H1.forEach((v,i)=>{if(v)ws[C[i]+'1']=mh(v,i===11?'FF4472C4':'FFB8B8B8');});
  H2.forEach((v,i)=>{if(v){const rgb=i<=6?'FF92D050':i<=8?'FFFFFF00':i===11?'FFD6E4F0':'FFFF8888';ws[C[i]+'2']=mh(v,rgb);}});
  allowedStreets.forEach((s,idx)=>{
    const R=String(idx+3),d=gpsData[s.id]||{};
    ws['A'+R]={v:s.municipality||'',t:'s'};ws['B'+R]={v:s.constituency||'',t:'s'};
    ws['C'+R]={v:s.ward_no||'',t:'s'};ws['D'+R]={v:s.ward_name||'',t:'s'};ws['E'+R]={v:s.street_name||'',t:'s'};
    const nc=v=>v!=null?{v,t:'n',z:'0.000000'}:{v:'',t:'s'};
    ws['F'+R]=nc(d.start_lat);ws['G'+R]=nc(d.start_lon);ws['H'+R]=nc(d.mid_lat);ws['I'+R]=nc(d.mid_lon);ws['J'+R]=nc(d.end_lat);ws['K'+R]=nc(d.end_lon);
    // Total length: sum of available segments
    const hasS=d.start_lat!=null&&d.start_lon!=null;
    const hasM=d.mid_lat!=null&&d.mid_lon!=null;
    const hasE=d.end_lat!=null&&d.end_lon!=null;
    let totalM=0;
    if(hasS&&hasM) totalM+=haversine(d.start_lat,d.start_lon,d.mid_lat,d.mid_lon);
    if(hasM&&hasE) totalM+=haversine(d.mid_lat,d.mid_lon,d.end_lat,d.end_lon);
    else if(hasS&&hasE&&!hasM) totalM+=haversine(d.start_lat,d.start_lon,d.end_lat,d.end_lon);
    ws['L'+R]=totalM>0?{v:Math.round(totalM),t:'n'}:{v:'',t:'s'};
  });
  ws['!ref']=`A1:L${allowedStreets.length+2}`;
  ws['!merges']=[{s:{r:0,c:0},e:{r:1,c:0}},{s:{r:0,c:1},e:{r:1,c:1}},{s:{r:0,c:2},e:{r:1,c:2}},{s:{r:0,c:3},e:{r:1,c:3}},{s:{r:0,c:4},e:{r:1,c:4}},{s:{r:0,c:5},e:{r:0,c:6}},{s:{r:0,c:7},e:{r:0,c:8}},{s:{r:0,c:9},e:{r:0,c:10}},{s:{r:0,c:11},e:{r:1,c:11}}];
  ws['!cols']=[{wch:18},{wch:18},{wch:9},{wch:18},{wch:32},{wch:14},{wch:14},{wch:14},{wch:14},{wch:14},{wch:14},{wch:14}];
  XLSX.utils.book_append_sheet(wb,ws,'GEO-LOCATION');
  XLSX.writeFile(wb,`street_gps_${new Date().toISOString().slice(0,10)}.xlsx`);
  showToast(`✓ Exported ${allowedStreets.length} streets`);
}

// ── Measure Ruler Tool ─────────────────────────────────
let mpUnit='auto', mpLiveLine=null;

function fmtDistUnit(m){
  if(mpUnit==='m')  return Math.round(m)+' m';
  if(mpUnit==='km') return (m/1000).toFixed(3)+' km';
  if(mpUnit==='ft') return Math.round(m*3.28084)+' ft';
  return m<1000?Math.round(m)+' m':(m/1000).toFixed(2)+' km';
}

function mpUnitChange(el){mpUnit=el.value;updateMpPanel();redrawMeasure();}

function toggleMpAdv(hdr){
  hdr.classList.toggle('open');
  hdr.nextElementSibling.classList.toggle('open');
}

function toggleMeasure(){
  if(measureActive){clearMeasure();return;}
  measureActive=true;
  document.getElementById('measure-btn').classList.add('active');
  document.getElementById('measure-btn').textContent='⬌ Measuring…';
  document.getElementById('measure-panel').classList.remove('hidden');
  map.getContainer().style.cursor='crosshair';
  updateMpPanel();
}

function clearMeasure(){
  measureActive=false;
  measurePts=[];
  measureLayers.forEach(l=>map.removeLayer(l));
  measureLayers=[];
  if(mpLiveLine){map.removeLayer(mpLiveLine);mpLiveLine=null;}
  const btn=document.getElementById('measure-btn');
  btn.classList.remove('active');btn.textContent='⬌ Measure';
  document.getElementById('measure-panel').classList.add('hidden');
  map.getContainer().style.cursor='';
  hideCursorTip();
}

function finishMeasure(){
  // Stop adding points but keep drawing visible, close panel
  measureActive=false;
  if(mpLiveLine){map.removeLayer(mpLiveLine);mpLiveLine=null;}
  document.getElementById('measure-btn').classList.remove('active');
  document.getElementById('measure-btn').textContent='⬌ Measure';
  document.getElementById('measure-panel').classList.add('hidden');
  map.getContainer().style.cursor='';
  hideCursorTip();
  const total=measureTotal();
  if(total>0)showToast('Distance: '+fmtDistUnit(total));
}

function undoMeasurePoint(){
  if(!measurePts.length)return;
  measurePts.pop();
  redrawMeasure();
  updateMpPanel();
}

function hideCursorTip(){
  const t=document.getElementById('measure-cursor-tip');
  if(t)t.style.display='none';
}

function updateMpPanel(){
  const total=measureTotal();
  const segs=Math.max(0,measurePts.length-1);
  document.getElementById('mp-length').textContent=total>0?fmtDistUnit(total):'—';
  document.getElementById('mp-segs').textContent=segs;
  if(segs>0){
    const a=measurePts[segs-1],b=measurePts[segs];
    document.getElementById('mp-last').textContent=fmtDistUnit(haversine(a.lat,a.lng,b.lat,b.lng));
  }else{
    document.getElementById('mp-last').textContent='—';
  }
  const hint=document.getElementById('mp-hint');
  if(measurePts.length===0)hint.textContent='Click points on the map to measure distances';
  else if(measurePts.length===1)hint.textContent='Click to add more points. Double-click to finish.';
  else hint.textContent='Continue clicking or double-click to finish.';
}

function measureTotal(){
  let d=0;
  for(let i=1;i<measurePts.length;i++)
    d+=haversine(measurePts[i-1].lat,measurePts[i-1].lng,measurePts[i].lat,measurePts[i].lng);
  return d;
}

function initMeasureTool(){
  // Mouse move — live preview line + cursor tip
  map.on('mousemove',function(e){
    if(!measureActive)return;
    const tip=document.getElementById('measure-cursor-tip');
    if(measurePts.length>0){
      const last=measurePts[measurePts.length-1];
      const seg=haversine(last.lat,last.lng,e.latlng.lat,e.latlng.lng);
      const total=measureTotal()+seg;
      // Live dashed line from last point to cursor
      const pts=[last,e.latlng];
      if(!mpLiveLine){mpLiveLine=L.polyline(pts,{color:'#f4a31a',weight:2,dashArray:'5 5',opacity:0.7}).addTo(map);}
      else{mpLiveLine.setLatLngs(pts);}
      // Cursor tip
      if(tip){
        tip.textContent=fmtDistUnit(seg)+(measurePts.length>1?' · Total: '+fmtDistUnit(total):'');
        tip.style.display='block';
        tip.style.left=(e.originalEvent.clientX+16)+'px';
        tip.style.top=(e.originalEvent.clientY-34)+'px';
      }
    }else{
      if(tip){tip.textContent='Click to start';tip.style.display='block';
        tip.style.left=(e.originalEvent.clientX+16)+'px';
        tip.style.top=(e.originalEvent.clientY-34)+'px';}
    }
  });

  // Single click — add point
  map.on('click',function(e){
    if(!measureActive)return;
    measurePts.push(e.latlng);
    redrawMeasure();
    updateMpPanel();
  });

  // Double-click — finish
  map.on('dblclick',function(e){
    if(!measureActive)return;
    // The dblclick fires after two single-clicks; remove the duplicate last point
    if(measurePts.length>1)measurePts.pop();
    redrawMeasure();
    finishMeasure();
  });

  // Hide tip when cursor leaves map
  map.getContainer().addEventListener('mouseleave',()=>{
    hideCursorTip();
    if(mpLiveLine){map.removeLayer(mpLiveLine);mpLiveLine=null;}
  });
}

function redrawMeasure(){
  measureLayers.forEach(l=>map.removeLayer(l));
  measureLayers=[];
  if(measurePts.length<1)return;

  // Solid orange polyline
  if(measurePts.length>1){
    const line=L.polyline(measurePts,{color:'#f4a31a',weight:3,opacity:1,lineJoin:'round'});
    line.addTo(map);measureLayers.push(line);
  }

  // Node markers — white circle with orange ring (like Google Earth)
  measurePts.forEach((pt,i)=>{
    const isFirst=i===0,isLast=i===measurePts.length-1;
    const c=L.circleMarker(pt,{
      radius:isFirst||isLast?7:5,
      color:'#f4a31a',weight:2.5,
      fillColor:'#fff',fillOpacity:1
    });
    c.addTo(map);measureLayers.push(c);
  });

  // Segment distance labels (amber background, midpoint)
  if(measurePts.length>1){
    for(let i=1;i<measurePts.length;i++){
      const a=measurePts[i-1],b=measurePts[i];
      const mid=L.latLng((a.lat+b.lat)/2,(a.lng+b.lng)/2);
      const dist=haversine(a.lat,a.lng,b.lat,b.lng);
      const lbl=L.marker(mid,{
        icon:L.divIcon({className:'measure-label',html:fmtDistUnit(dist),iconSize:null,iconAnchor:[0,-6]})
      });
      lbl.addTo(map);measureLayers.push(lbl);
    }
    // Total label at the last point (dark pill)
    const total=measureTotal();
    const totalLbl=L.marker(measurePts[measurePts.length-1],{
      icon:L.divIcon({
        className:'measure-total-label',
        html:'Total: <b>'+fmtDistUnit(total)+'</b>',
        iconSize:null,iconAnchor:[0,22]
      })
    });
    totalLbl.addTo(map);measureLayers.push(totalLbl);
  }
}
