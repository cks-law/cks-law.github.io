/* 사이트 공통: 모바일 메뉴(드로어) + 방문 통계 */
(function(){
/* ===== 방문 통계 (Google Analytics 4) =====
   GA_ID에 'G-'로 시작하는 측정 ID를 넣으면 수집이 시작됩니다. 비어 있으면 아무것도 보내지 않습니다. */
var GA_ID = "G-KPNL776MZ3";

window.track = function(name, params){
  if(!GA_ID || typeof window.gtag !== "function") return;
  try{ window.gtag("event", name, params || {}); }catch(e){}
};
if(GA_ID){
  var s=document.createElement("script"); s.async=true; s.src="https://www.googletagmanager.com/gtag/js?id="+GA_ID;
  document.head.appendChild(s);
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){dataLayer.push(arguments)};
  gtag("js",new Date()); gtag("config",GA_ID,{anonymize_ip:true});
}

/* 클릭 이벤트: data-ev / data-label 이 붙은 요소, 칼럼 링크, 간이 상담 버튼 */
document.addEventListener("click",function(e){
  var t=e.target.closest("[data-ev]");
  if(t) track(t.getAttribute("data-ev"),{label:t.getAttribute("data-label")||t.textContent.trim().slice(0,40)});
  var a=e.target.closest('a[href*="posts/"]');
  if(a && !t) track("column_click",{label:a.textContent.trim().slice(0,60)});
  var i=e.target.closest("[data-intake]");
  if(i) track("intake_open",{label:(i.getAttribute("data-preset")||"general").slice(0,60)});
},true);
/* 어떤 상황(사건 카드)을 열어 봤는지 */
document.addEventListener("toggle",function(e){
  var d=e.target; if(!d.matches||!d.matches(".cases details")||!d.open) return;
  var s=d.querySelector("summary"); track("case_open",{label:s?s.childNodes[0].textContent.trim():""});
},true);

/* ===== 모바일 메뉴 ===== */
var dr=document.getElementById("drawer");
function openD(){ if(!dr) return; dr.hidden=false; document.body.classList.add("lock"); track("menu_open",{}); }
function closeD(){ if(!dr) return; dr.hidden=true; var sh=document.getElementById("sheet"); if(!sh||sh.hidden) document.body.classList.remove("lock"); }
document.addEventListener("click",function(e){
  if(e.target.closest("[data-drawer]")){ e.preventDefault(); openD(); return; }
  if(e.target.closest("[data-drawer-close]")){ e.preventDefault(); closeD(); return; }
  if(e.target.closest("[data-drawer-close-nav]")){ closeD(); return; }
  if(dr && !dr.hidden && e.target.closest("[data-intake]")) closeD();
});
document.addEventListener("keydown",function(e){ if(e.key==="Escape") closeD(); });
})();
