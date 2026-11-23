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
const tv=params.get('view')==='tv';
const idFromUrl=params.get('game');
const app=initializeApp(config),auth=getAuth(app),db=getDatabase(app);
const bar=document.createElement('div');bar.id='liveBar';bar.style.cssText='position:sticky;top:0;z-index:90;background:#102b55;border-bottom:2px solid #ffcf55;padding:12px;text-align:center;color:white;font:600 15px system-ui';
document.body.insertBefore(bar,document.body.firstChild);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const message=t=>bar.textContent=t;
let uid=null,gameId=null,enabled=false,writing=Promise.resolve();
function publicState(){return JSON.parse(JSON.stringify({state,practiceMode}));}
function push(){if(!enabled||!gameId||tv)return;const payload=publicState();writing=writing.then(()=>set(ref(db,'games/'+gameId),{ownerUid:uid,state:payload})).catch(e=>{message('Sync error: '+e.message);});}
window.feudSyncPush=push;
function tvRender(){
 document.querySelectorAll('.top-actions,.host-panel,.savebar,.helpdetails,.intro-overlay').forEach(el=>el.style.display='none');
 document.querySelectorAll('[data-action],#guessForm,#timerValue+button').forEach(el=>el.style.display='none');
 document.querySelectorAll('.panel').forEach(el=>{if(el.querySelector('.helpdetails'))el.style.display='none';});
}
window.feudTvMode=tv;window.feudTvRender=tvRender;
async function signIn(){const credential=await signInAnonymously(auth);uid=credential.user.uid;}
async function startHost(){
 if(!uid)return;
 const id=Array.from(crypto.getRandomValues(new Uint8Array(18)),b=>b.toString(16).padStart(2,'0')).join('');
 gameId=id;
 const audience=new URL(location.href);audience.search='?view=tv&game='+id;
 bar.innerHTML=`<div style="margin-bottom:8px">📱 HOST — Live game connected <span id="syncLabel"></span></div><input id="audienceLink" readonly style="width:min(100%,600px);padding:8px" value="${esc(audience.href)}"><button id="copyAudience" style="padding:9px;margin:5px">Copy iPad link</button><button id="endLive" style="padding:9px;margin:5px">Stop sharing</button><div style="font-size:12px">Open the link on the iPad and AirPlay the iPad to the TV. Keep this iPhone tab open.</div>`;
 document.getElementById('copyAudience').onclick=async()=>{try{await navigator.clipboard.writeText(audience.href);alert('iPad link copied!');}catch{prompt('Copy this link:',audience.href);}};
 document.getElementById('endLive').onclick=()=>{enabled=false;gameId=null;hostReady();};
 enabled=true;push();
}
function hostReady(){bar.innerHTML='<button id="startLive" style="padding:12px 20px;background:#ffcf55;color:#122348;border:0;border-radius:10px;font-weight:800">📺 Start iPad / TV connection</button> <span style="font-size:12px">Your original solo game still works.</span>';document.getElementById('startLive').onclick=startHost;}
async function startTv(){
 document.querySelector('.topbar').style.display='none';
 document.querySelector('.footer').style.display='none';
 if(!idFromUrl||!/^[a-f0-9]{36}$/.test(idFromUrl)){message('Invalid audience link. Ask the host for a new one.');return;}
 message('📺 AUDIENCE DISPLAY — Connecting…');
 onValue(ref(db,'games/'+idFromUrl),snapshot=>{
  const record=snapshot.val();if(!record?.state?.state){message('📺 Waiting for the host to start sharing…');return;}
  try{
   window.stopClock?.();
   state=record.state.state;
   practiceMode=!!record.state.practiceMode;
   render();tvRender();
   message('📺 LIVE THANKSGIVING FEUD — Audience display');
  }catch(e){message('Display error: '+e.message);}
 },e=>message('Connection error: '+e.message));
}
try{message('Connecting to free Firebase service…');await signIn();if(tv)await startTv();else hostReady();}catch(e){message('Live mode unavailable: '+e.message+' — Solo mode still works.');}
