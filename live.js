import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';
import { getDatabase, ref, set, onValue, get } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js';
const config = {
 apiKey:'AIzaSyBLe9cYOey4nKURCJKxLpdWSwpxw3H4Wqc',
 authDomain:'thanksgiving-family-feud-f3370.firebaseapp.com',
 databaseURL:'https://thanksgiving-family-feud-f3370-default-rtdb.firebaseio.com',
 projectId:'thanksgiving-family-feud-f3370',
 storageBucket:'thanksgiving-family-feud-f3370.firebasestorage.app',
 messagingSenderId:'452525365371',
 appId:'1:452525365371:web:ec9772a8f4890a67e12ade'
};
const params=new URLSearchParams(location.search);
const tv=params.get('view')==='tv', idFromUrl=params.get('game');
const app=initializeApp(config),auth=getAuth(app),db=getDatabase(app);
const bar=document.createElement('div');bar.id='liveBar';bar.style.cssText='position:sticky;top:0;z-index:90;background:#102b55;border-bottom:2px solid #ffcf55;padding:12px;text-align:center;color:white;font:600 15px system-ui';
document.body.prepend(bar);
const message=t=>bar.textContent=t;
let uid=null,gameId=null,enabled=false,sending=false,pending=null,lastJson=null;
function publicState(){return {state,practiceMode,muted,intro:{visible:document.getElementById('introOverlay').classList.contains('visible'),step:introStep,seconds:introSeconds,paused:introPaused}};}
// A JSON string preserves empty arrays and null values that Realtime Database otherwise drops.
function push(){if(!enabled||!gameId||tv)return;const json=JSON.stringify(publicState());if(json===lastJson)return;lastJson=json;pending={id:gameId,json};flush();}
async function flush(){if(sending)return;sending=true;while(pending){const job=pending;pending=null;try{await set(ref(db,'games/'+job.id),{ownerUid:uid,state:{json:job.json}});if(gameId===job.id)status('✓ Synced');}catch(e){if(gameId===job.id){lastJson=null;status('Sync error: '+e.message);}}}sending=false;}
function status(t){const el=document.getElementById('syncLabel');if(el)el.textContent=t;}
window.feudSyncPush=push;window.feudTvMode=tv;
function tvRender(){document.querySelectorAll('#app input,#app select,#app button').forEach(el=>{el.disabled=true;el.tabIndex=-1;});}
window.feudTvRender=tvRender;
async function signIn(){const credential=await signInAnonymously(auth);uid=credential.user.uid;}
function startHost(){if(!uid)return;gameId=Array.from(crypto.getRandomValues(new Uint8Array(18)),b=>b.toString(16).padStart(2,'0')).join('');const audience=new URL(location.href);audience.search='?view=tv&game='+gameId;audience.hash='';
bar.innerHTML='<div style="margin-bottom:8px">📱 HOST — Live game <span id="syncLabel">Connecting…</span></div><input id="audienceLink" readonly style="width:min(100%,600px);padding:8px"><button id="copyAudience" style="padding:9px;margin:5px">Copy iPad link</button><button id="endLive" style="padding:9px;margin:5px">Stop sharing</button><div style="font-size:12px">Open the link on the iPad and AirPlay the iPad to the TV. Keep this iPhone tab open.</div>';
document.getElementById('audienceLink').value=audience.href;
document.getElementById('copyAudience').onclick=async()=>{try{await navigator.clipboard.writeText(audience.href);alert('iPad link copied!');}catch{prompt('Copy this link:',audience.href);}};
document.getElementById('endLive').onclick=()=>{enabled=false;gameId=null;pending=null;lastJson=null;hostReady();};
syncSetupFields();enabled=true;lastJson=null;push();}
function hostReady(){bar.innerHTML='<button id="startLive" style="padding:12px 20px;background:#ffcf55;color:#122348;border:0;border-radius:10px;font-weight:800">📺 Start iPad / TV connection</button> <span style="font-size:12px">Solo game still works.</span>';document.getElementById('startLive').onclick=startHost;}
function applySnapshot(payload){stopClock();clearInterval(introTimer);introTimer=null;state=payload.state;practiceMode=!!payload.practiceMode;muted=!!payload.muted;render();tvRender();const i=payload.intro||{};const overlay=document.getElementById('introOverlay');overlay.classList.toggle('visible',!!i.visible);if(i.visible){introStep=Math.max(0,Math.min(8,Number(i.step)||0));introSeconds=Math.max(0,Math.min(19,Number(i.seconds)||0));introPaused=!!i.paused;introDraw();}}
function startTv(){document.body.classList.add('audience');tvRender();if(!idFromUrl||!/^[a-f0-9]{36}$/.test(idFromUrl)){message('Invalid audience link. Ask the host for a new one.');return;}message('📺 AUDIENCE DISPLAY — Connecting…');onValue(ref(db,'games/'+idFromUrl),snapshot=>{const record=snapshot.val();if(!record?.state){message('📺 Waiting for the host…');return;}try{const payload=record.state.json?JSON.parse(record.state.json):record.state;if(!payload.state)throw Error('Missing game state');applySnapshot(payload);message('📺 LIVE THANKSGIVING FEUD — Audience display');}catch(e){message('Display error: '+e.message);}},e=>message('Connection error: '+e.message));}
try{message('Connecting to free Firebase service…');await signIn();if(tv)startTv();else hostReady();}catch(e){message('Live mode unavailable: '+e.message+' — Solo mode still works.');}
