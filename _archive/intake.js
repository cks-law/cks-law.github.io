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
 {id:"deepfake",g:"sex",t:"딥페이크·허위영상물",kw:{"딥페이크":7,"합성":5,"지인능욕":7,"허위영상":7,"얼굴 합성":7,"ai 사진":4,"능욕":4},post:"deepfake",urgent:true,
  first:["직접 만들었는지 받기만 했는지 구분해 정리하세요.","언제 저장·시청했는지 날짜를 확인하세요.","파일과 대화방을 지우거나 다시 보내지 마세요."]},
 {id:"threat",g:"sex",t:"촬영물 유포·유포 협박",kw:{"유포":6,"퍼뜨리":6,"뿌리겠":6,"올리겠":5,"리벤지":6,"영상 협박":7,"사진 협박":7,"동영상 협박":7,"헤어진 연인":3},post:"filming-threat",urgent:true,
  first:["상대에게 더 이상 연락하지 마세요.","파일을 지우거나 다른 사람에게 보내지 마세요.","협박만 해도 벌금형 없는 죄가 될 수 있습니다."]},
 {id:"csam",g:"sex",t:"아동·청소년 성착취물",kw:{"성착취물":7,"아청물":7,"아동음란물":7,"아동 음란물":7,"텔레그램":3,"다운로드":3,"토렌트":4,"p2p":4,"웹하드":3},post:"csam-possession",urgent:true,
  first:["파일과 프로그램을 지우지 마세요.","어디서 받았는지, 공유한 적이 있는지 정리하세요.","소지·시청도 벌금형이 없는 죄입니다."]},
 {id:"grooming",g:"sex",t:"온라인 그루밍 (성착취 목적 대화)",kw:{"그루밍":7,"성착취 목적":7,"미성년자와 대화":6,"게임에서 만난":3,"사진 요구":4,"중학생과":5,"고등학생과":5},post:"online-grooming",urgent:true,
  first:["대화 기록을 그대로 보존하세요.","상대에게 다시 연락하지 마세요.","사진 요구나 만남이 있었는지 정리하세요."]},
 {id:"power",g:"sex",t:"업무상 위력 추행",kw:{"위력":6,"상사":3,"부하 직원":5,"부하직원":5,"교수":3,"출장":2,"직장 내 추행":6},post:"workplace-power-assault",
  first:["피해자에게 직접 사과하거나 해명하지 마세요.","회사 조사 전에 형사 진술 방향을 정하세요.","관계를 보여주는 자료를 정리하세요."]},
 {id:"harass",g:"sex",t:"직장 내 성희롱",kw:{"성희롱":7,"성적 농담":5,"외모 평가":4,"인사팀":2,"고충":2},post:"harassment-vs-assault",
  first:["회사 조사 진술을 가볍게 보지 마세요.","피해자에게 직접 연락하지 마세요.","형사 문제로 번질 수 있는지 먼저 확인하세요."]},
 {id:"indecency",g:"sex",t:"공연음란",kw:{"공연음란":7,"노출":4,"바바리맨":6,"성기":4,"바지를 내":5,"알몸":3},post:"public-indecency",
  first:["언제 어디서 어떤 상황이었는지 정리하세요.","CCTV와 동행인 진술을 확보하세요.","직업에 따라 취업제한이 문제될 수 있습니다."]},
 {id:"restroom",g:"sex",t:"화장실·탈의실 침입",kw:{"화장실":4,"여자화장실":7,"여자 화장실":7,"탈의실":5,"목욕탕":4,"잘못 들어":5},post:"restroom-intrusion",
  first:["CCTV와 동선 자료를 빨리 확보하세요.","안에 머문 시간과 나온 경위를 정리하세요.","휴대폰을 지우지 말고 그대로 두세요."]},
 {id:"prost",g:"sex",t:"성매매 적발",kw:{"성매매":7,"성매수":4,"존스쿨":7,"업소":4,"오피":4,"안마":3,"스웨디시":4,"단속":3,"장부":3},post:"prostitution",
  first:["방문 횟수와 경위를 정확히 정리하세요.","다툴 부분이 있는지 먼저 확인하세요.","존스쿨은 검사가 대상을 정합니다."]},
 {id:"registry",g:"sex",t:"신상정보 등록·취업제한",kw:{"신상정보":7,"신상등록":7,"신상 등록":7,"취업제한":7,"성범죄자 알림":6,"공개명령":6,"고지명령":6},post:"sex-offender-registry",
  first:["어떤 죄명인지, 처분이 나왔는지 확인하세요.","통매음·화장실 침입은 벌금형이면 등록 제외입니다.","판결 확정 후 30일 안에 제출해야 합니다."]},
 {id:"servant",g:"sex",t:"공무원·교사 성범죄",kw:{"공무원":4,"교사":4,"교원":4,"당연퇴직":7,"결격":5,"임용":3},post:"public-servant-sex-crime",
  first:["벌금 100만 원 이상이면 당연퇴직 사유입니다.","선고유예도 안전하지 않습니다.","징계 절차는 따로 진행됩니다."]},
 {id:"settle",g:"sex",t:"성범죄 합의·형사공탁",kw:{"합의금":5,"공탁":6,"형사공탁":7,"처벌불원":6,"합의서":5},post:"sex-crime-settlement",
  first:["피해자에게 직접 연락하지 마세요.","합의는 대리인을 통해 진행하세요.","공탁은 선고 전 피해자 의견 청취가 의무입니다."]},
 {id:"sexvictim",g:"life",t:"성범죄 피해",kw:{"피해를 당했":5,"당했어요":3,"성폭행":6,"성추행 당":7,"추행을 당":7,"몰카 피해":7,"신고하고 싶":4,"고소하고 싶":4},post:"sex-crime-victim",
  first:["메시지와 기록을 지우지 말고 보관하세요.","피해 직후라면 병원 진료를 먼저 받으세요.","피해자 국선변호사의 도움을 받을 수 있습니다."]},
 {id:"iasettle",g:"sex",t:"강제추행 합의",kw:{"강제추행 합의":20,"추행 합의":14},post:"indecent-assault-settlement",
  first:["피해자에게 직접 연락하지 마세요.","합의는 대리인을 통해 진행하세요.","처벌불원서를 받으면 바로 제출하세요."]},
 {id:"tsettle",g:"sex",t:"통매음 합의",kw:{"통매음 합의":20,"통매음 고소 취소":15},post:"tongmaeum-settlement",
  first:["사과 메시지도 다시 보내지 마세요.","합의는 대리인을 통해 진행하세요.","처벌불원서를 받으면 바로 제출하세요."]},
 {id:"quasi",g:"sex",t:"준강제추행",kw:{"준강제추행":13,"잠든 사이":6,"잠든 사람":6,"블랙아웃":7,"만취한 상대":6,"필름이 끊":4},post:"quasi-indecent-assault",urgent:true,
  first:["당시 상대 상태를 보여줄 CCTV를 확보하세요.","상대에게 직접 연락해 해명하지 마세요.","전후 대화 기록을 지우지 마세요."]},
 {id:"injury",g:"sex",t:"강제추행치상·강간치상",kw:{"치상":10,"추행치상":6,"진단서":5,"전치":5,"ptsd":6,"외상 후":5},post:"indecent-assault-injury",urgent:true,
  first:["진단서 내용과 발급 경위를 확인하세요.","상해가 언제 어떻게 생겼는지 정리하세요.","하한 5년의 중범죄라 바로 상담하세요."]},
 {id:"statrape",g:"sex",t:"미성년자의제강간",kw:{"의제강간":14,"의제":6,"15살":5,"14살":5,"15세":5,"14세":5,"서로 좋아":5,"사귀":3,"교제":3},post:"statutory-rape",urgent:true,
  first:["사건 당시 두 사람의 나이를 확인하세요.","나이를 알게 된 시점과 대화를 보존하세요.","동의가 있어도 처벌되는 죄입니다."]},
 {id:"milsex",g:"sex",t:"군인 성범죄",kw:{"군인":6,"군대":6,"부대":5,"선임":4,"후임":5,"생활관":7,"군형법":8,"군인등강제추행":12},post:"military-sex-crime",urgent:true,
  first:["가해자·피해자의 신분을 확인하세요.","군인등강제추행은 벌금형이 없습니다.","군 내부 진술 전에 상담하세요."]},
 {id:"limitation",g:"sex",t:"성범죄 공소시효",kw:{"공소시효":9,"오래전":4,"오래 전":4,"몇 년 전":4,"년 전 일":4},post:"sex-crime-limitation",
  first:["사건 날짜를 최대한 정확히 확인하세요.","당시 피해자 나이를 확인하세요(정지·배제 특례).","날짜를 보여줄 기록을 모아 두세요."]},
 {id:"plimit",g:"sex",t:"성매매 공소시효",kw:{"성매매 공소시효":20,"업소 공소시효":20,"성매수 공소시효":20},post:"prostitution-limitation",
  first:["방문 날짜별로 정리하세요(각 5년).","상대가 미성년자였을 가능성을 확인하세요.","초범이면 존스쿨 가능성을 검토하세요."]},
 {id:"falserep",g:"sex",t:"성범죄 무고",kw:{"무고":8,"허위 신고":6,"허위신고":6,"거짓 신고":6,"거짓말로 신고":6,"맞고소":5},post:"sex-crime-false-report",
  first:["원래 사건의 처분 결과와 이유를 확인하세요.","허위를 보여줄 객관적 자료를 모으세요.","근거가 약하면 역고소 위험이 있습니다."]},
 {id:"obscene",g:"sex",t:"음란물 유포",kw:{"음란물":6,"야동":6,"성인 영상":6,"음란물 유포":8,"웹하드":5,"토렌트":4,"단톡방":3},post:"obscene-distribution",
  first:["어떤 파일을 어디에 올렸는지 확인하세요.","파일과 프로그램을 지우지 마세요.","불법촬영물·성착취물이 섞였는지 확인하세요."]},
 {id:"agestd",g:"sex",t:"미성년자 나이 기준",kw:{"몇 살":5,"나이 기준":9,"만 나이":4,"생일 안":4,"19세":4,"빠른년생":7},post:"minor-age-standard",
  first:["사건 당시 상대의 정확한 나이를 확인하세요.","나이를 언제 알았는지 대화를 보존하세요.","기록을 지우면 불리할 수 있습니다."]},
 {id:"rapesent",g:"sex",t:"강간죄 형량",kw:{"강간 형량":16,"강간죄 형량":16,"강간 처벌":10,"강간죄 처벌":10},post:"rape-sentencing",
  first:["어떤 죄명인지 먼저 확인하세요.","상대 나이와 관계, 상해 여부를 정리하세요.","첫 진술 전에 상담하세요."]},
 {id:"indcrit",g:"sex",t:"추행의 기준",kw:{"어디까지":5,"성추행 기준":12,"추행 기준":10,"성추행":3,"추행인가":6,"추행이 되":6},post:"indecency-criteria",
  first:["어떤 접촉이었는지 구체적으로 정리하세요.","장소와 관계, 상대 나이를 확인하세요.","상대에게 직접 연락하지 마세요."]},
 {id:"digital",g:"sex",t:"디지털 성범죄",kw:{"디지털 성범죄":10,"디지털성범죄":10,"온라인 성범죄":8},post:"digital-sex-crime-types",
  first:["게시물 주소와 화면을 캡처해 두세요.","기기를 초기화하거나 파일을 지우지 마세요.","협박을 받고 있다면 돈을 보내지 마세요."]},
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
 {id:"refusal",g:"crim",t:"음주측정거부",kw:{"측정 거부":9,"측정거부":9,"측정을 거부":9,"불응":5,"채혈":4,"술타기":7},post:"breath-test-refusal",urgent:true,
  first:["측정 요구 당시 상황을 시간 순서로 정리하세요.","측정거부는 면허 생계형 감경 대상이 아닙니다.","경찰이 한 말과 요구 횟수를 적어 두세요."]},
 {id:"duirepeat",g:"crim",t:"음주운전 재범",kw:{"두 번째":9,"두번째":9,"2회":8,"3회":8,"재범":8,"삼진":9,"또 걸":8,"다시 걸":8},post:"dui-repeat",urgent:true,
  first:["이전 형 확정일을 확인하세요(10년 기준).","차량 처분 등 재범 방지 조치를 시작하세요.","결격 2년과 조건부 면허가 적용될 수 있습니다."]},
 {id:"duiacc",g:"crim",t:"음주운전 사고",kw:{"음주사고":7,"음주 사고":7,"술 마시고 사고":7,"위험운전":7},post:"dui-accident",urgent:true,
  first:["피해자 부상 정도를 확인하세요.","보험과 별도로 형사 합의가 필요합니다.","사고 경위 영상을 보존하세요."]},
 {id:"licappeal",g:"crim",t:"면허 취소·정지 구제",kw:{"면허 취소":5,"면허취소":5,"면허 정지":5,"면허정지":5,"행정심판":6,"이의신청":6,"생계형":7,"구제":4,"110일":7},post:"dui-license-appeal",
  first:["처분 통지일을 확인하세요(60일·90일).","0.1% 초과·사고·측정불응이면 감경이 어렵습니다.","생계 관련 자료를 준비하세요."]},
 {id:"accomplice",g:"crim",t:"음주운전 동승·방조",kw:{"동승":6,"방조":7,"차 키":5,"차키":5,"옆에 탔":5},post:"dui-accomplice",
  first:["음주 사실을 언제 알았는지 정리하세요.","말렸거나 대리를 권한 기록을 보관하세요.","운전자를 감싸려는 거짓 진술은 하지 마세요."]},
 {id:"pm",g:"crim",t:"킥보드·자전거 음주",kw:{"킥보드":7,"전동킥보드":7,"자전거":5,"공유 킥보드":7,"pm":3},post:"pm-bicycle-dui",
  first:["무엇을 탔는지(킥보드·자전거) 확인하세요.","킥보드는 자동차 면허 처분까지 갈 수 있습니다.","사고가 있었다면 피해 상황을 정리하세요."]},
 {id:"unlic",g:"crim",t:"무면허운전",kw:{"무면허":7,"면허 없이":6,"면허없이":6,"정지 중":5,"취소된 상태":5},post:"unlicensed-driving",
  first:["면허 정지·취소 통지 시점을 확인하세요.","면허를 다시 받기 전까지 운전하지 마세요.","음주가 겹쳤다면 바로 상담하세요."]},
 {id:"hitrun",g:"crim",t:"뺑소니·사고 후 도주",kw:{"뺑소니":7,"도주":5,"그냥 갔":5,"그냥 떠":5,"사고후미조치":7,"미조치":6},post:"hit-and-run-injury",urgent:true,
  first:["지금이라도 자진 신고를 검토하세요.","피해자와 연락해 피해를 회복하세요.","떠난 경위를 보여줄 영상을 보존하세요."]},
 {id:"parked",g:"crim",t:"물피도주·주차 사고",kw:{"물피도주":7,"주차된 차":6,"주차장":4,"긁고":5,"박고":3,"연락처":3},post:"parked-car-hit-run",
  first:["상대 차에 사람이 타고 있었는지 확인하세요.","연락받으면 바로 사과하고 보험 처리하세요.","접촉을 몰랐다면 그 근거를 정리하세요."]},
 {id:"rage",g:"crim",t:"보복운전",kw:{"보복운전":7,"급제동":5,"칼치기":5,"난폭운전":6,"상향등":4,"경적":3},post:"road-rage",
  first:["내 블랙박스 영상 전체를 보존하세요.","입건만으로 벌점 100점이 부과될 수 있습니다.","상대에게 직접 연락하지 마세요."]},
 {id:"schoolzone",g:"crim",t:"스쿨존 사고",kw:{"스쿨존":7,"어린이보호구역":7,"민식이법":7,"초등학생":3,"아이를 쳤":6},post:"school-zone-accident",urgent:true,
  first:["즉시 구호하고 보호자·경찰에 연락하세요.","당시 속도와 상황 영상을 확보하세요.","보험과 별개로 형사처벌 대상입니다."]},
 {id:"points",g:"crim",t:"벌점·면허정지",kw:{"벌점":7,"누산":6,"면허정지 벌점":7,"40점":6,"착한운전":6},post:"demerit-points",
  first:["이파인에서 현재 벌점을 조회하세요.","40점 미만이면 교육으로 20점 감경할 수 있습니다.","정지 중 운전은 무면허운전입니다."]},
 {id:"dui",g:"crim",t:"음주운전",kw:{"음주운전":7,"음주 측정":3,"음주측정":3,"측정 거부":2,"면허 취소":4,"면허취소":4,"대리 안":3,"혈중알코올":5},post:"drunk-driving",
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
 {id:"adultery",g:"life",t:"배우자 외도·상간 소송",kw:{"외도":5,"상간":7,"상간녀":7,"상간남":7,"불륜":6,"바람":4,"내연":5},post:"adultery-lawsuit",
  first:["증거를 합법적으로 확보하세요.","안 날부터 3년이 위자료 청구 기한입니다.","상대방에게 직접 찾아가거나 폭로하지 마세요."]},
 {id:"consent",g:"life",t:"협의이혼 절차",kw:{"협의이혼":7,"합의이혼":7,"숙려기간":6,"이혼서류":6,"이혼신고":5},post:"consensual-divorce",
  first:["자녀가 있으면 숙려기간은 3개월입니다.","양육비는 금액·지급일까지 구체적으로 정하세요.","확인 후 3개월 안에 신고해야 합니다."]},
 {id:"custody",g:"life",t:"양육권·친권",kw:{"양육권":7,"친권":6,"양육자":6,"아이를 데려":5,"애를 데려":5},post:"custody-criteria",
  first:["지금까지의 양육 기록을 정리하세요.","아이를 일방적으로 데려가거나 숨기지 마세요.","임시 양육자 지정을 신청할 수 있습니다."]},
 {id:"support",g:"life",t:"양육비 미지급·증액",kw:{"양육비":7,"양육비를 안":7,"안 주":3,"미지급":6,"양육비 안":7,"선지급":7,"이행명령":6,"감치":6},post:"child-support-unpaid",
  first:["양육비를 정한 판결·조서를 확인하세요.","밀린 금액을 월별로 정리하세요.","국가 선지급도 신청할 수 있습니다."]},
 {id:"visit",g:"life",t:"면접교섭",kw:{"면접교섭":7,"아이를 못 만나":7,"아이를 안 보여":7,"애를 못 보":6},post:"visitation-rights",
  first:["만나지 못한 날짜와 경위를 기록하세요.","양육비는 계속 지급하세요.","이행명령을 신청할 수 있습니다."]},
 {id:"commonlaw",g:"life",t:"사실혼",kw:{"사실혼":7,"혼인신고 안":6,"혼인신고를 안":6,"동거":3},post:"common-law-property",
  first:["관계가 끝난 시점을 기록하세요.","사실혼을 보여줄 자료를 모으세요.","재산분할은 해소 후 2년 안에 청구해야 합니다."]},
 {id:"engage",g:"life",t:"파혼·약혼 해제",kw:{"파혼":7,"약혼":6,"예물":6,"예단":6,"상견례":4,"결혼식 취소":6},post:"broken-engagement",
  first:["약혼 자료(상견례·예약)를 보관하세요.","지출 비용과 예물 목록을 정리하세요.","파혼 사유를 보여주는 메시지를 지우지 마세요."]},
 {id:"annul",g:"life",t:"혼인무효·취소",kw:{"혼인무효":7,"혼인취소":7,"사기결혼":7,"속아서 결혼":6},post:"marriage-annulment",
  first:["무엇을 속였는지, 언제 알았는지 정리하세요.","사기에 의한 취소는 안 날부터 3개월입니다.","기한이 지났다면 이혼으로 검토합니다."]},
 {id:"divorce",g:"life",t:"이혼·재산분할",kw:{"이혼":7,"재산분할":7,"위자료":4,"양육권":3,"양육비":3,"외도":5,"바람":4,"상간":3,"남편":2,"아내":2},post:"divorce-property",
  first:["부부 양쪽 명의 재산 목록을 정리하세요.","혼인 파탄 사유를 보여주는 자료를 보관하세요.","재산분할은 이혼 후 2년 안에 청구해야 합니다."]},
 {id:"inherit",g:"life",t:"상속·유류분",kw:{"상속":6,"유산":5,"유류분":7,"상속포기":7,"한정승인":7,"돌아가":3,"사망":2,"빚":2,"유언":5},post:"inheritance-renounce",
  first:["상속포기·한정승인은 사망을 안 날부터 3개월 안에 해야 합니다.","빚이 있을 수 있다면 상속재산에 손대지 마세요.","유류분 청구는 증여 사실을 안 날부터 1년 안에 해야 합니다."]},
 {id:"loan",g:"life",t:"빌려준 돈 받기",kw:{"빌려준":6,"빌려줬":6,"대여금":7,"차용증":6,"안 갚":5,"갚지":4,"지급명령":6,"돈을 빌":4},post:"loan-recovery",
  first:["송금 내역과 '빌려 달라'는 메시지를 함께 보관하세요.","상대 재산을 파악해 가압류를 검토하세요.","개인 간 대여금 시효는 10년입니다."]},
 {id:"school",g:"life",t:"학교폭력",kw:{"학교폭력":7,"학폭":7,"학폭위":7,"심의위원회":5,"같은 반":4,"반 친구":4,"담임":3,"따돌림":5,"왕따":5,"아이가":2,"아들이":2,"딸이":2},post:"school-violence",
  first:["학교에 낸 진술서와 받은 통지문을 모두 보관하세요.","심의위원회 일정 전에 의견서를 준비할 수 있습니다.","처분에 불복하려면 정해진 기간 안에 행정심판이나 소송을 내야 합니다."]}
];

var POSTS = {
 "indecency-criteria":"어디까지가 성추행인가요, 추행의 기준과 처벌",
 "prostitution-limitation":"성매매 공소시효, 몇 년 전 일도 처벌되나요",
 "indecent-assault-settlement":"강제추행 합의금은 무엇으로 정해지나요",
 "quasi-indecent-assault":"준강제추행, 술에 취한 상대와의 접촉이 문제될 때",
 "rape-sentencing":"강간죄 형량, 어떤 경우에 얼마나 무거워지나요",
 "minor-age-standard":"아청법 나이 기준, 미성년자는 몇 살까지인가요",
 "military-sex-crime":"군인 성범죄, 군인등강제추행과 민간 법원 재판",
 "sex-crime-limitation":"성범죄 공소시효, 죄명별 기간과 특례",
 "sex-crime-false-report":"성범죄 무고, 무혐의가 나오면 무고죄가 되나요",
 "obscene-distribution":"음란물 유포죄, 웹하드·토렌트·단톡방 공유도 처벌되나요",
 "tongmaeum-settlement":"통매음 합의, 언제 어떻게 하는 것이 좋을까요",
 "indecent-assault-injury":"강제추행치상, 작은 상처나 정신적 피해도 '상해'가 되나요",
 "statutory-rape":"미성년자의제강간, 서로 좋아서 만났어도 처벌되나요",
 "digital-sex-crime-types":"디지털 성범죄 유형 한눈에 보기, 촬영·유포·합성·협박",
 "dui-first-fine":"음주운전 초범 벌금, 무엇으로 정해지나요",
 "dui-repeat":"음주운전 2회·3회 적발, 처벌은 어떻게 달라지나요",
 "license-revocation-reacquire":"음주운전 면허취소, 언제 다시 딸 수 있나요",
 "dui-license-appeal":"음주운전 면허 구제, 이의신청과 행정심판 요건",
 "breath-test-refusal":"음주측정거부, 수치보다 무겁게 처벌되는 이유",
 "dui-accident":"음주운전 사고를 냈다면, 위험운전치사상과 교통사고처리법",
 "dui-arrest":"음주운전으로 구속될 수 있나요, 실형이 나오는 기준",
 "dui-suspended-sentence":"음주운전 집행유예와 기소유예, 어떤 경우에 가능한가요",
 "dui-mitigation-materials":"음주운전 반성문·탄원서·양형자료, 무엇을 어떻게 준비하나요",
 "dui-accomplice":"음주운전 차에 같이 탔다면, 동승자도 처벌되나요 (음주운전 방조)",
 "public-servant-dui":"공무원 음주운전, 징계 기준과 당연퇴직 위험",
 "pm-bicycle-dui":"전동킥보드·자전거 음주운전, 어떻게 처벌되나요",
 "unlicensed-driving":"무면허운전 처벌, 정지 중 운전도 무면허인가요",
 "unlicensed-dui":"무면허 음주운전, 두 죄가 겹치면 어떻게 처벌되나요",
 "hit-and-run-injury":"뺑소니(도주치상) 처벌, '도주'는 어떤 경우에 인정되나요",
 "parked-car-hit-run":"주차된 차를 긁고 그냥 갔다면, 물피도주 처벌",
 "failure-to-take-measures":"사고후미조치, 사람이 안 다쳤는데도 처벌되나요",
 "road-rage":"보복운전으로 신고됐다면, 특수협박과 면허 처분",
 "school-zone-accident":"어린이보호구역(스쿨존) 사고, 민식이법은 어떻게 적용되나요",
 "demerit-points":"운전면허 벌점, 몇 점이면 정지·취소되나요",
 "consensual-divorce":"협의이혼 절차와 서류, 한 번에 정리",
 "divorce-grounds":"재판상 이혼사유 6가지와 유책배우자의 이혼청구",
 "adultery-lawsuit":"상간녀·상간남 위자료 소송, 언제까지 무엇으로 하나요",
 "property-division":"이혼 재산분할, 무엇을 어떤 기준으로 나누나요",
 "common-law-property":"사실혼 재산분할과 위자료, 혼인신고를 안 했어도 받을 수 있나요",
 "divorce-alimony":"이혼 위자료, 무엇으로 정해지고 언제까지 청구하나요",
 "divorce-lawsuit-process":"이혼소송 절차, 소장부터 판결 확정까지",
 "late-life-divorce":"황혼이혼, 퇴직금과 연금은 어떻게 나누나요",
 "custody-criteria":"양육권·친권, 법원은 어떤 기준으로 정하나요",
 "child-support-unpaid":"양육비를 안 줄 때, 받아내는 방법 순서대로",
 "child-support-increase":"양육비 증액과 과거 양육비, 지금이라도 청구할 수 있나요",
 "visitation-rights":"면접교섭권, 아이를 못 만나게 할 때와 만나게 하기 싫을 때",
 "custody-change":"이미 정한 양육권·친권, 바꿀 수 있나요",
 "divorce-mediation":"조정이혼, 소송보다 빨리 끝내는 방법",
 "cooling-off-shorten":"이혼숙려기간, 줄이거나 면제받을 수 있나요",
 "separation-divorce":"별거 중인데 이혼할 수 있나요, 별거와 이혼의 관계",
 "marriage-annulment":"혼인무효와 혼인취소, 이혼과 무엇이 다른가요",
 "broken-engagement":"파혼당했다면, 손해배상과 예물 반환",
 "post-divorce-property":"협의이혼 후에도 재산분할을 청구할 수 있나요",
 "divorce-appeal":"이혼소송 판결에 불복하려면, 항소 14일과 범위 정하기",
 "jealousy-personality-divorce":"의부증·의처증, 성격 차이도 이혼사유가 되나요",
 "common-law-dissolution":"사실혼 관계를 끝낼 때, 절차와 챙길 권리",
 "deepfake":"딥페이크 영상, 만들기만 하거나 보기만 해도 처벌되나요",
 "filming-threat":"촬영물을 유포하거나 '퍼뜨리겠다'고 했다면",
 "csam-possession":"아동·청소년 성착취물, 내려받거나 보기만 해도 징역형인 이유",
 "online-grooming":"미성년자와 온라인으로 대화만 했는데 그루밍으로 조사받는다면",
 "workplace-power-assault":"직장 상사의 '업무상 위력 추행', 강제추행과 무엇이 다른가요",
 "harassment-vs-assault":"직장 내 성희롱과 강제추행, 징계와 형사처벌은 따로 갑니다",
 "public-indecency":"공연음란으로 조사받게 됐다면, 경범죄와의 차이부터 확인하세요",
 "restroom-intrusion":"여자화장실에 들어갔다가 신고됐다면, '성적 목적'이 쟁점입니다",
 "prostitution":"성매매 단속에 적발됐다면, 존스쿨(교육조건부 기소유예)의 조건",
 "sex-offender-registry":"성범죄 신상정보 등록, 언제 되고 몇 년 가나요",
 "employment-restriction":"성범죄 취업제한명령, 벌금형이어도 나오나요",
 "public-servant-sex-crime":"공무원·교사가 성범죄로 입건됐다면, 벌금 100만 원이 기준선입니다",
 "sex-crime-settlement":"성범죄 합의와 형사공탁, 2025년부터 달라진 점",
 "sex-crime-first-offense":"성범죄 초범이면 어떻게 되나요, 처분이 갈리는 기준",
 "sex-crime-victim":"성범죄 피해를 당했다면, 고소 전에 알아둘 것",
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
