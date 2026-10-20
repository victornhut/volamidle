"use strict";
/* ====================================================================
 * HỆ THỐNG XÁC THỰC & MẠNG (NET.JS) - HỖ TRỢ TOGGLE BẬT / TẮT
 * ==================================================================== */
const isAuthEnabled = () => (typeof window !== "undefined" && window.AUTH_ENABLED !== undefined ? !!window.AUTH_ENABLED : false);
const NET={sb:null,user:null,tab:"acc",mkt:"buy",rank:"lvl",rfac:"",mailN:0,lastChar:0,lastUp:0,sel:null,q:""},NET_DOMAIN="@volamidle.game",NET_TAX=.05,NET_LOCAL=/[?&]offline_test=1\b/.test(location.search),netOn=()=>{if(!isAuthEnabled())return!1;const t=window.CHAT_CFG||{};return!!(t.url&&t.key)&&!NET_LOCAL},netUname=()=>NET.user&&NET.user.email?NET.user.email.replace(NET_DOMAIN,""):"",netErr=t=>{const n=t&&(t.message||t.error_description)||String(t||"Lỗi mạng");return/chars_name|duplicate key/i.test(n)?"Tên nhân vật đã có người dùng — hãy đổi tên (thẻ Nhân vật ✏)":/Invalid login/i.test(n)?"Sai tên đăng nhập hoặc mật khẩu":/already registered|already exists/i.test(n)?"Tên đăng nhập đã có người dùng":/Email not confirmed/i.test(n)?'Supabase đang bật "Confirm email" — hãy tắt (xem HUONG_DAN_WEB.txt)':/relation .* does not exist|Could not find the (table|function)/i.test(n)?"Máy chủ chưa chạy NET_SETUP.sql":n},NET_VIA="jxidle_sbvia";async function netPickUrl(t){const n=location.origin+"/sb";if(!(/^https:/.test(location.protocol)&&!/^(localhost|127\.)/.test(location.hostname)))return t.url;let o="";try{o=localStorage.getItem(NET_VIA)||""}catch{}const i=(e,r)=>Promise.race([fetch(e+"/auth/v1/health",{headers:{apikey:t.key},cache:"no-store"}).then(u=>u.ok&&/json/.test(u.headers.get("content-type")||"")),new Promise(u=>setTimeout(()=>u(!1),r))]).catch(()=>!1),c=e=>{try{localStorage.setItem(NET_VIA,e)}catch{}},s=o==="p"?[[n,6e3,"p"],[t.url,4e3,"d"]]:[[t.url,4e3,"d"],[n,6e3,"p"]];for(const[e,r,u]of s)if(await i(e,r))return c(u),e;return t.url}function netClient(){return NET.sb?Promise.resolve(NET.sb):netOn()?NET.sbP||(NET.sbP=(async()=>{await chatLoadLib();const t=window.CHAT_CFG,n=t.url;try{localStorage.removeItem("jxidle_auth")}catch{}const a=window.supabase.createClient(n,t.key,{auth:{persistSession:!0,autoRefreshToken:!0,storageKey:"jxidle_auth",storage:window.sessionStorage}});try{const{data:o}=await a.auth.getSession();NET.user=o&&o.session?o.session.user:null}catch{NET.user=null}return a.auth.onAuthStateChange((o,i)=>{if(i&&i.user)NET.user=i.user;else if(o==="SIGNED_OUT"){const c=!!NET.user;NET.user=null,c&&!NET.loggingOut&&S&&S.fac&&setTimeout(()=>netRelogin(),0)}netDot()}),NET.sb=a,a})().catch(t=>{throw NET.sbP=null,t})):Promise.reject(new Error("Chưa cấu hình máy chủ (js/chatcfg.js)"))}const netBusyErr=t=>/timeout|timed out|fetch|network|503|502|504|520|522|524|544|too many|overload|connection|failed to/i.test(String(t&&(t.message||t.code||t.status)||t)),netHeld=()=>Date.now()<(NET.holdUntil||0);function netFail(t){netBusyErr(t)&&(NET.failN=Math.min(6,(NET.failN||0)+1),NET.holdUntil=Date.now()+Math.min(6e5,3e4*2**(NET.failN-1))*(.8+Math.random()*.4))}const netUpSig=()=>S?[S.lvl,Math.floor(S.xp||0),S.gold,S.knb|0,(S.inv||[]).length,S.uid,(S.rw&&S.rw.stat&&S.rw.stat.towerBest)|0].join("|"):"",netCall=async t=>{if(window.MAINT)throw new Error("Máy chủ đang bảo trì");try{const n=await netClient(),a=await t(n);if(a&&a.error)throw a.error;return NET.failN=0,NET.holdUntil=0,a}catch(n){throw netFail(n),new Error(netErr(n))}};async function netAuth(t,n,a){if(n=String(n||"").trim().toLowerCase(),!/^[a-z0-9_]{3,16}$/.test(n))throw new Error("Tên đăng nhập 3–16 ký tự: chữ không dấu, số, _");if(String(a||"").length<6)throw new Error("Mật khẩu ít nhất 6 ký tự");const o=await Promise.race([netCall(i=>t==="up"?i.auth.signUp({email:n+NET_DOMAIN,password:a}):i.auth.signInWithPassword({email:n+NET_DOMAIN,password:a})),new Promise((i,c)=>setTimeout(()=>c(new Error("Máy chủ không phản hồi — kiểm tra mạng rồi bấm lại")),2e4))]);if(!o.data||!o.data.session)throw new Error('Supabase đang bật "Confirm email" — hãy tắt (xem HUONG_DAN_WEB.txt)');NET.user=o.data.session.user,netMailCount()}function netGear(){const t={};for(const[n,a]of Object.entries(S.eq||{}))a&&(t[n]=a);return t}async function netSyncChar(t){if(!NET.user)throw new Error("Chưa đăng nhập");if(!S||!S.fac)throw new Error("Chưa có nhân vật");if(!hasRealName())throw t||nameModal(),new Error("Cần đặt tên nhân vật trước");if(netForeign(S))throw new Error("Nhân vật thuộc tài khoản khác");const n=RW().stat||{},a={owner:NET.user.id,slot:SLOT,name:S.name,fac:S.fac,sex:S.sex|0,lvl:S.lvl|0,reborn:Math.min(10,n.reborn|0),power:Math.round(R.power||0),tower:n.towerBest|0,bosses:n.bosses|0,gear:netGear(),updated:new Date().toISOString()};if((NET.snapOk!==!1||Date.now()-(NET.snapNo||0)>3e5)&&typeof partySnap=="function"){const i=partySnap();i&&(a.snap=i)}const o=JSON.stringify(Object.assign({},a,{updated:0}));if(t&&o===NET.charSig&&Date.now()-(NET.charSent||0)<30*6e4){NET.lastChar=Date.now();return}try{await netCall(i=>i.from("chars").upsert(a))}catch(i){if(!a.snap||!/snap/i.test(String(i&&i.message)))throw i;NET.snapOk=!1,NET.snapNo=Date.now(),delete a.snap,await netCall(c=>c.from("chars").upsert(a))}NET.lastChar=NET.charSent=Date.now(),NET.charSig=o,netCheat().catch(()=>{})}const CHEAT_KEY="jxCheat";function cheatK(){if(typeof NET>"u"||!NET.user)return 1;if(NET.cheatU!==NET.user.id){NET.cheatU=NET.user.id;try{NET.cheat=localStorage.getItem(CHEAT_KEY)===NET.user.id}catch{NET.cheat=!1}}return NET.cheat?.01:1}async function netCheat(){if(!NET.user||!(R.power>20))return;cheatK();const t=await netCall(o=>o.from("chars").select("power").eq("owner",NET.user.id).eq("slot",SLOT).maybeSingle()),n=t&&t.data;if(!n||n.power==null)return;const a=(n.power|0)===1;if(a!==!!NET.cheat){NET.cheat=a,NET.cheatU=NET.user.id;try{a?localStorage.setItem(CHEAT_KEY,NET.user.id):localStorage.removeItem(CHEAT_KEY)}catch{}a&&typeof log=="function"&&log('<span class="bad">⚠ Tài khoản bị ghi nhận dùng console: sát thương giảm 99%.</span>')}}const netNeedChar=async()=>{Date.now()-NET.lastChar>6e4&&await netSyncChar()},cloudPack=(t,n)=>JSON.stringify({v:2,d:t,k:n||null});function cloudParse(t){try{const n=JSON.parse(t);if(n&&n.v===2&&typeof n.d=="string")return{d:n.d,k:n.k}}catch{}return{d:t,k:null}}const stashRaw=()=>{try{return localStorage.getItem(STASH_KEY)}catch{return null}},slotState=t=>{try{const n=localStorage.getItem(slotKey(t)),a=n&&unpack(n);return a&&a.ok&&a.state&&a.state.fac?a.state:null}catch{return null}},stateFromPacked=t=>parseSaveText(JSON.stringify({game:"jxidle",data:t})),netForeign=t=>!!(t&&t.netOwner&&NET.user&&t.netOwner!==NET.user.id);async function netUpload(){if(!NET.user)throw new Error("Chưa đăng nhập");if(!S||!S.fac)throw new Error("Chưa có nhân vật");if(netForeign(S))throw new Error("Nhân vật thuộc tài khoản khác");const t=new Date,n=S.cloudAt;S.cloudAt=t.getTime(),S.netOwner=NET.user.id;try{await netCall(a=>a.from("saves").upsert({owner:NET.user.id,slot:SLOT,name:S.name||"",lvl:S.lvl|0,fac:S.fac,data:cloudPack(pack(S),stashRaw()),updated:t.toISOString()}))}catch(a){throw S.cloudAt=n,a}NET.upSig=netUpSig(),save(),NET.lastUp=Date.now()}async function netUploadSlot(t,n){const a=new Date;n.cloudAt=a.getTime();try{localStorage.setItem(slotKey(t),pack(n))}catch{}await netCall(o=>o.from("saves").upsert({owner:NET.user.id,slot:t,name:n.name||"",lvl:n.lvl|0,fac:n.fac,data:cloudPack(pack(n),stashRaw()),updated:a.toISOString()}))}function netApplyStash(t){if(!t)return!1;try{const n=unpack(t);if(!n.ok)return!1;const a=stashRead().st;return(n.state.rev|0)<=(a.rev|0)?!1:(localStorage.setItem(STASH_KEY,t),!0)}catch{return!1}}function netUserSwitch(){try{const t=localStorage.getItem("jxidle_lastuser");if(t&&t!==NET.user.id){const n=localStorage.getItem(STASH_KEY);n&&localStorage.setItem(STASH_KEY+"_"+t,n),localStorage.removeItem(STASH_KEY)}localStorage.setItem("jxidle_lastuser",NET.user.id)}catch{}}async function netSyncAll(){if(!NET.user)return!1;netUserSwitch();const t=await netCall(i=>i.from("saves").select("slot,updated").order("slot")),n=t.data||[];let a=!1;for(let i=0;i<SLOT_N;i++){const c=n.find(m=>m.slot===i),s=c?Date.parse(c.updated):0;if(i===SLOT&&S&&S.fac)continue;const e=slotState(i);if(!c){if(e&&e.netOwner===NET.user.id)await netUploadSlot(i,e);else if(e)try{const m=slotKey(i);localStorage.setItem(m+"_bak",localStorage.getItem(m)),localStorage.removeItem(m),a=!0}catch{}continue}if(!netCloudStale(e,s)&&!netForeign(e))continue;const r=await netCall(m=>m.from("saves").select("data").eq("slot",i).single()),u=cloudParse(r.data.data),g=stateFromPacked(u.d);if(g.cloudAt=s,g.netOwner=NET.user.id,!(e&&!netForeign(e)&&netProg(g)<netProg(e)))try{const m=slotKey(i),l=localStorage.getItem(m);l&&localStorage.setItem(m+"_bak",l),localStorage.setItem(m,pack(g)),a=!0}catch{}}const o=n.slice().sort((i,c)=>Date.parse(c.updated)-Date.parse(i.updated))[0];if(o){const i=await netCall(c=>c.from("saves").select("data").eq("slot",o.slot).single());netApplyStash(cloudParse(i.data.data).k)&&(a=!0)}return a}const netProg=t=>t?((t.rw&&t.rw.stat&&t.rw.stat.reborn)|0)*200+(t.lvl|0):0,netCloudStale=(t,n)=>!t||!t.cloudAt||n>t.cloudAt+5e3;async function netCheckCloud(){if(!isAuthEnabled()||!NET.user||!S||!S.fac)return;const t=await netCall(o=>o.from("saves").select("slot,name,lvl,fac,updated").eq("slot",SLOT).maybeSingle()),n=t.data;if(!n){if(S.netOwner===NET.user.id){await netUpload();return}SAVE_LOCK=!0;try{const o=slotKey(SLOT);localStorage.setItem(o+"_bak",localStorage.getItem(o)),localStorage.removeItem(o),localStorage.setItem(SLOT_PTR,"menu")}catch{}toast("Nhân vật chỉ có trên máy này, không có trên đám mây: không dùng được"),setTimeout(()=>location.reload(),1500);return}const a=Date.parse(n.updated);if(S.netOwner&&!netForeign(S)&&netCloudStale(S,a)){let o=!1;try{const i=await netCall(c=>c.from("saves").select("data").eq("slot",SLOT).single());o=netProg(stateFromPacked(cloudParse(i.data.data).d))<netProg(S)}catch{}if(o){S.cloudAt=Math.max(S.cloudAt||0,a);try{await netUpload()}catch{}return}}!S.netOwner||netForeign(S)||netCloudStale(S,a)?(toast("Đang tải nhân vật từ đám mây…"),await netUseCloud(SLOT,a)):(S.last||0)>a+5e3&&await netUpload()}async function netUseCloud(t,n){const a=await netCall(c=>c.from("saves").select("data,updated").eq("slot",t).single()),o=cloudParse(a.data.data),i=stateFromPacked(o.d);i.cloudAt=n||Date.parse(a.data.updated),i.netOwner=NET.user.id,netApplyStash(o.k),writeSlot(t,i),location.reload()}async function netCloudList(){return(await netCall(n=>n.from("saves").select("slot,name,lvl,fac,updated").order("slot"))).data||[]}async function netCloudLoad(t){await netUseCloud(t)}const NG_P=(t,n,a,o)=>`left:${t/3.08}%;top:${n/1.97}%;width:${a/3.08}%;height:${o/1.97}%`,ngRem=t=>{try{if(t===void 0)return localStorage.getItem("jx_lu")||"";t?localStorage.setItem("jx_lu",t):localStorage.removeItem("jx_lu")}catch{return""}return""};function netGate(t){
  if(!isAuthEnabled()){
    closeModal(!0);
    if(!S||!S.fac){if(typeof pickFaction=="function")pickFaction();}
    return;
  }
if(window.NET_GATE=!0,document.body.classList.add("ngate-on"),!document.getElementById("ngateCss")){const o=document.createElement("style");o.id="ngateCss";const i=Math.random()<.5?"bg20a":"bg20b";o.textContent=`body.ngate-on #modal{position:fixed!important;inset:0;z-index:9000!important;background:radial-gradient(ellipse at 50% 55%,#0000 35%,#000b 100%),url(img/u2/login/${i}.jpg) center/cover #0b1418!important;display:flex!important;flex-direction:column;align-items:center;justify-content:center}
body.ngate-on #modal.hidden{display:none!important}body.ngate-on #modal .mx{display:none!important}
body.ngate-on #modal::before{content:'VÕ LÂM IDLE';font-size:clamp(28px,6vw,46px);letter-spacing:5px;color:#f3d27a;text-shadow:0 0 16px #c8902a,0 0 4px #000,0 3px 0 #000;margin-bottom:6px;font-weight:bold;font-family:serif}
body.ngate-on #modal .mbox{max-width:none!important;width:min(440px,94vw)!important;background:none!important;border:0!important;outline:0!important;box-shadow:none!important;padding:0!important;overflow:visible!important;zoom:1}
body.ngate-on #modal .mbox::before,body.ngate-on #modal .mbox::after{display:none!important}
body.ngate-on #csel{display:none}
.ng2{container-type:inline-size;position:relative;width:100%;aspect-ratio:308/197;background:url(img/u2/login/panel.png) 0 0/100% 100% no-repeat;image-rendering:auto;filter:drop-shadow(0 8px 24px #000c)}
.ng2>*{position:absolute;box-sizing:border-box}
.ng2 .t{display:flex;align-items:center;justify-content:center;color:#f2ecd0;font-weight:bold;font-size:4.6cqw;text-shadow:0 0 3px #000,0 1px 1px #000;white-space:nowrap}
.ng2 .l{display:flex;align-items:center;justify-content:flex-end;padding-right:1.2cqw;color:#fff;font-weight:bold;font-size:3.3cqw;text-shadow:-1px 0 #000,1px 0 #000,0 -1px #000,0 1px #000;white-space:nowrap}
.ng2 input{background:transparent;border:0;outline:0;color:#f6e7b8;font:bold 4.2cqw/1 inherit;font-family:inherit;padding:0 1.6cqw;margin:0;border-radius:0}
.ng2 input:focus{box-shadow:inset 0 0 0 1px #e3ffd4}
.ng2 .cb{cursor:pointer;background:transparent!important;border:0!important;padding:0!important;box-shadow:none!important;min-height:0!important}.ng2 .cb.on{background:url(img/u2/login/tick.png) 20% 30%/150% auto no-repeat!important}
.ng2 .cl{display:flex;align-items:center;color:#fff;font-weight:bold;font-size:3.6cqw;text-shadow:-1px 0 #000,1px 0 #000,0 -1px #000,0 1px #000;cursor:pointer;white-space:nowrap;padding-left:.8cqw;user-select:none}
.ng2 .b{display:flex;align-items:center;justify-content:center;border:0!important;border-radius:0!important;box-shadow:none!important;min-height:0!important;background:#000;color:#ffe23a;font-weight:bold;font-size:4.6cqw;text-shadow:0 1px 0 #000;cursor:pointer;padding:0}
.ng2 .b:hover{background:radial-gradient(ellipse 60% 70% at 50% 50%,#3fb2e2 0%,#1a6f95 45%,#06222e 80%,#000 100%);color:#fff7c0}
.ng2 .b:active,.ng2 .b[disabled]{background:radial-gradient(ellipse 60% 70% at 50% 50%,#8a8a8a 0%,#3c3c3c 55%,#000 100%);color:#d8d8d8}
.ng2x{margin-top:10px;text-align:center;color:#f3ead2;font-size:12px;text-shadow:0 1px 2px #000,0 0 4px #000}.ng2x .reqbad{margin:6px 0}`,document.head.appendChild(o)}const n=t?`<p class="reqbad">${esc(t)}</p><div class="btnrow" style="justify-content:center"><button class="btn sm" id="ngRetry">Thử kết nối lại</button></div>`:"",a=ngRem();modal(`<div class="ng2">
      <div class="t" style="${NG_P(0,5,308,22)}">Xác nhận tên tài khoản</div>
      <label class="l" for="ngU" style="${NG_P(6,53,68,24)}">Tài khoản:</label><input id="ngU" style="${NG_P(74,55,210,20)}" maxlength="16" autocomplete="username" autocapitalize="off" spellcheck="false" value="${esc(a)}">
      <label class="l" for="ngP" style="${NG_P(6,91,68,24)}">Mật mã:</label><input id="ngP" style="${NG_P(74,93,210,20)}" type="password" maxlength="64" autocomplete="current-password">
      <button type="button" class="cb" id="ngShow" style="${NG_P(73,123,18,20)}" aria-label="Hiện mật mã"></button><span class="cl" data-cb="ngShow" style="${NG_P(91,123,80,20)}">Hiện mật mã</span>
      <button type="button" class="cb${a?" on":""}" id="ngRem" style="${NG_P(173,123,18,20)}" aria-label="Nhớ tài khoản"></button><span class="cl" data-cb="ngRem" style="${NG_P(191,123,110,20)}">Nhớ tài khoản</span>
      <button type="button" class="b" id="ngIn" style="${NG_P(7,167,144,23)}">Đăng nhập</button>
      <button type="button" class="b" id="ngUp" style="${NG_P(157,167,144,23)}">Đăng ký</button>
    </div>
    <div class="ng2x">Một tài khoản dùng cho 3 nhân vật · tên 3–16 ký tự không dấu · mật mã ít nhất 6 ký tự.<br>Nhớ mật mã — hiện chưa có cách lấy lại.${n}</div>`,()=>{const o=s=>busy($(s==="up"?"#ngUp":"#ngIn"),async()=>(await netAuth(s,$("#ngU").value,$("#ngP").value),ngRem($("#ngRem").classList.contains("on")?String($("#ngU").value||"").trim().toLowerCase():null),netAfterLogin()));$("#ngIn").onclick=()=>o("in"),$("#ngUp").onclick=()=>o("up"),$("#ngP").onkeydown=s=>{s.key==="Enter"&&o("in")},$("#ngU").onkeydown=s=>{s.key==="Enter"&&$("#ngP").focus()};const i=s=>{const e=$("#"+s);e.classList.toggle("on"),s==="ngShow"&&($("#ngP").type=e.classList.contains("on")?"text":"password")};$("#ngShow").onclick=()=>i("ngShow"),$("#ngRem").onclick=()=>i("ngRem"),document.querySelectorAll(".ng2 [data-cb]").forEach(s=>s.onclick=()=>i(s.dataset.cb)),setTimeout(()=>{try{(a?$("#ngP"):$("#ngU")).focus()}catch{}},50);const c=$("#ngRetry");c&&(c.onclick=()=>location.reload())},!0)}async function netAfterLogin(){window.NET_GATE=!1,document.body.classList.remove("ngate-on");const t=await netSyncAll();if(!S||!S.fac){const n=[...Array(SLOT_N).keys()].filter(a=>slotInfo(a));if(n.length){try{localStorage.setItem(SLOT_PTR,n.length>1?"menu":String(n[0]))}catch{}location.reload();return}closeModal(!0),pickFaction();return}closeModal(!0),toast("Đã đăng nhập: "+netUname()),netSyncChar(!0).catch(()=>{}),netCheckCloud().catch(()=>{}),netMailCount()}async function netMailCount(){if(!NET.user){NET.mailN=0,netDot();return}if(!netHeld()){try{const t=await netCall(n=>n.from("mail").select("id",{count:"exact",head:!0}));NET.mailN=t.count||0}catch{}netDot()}}function netCleanItem(t){if(!t||typeof t!="object"||!Array.isArray(t.base)||!Array.isArray(t.mag))return null;const n=JSON.parse(JSON.stringify(t));return n.uid=S.uid++,delete n.lock,typeof vioDedupe=="function"&&vioDedupe(n),typeof setRepair=="function"&&setRepair(n),n}async function netClaim(t,n){if(NET_PAUSE.includes("mail"))throw new Error("Hộp thư đang tạm đóng");if(t.item&&S.inv.length>=INV_MAX)throw new Error("Hành trang đầy");const a=await netCall(c=>c.rpc("claim_mail",{mid:t.id})),o=a.data||t,i=[];if(o.item){const c=netCleanItem(o.item);if(c&&(c.lock=!0),c&&typeof eqBanned=="function"&&eqBanned(c))i.push(`${c.n} (đồ đã xóa khỏi game)`);else if(c&&typeof eqRemoved=="function"&&eqRemoved(c)){const s=itemValue(c);S.gold+=s,i.push(`${c.n} → ${fmtL(s)} lượng (đồ đã bỏ khỏi game)`)}else c&&(S.inv.push(c),i.push(c.n),invDirty=!0)}return o.gold>0&&(S.gold+=+o.gold,i.push(fmtL(+o.gold)+" lượng")),o.knb>0&&(S.knb=(S.knb|0)+(o.knb|0),i.push((o.knb|0)+" KNB")),save(),n||log(`📨 Nhận thư từ <b>${esc(o.from_name)}</b>: ${esc(i.join(", "))}`),await netUpload().catch(()=>{}),i}const MKT_HK_MIN=5e6,MKT_HKMP_MIN=5e7,MKT_HK_MAX=3,mktKnb=t=>t&&t.cur==="knb",mktPriceTxt=t=>mktKnb(t)?`${fmt(t.price)} KNB`:`${fmtL(t.price)} lượng`,mktCan=t=>mktKnb(t)?(S.knb|0)>=t.price:S.gold>=t.price,mktIsHk=t=>!!t&&((t.r|0)>=4||!!t.set),mktHkMin=t=>t.set&&setFac(t)>=0?MKT_HKMP_MIN:MKT_HK_MIN;async function netSendGift(t,n,a,o){if(NET_PAUSE.includes("mail"))throw new Error("Hộp thư đang tạm đóng");if(t=String(t||"").trim(),a=Math.max(0,Math.floor(+a||0)),!t)throw new Error("Nhập tên người nhận");if(!n&&!a)throw new Error("Chọn món đồ hoặc nhập số lượng");if(n&&n.ktc&&typeof KTC_TRADE<"u"&&!KTC_TRADE.includes(n.ktc.k))throw new Error("Thư chỉ gửi được Võ Lâm Mật Tịch, Tẩy Tủy Kinh, Rương Ngựa của Kỳ Trân Các");if(a>S.gold)throw new Error("Không đủ ngân lượng");if(n&&(n.lock||!S.inv.includes(n)))throw new Error("Món không gửi được (đang khóa / đang mặc)");await netNeedChar();const i=n?S.inv.indexOf(n):-1;n&&S.inv.splice(i,1),S.gold-=a,invDirty=!0,save();try{await netUpload()}catch(c){throw n&&S.inv.splice(i,0,n),S.gold+=a,invDirty=!0,save(),new Error("Không lưu được nhân vật lên máy chủ, chưa gửi: "+c.message)}try{await netCall(c=>c.from("mail").insert({to_name:t,from_name:S.name,from_owner:NET.user.id,kind:"gift",item:n||null,gold:a,note:String(o||"").slice(0,100)}))}catch(c){throw n&&S.inv.splice(i,0,n),S.gold+=a,invDirty=!0,save(),netUpload().catch(()=>{}),c}log(`📨 Gửi <b>${esc(t)}</b>: ${esc([n&&n.n,a&&fmtL(a)+" lượng"].filter(Boolean).join(", "))}`),netUpload().catch(()=>{})}const EVENT_GIFTCODES = {
  TANTHU2026: {
    name: "Gói Tân Thủ Toàn Diện",
    desc: "Khởi đầu vững chắc",
    gold: 400000,
    knb: 20,
    buffs: { tt: [0.5, 60] },
    misc: { rngua: 1 }
  },
  CAYCAP2026: {
    name: "Gói Đua Cấp Tu Luyện",
    desc: "Cày cấp siêu tốc",
    gold: 350000,
    knb: 20,
    buffs: { tt: [0.5, 60] },
    misc: { vlmt: 1 }
  },
  PHUHO2026: {
    name: "Gói Phú Hộ Kim Ngân",
    desc: "Ngân lượng dồi dào",
    gold: 600000,
    knb: 40
  },
  KHAMNAM2026: {
    name: "Gói Thần Binh Lò Rèn",
    desc: "Chế tạo & Khảm nạm",
    gold: 400000,
    knb: 20,
    ht: { 5: 4 },
    misc: { wc: 2 }
  },
  VOCO2026: {
    name: "Gói Tuyệt Kỹ Võ Công",
    desc: "Võ công tối thượng",
    gold: 300000,
    knb: 20,
    misc: { bk90: 1, dtbk: 1 }
  },
  DANHTAU2026: {
    name: "Gói Dã Tẩu Danh Vọng",
    desc: "Nhiệm vụ & May mắn",
    gold: 400000,
    knb: 20,
    buffs: { luck: [20, 60] },
    misc: { ldt: 2 }
  },
  SANBOSS2026: {
    name: "Gói Săn Boss Khảo Vận",
    desc: "Săn đồ quý",
    gold: 400000,
    knb: 20,
    buffs: { luck: [20, 120] }
  },
  THUCUOI2026: {
    name: "Gói Kỵ Sĩ Thú Cưỡi",
    desc: "Chiến mã giang hồ",
    gold: 400000,
    knb: 20,
    misc: { rngua: 2 }
  },
  TAYTUY2026: {
    name: "Gói Tẩy Tủy Kinh Mạch",
    desc: "Tăng tiềm năng",
    gold: 350000,
    knb: 20,
    buffs: { tt: [0.5, 60] },
    misc: { ttk: 1 }
  },
  DUOCSU2026: {
    name: "Gói Dược Sư Hộ Thể",
    desc: "Bền bỉ cắm train",
    gold: 500000,
    knb: 30,
    buffs: { tt: [0.5, 60] }
  }
};

async function netRedeem(rawCode) {
  let c = String(rawCode || "").trim().toUpperCase();
  if (!c) throw new Error("Vui lòng nhập mã Giftcode");
  if (!/^[A-Z0-9_-]{3,32}$/.test(c)) throw new Error("Mã Giftcode không hợp lệ");
  if (!S || !S.fac) throw new Error("Cần tạo và chọn nhân vật trước khi nhập Giftcode");

  // Hỗ trợ mã VOLAMIDLE (trong ảnh chụp) quy đổi thành gói Tân Thủ
  if (c === "VOLAMIDLE") c = "TANTHU2026";

  // QUY ĐỊNH: Mỗi nhân vật chỉ được nhận 1 mã duy nhất
  if (S.claimedGiftcode) {
    throw new Error(`Nhân vật ${S.name || "hiện tại"} đã nhận Giftcode [${S.claimedGiftcode}] rồi! Mỗi nhân vật chỉ được nhận 1 Giftcode thử nghiệm duy nhất.`);
  }

  const def = EVENT_GIFTCODES[c];
  if (def) {
    const out = [];
    if (def.gold) {
      S.gold = (S.gold || 0) + def.gold;
      out.push(fmtL(def.gold) + " lượng");
    }
    if (def.knb) {
      S.knb = (S.knb || 0) + def.knb;
      out.push(def.knb + " KNB");
    }
    if (def.buffs && typeof addBuff === "function") {
      for (const b in def.buffs) {
        const [val, mins] = def.buffs[b];
        addBuff(b, val, mins);
        out.push(b === "luck" ? `+${val} May mắn (${mins} phút)` : `+${Math.round(val * 100)}% Exp (${mins} phút)`);
      }
    }
    const GIFT_MISC_NAMES = { rngua: "Rương Ngựa", vlmt: "Võ Lâm Mật Tịch", ttk: "Tẩy Tủy Kinh", bk90: "Bí Kíp 90", dtbk: "Đại Thành Bí Kíp", ldt: "Lệnh Bài Dã Tẩu", wc: "Thủy Tinh Trắng", mys: "Thần Bí Khoáng Thạch", ldp: "Lệnh Bài Đổi Phái" };
    const getMiscName = m => (typeof miscName === "function" ? miscName(m) : null) || GIFT_MISC_NAMES[m] || m;
    if (def.misc && typeof matAdd === "function") {
      for (const m in def.misc) {
        matAdd("misc", m, def.misc[m]);
        out.push(`${def.misc[m]} ${getMiscName(m)}`);
      }
    }
    if (def.ht && typeof matAdd === "function") {
      for (const lv in def.ht) {
        matAdd("ht", +lv, def.ht[lv]);
        out.push(`${def.ht[lv]} Huyền Tinh cấp ${lv}`);
      }
    }

    // Đánh dấu nhân vật đã nhận mã
    S.claimedGiftcode = c;
    S.claimedGiftcodeAt = Date.now();

    if (typeof invDirty !== "undefined") invDirty = true;
    if (typeof R !== "undefined" && R) R.dirty = true;
    save();
    if (typeof refresh === "function") refresh();

    log(`🎟 Nhận thành công Giftcode <b>${esc(c)}</b> (${esc(def.name)}): ${esc(out.join(", "))}`);
    return { name: def.name, out: out, direct: true };
  }

  // Nếu không nằm trong 10 mã sự kiện, kiểm tra nếu có máy chủ online
  if (NET.user && typeof netOn === "function" && netOn()) {
    await netSyncChar().catch(() => {});
    const n = await netCall(callObj => callObj.rpc("jx_redeem", { c: c, cname: S.name })), a = n && n.data || {};
    if (a.err) throw new Error(a.err);
    const o = a.reward || {}, i = [];
    +o.knb > 0 && i.push(`${+o.knb} KNB`);
    +o.gold > 0 && i.push(fmtL(+o.gold) + " lượng");
    S.claimedGiftcode = c;
    save();
    log(`🎟 Giftcode <b>${esc(c)}</b>: quà (${i.join(", ")}) đã gửi vào Thư`);
    netMailCount();
    return { name: "Quà máy chủ", out: i, direct: false };
  }

  throw new Error("Mã Giftcode không chính xác hoặc đã hết hạn!");
}

async function giftcodeModal() {
  const curName = S && S.name ? esc(S.name) : "(chưa chọn)";
  const claimed = S && S.claimedGiftcode;

  let alertBox = "";
  if (claimed) {
    alertBox = `<div class="card" style="background:#2a2410;border:1px solid #ffd76a;margin-bottom:8px">
      <b style="color:#ffd76a">✓ Nhân vật đã nhận Giftcode:</b> <code>${esc(claimed)}</code>
      <p class="small dim" style="margin-top:4px">Mỗi nhân vật chỉ được chọn kích hoạt 1 Giftcode duy nhất trong đợt thử nghiệm.</p>
    </div>`;
  }

  modal(`<h3>🎟 Nhập Giftcode</h3>
    ${alertBox}
    <p class="small dim">Nhân vật nhận quà: <b>${curName}</b>. Quà được cộng <b>trực tiếp</b> vào hành trang / nhân vật.</p>
    <div class="btnrow">
      <input id="gcIn" maxlength="32" placeholder="${claimed ? "Đã nhận mã " + claimed : "Nhập 1 trong 10 mã Giftcode"}" style="flex:1;text-transform:uppercase" autocomplete="off" ${claimed ? "disabled" : ""}>
      <button class="btn" id="gcOk" ${claimed ? "disabled" : ""}>Nhận quà</button>
    </div>
    <div id="gcMsg" class="small" style="min-height:1.5em;margin-top:6px"></div>
    <div class="card small" style="margin-top:10px;max-height:190px;overflow-y:auto;background:rgba(0,0,0,0.3)">
      <b style="color:#ffd76a">📜 Danh sách 10 Giftcode Thử Nghiệm (Chọn 1 mã):</b>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:6px;font-family:monospace">
        <div>• <b>TANTHU2026</b>: Tân Thủ Toàn Diện</div>
        <div>• <b>CAYCAP2026</b>: Đua Cấp Tu Luyện</div>
        <div>• <b>PHUHO2026</b>: Phú Hộ Kim Ngân</div>
        <div>• <b>KHAMNAM2026</b>: Thần Binh Lò Rèn</div>
        <div>• <b>VOCO2026</b>: Tuyệt Kỹ Võ Công</div>
        <div>• <b>DANHTAU2026</b>: Dã Tẩu Danh Vọng</div>
        <div>• <b>SANBOSS2026</b>: Săn Boss Khảo Vận</div>
        <div>• <b>THUCUOI2026</b>: Kỵ Sĩ Thú Cưỡi</div>
        <div>• <b>TAYTUY2026</b>: Tẩy Tủy Kinh Mạch</div>
        <div>• <b>DUOCSU2026</b>: Dược Sư Hộ Thể</div>
      </div>
      <p class="dim" style="margin-top:6px;font-size:11px"><i>* Lưu ý: Mỗi nhân vật chỉ được chọn 1 mã. Hãy cân nhắc phong cách chơi trước khi nhập!</i></p>
    </div>`, () => {
    const t = $("#gcIn"), n = $("#gcOk"), a = $("#gcMsg");
    if (!t || !n) return;
    t.focus();
    const s = async () => {
      if (!n.disabled) {
        n.disabled = !0;
        a.innerHTML = "<span class=\"dim\">Đang kiểm tra và nhận quà…</span>";
        try {
          const res = await netRedeem(t.value);
          a.innerHTML = `<span class="cp">✔ Nhận thành công ${esc(res.name)}: (${res.out.join(", ")})!</span>`;
          if (typeof uiSfx === "function") uiSfx("levelup");
          t.value = "";
          t.disabled = !0;
          n.disabled = !0;
          if (typeof toast === "function") toast("Nhận Giftcode thành công!");
        } catch (err) {
          a.innerHTML = `<span class="cn">✖ ${esc(err.message || String(err))}</span>`;
          if (typeof uiSfx === "function") uiSfx("use");
          n.disabled = false;
        }
      }
    };
    n.onclick = s;
    t.onkeydown = e => { e.key === "Enter" && s(); };
  });
}
async function netSell(t,n,a){if(NET_PAUSE.includes("mkt"))throw new Error("Chợ đang tạm đóng");if(n=Math.floor(+n||0),n<1)throw new Error("Nhập giá bán");if(!t||t.lock||!S.inv.includes(t))throw new Error("Món không bán được (đang khóa / đang mặc)");if(t.ktc&&typeof KTC_TRADE<"u"&&!KTC_TRADE.includes(t.ktc.k))throw new Error("Chợ chỉ nhận Võ Lâm Mật Tịch, Tẩy Tủy Kinh, Rương Ngựa của Kỳ Trân Các");await netNeedChar();const o=S.inv.indexOf(t);S.inv.splice(o,1),invDirty=!0,save();try{await netUpload()}catch(c){throw S.inv.splice(o,0,t),invDirty=!0,save(),new Error("Không lưu được nhân vật lên máy chủ, chưa bày bán: "+c.message)}const i=()=>netCall(c=>c.from("market").insert(Object.assign({seller:NET.user.id,seller_name:S.name,item:t,iname:String(t.n).slice(0,80),price:n},a==="knb"?{cur:"knb"}:{})));try{try{await i()}catch(c){if(!/row-level security/i.test(String(c&&c.message)))throw c;let s=null;try{const e=await NET.sb.auth.refreshSession();s=e&&e.data&&e.data.session?e.data.session.user.id:null}catch{}if(!s)throw new Error("Phiên đăng nhập đã hết hạn — đăng xuất rồi đăng nhập lại để bày bán");if(s!==NET.user.id)throw new Error("Trình duyệt đang đăng nhập tài khoản khác — tải lại trang (F5)");NET.lastChar=0,await netSyncChar();try{await i()}catch(e){throw new Error(`Máy chủ từ chối (nhân vật ${S.name}, tài khoản ${String(s).slice(0,8)}): ${e.message}`)}}}catch(c){throw S.inv.splice(o,0,t),invDirty=!0,save(),netUpload().catch(()=>{}),c}log(`🏪 Bày bán <b>${esc(t.n)}</b> giá ${mktPriceTxt({price:n,cur:a})} · bày 2 giờ, hết hạn tự về Thư`),netUpload().catch(()=>{})}async function netBuy(t){if(NET_PAUSE.includes("mkt"))throw new Error("Chợ đang tạm đóng");const n=mktKnb(t);if(!mktCan(t))throw new Error(n?"Không đủ KNB":"Không đủ ngân lượng");await netNeedChar();const a=o=>{n?S.knb=(S.knb|0)+o:S.gold+=o};a(-t.price),save();try{await netUpload()}catch(o){throw a(t.price),save(),new Error("Không lưu được nhân vật lên máy chủ, chưa mua: "+o.message)}try{await netCall(o=>o.rpc("market_buy",{lid:t.id,buyer:S.name}))}catch(o){throw a(t.price),save(),netUpload().catch(()=>{}),o}log(`🏪 Mua <b>${esc(t.iname)}</b> của ${esc(t.seller_name)} giá ${mktPriceTxt(t)} (món đã vào Thư)`),netMailCount(),netUpload().catch(()=>{})}function netDot(){const t=$("#netBtn");t&&(t.classList.toggle("on",NET.mailN>0),t.dataset.n=NET.mailN>9?"9+":NET.mailN||"")}const facName=t=>FAC[t]?FAC[t].n:t||"",netCell=t=>itemCell(t).replace(" bad","").replace(/ title="[^"]*"/,"");function netItemModal(t,n,a){modal(`${itemHTML(t)}${n||""}<div class="btnrow"><button class="btn" id="niBack">Quay lại</button></div>`,()=>{$("#niBack").onclick=a})}async function netEnsureUser(){if(NET.user||!NET.sb)return!!NET.user;try{const{data:t}=await NET.sb.auth.getSession();NET.user=t&&t.session?t.session.user:null}catch{}return!!NET.user}async function netRelogin(){if(!isAuthEnabled())return!1;return await netEnsureUser()||netGate("Phiên đăng nhập đã hết — đăng nhập lại để tiếp tục lưu nhân vật lên đám mây.")}const NET_PAUSE=[],MKT_LIFE=2*36e5,mktLeft=t=>{const n=Math.max(0,Math.round((new Date(t.created).getTime()+MKT_LIFE-Date.now())/6e4));return n>=60?`còn ${Math.floor(n/60)} giờ ${n%60} phút`:`còn ${n} phút`};async function netModal(t,n){
  if(!isAuthEnabled()){
    modal(`<h3>🌐 Giang hồ online</h3>
      <div class="card">
        <div style="font-size:15px;font-weight:bold;color:#f3d27a;margin-bottom:8px">⚔️ Chế độ Chơi Tự Do / Offline</div>
        <p class="desc" style="line-height:1.6">
          Hệ thống đăng nhập bằng <b>Tên đăng nhập & Mật khẩu</b> đang được <b>TẠM TẮT</b>.
        </p>
        <p class="small dim" style="margin-top:6px;line-height:1.5">
          • Dữ liệu nhân vật, trang bị, kho chung được tự động lưu trực tiếp trên trình duyệt (LocalStorage).<br>
          • Bạn có thể trải nghiệm toàn diện mọi nội dung game mà không bắt buộc tạo tài khoản.
        </p>
        <div style="margin-top:12px;padding:10px;background:rgba(255,215,0,0.06);border:1px dashed #ffd76a;border-radius:4px" class="small">
          <b style="color:#ffd76a">💡 Khi cần mở lại Đăng nhập ID / Pass:</b><br>
          Mở file <code>js/chatcfg.js</code>, sửa <code>window.AUTH_ENABLED = true;</code> và cấu hình Supabase tương ứng.
        </div>
      </div>
      <div class="btnrow" style="margin-top:12px;justify-content:center"><button class="btn" onclick="closeModal()">Đã hiểu</button></div>`);
    return;
  }
  if(t&&(NET.tab=t),NET.sb&&await netEnsureUser(),!netOn())return modal('<h3>🌐 Giang hồ online</h3><p class="desc">Chưa cấu hình máy chủ (js/chatcfg.js).</p>');const a=[["acc","Tài khoản"],["rank","Xếp hạng"],["mail",`Thư${NET.mailN?` (${NET.mailN})`:""}`],["mkt","Chợ"]],o=`<h3>🌐 Giang hồ online <small>${NET.user?esc(netUname()):"chưa đăng nhập"}</small></h3><div class="dtabs" id="netTabs">${a.map(([s,e])=>`<button data-nt="${s}" class="${s===NET.tab?"on":""}">${e}</button>`).join("")}</div>${n?`<p class="cn small">${esc(n)}</p>`:""}${S&&S.fac?"":'<div class="btnrow"><button class="btn sm" id="netSlot">← Chọn nhân vật</button></div>'}`;modal(o+'<div id="netBody"><p class="dim small">Đang tải…</p></div>',()=>{document.querySelectorAll("#netTabs [data-nt]").forEach(e=>e.onclick=()=>netModal(e.dataset.nt));const s=$("#netSlot");s&&(s.onclick=()=>slotMenu())},!(S&&S.fac));try{await netClient()}catch(s){$("#netBody").innerHTML=`<p class="reqbad">${esc(s.message)}</p>`;return}const i=$("#netBody");if(!i)return;const c=!NET.user&&NET.tab!=="rank";if(!c&&NET_PAUSE.includes(NET.tab)){i.innerHTML=`<div class="card"><b>⛔ Tạm đóng</b><p class="desc">${NET.tab==="mkt"?"Chợ":"Hộp thư"} đang tạm đóng để bảo trì. Đồ và ngân lượng trong ${NET.tab==="mkt"?"Chợ":"thư"} vẫn được giữ nguyên.</p></div>`;return}try{await{acc:netAccBody,rank:netRankBody,mail:netMailBody,mkt:netMktBody}[c?"acc":NET.tab](i)}catch(s){i.innerHTML=`<p class="reqbad">${esc(s.message||s)}</p>`}}const busy=async(t,n,a)=>{t&&(t.disabled=!0);try{const o=await n();a&&a(o)}catch(o){toast(o.message||String(o)),t&&(t.disabled=!1)}};async function netAccBody(t){
  if(!isAuthEnabled()){
    t.innerHTML=`<div class="card">
      <div style="font-size:15px;font-weight:bold;color:#f3d27a;margin-bottom:8px">⚔️ Chế độ Chơi Tự Do / Offline</div>
      <p class="desc" style="line-height:1.6">
        Hệ thống đăng nhập bằng <b>Tên đăng nhập & Mật khẩu</b> đang được <b>TẠM TẮT</b>.
      </p>
      <p class="small dim" style="margin-top:6px;line-height:1.5">
        • Dữ liệu nhân vật, trang bị, kho chung được tự động lưu trực tiếp trên trình duyệt (LocalStorage).<br>
        • Bạn có thể trải nghiệm toàn diện mọi nội dung game mà không bắt buộc tạo tài khoản.
      </p>
      <div style="margin-top:12px;padding:10px;background:rgba(255,215,0,0.06);border:1px dashed #ffd76a;border-radius:4px" class="small">
        <b style="color:#ffd76a">💡 Khi cần mở lại Đăng nhập ID / Pass:</b><br>
        Mở file <code>js/chatcfg.js</code>, sửa <code>window.AUTH_ENABLED = true;</code> và cấu hình Supabase tương ứng.
      </div>
    </div>`;
    return;
  }
  if(!NET.user){t.innerHTML=`<div class="card"><b>Đăng nhập / Đăng ký</b><p class="dim small">Một tài khoản dùng cho cả 3 nhân vật: lưu đám mây, bảng xếp hạng, gửi thư, Chợ. Không cần email.</p>
      <div class="row">Tên đăng nhập <input id="naU" maxlength="16" autocomplete="username" placeholder="chữ không dấu, số, _"></div>
      <div class="row">Mật khẩu <input id="naP" type="password" maxlength="64" autocomplete="current-password" placeholder="ít nhất 6 ký tự"></div>
      <div class="btnrow"><button class="btn" id="naIn">Đăng nhập</button><button class="btn" id="naUp">Đăng ký mới</button></div>
      <p class="dim small">Nhớ mật khẩu — hiện chưa có cách lấy lại.</p></div>`;const c=s=>busy($(s==="up"?"#naUp":"#naIn"),()=>netAuth(s,$("#naU").value,$("#naP").value),()=>{toast(s==="up"?"Đã tạo tài khoản":"Đã đăng nhập"),netModal("acc")});$("#naIn").onclick=()=>c("in"),$("#naUp").onclick=()=>c("up");return}const n=await netCloudList(),a=c=>c?new Date(c).toLocaleString("vi-VN"):"—";t.innerHTML=`<div class="card"><b>Tài khoản ${esc(netUname())}</b> <button class="btn sm" id="naOut">Đăng xuất</button>
      ${S.fac?`<p class="small">Nhân vật đang chơi: <b>${esc(hasRealName()?S.name:"(chưa đặt tên)")}</b> · ${esc(facName(S.fac))} cấp ${S.lvl} · slot ${SLOT+1}</p>
      <div class="btnrow"><button class="btn sm" id="naSync">Cập nhật lên bảng xếp hạng</button>${hasRealName()?"":'<button class="btn sm on" id="naName">✏ Đặt tên</button>'}</div>`:""}</div>
    <div class="card"><b>☁ Lưu đám mây</b> <small class="dim">mỗi slot 1 bản, chơi tiếp trên máy khác</small>
      ${S.fac?`<div class="btnrow"><button class="btn sm" id="naUp">Tải lên ngay (slot ${SLOT+1})</button></div>
      <p class="dim small">Nhân vật chỉ lưu trên đám mây: tự lưu lên mỗi 2 phút và khi rời trang; vào game luôn lấy bản đám mây.</p>`:""}
      <table class="dktbl small"><tr><th>Slot</th><th>Nhân vật</th><th>Lưu lúc</th><th></th></tr>
      ${[0,1,2].map(c=>{const s=n.find(e=>e.slot===c);return`<tr><td>${c+1}</td><td>${s?`${esc(s.name||"")} · ${esc(facName(s.fac))} ${s.lvl}`:'<span class="dim">trống</span>'}</td><td>${s?a(s.updated):""}</td><td>${s?`<button class="btn sm" data-cl="${c}">Tải về</button>`:""}</td></tr>`}).join("")}</table>
      <p class="dim small">Tải về: thay nhân vật slot đó trên máy này bằng bản đám mây (bản cũ giữ 1 bản sao lưu). Bình thường game tự đồng bộ, không cần bấm.</p></div>`,$("#naOut").onclick=()=>busy($("#naOut"),async()=>{S&&S.fac&&await netUpload().catch(()=>{}),NET.loggingOut=!0,await NET.sb.auth.signOut(),NET.loggingOut=!1,NET.user=null,NET.mailN=0,netDot()},()=>location.reload());const o=(c,s)=>{const e=$(c);e&&(e.onclick=s)};o("#naSync",()=>busy($("#naSync"),()=>netSyncChar(),()=>toast("Đã cập nhật"))),o("#naName",()=>nameModal(()=>netModal("acc"))),o("#naUp",()=>busy($("#naUp"),()=>netUpload(),()=>{toast("Đã lưu lên đám mây"),netModal("acc")}));const i=$("#naAuto");i&&(i.onchange=()=>{S.cloudAuto=i.checked,save()}),t.querySelectorAll("[data-cl]").forEach(c=>c.onclick=()=>busy(c,()=>netCloudLoad(+c.dataset.cl)))}const RANK_CS_MAX=10,RANKS=[["lvl","Cấp"],["tower","Tháp"],["bosses","Trùm đã hạ"]];async function netRankBody(t){RANKS.some(s=>s[0]===NET.rank)||(NET.rank="lvl");const n=NET.rank,a=await netCall(s=>{let e=s.from("chars").select("name,fac,lvl,reborn,power,tower,bosses");return NET.rfac&&(e=e.eq("fac",NET.rfac)),e=n==="lvl"?e.order("reborn",{ascending:!1}).order("lvl",{ascending:!1}).order("power",{ascending:!1}):e.order(n,{ascending:!1}),e.limit(n==="lvl"?100:50)}),o=s=>Math.min(RANK_CS_MAX,Math.max(0,s.reborn|0));let i=a.data||[];n==="lvl"&&(i=i.map((s,e)=>[s,e]).sort((s,e)=>o(e[0])-o(s[0])||(e[0].lvl|0)-(s[0].lvl|0)||s[1]-e[1]).map(s=>s[0]).slice(0,50));const c=s=>n==="lvl"?`${o(s)?`<small class="cp">CS${o(s)}</small> `:""}${s.lvl}`:fmt(s[n]||0);t.innerHTML=`<div class="row"><select id="nrCol">${RANKS.map(([s,e])=>`<option value="${s}" ${s===n?"selected":""}>${e}</option>`).join("")}</select>
      <select id="nrFac"><option value="">Mọi phái</option>${FACTIONS.filter(s=>!s.novice).map(s=>`<option value="${s.key}" ${s.key===NET.rfac?"selected":""}>${esc(s.n)}</option>`).join("")}</select></div>
    <table class="dktbl small"><tr><th>#</th><th>Nhân vật</th><th>Phái</th><th>${RANKS.find(s=>s[0]===n)[1]}</th></tr>
    ${i.map((s,e)=>`<tr${S&&s.name===S.name?' style="background:#2a2410"':""}><td>${e+1}</td><td><a href="#" data-pn="${esc(s.name)}" style="color:${typeof nameCol=="function"?nameCol(s.name,s.fac):"#ffd76a"}">${esc(s.name)}</a></td><td>${esc(facName(s.fac))}</td><td>${c(s)}</td></tr>`).join("")||'<tr><td colspan="4" class="dim">Chưa có ai</td></tr>'}</table>
    <p class="dim small">Bấm tên để xem trang bị. Nhân vật của bạn tự cập nhật khi đã đăng nhập.</p>`,$("#nrCol").onchange=s=>{NET.rank=s.target.value,netModal("rank")},$("#nrFac").onchange=s=>{NET.rfac=s.target.value,netModal("rank")},t.querySelectorAll("[data-pn]").forEach(s=>s.onclick=e=>{e.preventDefault(),profileModal(s.dataset.pn,()=>netModal("rank"))})}async function profileModal(t,n){n=n||(()=>closeModal()),modal(`<h3>${esc(t)}</h3><p class="dim small">Đang tải…</p>`);let a;try{a=await netCall(e=>e.from("chars").select("name,fac,sex,lvl,reborn,power,tower,bosses,gear,updated").eq("name",t).maybeSingle())}catch(e){return modal(`<h3>${esc(t)}</h3><p class="reqbad">${esc(e.message)}</p>`)}const o=a.data;if(!o)return modal(`<h3>${esc(t)}</h3><p class="desc">Nhân vật này chưa liên kết tài khoản online nên chưa xem được trang bị.</p><div class="btnrow"><button class="btn" id="pfB">Quay lại</button></div>`,()=>{$("#pfB").onclick=n});const i=o.gear||{},c=FAC[o.fac],s=SLOTS.map(([e,r])=>`<div class="pfs"><small class="dim">${r}</small>${i[e]?netCell(i[e]).replace("data-uid=",`data-pk="${e}" data-x=`):'<div class="it"></div>'}</div>`).join("");modal(`<h3${typeof isAdminName=="function"&&isAdminName(o.name)?' style="color:#ff3b3b"':""}>${esc(o.name)} <small>${esc(c?c.n:"")} · cấp ${o.lvl}${o.reborn?` · chuyển sinh ${o.reborn}`:""}</small></h3>
    <p class="small">Tháp tầng <b>${o.tower||0}</b> · Trùm đã hạ <b>${fmt(o.bosses||0)}</b> <small class="dim">· cập nhật ${new Date(o.updated).toLocaleString("vi-VN")}</small></p>
    <div class="pfgrid">${s}</div>
    <div class="btnrow">${S&&S.fac&&o.name!==S.name?'<button class="btn" id="pfParty">👥 Mời tổ đội</button><button class="btn" id="pfMail">📨 Gửi thư</button>':""}<button class="btn" id="pfB">Quay lại</button></div>`,()=>{document.querySelectorAll("#mBody [data-pk]").forEach(u=>u.onclick=()=>netItemModal(i[u.dataset.pk],"",()=>profileModal(t,n))),$("#pfB").onclick=n;const e=$("#pfMail");e&&(e.onclick=()=>{NET.mailTo=o.name,netModal("mail")});const r=$("#pfParty");r&&(r.onclick=()=>{typeof partyInvite=="function"&&partyInvite(o.name)})})}async function netMailBody(t){const n=await netCall(e=>e.from("mail").select("*").order("id",{ascending:!1}).limit(50)),a=n.data||[];NET.mailN=a.length,netDot();const o=S.fac?S.inv.filter(e=>!(e.ktc&&typeof KTC_TRADE<"u"&&!KTC_TRADE.includes(e.ktc.k))):[];t.innerHTML=`<div class="card"><b>📥 Hộp thư</b> ${a.length?'<button class="btn sm" id="nmAll">Nhận tất cả</button>':""}
      ${a.map(e=>`<div class="nmrow">${e.item?netCell(e.item).replace("data-uid=",`data-mi="${e.id}" data-x=`):'<span class="nmg">💰</span>'}<span><b>${esc(e.from_name)}</b> <small class="dim">${new Date(e.created).toLocaleString("vi-VN")}</small><br>
        ${e.item?`<span style="color:${RAR_COL[e.item.r]||"#ddd"}">${esc(e.item.n)}</span>`:""}${e.gold>0?` <span class="cp">+${fmtL(e.gold)} lượng</span>`:""}${e.knb>0?` <span class="gold">+${e.knb} KNB</span>`:""}${e.note?`<br><small class="dim">${esc(e.note)}</small>`:""}</span>
        <button class="btn sm" data-take="${e.id}" ${S.fac?"":"disabled"}>Nhận</button>${e.kind==="gift"?` <button class="btn sm" data-rej="${e.id}" ${S.fac?"":"disabled"}>Hủy</button>`:""}</div>`).join("")||'<p class="dim small">Không có thư.</p>'}</div>
    ${S.fac?`<div class="card"><b>📤 Gửi thư</b> <small class="dim">từ ${esc(hasRealName()?S.name:"(chưa đặt tên)")}</small>
      <div class="row">Gửi cho <input id="nmTo" maxlength="14" placeholder="Tên nhân vật" value="${esc(NET.mailTo||"")}"></div>
      <div class="row">Ngân lượng <input id="nmGold" type="number" min="0" placeholder="0"> <small class="dim">có ${fmtL(S.gold)}</small></div>
      <div class="row">Lời nhắn <input id="nmNote" maxlength="100" placeholder="(không bắt buộc)"></div>
      <div class="small">Kèm món đồ (chạm để chọn, chạm lại để bỏ):</div>
      <div class="invgrid" id="nmInv">${o.map(e=>netCell(e).replace('class="it',`${e.lock?'style="opacity:.4" title="Đang khóa 🔒" ':""}class="it${NET.sel===e.uid?" ep-on":""}`)).join("")||'<small class="dim">Hành trang trống</small>'}</div>
      <small class="dim">Món mờ = đang khóa 🔒: mở khóa trong Hành trang mới gửi được.</small>
      <div id="nmPick" class="small"></div>
      <div class="btnrow"><button class="btn" id="nmSend">Gửi</button></div></div>`:""}`,t.querySelectorAll("[data-mi]").forEach(e=>e.onclick=()=>{const r=a.find(u=>u.id===+e.dataset.mi);netItemModal(r.item,"",()=>netModal("mail"))}),t.querySelectorAll("[data-rej]").forEach(e=>e.onclick=()=>{const r=a.find(u=>u.id===+e.dataset.rej);r&&(r.kind!=="gift"||!confirm(`Không nhận thư của ${r.from_name}? Thư sẽ được trả lại cho người gửi.`)||busy(e,()=>netCall(u=>u.rpc("reject_mail",{mid:r.id})),()=>{toast("Đã trả lại thư"),netModal("mail")}))}),t.querySelectorAll("[data-take]").forEach(e=>e.onclick=()=>busy(e,()=>netClaim(a.find(r=>r.id===+e.dataset.take)),r=>{toast("Đã nhận: "+r.join(", ")),refresh(),netModal("mail")}));const i=$("#nmAll");if(i&&(i.onclick=()=>busy(i,async()=>{let e=0;for(const r of a)try{await netClaim(r,!1),e++}catch(u){toast(u.message);break}return e},e=>{toast(`Đã nhận ${e} thư`),refresh(),netModal("mail")})),!S.fac)return;const c=()=>{NET.mailTo=$("#nmTo").value};t.querySelectorAll("#nmInv [data-uid]").forEach(e=>e.onclick=()=>{const r=+e.dataset.uid,u=S.inv.find(g=>g.uid===r);if(u){if(u.lock){toast("Món đang khóa 🔒 — mở khóa trong Hành trang rồi gửi");return}NET.sel=NET.sel===r?null:r,t.querySelectorAll("#nmInv [data-uid]").forEach(g=>g.classList.toggle("ep-on",NET.sel!=null&&+g.dataset.uid===NET.sel)),s()}});const s=()=>{const e=NET.sel!=null?S.inv.find(u=>u.uid===NET.sel):null,r=$("#nmPick");r&&(r.innerHTML=e?`✓ Đang chọn: <b style="color:${RAR_COL[e.r]||"#ddd"}">${esc(e.n)}</b>${e.enh?" +"+e.enh:""}`:"")};s(),$("#nmSend").onclick=()=>{c();const e=NET.sel!=null?S.inv.find(r=>r.uid===NET.sel):null;e&&!confirm(`Gửi ${e.n}${e.enh?" +"+e.enh:""} cho ${$("#nmTo").value.trim()||"?"}?`)||busy($("#nmSend"),()=>netSendGift($("#nmTo").value,e,$("#nmGold").value,$("#nmNote").value),()=>{toast("Đã gửi"),NET.sel=null,refresh(),netModal("mail")})}}const MKT_SLOTS=[["weapon","Vũ khí"],["armor","Áo"],["helm","Mũ"],["belt","Đai lưng"],["boot","Giày"],["cuff","Hộ uyển"],["amulet","Dây chuyền"],["ring","Nhẫn"],["pendant","Ngọc bội"],["horse","Ngựa"]],MKT_RARS=[["hkmp","Hoàng Kim Môn Phái"],["hk","Hoàng Kim bộ chung"],["bk","Bạch Kim"],["tim","Tím"],["hiem","Hiếm"],["xanh","Xanh"],["trang","Thường"]];function mktRar(t){return t?t.set?t.set.kind==="platina"?"bk":setFac(t)>=0?"hkmp":"hk":["trang","xanh","hiem","tim","hk","bk"][t.r|0]||"trang":""}async function netMktBody(t){const a=`<div class="seg" id="nkSub">${[["buy","Mua"],["sell","Bày bán"],["mine","Hàng của tôi"]].map(([l,d])=>`<button class="btn sm${NET.mkt===l?" on":""}" data-nk="${l}">${d}</button>`).join("")}</div>`,o=()=>t.querySelectorAll("[data-nk]").forEach(l=>l.onclick=()=>{NET.mkt=l.dataset.nk,NET.sel=null,netModal("mkt")});if(NET.mkt==="sell"){const l=S.fac?S.inv.filter(f=>!f.lock&&!(f.ktc&&typeof KTC_TRADE<"u"&&!KTC_TRADE.includes(f.ktc.k))):[],d=NET.sel?l.find(f=>f.uid===NET.sel):null;t.innerHTML=`${a}<p class="dim small">Bày tối đa 10 món. Bán được: nhận ${100-NET_TAX*100}% giá vào Thư. Gỡ hàng: món về Thư.</p>
      <div class="invgrid" id="nkInv">${l.map(f=>netCell(f).replace('class="it',`class="it${NET.sel===f.uid?" ep-on":""}`)).join("")||'<small class="dim">Hành trang trống (món khóa 🔒 không bày được)</small>'}</div>
      ${d?`<div class="card">${itemHTML(d)}<div class="row">Giá <input id="nkPrice" type="number" min="1" placeholder="số tiền"> <select id="nkCur"><option value="gold" ${NET.cur!=="knb"?"selected":""}>lượng</option><option value="knb" ${NET.cur==="knb"?"selected":""}>KNB</option></select> <small class="dim">giá bán NPC ${fmt(itemValue(d))} lượng</small> <small class="dim">Bày 2 giờ, hết hạn tự trả về Thư.</small></div><div class="btnrow"><button class="btn" id="nkGo">Bày bán</button></div></div>`:'<p class="dim small">Chạm món muốn bán.</p>'}`,o(),t.querySelectorAll("#nkInv [data-uid]").forEach(f=>f.onclick=()=>{NET.sel=NET.sel===+f.dataset.uid?null:+f.dataset.uid,netModal("mkt")});const h=$("#nkGo");h&&(h.onclick=()=>busy(h,()=>netSell(d,$("#nkPrice").value,NET.cur=$("#nkCur").value),()=>{toast("Đã bày bán"),NET.sel=null,refresh(),netModal("mkt")}));return}const i=NET.mkt==="mine";try{await NET.sb.rpc("market_expire")}catch{}let s=((await netCall(l=>{let d=l.from("market").select("*").order("id",{ascending:!1}).limit(i?50:200);return i&&(d=d.eq("seller",NET.user.id)),d})).data||[]).filter(l=>l&&l.item&&(i||typeof itemGone!="function"||!itemGone(l.item)));const e=NET.q.trim().toLowerCase(),r=NET.mf||(NET.mf={slot:"",rar:"",fit:!1,can:!1,sort:"new",cur:""});if(!i){e&&(s=s.filter(d=>d.iname.toLowerCase().includes(e)||d.seller_name.toLowerCase().includes(e))),r.slot&&(s=s.filter(d=>{const h=DETAIL_SLOT[d.item.d];return r.slot==="other"?!h:h===r.slot})),r.rar&&(s=s.filter(d=>mktRar(d.item)===r.rar)),r.fit&&S.fac&&(s=s.filter(d=>{const h=d.item;try{if(typeof reqOk=="function"&&!reqOk(h)||DETAIL_SLOT[h.d]==="weapon"&&typeof weaponFits=="function"&&!weaponFits(h))return!1;const f=setFac(h);return f<0||!FAC[S.fac]||f===FAC[S.fac].id}catch{return!0}})),r.cur&&(s=s.filter(d=>(mktKnb(d)?"knb":"gold")===r.cur)),r.can&&(s=s.filter(d=>mktCan(d)));const l=d=>d.price*(mktKnb(d)?KNB_GOLD:1);r.sort==="lo"?s.sort((d,h)=>l(d)-l(h)):r.sort==="hi"&&s.sort((d,h)=>l(h)-l(d))}const u=(l,d,h)=>`<option value="${l}" ${l===d?"selected":""}>${h}</option>`,g=i?"":`<div class="row"><input id="nkQ" placeholder="Tìm tên món / người bán" value="${esc(NET.q)}"></div>
    <div class="row mktf"><select id="nkSlot">${u("",r.slot,"Mọi loại")}${MKT_SLOTS.map(([l,d])=>u(l,r.slot,d)).join("")}${u("other",r.slot,"Khác")}</select>
      <select id="nkRar">${u("",r.rar,"Mọi phẩm chất")}${MKT_RARS.map(([l,d])=>u(l,r.rar,d)).join("")}</select>
      <select id="nkCur2">${u("",r.cur,"Mọi loại tiền")}${u("gold",r.cur,"Lượng")}${u("knb",r.cur,"KNB")}</select>
      <select id="nkSort">${u("new",r.sort,"Mới nhất")}${u("lo",r.sort,"Giá thấp → cao")}${u("hi",r.sort,"Giá cao → thấp")}</select></div>
    <div class="row mktf"><label><input type="checkbox" id="nkFit" ${r.fit?"checked":""}> Hợp với tôi (đủ cấp, đúng phái / vũ khí)</label> <label><input type="checkbox" id="nkCan" ${r.can?"checked":""}> Đủ tiền mua</label> <small class="dim">${s.length} món</small></div>`;t.innerHTML=`${a}${g}
    ${s.map(l=>`<div class="nmrow">${netCell(l.item).replace("data-uid=",`data-li="${l.id}" data-x=`)}<span><span style="color:${RAR_COL[l.item.r]||"#ddd"}">${esc(l.iname)}</span><br><small class="dim">${esc(l.seller_name)} · ${mktLeft(l)}</small></span>
      <span class="cp">${mktPriceTxt(l)}</span>${i?`<button class="btn sm red" data-cx="${l.id}">Gỡ</button>`:l.seller===NET.user.id?'<small class="dim">của bạn</small>':`<button class="btn sm" data-buy="${l.id}" ${S.fac&&mktCan(l)?"":"disabled"}>Mua</button>`}</div>`).join("")||'<p class="dim small">Chưa có món nào.</p>'}
    ${i?"":`<p class="dim small">Bạn có ${S.fac?fmtL(S.gold):0} lượng · ${S.fac?fmt(S.knb|0):0} KNB. Món mua được gửi vào Thư.</p>`}`,o();const m=$("#nkQ");m&&(m.onchange=()=>{NET.q=m.value,netModal("mkt")});for(const[l,d]of[["#nkSlot","slot"],["#nkRar","rar"],["#nkSort","sort"],["#nkCur2","cur"]]){const h=$(l);h&&(h.onchange=()=>{r[d]=h.value,netModal("mkt")})}for(const[l,d]of[["#nkFit","fit"],["#nkCan","can"]]){const h=$(l);h&&(h.onchange=()=>{r[d]=h.checked,netModal("mkt")})}t.querySelectorAll("[data-li]").forEach(l=>l.onclick=()=>{const d=s.find(h=>h.id===+l.dataset.li);netItemModal(d.item,`<p class="small">Người bán <b>${esc(d.seller_name)}</b> · giá <b class="cp">${mktPriceTxt(d)}</b></p>`,()=>netModal("mkt"))}),t.querySelectorAll("[data-buy]").forEach(l=>l.onclick=()=>busy(l,()=>netBuy(s.find(d=>d.id===+l.dataset.buy)),()=>{toast("Đã mua — món trong Thư"),refresh(),netModal("mkt")})),t.querySelectorAll("[data-cx]").forEach(l=>l.onclick=()=>busy(l,()=>netCall(d=>d.rpc("market_cancel",{lid:+l.dataset.cx})),()=>{toast("Đã gỡ — món về Thư"),netMailCount(),netModal("mkt")}))}async function netInit(){
  const t=$("#giftBtn");
  if(t&&!$("#netBtn")){
    const n=document.createElement("button");
    n.id="netBtn",n.title="Giang hồ online: tài khoản, xếp hạng, thư, chợ",n.textContent="🌐",t.parentNode.insertBefore(n,t),n.onclick=()=>{typeof uiSfx=="function"&&uiSfx("click"),netModal()};
  }
  if(!isAuthEnabled()||!netOn())return;
  try{await netClient()}catch(n){netGate("Không kết nối được máy chủ: "+(n.message||n));return}
  if(!NET.user){netGate();return}
  netSyncAll().then(n=>{n&&(!S||!S.fac)&&location.reload()}).catch(()=>{}),netMailCount(),netCheckCloud().catch(()=>{}),document.addEventListener("visibilitychange",()=>{document.hidden&&NET.user&&S&&S.fac&&!netHeld()&&Date.now()-NET.lastUp>6e4&&netUpSig()!==NET.upSig&&netUpload().catch(()=>{})}),setInterval(async()=>{if(!NET.user&&S&&S.fac&&!document.hidden&&!netHeld()&&$("#modal").classList.contains("hidden")){netRelogin();return}if(!(!NET.user||!S||!S.fac||document.hidden||netHeld())){try{hasRealName()&&Date.now()-NET.lastChar>10*6e4&&await netSyncChar(!0),Date.now()-NET.lastUp>5*6e4&&netUpSig()!==NET.upSig&&await netUpload()}catch{}Date.now()-(NET.mailT||0)>5*6e4&&(NET.mailT=Date.now(),netMailCount())}},6e4);
}
