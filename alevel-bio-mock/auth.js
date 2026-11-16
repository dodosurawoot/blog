/* Firebase Auth + Firestore extension for BioLab. Never put OAuth secrets here. */
(function(){
"use strict";
var cfg=window.BIOLAB_FIREBASE_CONFIG,ready=!!(cfg&&cfg.apiKey&&cfg.projectId&&cfg.authDomain&&cfg.appId&&window.firebase);
var auth,db,user=null,admin=false,attempts=[],adminID=String(window.BIOLAB_ADMIN_GITHUB_ID||"19434459");
var $=id=>document.getElementById(id);
window.bioLabConfigured=ready;
function status(s,bad){if($("cloudStatus")){$("cloudStatus").textContent=s;$("cloudStatus").style.color=bad?"#b44747":"#5e7477"}}
function toggle(id,yes){if($(id))$(id).classList.toggle("hidden",!yes)}
function err(e){return e&&e.message?e.message:String(e)}
function adminCheck(u,t){return t.claims.firebase&&t.claims.firebase.sign_in_provider==="github.com"&&u.providerData.some(p=>p.providerId==="github.com"&&p.uid===adminID)}
async function login(type){if(!ready)return;try{status("กำลังเข้าสู่ระบบ...");var p=type==="google"?new firebase.auth.GoogleAuthProvider():new firebase.auth.GithubAuthProvider();await auth.signInWithPopup(p)}catch(e){status("Login ไม่สำเร็จ: "+err(e),true)}}
function score(a){return ((a.scoreX10||0)/10).toFixed(1)}
function displayDate(t){return t&&t.toMillis?new Date(t.toMillis()).toLocaleString("th-TH",{dateStyle:"short",timeStyle:"short"}):"—"}
function makeCell(v){var td=document.createElement("td");td.textContent=String(v===undefined?"—":v);return td}
function render(){
var term=($("adminSearch")?.value||"").toLowerCase(),filtered=attempts.filter(a=>(String(a.name||"")+" "+String(a.email||"")).toLowerCase().includes(term));
$("adminAttempts").replaceChildren();
if(!filtered.length){var tr=document.createElement("tr"),td=makeCell("ยังไม่มีข้อมูล");td.colSpan=7;tr.appendChild(td);$("adminAttempts").appendChild(tr)}
filtered.forEach(a=>{var tr=document.createElement("tr");[
displayDate(a.submittedAt),a.name||"—",a.email||"—",score(a)+"/100",a.answeredCount+"/40",Math.round(a.durationSeconds/60)+" นาที",a.autoSubmitted?"หมดเวลา":"ส่งเอง"
].forEach(v=>tr.appendChild(makeCell(v)));$("adminAttempts").appendChild(tr)});
$("countAttempts").textContent=attempts.length;$("countStudents").textContent=new Set(attempts.map(a=>a.uid)).size;
$("meanScore").textContent=attempts.length?(attempts.reduce((s,a)=>s+(a.scoreX10||0),0)/attempts.length/10).toFixed(1):"—";
$("latestDate").textContent=attempts.length?displayDate(attempts[0].submittedAt):"—";
}
async function dashboard(){if(!admin)return;show("dashboard");status("กำลังโหลดประวัติการสอบ...");
try{var snap=await db.collection("attempts").get();attempts=snap.docs.map(d=>Object.assign({id:d.id},d.data()));attempts.sort((a,b)=>(b.submittedAt?.toMillis?.()||0)-(a.submittedAt?.toMillis?.()||0));render();status("โหลดข้อมูลผลสอบ "+attempts.length+" ครั้งแล้ว")}catch(e){status("โหลด Dashboard ไม่สำเร็จ: "+err(e),true)}}
async function save(){
if(!ready||!user)return;var a=window.bioLabGetFinishedAttempt?.();if(!a||a.cloudSaved||a.userUid!==user.uid)return;
try{status("กำลังบันทึกคะแนนลงฐานข้อมูล...");var ref=db.collection("attempts").doc(user.uid+"_"+a.startAt);
var old=await ref.get();if(!old.exists)await ref.set({
uid:user.uid,name:(user.displayName||"").slice(0,100),email:(user.email||"").slice(0,254),
examId:"biology-mock-2570-v1",scoreX10:Math.round(a.score*10),categoryX10:Object.fromEntries(Object.entries(a.categoryScores).map(([k,v])=>[k,Math.round(v*10)])),
answeredCount:a.answeredCount,durationSeconds:Math.min(5400,Math.max(0,Math.floor((a.endAt-a.startAt)/1000))),
autoSubmitted:!!a.timedOut,submittedAt:firebase.firestore.FieldValue.serverTimestamp()
});
window.bioLabMarkCloudSaved?.();status("✅ บันทึกคะแนนบน Cloud เรียบร้อย");
}catch(e){status("บันทึกคะแนนไม่สำเร็จ: "+err(e),true)}
}
window.bioLabSaveAttempt=save;
$("googleLogin").onclick=()=>login("google");$("githubLogin").onclick=()=>login("github");
$("signOutBtn").onclick=()=>auth&&auth.signOut();
$("openAdmin").onclick=dashboard;$("refreshAdmin").onclick=dashboard;$("backHome").onclick=()=>show("home");
$("adminSearch").oninput=render;
$("exportAdmin").onclick=()=>{
if(!admin)return;
function csv(v){var s=String(v??"");if(/^\s*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'}
var rows=[["วันที่","ชื่อ","อีเมล","คะแนน","ตอบครบ","เวลา(วินาที)","หมดเวลา","นิเวศ","เซลล์","ร่างกาย","พืช","พันธุศาสตร์"]];
attempts.forEach(a=>rows.push([displayDate(a.submittedAt),a.name,a.email,score(a),a.answeredCount,a.durationSeconds,a.autoSubmitted,...["eco","cell","human","plant","gene"].map(k=>(a.categoryX10?.[k]||0)/10)]));
var url=URL.createObjectURL(new Blob(["\uFEFF"+rows.map(r=>r.map(csv).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}));
var a=document.createElement("a");a.href=url;a.download="biolab-attempts.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
if(!ready){$("googleLogin").disabled=true;$("githubLogin").disabled=true;status("ยังไม่เชื่อม Firebase: ยังฝึกสอบในเครื่องได้ แต่ Login และบันทึกผลกลางยังไม่พร้อม");return}
try{
firebase.initializeApp(cfg);auth=firebase.auth();db=firebase.firestore();
auth.onAuthStateChanged(async u=>{
user=u;admin=false;window.bioLabCurrentUser=u;
if(u){try{admin=adminCheck(u,await u.getIdTokenResult())}catch(e){status(err(e),true)}}
window.bioLabAdmin=admin;
toggle("googleLogin",!u);toggle("githubLogin",!u);toggle("signOutBtn",!!u);toggle("signedProfile",!!u);toggle("openAdmin",admin);
if(u){$("signedProfile").textContent=(admin?"Admin: ":"ผู้สอบ: ")+(u.displayName||u.email||u.uid);status("เข้าสู่ระบบแล้ว "+(u.email||""));}else{status("เข้าสู่ระบบ Google เพื่อเก็บผลสอบทุกครั้ง");show("home")}
window.bioLabAuthChanged?.();
if(u)save();
},e=>status(err(e),true))
}catch(e){status("Firebase config มีปัญหา: "+err(e),true)}
})();
