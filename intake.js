/* 간이 상담: 상황 입력 → 자동 분류 → 관련 칼럼 연결 → (동의 시) 내용·연락처 접수
   ENDPOINT: 접수 내용을 받을 Google Apps Script 웹앱 주소. 비어 있으면 메일 앱으로 보냅니다. */
(function(){
var ENDPOINT = "";
var MAIL = "kschoi@enclaw.co.kr";
var BASE = (document.body.dataset.base || "");

var G = {sex:{name:"성범죄",c:"var(--red)"}, crim:{name:"형사 사건",c:"var(--gold)"}, life:{name:"피해·생활 분쟁",c:"var(--green)"}};

var CATS = [
 {id:"drunk-touch",g:"sex",t:"술자리 신체접촉으로 고소",kw:{"술":2,"취해":2,"취한":2,"회식":3,"스킨십":4,"만졌":3,"터치":3,"껴안":3,"안았":2,"손잡":2,"키스":3,"뽀뽀":3,"클럽":2,"헌팅":2,"고소":1},post:"drunk-touch-complaint",
  first:["상대방에게 직접 연락해 사과하거나 해명하지 마세요.","그날 동선의 CCTV, 택시·카드 결제 내역을 빨리 확보하세요.","기억이 불분명하면 인정도 부인도 서두르지 마세요."]},
 {id:"indecent",g:"sex",t:"강제추행",kw:{"추행":5,"강제추행":6,"엉덩이":3,"가슴":3,"허벅지":3,"신체접촉":4,"만졌":2,"더듬":4,"지하철":2,"버스":1},post:"indecent-assault",
  first:["상대방과의 연락은 중단하고, 받은 메시지는 지우지 말고 보관하세요.","현장 CCTV는 보존 기간이 짧습니다.","조사 전에 진술 방향을 정리하는 것이 중요합니다."]},
 {id:"rape",g:"sex",t:"강간·준강간",kw:{"강간":6,"준강간":7,"성관계":4,"동의 없이":4,"동의없이":4,"잠든":3,"잠들":3,"모텔":2,"원나잇":3,"합의하에":3},post:"rape-accusation",urgent:true,
  first:["법정형이 무거운 사건이라 첫 진술 전에 상담이 필요합니다.","당시 주고받은 메시지와 이후 연락 내용을 그대로 보관하세요.","상대방에게 연락해 합의를 요구하면 불리해질 수 있습니다."]},
 {id:"tongmae",g:"sex",t:"통신매체이용음란 (통매음)",kw:{"통매음":7,"음란":4,"야한":3,"성적인 메시지":5,"성적인":2,"사진 보냈":3,"디엠":2,"dm":2,"카톡으로":1,"메시지":1,"영상통화":2},post:"tongmaeum",
  first:["보낸 메시지를 지우는 것은 증거인멸로 비칠 수 있습니다.","대화 전체 맥락을 캡처로 보관해 두세요.","상대방에게 추가 연락은 하지 마세요."]},
 {id:"minor",g:"sex",t:"조건만남 상대가 미성년자 (아청 성매수)",kw:{"조건만남":6,"조건":2,"미성년":6,"미성년자":6,"청소년":4,"고등학생":4,"중학생":5,"랜덤채팅":4,"앱에서 만난":2,"성매수":6,"아청":7,"나이를 속":4,"나이 속":4},post:"minor-solicitation",urgent:true,
  first:["아동·청소년 관련 사건은 처벌과 부수처분이 매우 무겁습니다.","상대방 나이를 알았는지가 핵심 쟁점이 됩니다. 당시 대화를 보관하세요.","휴대폰 기록을 지우지 말고 바로 상담하세요."]},
 {id:"spycam",g:"sex",t:"불법촬영",kw:{"몰카":6,"불법촬영":7,"촬영":3,"찍었":3,"찍힌":3,"카메라":2,"치마":3,"도촬":6},post:"illegal-filming",urgent:true,
  first:["휴대폰이나 저장 매체를 임의로 초기화하지 마세요.","압수수색이 있었다면 압수목록을 받아 두세요.","조사 전에 변호인과 진술 범위를 정리하세요."]},
 {id:"arrest",g:"crim",t:"체포·구속",kw:{"체포":6,"구속":6,"현행범":6,"연행":5,"유치장":6,"영장":4,"잡혀":4,"경찰서에 있":5,"끌려":3},post:"police-summons",urgent:true,
  first:["체포 후 48시간 안에 구속영장 청구 여부가 정해집니다.","가족이라면 체포된 경찰서와 담당 수사관부터 확인하세요.","변호인 접견을 요청할 수 있습니다."]},
 {id:"summons",g:"crim",t:"수사기관 출석 요구",kw:{"출석":5,"조사받":5,"소환":5,"수사관":4,"경찰서에서 연락":5,"경찰에서 연락":5,"피의자":4,"고소장":3,"고소당":4,"피소":4},post:"police-summons",
  first:["어떤 신분으로, 어떤 사건으로 부르는지 확인하세요.","출석 날짜는 준비를 이유로 조율할 수 있습니다.","전화로 경위를 길게 설명하지 마세요."]},
 {id:"blackout",g:"crim",t:"술 마시고 기억이 나지 않는 사건",kw:{"기억이 안":6,"기억 안":6,"기억이 없":6,"필름":5,"블랙아웃":6,"만취":4,"취해서":3},post:"drunk-touch-complaint",
  first:["기억나지 않는 부분을 추측해서 진술하지 마세요.","함께 있던 사람, 결제 내역, 위치 기록으로 동선을 복원하세요.","CCTV는 빨리 확보해야 합니다."]},
 {id:"theft",g:"crim",t:"절도 적발",kw:{"절도":6,"훔쳤":5,"훔친":5,"무인점포":6,"편의점":3,"마트":2,"계산 안":4,"도둑":3,"가져왔":2,"점유이탈":5},post:"theft",
  first:["피해 금액과 횟수가 처분에 영향을 줍니다.","피해 회복(변제)과 합의 시점이 중요합니다.","점포 측 연락에 감정적으로 대응하지 마세요."]},
 {id:"assault",g:"crim",t:"폭행·상해",kw:{"폭행":6,"때렸":5,"맞았":4,"싸움":4,"싸웠":4,"상해":5,"주먹":4,"밀쳤":4,"멱살":4,"전치":4},post:"assault-injury",
  first:["진단서와 상처 사진, 현장 영상을 확보하세요.","쌍방폭행으로 번질 수 있으니 진술을 정리하세요.","합의 조건은 서면으로 남기세요."]},
 {id:"dui",g:"crim",t:"음주운전",kw:{"음주운전":7,"음주 측정":5,"음주측정":5,"측정 거부":6,"면허 취소":4,"면허취소":4,"대리 안":3,"혈중알코올":5},post:"drunk-driving",
  first:["처벌 전력이 있는지가 양형에 큰 영향을 줍니다.","행정처분(면허)과 형사처벌은 따로 진행됩니다.","운전이 생계와 연결된다면 그 자료를 모아 두세요."]},
 {id:"courier",g:"crim",t:"보이스피싱 연루 (현금 전달·수거)",kw:{"수거":5,"전달 알바":6,"고액 알바":6,"고액알바":6,"현금 전달":6,"현금을 받아":5,"수거책":7,"인출책":7,"통장 빌려":5,"통장을 빌려":5,"체크카드 빌려":5},post:"phishing-courier",urgent:true,
  first:["알바 모집 대화, 지시 메시지를 전부 보관하세요.","몰랐다는 점을 뒷받침할 자료가 핵심입니다.","추가 지시에는 응하지 말고 바로 상담하세요."]},
 {id:"stalking",g:"crim",t:"스토킹",kw:{"스토킹":7,"접근금지":6,"잠정조치":6,"계속 연락":5,"집 앞":4,"찾아갔":4,"헤어진":3,"전 여자친구":3,"전 남자친구":3,"차단":2},post:"stalking",
  first:["모든 연락을 즉시 멈추세요. 지인을 통한 연락도 위험합니다.","접근금지 등 통보받은 내용을 정확히 확인하세요.","스토킹은 합의해도 처벌될 수 있습니다."]},
 {id:"drugs",g:"crim",t:"마약",kw:{"마약":7,"대마":6,"필로폰":7,"투약":5,"모발":4,"소변 검사":5,"졸피뎀":5,"프로포폴":5,"엑스터시":6},post:"drugs",urgent:true,
  first:["다른 사람과 관련된 진술은 신중해야 합니다.","어떤 약물인지, 투약인지 소지인지부터 정리하세요.","치료 의지를 보여줄 수 있는 준비를 시작하세요."]},
 {id:"fraud",g:"crim",t:"사기 고소",kw:{"사기":6,"사기죄":7,"편취":6,"속였":4,"투자금":4,"사기로 고소":7},post:"fraud",
  first:["돈을 받을 당시 재산 상태와 자료를 정리하세요.","받은 돈의 사용처를 계좌 흐름으로 정리하세요.","상대와의 메시지를 지우지 마세요."]},
 {id:"embezzle",g:"crim",t:"횡령·배임",kw:{"횡령":7,"배임":7,"법인카드":5,"회사 돈":5,"공금":5,"업무상":3},post:"embezzlement",
  first:["문제된 금액과 실제 사용처를 정리하세요.","회계 자료와 영수증을 확보하세요.","인정하는 부분과 다투는 부분을 나눠 보세요."]},
 {id:"phishing",g:"life",t:"보이스피싱 피해",kw:{"보이스피싱":5,"피싱":4,"사칭":4,"검사라고":5,"검찰이라고":5,"대출해준다":4,"링크":2,"앱 설치":4,"원격":3,"송금했":3,"이체했":3,"속아서":3},post:null,
  first:["즉시 송금한 은행에 지급정지를 신청하세요.","경찰에 신고하고 사건사고사실확인원을 발급받으세요.","설치한 앱이 있다면 휴대폰 사용을 멈추세요."]},
 {id:"deposit",g:"life",t:"전세·월세 보증금을 못 받음",kw:{"보증금":6,"전세금":6,"전세":4,"집주인":4,"임대인":4,"안 돌려":4,"안돌려":4,"못 받":3,"만기":3,"임차권":5,"역전세":5,"이사":2},post:"deposit-return",
  first:["보증금을 받기 전에 이사 가야 한다면 임차권등기부터 하세요.","계약서, 확정일자, 전입신고 내역을 준비하세요.","반환 요구는 기록이 남는 방식으로 하세요."]},
 {id:"eviction",g:"life",t:"세입자가 집을 비우지 않음",kw:{"세입자":5,"임차인":4,"안 나가":5,"안나가":5,"명도":6,"퇴거":5,"월세 밀":5,"월세를 밀":5,"차임":4,"연체":3,"비워주지":5},post:"eviction",
  first:["월세 연체 기간과 금액을 정리하세요.","계약 해지 통지는 내용증명 등 기록이 남는 방식으로 하세요.","점유이전금지가처분이 필요할 수 있습니다."]},
 {id:"defame",g:"life",t:"온라인 명예훼손·모욕",kw:{"명예훼손":7,"모욕":5,"악플":6,"악성 댓글":6,"댓글":2,"유튜버":4,"유튜브":3,"인스타":3,"익명":3,"사이버렉카":6,"렉카":4,"허위사실":6,"거짓 글":5,"영상 올":3,"신상":3,"디스커버리":6},post:"online-defamation-discovery",
  first:["삭제 요청보다 먼저 URL, 화면 캡처, 영상 녹화로 증거를 남기세요.","게시자에게 직접 항의하거나 연락하지 마세요.","해외 플랫폼 익명 계정도 신원을 확인할 방법이 있습니다."]},
 {id:"dismissal",g:"life",t:"부당해고",kw:{"해고":6,"잘렸":5,"나오지 마":5,"권고사직":5,"사직서":3,"징계":3,"부당해고":7,"해고예고":6},post:"unfair-dismissal",
  first:["해고 통보 문자·메신저·녹음을 보관하세요.","사직서에는 서명하기 전에 상담하세요.","부당해고 구제신청은 해고일부터 3개월 안에 해야 합니다."]},
 {id:"wages",g:"life",t:"임금·퇴직금 체불",kw:{"월급":4,"임금":4,"퇴직금":6,"체불":7,"못 받":3,"급여":3,"주휴수당":5,"야근수당":5,"노동청":5},post:"unpaid-wages",
  first:["급여명세서와 입금 내역을 정리하세요.","퇴직 후 14일이 지나면 노동청에 진정할 수 있습니다.","임금 채권은 3년이 지나면 소멸합니다."]},
 {id:"bullying",g:"life",t:"직장 내 괴롭힘",kw:{"괴롭힘":6,"갑질":6,"폭언":4,"상사":3,"팀장":3,"따돌":3,"직장 내":4,"업무 배제":5},post:"workplace-bullying",
  first:["날짜별로 있었던 일을 기록하세요.","메신저와 이메일을 회사 계정이 막히기 전에 보관하세요.","회사 규모(5명 이상인지)를 확인하세요."]},
 {id:"divorce",g:"life",t:"이혼·재산분할",kw:{"이혼":7,"재산분할":7,"위자료":6,"양육권":6,"양육비":6,"외도":5,"바람":4,"상간":6,"남편":2,"아내":2},post:"divorce-property",
  first:["부부 양쪽 명의 재산 목록을 정리하세요.","혼인 파탄 사유를 보여주는 자료를 보관하세요.","재산분할은 이혼 후 2년 안에 청구해야 합니다."]},
 {id:"inherit",g:"life",t:"상속·유류분",kw:{"상속":6,"유산":5,"유류분":7,"상속포기":7,"한정승인":7,"돌아가":3,"사망":2,"빚":2,"유언":5},post:"inheritance-renounce",
  first:["상속포기·한정승인은 사망을 안 날부터 3개월 안에 해야 합니다.","빚이 있을 수 있다면 상속재산에 손대지 마세요.","유류분 청구는 증여 사실을 안 날부터 1년 안에 해야 합니다."]},
 {id:"loan",g:"life",t:"빌려준 돈 받기",kw:{"빌려준":6,"빌려줬":6,"대여금":7,"차용증":6,"안 갚":5,"갚지":4,"지급명령":6,"돈을 빌":4},post:"loan-recovery",
  first:["송금 내역과 '빌려 달라'는 메시지를 함께 보관하세요.","상대 재산을 파악해 가압류를 검토하세요.","개인 간 대여금 시효는 10년입니다."]},
 {id:"school",g:"life",t:"학교폭력",kw:{"학교폭력":7,"학폭":7,"학폭위":7,"심의위원회":5,"같은 반":4,"반 친구":4,"담임":3,"따돌림":5,"왕따":5,"아이가":2,"아들이":2,"딸이":2},post:"school-violence",
  first:["학교에 낸 진술서와 받은 통지문을 모두 보관하세요.","심의위원회 일정 전에 의견서를 준비할 수 있습니다.","처분에 불복하려면 정해진 기간 안에 행정심판이나 소송을 내야 합니다."]}
];

var POSTS = {
 "police-summons":"경찰에서 출석 요구 연락을 받았다면, 조사 전에 확인할 것들",
 "drunk-touch-complaint":"술자리 스킨십으로 강제추행 고소를 당했다면",
 "deposit-return":"전세 보증금을 돌려받지 못할 때, 순서대로 해야 할 일",
 "online-defamation-discovery":"익명 계정의 명예훼손, 미국 디스커버리로 신원을 찾는 방법",
 "illegal-filming":"불법촬영(몰카)으로 적발됐다면, 휴대폰부터 지우지 마세요",
 "tongmaeum":"성적인 메시지를 보냈다가 통매음으로 고소당했다면",
 "minor-solicitation":"조건만남 상대가 미성년자였다면, 지금 알아야 할 것",
 "drunk-driving":"음주운전으로 적발됐다면, 형사처벌과 면허 처분 따로 챙기세요",
 "phishing-courier":"고액 알바인 줄 알았는데 보이스피싱 수거책이 됐다면",
 "school-violence":"아이가 학교폭력에 휘말렸다면, 학폭위 전에 알아야 할 것",
 "indecent-assault":"강제추행으로 신고됐다면, 첫 진술 전에 확인할 것",
 "rape-accusation":"합의한 관계였는데 강간·준강간으로 고소당했다면",
 "theft":"무인점포·편의점 절도로 적발됐다면",
 "assault-injury":"다툼이 폭행·상해 사건이 됐다면, 합의 전에 알아야 할 것",
 "eviction":"세입자가 월세를 밀리고 집을 비우지 않는다면, 명도 절차",
 "unfair-dismissal":"갑자기 해고 통보를 받았다면, 3개월 안에 해야 할 일",
 "unpaid-wages":"월급·퇴직금을 못 받았다면, 진정부터 소송까지",
 "workplace-bullying":"직장 내 괴롭힘, 신고 전에 알아야 할 것",
 "divorce-property":"이혼을 고민한다면, 재산분할·위자료·양육권 기본 정리",
 "inheritance-renounce":"부모님이 빚을 남기셨다면, 상속포기와 한정승인",
 "loan-recovery":"빌려준 돈을 못 받고 있다면, 지급명령부터 가압류까지",
 "stalking":"헤어진 뒤 연락했다가 스토킹으로 신고됐다면",
 "drugs":"마약 투약·소지로 조사를 받게 됐다면",
 "fraud":"돈을 못 갚았는데 사기로 고소당했다면, 사기죄의 기준",
 "embezzlement":"회사 돈 문제로 횡령·배임 고소를 당했다면"
};

function classify(text){
  var s=text.toLowerCase().replace(/\s+/g," "), out=[];
  CATS.forEach(function(c){
    var sc=0; for(var k in c.kw){ if(s.indexOf(k)>-1) sc+=c.kw[k]; }
    if(sc>=4) out.push({c:c,s:sc});
  });
  out.sort(function(a,b){return b.s-a.s});
  return out.slice(0,2).map(function(o){return o.c});
}

function $(id){return document.getElementById(id)}
function el(tag,attrs,html){var e=document.createElement(tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(html!=null)e.innerHTML=html;return e}
function esc(t){return String(t).replace(/[&<>"]/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]})}

var root=$("intake"); if(!root) return;
var ta=$("in-text"), go=$("in-go"), s1=$("in-s1"), s2=$("in-s2"), s3=$("in-s3"), cnt=$("in-count");
var last={text:"",cats:[]};

function upd(){var n=ta.value.trim().length;cnt.textContent=n+"자";cnt.style.color="";go.disabled=false}
["input","keyup","change","compositionend","paste"].forEach(function(ev){ta.addEventListener(ev,function(){setTimeout(upd,0)})}); upd();

go.addEventListener("click",function(){
  var text=ta.value.trim();
  if(text.length<5){ cnt.textContent="상황을 조금 더 적어 주세요"; cnt.style.color="var(--gold-2)"; if(fine) ta.focus({preventScroll:true}); return; } var cats=classify(text); last={text:text,cats:cats};
  var box=$("in-result"); box.innerHTML="";
  var chips=el("div",{"class":"cat-out"});
  if(cats.length){ cats.forEach(function(c){var ch=el("span",{"class":"chip"},esc(c.t));ch.style.setProperty("--c",G[c.g].c);chips.appendChild(ch)}); }
  else { chips.appendChild(el("span",{"class":"chip"},"분류가 어려운 사건")); }
  box.appendChild(chips);
  if(cats.some(function(c){return c.urgent})) box.appendChild(el("div",{"class":"urgent"},"시간이 중요한 사건일 수 있습니다. 진술이나 조사 일정이 잡혀 있다면 그 전에 상담하는 것이 좋습니다."));
  var main=cats[0];
  if(main){
    var ul=el("ul",{"class":"first"}); main.first.forEach(function(f){ul.appendChild(el("li",{},esc(f)))}); box.appendChild(ul);
  }
  var post=cats.map(function(c){return c.post}).filter(Boolean)[0];
  if(post){ var a=el("a",{"class":"post-link",href:BASE+"posts/"+post+".html"},"<small>먼저 읽어 보세요</small><span>"+esc(POSTS[post])+"</span>"); box.appendChild(a); }
  else { box.appendChild(el("p",{"class":"no-post"},"이 상황을 다룬 칼럼은 아직 없습니다. 내용을 남겨 주시면 비슷한 고민을 가진 분들을 위해 칼럼으로 정리하겠습니다.")); }
  s1.hidden=true; s2.hidden=false;
  var pnl=document.querySelector(".sheet-panel"); if(pnl) pnl.scrollTop=0;
});

$("in-back").addEventListener("click",function(){s2.hidden=true;s1.hidden=false;if(fine)ta.focus({preventScroll:true})});

var agree=$("in-agree"), send=$("in-send");
function canSend(){send.disabled=!agree.checked}
agree.addEventListener("change",canSend); canSend();

send.addEventListener("click",function(){
  var data={
    ts:new Date().toISOString(), text:last.text,
    categories:last.cats.map(function(c){return c.t}).join(", ")||"미분류",
    hasPost:last.cats.some(function(c){return c.post})?"Y":"N",
    name:$("in-name").value.trim(), phone:$("in-phone").value.trim(), time:$("in-time").value.trim(),
    consent:"Y", page:location.pathname
  };
  send.disabled=true; send.textContent="보내는 중";
  if(ENDPOINT){
    fetch(ENDPOINT,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(data)})
      .then(function(){finish(true)}).catch(function(){finish(false,data)});
  } else { finish(false,data); }
});

function finish(ok,data){
  s2.hidden=true; s3.hidden=false;
  var d=$("in-done");
  if(ok){
    d.innerHTML='<div class="ok">접수되었습니다</div><p>남겨주신 내용은 최경수 변호사가 직접 확인합니다. 연락처를 남기셨다면 상황에 따라 변호사가 연락드릴 수 있습니다.</p>';
  } else {
    var body="[간이 상담]\n분류: "+data.categories+"\n\n"+data.text+"\n\n성함: "+data.name+"\n연락처: "+data.phone+"\n연락 가능 시간: "+data.time;
    var href="mailto:"+MAIL+"?subject="+encodeURIComponent("간이 상담 ("+data.categories+")")+"&body="+encodeURIComponent(body);
    d.innerHTML='<p>메일 앱에서 보내기를 누르면 접수됩니다. 메일 앱이 열리지 않으면 아래 주소로 내용을 보내 주세요.</p><p><b>'+MAIL+'</b></p><a class="btn gold" href="'+href+'">메일 앱 열기</a>';
    location.href=href;
  }
}

/* open from anywhere: buttons with data-intake (optionally data-preset). Opens as a fixed sheet; the page underneath never scrolls. */
var sheet=$("sheet"), fine=window.matchMedia&&matchMedia("(pointer:fine)").matches;
function openSheet(p){
  if(p){ s3.hidden=true; s2.hidden=true; s1.hidden=false; if(!ta.value.trim()) ta.value=p+" "; upd(); }
  if(sheet){ sheet.hidden=false; document.body.classList.add("lock"); var pnl=sheet.querySelector(".sheet-panel"); if(pnl) pnl.scrollTop=0; }
  if(fine){ ta.focus({preventScroll:true}); ta.setSelectionRange(ta.value.length,ta.value.length); }
}
function closeSheet(){ if(sheet){ sheet.hidden=true; document.body.classList.remove("lock"); } if(location.hash==="#intake") history.replaceState(null,"",location.pathname+location.search); }
document.addEventListener("click",function(e){
  if(e.target.closest("[data-close]")){ e.preventDefault(); closeSheet(); return; }
  var b=e.target.closest("[data-intake]"); if(!b) return;
  e.preventDefault(); openSheet(b.getAttribute("data-preset"));
});
document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&sheet&&!sheet.hidden) closeSheet(); });
if(location.hash==="#intake") openSheet();
})();
