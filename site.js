/* 사이트 공통: 방문 통계(GA4) + 모바일 메뉴 + 상담 문의 메일 */
(function(){
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
document.addEventListener("click",function(e){
  var t=e.target.closest("[data-ev]");
  if(t) track(t.getAttribute("data-ev"),{label:t.getAttribute("data-label")||""});
},true);

/* 상단 줄 */
var bar=document.getElementById("bar");
if(bar) addEventListener("scroll",function(){bar.classList.toggle("on",scrollY>8)},{passive:true});

/* 모바일 메뉴 */
var btn=document.querySelector(".menu"), nav=document.getElementById("nav");
if(btn&&nav){
  btn.addEventListener("click",function(){var o=nav.classList.toggle("open");btn.setAttribute("aria-expanded",o)});
  nav.addEventListener("click",function(e){if(e.target.closest("a")){nav.classList.remove("open");btn.setAttribute("aria-expanded","false")}});
}

/* 상담 문의 → 메일 앱 */
var f=document.getElementById("ask");
if(f) f.addEventListener("submit",function(e){
  e.preventDefault();
  var E=f.elements, n=E.namedItem("name").value.trim(), p=E.namedItem("phone").value.trim(), m=E.namedItem("msg").value.trim();
  var body="성함: "+(n||"-")+"\n연락처: "+(p||"-")+"\n\n"+m;
  track("contact_submit",{});
  location.href="mailto:kschoi@enclaw.co.kr?subject="+encodeURIComponent("[홈페이지 상담 문의] "+(n||""))+"&body="+encodeURIComponent(body);
});
})();
