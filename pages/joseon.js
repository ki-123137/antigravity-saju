import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════
// 사주 계산 엔진
// ═══════════════════════════════════════════════════════
const CG=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const CG_KR=["갑","을","병","정","무","기","경","신","임","계"];
const JJ=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const JJ_KR=["자","축","인","묘","진","사","오","미","신","유","술","해"];
const JJ_ZOD=["쥐","소","범","토끼","용","뱀","말","양","원숭이","닭","개","돼지"];
function getYP(y,m,d){let yr=y;if(m<2||(m===2&&d<4))yr--;const i=((yr-1984)%60+600)%60;return{gan:CG[i%10],ganh:CG_KR[i%10],ji:JJ[i%12],jih:JJ_KR[i%12],zod:JJ_ZOD[i%12],gi:i%10};}
function getMP(ygi,m){const jb=[1,2,3,4,5,6,7,8,9,10,11,0];const ji=jb[m-1];const gs=[2,4,6,8,0][ygi%5];const gi=(gs+((ji-2+12)%12))%10;return{gan:CG[gi],ganh:CG_KR[gi],ji:JJ[ji],jih:JJ_KR[ji],gi};}
function getDP(y,m,d){const days=Math.round((new Date(y,m-1,d)-new Date(1900,0,1))/86400000);const i=((days+10)%60+60)%60;return{gan:CG[i%10],ganh:CG_KR[i%10],ji:JJ[i%12],jih:JJ_KR[i%12],gi:i%10};}
function getHP(dgi,h){if(!h&&h!==0)return{gan:"時",ganh:"시",ji:"柱",jih:"주",gi:-1};const n=+h;const ji=n===23?0:Math.floor((n+1)/2)%12;const gi=([0,2,4,6,8][dgi%5]+ji)%10;return{gan:CG[gi],ganh:CG_KR[gi],ji:JJ[ji],jih:JJ_KR[ji],gi};}
function calcSaju(y,m,d,h){const yp=getYP(+y,+m,+d);const mp=getMP(yp.gi,+m);const dp=getDP(+y,+m,+d);const hp=h?getHP(dp.gi,h):getHP(dp.gi,null);return{year:yp,month:mp,day:dp,hour:hp};}

// ═══════════════════════════════════════════════════════
// 구독 플랜 정의
// ═══════════════════════════════════════════════════════
const PLANS = {
  free: {
    id:"free", name:"무료 열람", nameH:"無料 閱覽",
    price:0, priceLabel:"무료",
    color:"#7f8c8d",
    features:[
      "사주팔자 기본 풀이",
      "토정비결 기본 연간운",
      "오늘의 일진 확인",
      "오행 배합 분석",
    ],
    locked:[
      "직업·혼인·재물 상세운",
      "궁합 宮合",
      "신년 대운 大運",
      "작명·이름풀이",
      "매월 신규 운세 리포트",
      "무제한 재조회",
    ],
  },
  basic: {
    id:"basic", name:"관원 구독", nameH:"官員 口讀",
    price:9900, priceLabel:"월 9,900원",
    color:"#c0392b",
    badge:"인기",
    features:[
      "사주팔자 전체 풀이 (6탭)",
      "토정비결 상세 풀이",
      "오늘의 일진 + 주간 일진",
      "오행 배합 + 격국·용신",
      "직업·혼인·재물 상세운",
      "신년 대운 大運",
      "무제한 재조회",
    ],
    locked:[
      "궁합 宮合",
      "작명·이름풀이",
      "대제학 1:1 상담 (월 1회)",
    ],
  },
  premium: {
    id:"premium", name:"대감 구독", nameH:"大監 口讀",
    price:29900, priceLabel:"월 29,900원",
    color:"#e8b84b",
    badge:"최고",
    features:[
      "관원 구독 전체 포함",
      "궁합 宮合 무제한",
      "작명·이름풀이",
      "대제학 1:1 상담 (월 3회)",
      "매월 운세 리포트 PDF",
      "신년 사주 감정서 (연 1회)",
      "가족 계정 추가 2명",
    ],
    locked:[],
  },
};

// ═══════════════════════════════════════════════════════
// 오행 & 색상
// ═══════════════════════════════════════════════════════
const EC={wood:"#4a7c3f",fire:"#c0392b",earth:"#8b6914",metal:"#7f8c8d",water:"#1a5276"};
const EK={wood:"木",fire:"火",earth:"土",metal:"金",water:"水"};
const EKR={wood:"목",fire:"화",earth:"토",metal:"금",water:"수"};

// ═══════════════════════════════════════════════════════
// Claude API
// ═══════════════════════════════════════════════════════
async function callClaude(system,user,tokens=4000){
  const res=await fetch("/api/claude",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({system,user,tokens})
  });
  const data=await res.json();
  if(!res.ok||!data.success) throw new Error(data.error||"API 오류");
  return data.data;
}
const SYS=`당신은 조선 왕실 사주 관청의 관상감 대제학입니다. 사주를 조선시대 궁중 언어와 전통 역학으로 풀이합니다. 마크다운 코드블록 없이 순수 JSON만 출력. 큰따옴표는 JSON에만 사용. 현대어로 설명하되 격조 있는 문어체를 사용하세요.`;

function getToday(){const d=new Date();return`${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;}
function getYear(){return new Date().getFullYear();}
function getNextMonth(){const d=new Date();d.setMonth(d.getMonth()+1);return`${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;}

// ═══════════════════════════════════════════════════════
// 공통 래퍼 (App 외부 — 키보드 포커스 유지)
// ═══════════════════════════════════════════════════════
function PalaceBG({children,scanY}){
  return(
    <div style={{minHeight:"100vh",
      background:"linear-gradient(180deg,#0e0a06 0%,#150f08 50%,#0a0806 100%)",
      color:"#e8d5b0",fontFamily:"'Noto Serif KR','Batang',Georgia,serif",
      position:"relative",overflow:"hidden"}}>
      <div style={{position:"fixed",top:0,left:0,right:0,height:6,zIndex:10,
        background:"repeating-linear-gradient(90deg,#8b1a1a 0px,#8b1a1a 20px,#c0392b 20px,#c0392b 24px,#e8b84b 24px,#e8b84b 28px,#4a7c3f 28px,#4a7c3f 32px,#1a5276 32px,#1a5276 36px,#e8b84b 36px,#e8b84b 40px)"}}/>
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:4,zIndex:10,
        background:"repeating-linear-gradient(90deg,#8b1a1a 0px,#8b1a1a 20px,#c0392b 20px,#c0392b 24px,#e8b84b 24px,#e8b84b 28px,#4a7c3f 28px,#4a7c3f 32px,#1a5276 32px,#1a5276 36px,#e8b84b 36px,#e8b84b 40px)"}}/>
      <div style={{position:"fixed",inset:0,zIndex:1,pointerEvents:"none",opacity:.03,
        backgroundImage:"linear-gradient(rgba(232,213,176,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(232,213,176,.8) 1px,transparent 1px)",
        backgroundSize:"30px 30px"}}/>
      <div style={{position:"fixed",top:"10%",left:"50%",transform:"translateX(-50%)",width:"70%",height:"40%",
        background:"radial-gradient(ellipse,rgba(192,152,75,.05) 0%,transparent 70%)",pointerEvents:"none",zIndex:1}}/>
      <div style={{position:"fixed",left:0,top:6,bottom:4,width:3,zIndex:5,
        background:"linear-gradient(180deg,#8b1a1a,#c0392b,#e8b84b,#4a7c3f,#1a5276,#e8b84b,#8b1a1a)"}}/>
      <div style={{position:"fixed",right:0,top:6,bottom:4,width:3,zIndex:5,
        background:"linear-gradient(180deg,#8b1a1a,#c0392b,#e8b84b,#4a7c3f,#1a5276,#e8b84b,#8b1a1a)"}}/>
      <div style={{position:"fixed",left:0,right:0,height:"1px",zIndex:2,pointerEvents:"none",
        top:`${scanY}%`,background:"linear-gradient(90deg,transparent,rgba(232,213,176,.05),transparent)"}}/>
      <div style={{position:"relative",zIndex:3,maxWidth:700,margin:"0 auto",padding:"28px 22px 70px"}}>
        {children}
      </div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes inkDrop{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
        @keyframes brushGlow{0%,100%{opacity:.7}50%{opacity:1}}
        @keyframes unfurl{from{opacity:0;transform:scaleY(.96)}to{opacity:1;transform:none}}
        @keyframes shimmer{0%,100%{opacity:.6}50%{opacity:1}}
        *{box-sizing:border-box}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        ::placeholder{color:rgba(232,213,176,.3)}
        ::-webkit-scrollbar{width:4px;background:#0e0a06}
        ::-webkit-scrollbar-thumb{background:rgba(192,152,75,.3)}
      `}</style>
    </div>
  );
}

function PalaceHeader({title,sub,onBack,rightEl}){
  return(
    <div style={{textAlign:"center",marginBottom:28,animation:"inkDrop .5s ease both"}}>
      {onBack&&(
        <button onClick={onBack} style={{position:"absolute",left:22,top:34,background:"transparent",
          border:"none",color:"rgba(139,105,20,.6)",fontSize:12,letterSpacing:2,cursor:"pointer",
          fontFamily:"inherit"}}
          onMouseEnter={e=>e.target.style.color="#8b6914"}
          onMouseLeave={e=>e.target.style.color="rgba(139,105,20,.6)"}>
          ← 돌아가기
        </button>
      )}
      {rightEl&&<div style={{position:"absolute",right:22,top:34}}>{rightEl}</div>}
      <div style={{display:"inline-block",border:"2px solid #8b1a1a",
        padding:"3px 14px",marginBottom:10,background:"rgba(139,26,26,.12)"}}>
        <span style={{fontSize:10,letterSpacing:5,color:"#c0392b"}}>朝鮮 王室 命理院</span>
      </div>
      <h1 style={{fontSize:"clamp(24px,5vw,40px)",fontWeight:700,margin:0,
        color:"#e8d5b0",letterSpacing:4,textShadow:"0 0 30px rgba(192,152,75,.25)"}}>{title}</h1>
      <div style={{fontSize:"clamp(12px,2.5vw,15px)",color:"#c0a060",letterSpacing:5,marginTop:5}}>{sub}</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,margin:"14px 0"}}>
        <div style={{flex:1,height:1,background:"linear-gradient(90deg,transparent,#8b6914)",maxWidth:100}}/>
        <span style={{color:"#c0392b",fontSize:16}}>◆</span>
        <div style={{width:32,height:1,background:"#8b6914"}}/>
        <span style={{color:"#e8b84b",fontSize:9}}>◇</span>
        <div style={{width:32,height:1,background:"#8b6914"}}/>
        <span style={{color:"#c0392b",fontSize:16}}>◆</span>
        <div style={{flex:1,height:1,background:"linear-gradient(90deg,#8b6914,transparent)",maxWidth:100}}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 구독 상태 배지
// ═══════════════════════════════════════════════════════
function PlanBadge({plan,onClick}){
  const p=PLANS[plan];
  if(!p)return null;
  return(
    <button onClick={onClick} style={{background:`${p.color}18`,
      border:`1px solid ${p.color}55`,padding:"4px 10px",cursor:"pointer",
      fontFamily:"inherit",transition:"all .2s"}}>
      <span style={{fontSize:9,color:p.color,letterSpacing:2}}>
        {plan==="free"?"무료":"👑 "}{p.name}
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════
// 메인 앱
// ═══════════════════════════════════════════════════════
export default function PalaceApp(){
  // 구독 상태 (localStorage 기반 데모)
  const [userPlan,setUserPlan]=useState(()=>{
    try{return localStorage.getItem("joseon_plan")||"free";}catch{return"free";}
  });
  const [subExpiry,setSubExpiry]=useState(()=>{
    try{return localStorage.getItem("joseon_expiry")||null;}catch{return null;}
  });

  const [screen,setScreen]=useState("home"); // home|pricing|subscribe|service|loading|result|mypage
  const [activeService,setActiveService]=useState(null);
  const [form,setForm]=useState({year:"",month:"",day:"",hour:"",gender:"남"});
  const [result,setResult]=useState(null);
  const [activeTab,setActiveTab]=useState("basic");
  const [cache,setCache]=useState({});
  const [tabLoading,setTabLoading]=useState(false);
  const [error,setError]=useState("");
  const [loadText,setLoadText]=useState("");
  const [scanY,setScanY]=useState(0);
  const [todayPillar,setTodayPillar]=useState(null);
  const [selectedPlan,setSelectedPlan]=useState("basic");
  const [payStep,setPayStep]=useState("select"); // select|confirm|done

  useEffect(()=>{const iv=setInterval(()=>setScanY(v=>(v+1.2)%100),40);return()=>clearInterval(iv);},[]);
  useEffect(()=>{
    const d=new Date();
    setTodayPillar(getDP(d.getFullYear(),d.getMonth()+1,d.getDate()));
  },[]);

  // 구독 활성화 (데모용 — 실제는 결제 API 연동)
  const activatePlan=(planId)=>{
    const expiry=getNextMonth();
    setUserPlan(planId);
    setSubExpiry(expiry);
    try{localStorage.setItem("joseon_plan",planId);localStorage.setItem("joseon_expiry",expiry);}catch{}
    setPayStep("done");
  };

  const isPremium=userPlan==="basic"||userPlan==="premium";
  const isTopPremium=userPlan==="premium";

  const runLoad=async()=>{
    const msgs=["▷ 관상감 문서 열람 중...","▷ 천간지지 대조 중...","▷ 오행 배합 분석 중...","▷ 왕실 비문 해독 중...","▷ 대제학 풀이 작성 중..."];
    for(let i=0;i<msgs.length;i++){setLoadText(msgs[i]);await new Promise(r=>setTimeout(r,500));}
  };

  // ── 사주 분석 ──
  const handleSaju=async()=>{
    if(!form.year||!form.month||!form.day){setError("생년월일을 입력하십시오.");return;}
    setError("");setScreen("loading");runLoad();
    try{
      const p=calcSaju(form.year,form.month,form.day,form.hour||null);
      const prompt=`생년월일시: ${form.year}년 ${form.month}월 ${form.day}일 ${form.hour?form.hour+"시":"시각 미상"}, 성별: ${form.gender}
계산된 4주: 년주${p.year.gan}${p.year.ji} 월주${p.month.gan}${p.month.ji} 일주${p.day.gan}${p.day.ji} 시주${p.hour.gan}${p.hour.ji}
조선 궁중 역학으로 풀이. 순수 JSON:
{"title":"왕실 명리 칭호","summary":"사주 한줄 풀이 20자","pillars":{"year":{"gan":"${p.year.gan}","ganh":"${p.year.ganh}","ji":"${p.year.ji}","jih":"${p.year.jih}","zod":"${p.year.zod}","desc":"년주 풀이 두 문장"},"month":{"gan":"${p.month.gan}","ganh":"${p.month.ganh}","ji":"${p.month.ji}","jih":"${p.month.jih}","desc":"월주 풀이 두 문장"},"day":{"gan":"${p.day.gan}","ganh":"${p.day.ganh}","ji":"${p.day.ji}","jih":"${p.day.jih}","desc":"일주 풀이 두 문장"},"hour":{"gan":"${p.hour.gan}","ganh":"${p.hour.ganh}","ji":"${p.hour.ji}","jih":"${p.hour.jih}","desc":"시주 풀이 두 문장"}},"elements":{"wood":20,"fire":20,"earth":20,"metal":20,"water":20},"dominant":"wood","format":"격국명","strong_god":"용신 천간","life_path":"타고난 운명 두 문장","caution":"주의 한 문장","lucky_direction":"길방","lucky_color":"길색"}`;
      const parsed=await callClaude(SYS,prompt);
      ["year","month","day","hour"].forEach(k=>{
        if(!parsed.pillars[k])parsed.pillars[k]={};
        parsed.pillars[k].gan=p[k].gan;parsed.pillars[k].ganh=p[k].ganh;
        parsed.pillars[k].ji=p[k].ji;parsed.pillars[k].jih=p[k].jih;
      });
      setResult({type:"saju",data:parsed,pillars:p});
      setActiveTab("basic");setCache({});setScreen("result");
    }catch(e){setError("오류: "+e.message);setScreen("service");}
  };

  // ── 탭 운세 ──
  const handleTab=async(tabId)=>{
    if(!isPremium&&tabId!=="basic"){setScreen("pricing");return;}
    setActiveTab(tabId);
    if(tabId==="basic"||cache[tabId]||!result?.pillars)return;
    setTabLoading(true);
    const p=result.pillars;
    const sj=`년주${p.year.gan}${p.year.ji} 월주${p.month.gan}${p.month.ji} 일주${p.day.gan}${p.day.ji} 시주${p.hour.gan}${p.hour.ji}`;
    const prompts={
      today:`사주:${sj} 오늘(${getToday()}) 일진 운세 조선 역학으로. JSON: {"score":75,"headline":"오늘 운세 한줄","morning":"오전 두 문장","afternoon":"오후 두 문장","lucky_direction":"길방","lucky_color":"길색","caution":"주의 한 문장","advice":"오늘의 가르침"}`,
      work: `사주:${sj} 직업/사업운 조선 역학으로. JSON: {"score":75,"headline":"직업운 한줄","aptitude":"타고난 재능 두 문장","career":"어울리는 직업군","peak":"전성기 시기","caution":"주의 한 문장","advice":"직업 가르침"}`,
      love: `사주:${sj} 성별:${form.gender} 혼인/연애운 조선 역학으로. JSON: {"score":75,"headline":"혼인운 한줄","character":"인연 특성 두 문장","ideal":"이상적 배우자 특성","timing":"인연 시기","caution":"주의 한 문장","advice":"혼인 가르침"}`,
      money:`사주:${sj} 재물/재복 조선 역학으로. JSON: {"score":75,"headline":"재물운 한줄","fortune":"재물 기질 두 문장","method":"재물 모으는 방법","timing":"재물 전성기","caution":"주의 한 문장","advice":"재물 가르침"}`,
      yearly:`사주:${sj} ${getYear()}년 대운 조선 역학으로. JSON: {"score":75,"headline":"${getYear()}년 운세 한줄","overview":"올해 전체 흐름 두 문장","opportunity":"올해의 기회 한 문장","caution":"올해 주의 한 문장","next_year":"내년 예고 한 문장","advice":"올해의 교훈"}`,
    };
    try{const d=await callClaude(SYS,prompts[tabId]);setCache(prev=>({...prev,[tabId]:d}));}
    catch(e){setError("오류: "+e.message);}
    setTabLoading(false);
  };

  const goHome=()=>{setScreen("home");setResult(null);setActiveTab("basic");setCache({});setError("");};
  const inp={width:"100%",background:"rgba(10,8,4,.8)",border:"1px solid rgba(192,152,75,.3)",
    color:"#e8d5b0",padding:"11px 14px",fontSize:15,outline:"none",
    fontFamily:"'Noto Serif KR',Georgia,serif",boxSizing:"border-box",letterSpacing:1};

  // ══════════════════ 홈 ══════════════════
  if(screen==="home")return(
    <PalaceBG scanY={scanY}>
      <PalaceHeader title="조선 명리원" sub="朝鮮 命理院"
        rightEl={<PlanBadge plan={userPlan} onClick={()=>setScreen("mypage")}/>}/>

      {/* 오늘 일진 */}
      {todayPillar&&(
        <div style={{background:"rgba(139,26,26,.1)",border:"1px solid rgba(192,57,43,.25)",
          padding:"12px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:14,
          animation:"inkDrop .4s ease"}}>
          <div style={{textAlign:"center",minWidth:56}}>
            <div style={{fontSize:9,color:"#8b6914",letterSpacing:2,marginBottom:3}}>오늘 일진</div>
            <div style={{fontSize:24,color:"#e8b84b",fontWeight:700,letterSpacing:3}}>
              {todayPillar.gan}{todayPillar.ji}
            </div>
            <div style={{fontSize:10,color:"#c0a060"}}>{todayPillar.ganh}{todayPillar.jih}일</div>
          </div>
          <div style={{width:1,height:44,background:"rgba(192,152,75,.18)"}}/>
          <div style={{fontSize:12,color:"#8b7a5a",lineHeight:1.8}}>{getToday()}</div>
        </div>
      )}

      {/* 구독 유도 배너 (비구독자에게만) */}
      {!isPremium&&(
        <button onClick={()=>{setScreen("pricing");setPayStep("select");}} style={{
          width:"100%",marginBottom:18,
          background:"linear-gradient(135deg,rgba(192,57,43,.2),rgba(232,184,75,.15))",
          border:"1px solid rgba(232,184,75,.4)",padding:"14px 18px",cursor:"pointer",
          fontFamily:"inherit",textAlign:"left",display:"flex",justifyContent:"space-between",
          alignItems:"center",animation:"shimmer 3s ease-in-out infinite",transition:"all .2s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor="#e8b84b"}
          onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(232,184,75,.4)"}>
          <div>
            <div style={{fontSize:10,color:"#e8b84b",letterSpacing:3,marginBottom:4}}>👑 왕실 구독 혜택</div>
            <div style={{fontSize:13,color:"#e8d5b0"}}>월 9,900원으로 모든 서비스 무제한 이용</div>
          </div>
          <div style={{fontSize:14,color:"#e8b84b"}}>▷</div>
        </button>
      )}

      {/* 서비스 목록 */}
      <div style={{fontSize:10,color:"#8b6914",letterSpacing:5,marginBottom:14,textAlign:"center"}}>
        ◆ 관청 서비스 ◆
      </div>
      {[
        {id:"saju",    name:"사주팔자",   sub:"四柱八字",icon:"☰",color:"#c0392b",free:true, desc:"생년월일시로 보는 운명의 네 기둥"},
        {id:"tojeong", name:"토정비결",   sub:"土亭秘訣",icon:"卦",color:"#8b6914",free:true, desc:"이지함 선생의 64괘 연간 운세"},
        {id:"gung",    name:"궁합",       sub:"宮合",    icon:"♥",color:"#6c3483",free:false,desc:"두 사람의 사주로 보는 인연의 깊이"},
        {id:"yearly",  name:"신년 대운",  sub:"大運",    icon:"運",color:"#1e8449",free:false,desc:"올해와 내년의 큰 운세 흐름"},
        {id:"name",    name:"작명·이름풀이",sub:"命名",  icon:"名",color:"#784212",free:false,desc:"이름의 획수와 오행으로 보는 운명"},
      ].map((svc,idx)=>{
        const locked=!svc.free&&!isPremium;
        const topLocked=!svc.free&&svc.id==="name"&&!isTopPremium;
        return(
          <button key={svc.id} onClick={()=>{
            if(locked||topLocked){setScreen("pricing");setPayStep("select");}
            else{setActiveService(svc);setScreen("service");setError("");}
          }} style={{
            width:"100%",display:"flex",alignItems:"center",gap:14,
            background:locked?"rgba(8,6,3,.5)":"rgba(10,8,4,.75)",
            border:`1px solid ${locked?"rgba(100,80,50,.15)":svc.color+"28"}`,
            padding:"14px 18px",cursor:"pointer",marginBottom:8,
            fontFamily:"'Noto Serif KR',Georgia,serif",color:"#e8d5b0",textAlign:"left",
            opacity:locked?.65:1,transition:"all .2s",
            animation:`inkDrop .4s ease ${idx*.07}s both`,
          }}
            onMouseEnter={e=>{if(!locked)e.currentTarget.style.borderColor=svc.color+"55";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=locked?"rgba(100,80,50,.15)":svc.color+"28";}}>
            <div style={{width:42,height:42,border:`1px solid ${locked?"rgba(100,80,50,.2)":svc.color+"44"}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:18,color:locked?"#4a3a2a":svc.color,flexShrink:0}}>{svc.icon}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                <span style={{fontSize:15,letterSpacing:2,fontWeight:700,color:locked?"#6b5a3a":"#e8d5b0"}}>{svc.name}</span>
                <span style={{fontSize:10,color:"#6b5a3a"}}>{svc.sub}</span>
                {svc.free
                  ?<span style={{fontSize:9,border:"1px solid rgba(26,82,118,.4)",color:"#7fb3d3",padding:"1px 5px"}}>무료</span>
                  :locked
                    ?<span style={{fontSize:9,border:"1px solid rgba(192,184,75,.3)",color:"#c8b840",padding:"1px 5px"}}>구독 전용</span>
                    :<span style={{fontSize:9,border:"1px solid rgba(192,57,43,.4)",color:"#e8806a",padding:"1px 5px"}}>구독 중</span>
                }
              </div>
              <div style={{fontSize:11,color:locked?"#4a3a2a":"#8b7a5a"}}>{svc.desc}</div>
            </div>
            <div style={{color:locked?"#4a3a2a":"#8b6914",fontSize:14}}>{locked?"🔒":"▷"}</div>
          </button>
        );
      })}

      <div style={{textAlign:"center",marginTop:20,fontSize:10,color:"rgba(139,105,20,.35)",letterSpacing:3}}>
        朝鮮 命理院 · {getToday()}
      </div>
    </PalaceBG>
  );

  // ══════════════════ 구독 요금제 ══════════════════
  if(screen==="pricing")return(
    <PalaceBG scanY={scanY}>
      <PalaceHeader title="왕실 구독" sub="王室 口讀 · 요금제" onBack={goHome}/>

      {/* 현재 구독 상태 */}
      {isPremium&&(
        <div style={{background:"rgba(192,57,43,.1)",border:"1px solid rgba(192,57,43,.3)",
          padding:"12px 18px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,color:"#8b6914",letterSpacing:2,marginBottom:3}}>현재 구독</div>
            <div style={{fontSize:14,color:"#e8b84b"}}>{PLANS[userPlan].name}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"#8b6914",letterSpacing:1,marginBottom:2}}>다음 결제일</div>
            <div style={{fontSize:11,color:"#c0a060"}}>{subExpiry}</div>
          </div>
        </div>
      )}

      {/* 요금제 카드 */}
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
        {Object.values(PLANS).map(plan=>{
          const isCurrent=userPlan===plan.id;
          return(
            <div key={plan.id} style={{
              background:isCurrent?"rgba(192,57,43,.1)":plan.id==="premium"?"rgba(232,184,75,.07)":"rgba(8,6,3,.8)",
              border:`2px solid ${isCurrent?plan.color:plan.id==="free"?"rgba(100,80,50,.2)":plan.color+"33"}`,
              padding:"20px 22px",position:"relative",animation:"unfurl .4s ease",
              transition:"border-color .2s",
            }}>
              {/* 배지 */}
              {plan.badge&&!isCurrent&&(
                <div style={{position:"absolute",top:-1,right:20,
                  background:plan.color,padding:"2px 10px",
                  fontSize:9,letterSpacing:2,color:"#0e0a06",fontWeight:700}}>
                  {plan.badge}
                </div>
              )}
              {isCurrent&&(
                <div style={{position:"absolute",top:-1,right:20,
                  background:"#c0392b",padding:"2px 10px",fontSize:9,letterSpacing:2,color:"#fff"}}>
                  현재 이용 중
                </div>
              )}

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <div style={{fontSize:16,color:"#e8d5b0",letterSpacing:3,fontWeight:700,marginBottom:3}}>{plan.name}</div>
                  <div style={{fontSize:11,color:"#8b6914",letterSpacing:2}}>{plan.nameH}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:plan.price===0?16:20,color:plan.color,fontWeight:700,letterSpacing:1}}>
                    {plan.priceLabel}
                  </div>
                  {plan.price>0&&<div style={{fontSize:10,color:"rgba(139,105,20,.5)"}}>/ 월</div>}
                </div>
              </div>

              {/* 포함 기능 */}
              <div style={{marginBottom:plan.locked.length>0?12:0}}>
                {plan.features.map((f,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
                    <span style={{color:"#4a7c3f",fontSize:11,marginTop:1}}>✓</span>
                    <span style={{fontSize:12,color:"#c0a878"}}>{f}</span>
                  </div>
                ))}
              </div>

              {/* 미포함 */}
              {plan.locked.length>0&&(
                <div style={{borderTop:"1px solid rgba(100,80,50,.15)",paddingTop:10}}>
                  {plan.locked.map((f,i)=>(
                    <div key={i} style={{display:"flex",gap:8,marginBottom:5,alignItems:"flex-start"}}>
                      <span style={{color:"rgba(100,80,50,.4)",fontSize:11,marginTop:1}}>✗</span>
                      <span style={{fontSize:12,color:"rgba(100,80,50,.5)"}}>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 구독 버튼 */}
              {!isCurrent&&plan.price>0&&(
                <button onClick={()=>{setSelectedPlan(plan.id);setPayStep("confirm");setScreen("subscribe");}}
                  style={{width:"100%",marginTop:16,padding:"12px 0",
                    background:`${plan.color}22`,border:`1px solid ${plan.color}66`,
                    color:"#e8d5b0",fontSize:13,letterSpacing:4,cursor:"pointer",
                    fontFamily:"inherit",transition:"all .25s"}}
                  onMouseEnter={e=>{e.target.style.background=`${plan.color}33`;}}
                  onMouseLeave={e=>{e.target.style.background=`${plan.color}22`;}}>
                  ▷ {plan.name} 시작하기
                </button>
              )}
              {!isCurrent&&plan.price===0&&(
                <div style={{marginTop:14,fontSize:11,color:"rgba(139,105,20,.4)",textAlign:"center"}}>
                  현재 이용 중이십니다
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 해지 (구독자에게만) */}
      {isPremium&&(
        <button onClick={()=>{setUserPlan("free");setSubExpiry(null);
          try{localStorage.removeItem("joseon_plan");localStorage.removeItem("joseon_expiry");}catch{}
          setScreen("home");}} style={{
          width:"100%",padding:"10px 0",background:"transparent",
          border:"1px solid rgba(100,80,50,.2)",color:"rgba(100,80,50,.5)",
          fontSize:11,letterSpacing:3,cursor:"pointer",fontFamily:"inherit"}}>
          구독 해지
        </button>
      )}
    </PalaceBG>
  );

  // ══════════════════ 결제 ══════════════════
  if(screen==="subscribe"){
    const plan=PLANS[selectedPlan];
    return(
      <PalaceBG scanY={scanY}>
        <PalaceHeader title="구독 신청" sub="口讀 申請" onBack={()=>setScreen("pricing")}/>

        {payStep==="confirm"&&(
          <div style={{animation:"unfurl .4s ease"}}>
            <div style={{background:"rgba(8,6,3,.85)",border:"1px solid rgba(192,152,75,.2)",
              padding:"24px 22px",marginBottom:14}}>
              <div style={{fontSize:10,color:"#8b6914",letterSpacing:4,marginBottom:16}}>▷ 신청 내역 확인</div>
              {[["구독 상품",plan.name+" "+plan.nameH],
                ["월 구독료",plan.priceLabel],
                ["첫 결제일",getToday()],
                ["다음 결제일",getNextMonth()],
                ["자동 갱신","매월 자동 결제"],
              ].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",
                  padding:"10px 0",borderBottom:"1px solid rgba(192,152,75,.08)"}}>
                  <span style={{fontSize:12,color:"#8b7a5a"}}>{k}</span>
                  <span style={{fontSize:13,color:"#e8d5b0"}}>{v}</span>
                </div>
              ))}
            </div>

            {/* 결제 수단 선택 */}
            <div style={{background:"rgba(8,6,3,.85)",border:"1px solid rgba(192,152,75,.15)",
              padding:"20px 22px",marginBottom:14}}>
              <div style={{fontSize:10,color:"#8b6914",letterSpacing:4,marginBottom:14}}>▷ 결제 수단</div>
              {[["💳 신용카드·체크카드","card"],["📱 카카오페이","kakao"],["🔵 네이버페이","naver"]].map(([lbl,id])=>(
                <label key={id} style={{display:"flex",alignItems:"center",gap:10,
                  padding:"12px 14px",marginBottom:8,cursor:"pointer",
                  border:"1px solid rgba(192,152,75,.15)",background:"rgba(10,8,4,.6)"}}>
                  <input type="radio" name="pay" defaultChecked={id==="card"}
                    style={{accentColor:"#c0392b"}}/>
                  <span style={{fontSize:13,color:"#c0a878"}}>{lbl}</span>
                </label>
              ))}
            </div>

            <div style={{fontSize:11,color:"rgba(139,105,20,.4)",lineHeight:1.8,marginBottom:16,padding:"0 4px"}}>
              ※ 구독은 매월 자동 갱신됩니다. 언제든지 해지 가능합니다.<br/>
              ※ 실제 서비스에서는 토스페이먼츠 결제가 연동됩니다.
            </div>

            <button onClick={()=>activatePlan(selectedPlan)} style={{
              width:"100%",padding:"15px 0",
              background:"linear-gradient(135deg,rgba(192,57,43,.3),rgba(232,184,75,.2))",
              border:"1px solid rgba(232,184,75,.5)",color:"#e8d5b0",
              fontSize:14,letterSpacing:5,cursor:"pointer",fontFamily:"inherit",
              transition:"all .3s"}}
              onMouseEnter={e=>{e.target.style.boxShadow="0 0 20px rgba(232,184,75,.2)";}}
              onMouseLeave={e=>{e.target.style.boxShadow="none";}}>
              ▷ {plan.priceLabel} 결제하기
            </button>
          </div>
        )}

        {payStep==="done"&&(
          <div style={{textAlign:"center",padding:"40px 20px",animation:"inkDrop .5s ease"}}>
            <div style={{fontSize:40,marginBottom:16}}>☯</div>
            <div style={{fontSize:20,color:"#e8b84b",letterSpacing:4,marginBottom:10,fontWeight:700}}>
              구독 완료
            </div>
            <div style={{fontSize:13,color:"#c0a878",lineHeight:1.9,marginBottom:24}}>
              {plan.name} 구독이 시작되었습니다.<br/>
              다음 결제일: {subExpiry}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10,maxWidth:300,margin:"0 auto"}}>
              <button onClick={()=>{setScreen("home");}} style={{
                padding:"13px 0",background:"rgba(192,57,43,.2)",
                border:"1px solid rgba(192,57,43,.4)",color:"#e8d5b0",
                fontSize:13,letterSpacing:4,cursor:"pointer",fontFamily:"inherit"}}>
                ▷ 관청으로 돌아가기
              </button>
            </div>
          </div>
        )}
      </PalaceBG>
    );
  }

  // ══════════════════ 마이페이지 ══════════════════
  if(screen==="mypage")return(
    <PalaceBG scanY={scanY}>
      <PalaceHeader title="나의 서첩" sub="私 書牒" onBack={goHome}/>
      <div style={{animation:"unfurl .4s ease"}}>
        {/* 구독 현황 */}
        <div style={{background:"rgba(8,6,3,.85)",border:`1px solid ${PLANS[userPlan].color}33`,
          padding:"22px 24px",marginBottom:14}}>
          <div style={{fontSize:10,color:"#8b6914",letterSpacing:4,marginBottom:14}}>▷ 구독 현황</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <div style={{fontSize:18,color:PLANS[userPlan].color,fontWeight:700,letterSpacing:3,marginBottom:4}}>
                {PLANS[userPlan].name}
              </div>
              <div style={{fontSize:11,color:"#8b7a5a"}}>{PLANS[userPlan].nameH}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:13,color:"#e8d5b0"}}>{PLANS[userPlan].priceLabel}</div>
              {subExpiry&&<div style={{fontSize:11,color:"#8b7a5a",marginTop:3}}>다음 결제: {subExpiry}</div>}
            </div>
          </div>
          {/* 이용 가능 서비스 */}
          <div style={{borderTop:"1px solid rgba(192,152,75,.1)",paddingTop:12}}>
            <div style={{fontSize:9,color:"#8b6914",letterSpacing:3,marginBottom:8}}>이용 가능 서비스</div>
            {PLANS[userPlan].features.map((f,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:5}}>
                <span style={{color:"#4a7c3f",fontSize:10}}>✓</span>
                <span style={{fontSize:11,color:"#c0a878"}}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 업그레이드 / 구독 버튼 */}
        {userPlan==="free"&&(
          <button onClick={()=>{setScreen("pricing");setPayStep("select");}} style={{
            width:"100%",padding:"14px",marginBottom:10,
            background:"linear-gradient(135deg,rgba(192,57,43,.2),rgba(232,184,75,.15))",
            border:"1px solid rgba(232,184,75,.4)",color:"#e8d5b0",
            fontSize:13,letterSpacing:4,cursor:"pointer",fontFamily:"inherit"}}>
            👑 관원 구독 시작하기
          </button>
        )}
        {userPlan==="basic"&&(
          <button onClick={()=>{setScreen("pricing");setPayStep("select");}} style={{
            width:"100%",padding:"14px",marginBottom:10,
            background:"rgba(232,184,75,.1)",border:"1px solid rgba(232,184,75,.3)",
            color:"#e8d5b0",fontSize:13,letterSpacing:4,cursor:"pointer",fontFamily:"inherit"}}>
            ▷ 대감 구독으로 업그레이드
          </button>
        )}
        {isPremium&&(
          <button onClick={()=>{setUserPlan("free");setSubExpiry(null);
            try{localStorage.removeItem("joseon_plan");localStorage.removeItem("joseon_expiry");}catch{}
            setScreen("home");}} style={{
            width:"100%",padding:"10px",background:"transparent",
            border:"1px solid rgba(100,80,50,.2)",color:"rgba(100,80,50,.4)",
            fontSize:11,letterSpacing:3,cursor:"pointer",fontFamily:"inherit"}}>
            구독 해지
          </button>
        )}
      </div>
    </PalaceBG>
  );

  // ══════════════════ 서비스 입력 ══════════════════
  if(screen==="service"&&activeService)return(
    <PalaceBG scanY={scanY}>
      <PalaceHeader title={activeService.name} sub={activeService.sub} onBack={goHome}/>
      <div style={{background:"rgba(10,8,4,.85)",border:"1px solid rgba(192,152,75,.2)",
        padding:"26px 24px",animation:"unfurl .4s ease"}}>
        <div style={{fontSize:11,color:"#8b6914",letterSpacing:4,marginBottom:20}}>▷ 생년월일 입력</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          {[["태어난 해","year","예) 1980"],["태어난 달","month","1~12"],
            ["태어난 날","day","1~31"],["태어난 시각","hour","0~23 (선택)"]].map(([lbl,key,ph])=>(
            <div key={key}>
              <div style={{fontSize:10,color:"#8b6914",letterSpacing:2,marginBottom:5}}>{lbl}</div>
              <input type="number" placeholder={ph} value={form[key]}
                onChange={e=>setForm({...form,[key]:e.target.value})} style={inp}
                onFocus={e=>{e.target.style.borderColor="#e8b84b";e.target.style.boxShadow="0 0 8px rgba(232,184,75,.12)";}}
                onBlur={e=>{e.target.style.borderColor="rgba(192,152,75,.3)";e.target.style.boxShadow="none";}}/>
            </div>
          ))}
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:10,color:"#8b6914",letterSpacing:2,marginBottom:7}}>성별</div>
          <div style={{display:"flex",gap:10}}>
            {["남","여"].map(g=>(
              <button key={g} onClick={()=>setForm({...form,gender:g})} style={{
                flex:1,padding:"11px 0",fontFamily:"inherit",fontSize:15,letterSpacing:5,cursor:"pointer",
                background:form.gender===g?"rgba(139,26,26,.25)":"rgba(10,8,4,.6)",
                border:form.gender===g?"1px solid #c0392b":"1px solid rgba(192,152,75,.2)",
                color:form.gender===g?"#e8d5b0":"#6b5a3a",transition:"all .2s"}}>{g}</button>
            ))}
          </div>
        </div>
        {error&&<div style={{background:"rgba(80,10,10,.6)",border:"1px solid rgba(192,57,43,.3)",
          padding:"10px 14px",marginBottom:12,fontSize:12,color:"#e8a090"}}>▷ {error}</div>}
        <button onClick={handleSaju} style={{
          width:"100%",padding:"13px 0",background:"rgba(139,26,26,.2)",
          border:"1px solid rgba(192,57,43,.45)",color:"#e8d5b0",
          fontSize:13,letterSpacing:5,cursor:"pointer",fontFamily:"inherit",transition:"all .3s"}}
          onMouseEnter={e=>{e.target.style.background="rgba(139,26,26,.38)";e.target.style.boxShadow="0 0 16px rgba(192,57,43,.18)";}}
          onMouseLeave={e=>{e.target.style.background="rgba(139,26,26,.2)";e.target.style.boxShadow="none";}}>
          ▷ {activeService.name} 열람하기
        </button>
      </div>
    </PalaceBG>
  );

  // ══════════════════ 로딩 ══════════════════
  if(screen==="loading")return(
    <PalaceBG scanY={scanY}>
      <PalaceHeader title="관상감 열람 중" sub="觀象監 閱覽"/>
      <div style={{textAlign:"center",padding:"50px 20px"}}>
        <div style={{position:"relative",width:120,height:120,margin:"0 auto 28px"}}>
          <div style={{position:"absolute",inset:0,borderRadius:"50%",
            border:"1px solid rgba(192,152,75,.15)",borderTop:"1px solid #e8b84b",
            animation:"spin 2s linear infinite"}}/>
          <div style={{position:"absolute",inset:16,borderRadius:"50%",
            border:"1px solid rgba(192,57,43,.12)",borderRight:"1px solid #c0392b",
            animation:"spin 1.5s linear infinite reverse"}}/>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:28,color:"#e8b84b",animation:"brushGlow 2s infinite"}}>☯</div>
        </div>
        <div style={{fontSize:14,color:"#c0a060",letterSpacing:3,minHeight:24,fontStyle:"italic"}}>{loadText}</div>
        <div style={{marginTop:10,fontSize:11,color:"rgba(139,105,20,.4)",letterSpacing:2}}>대제학이 명리를 살피고 있습니다</div>
      </div>
    </PalaceBG>
  );

  // ══════════════════ 결과 ══════════════════
  if(screen==="result"&&result){
    const d=result.data;
    const SAJU_TABS=[
      {id:"basic",  label:"사주 기본",color:"#c0392b"},
      {id:"today",  label:"오늘 운세",color:"#1a5276",lock:!isPremium},
      {id:"work",   label:"직업운",   color:"#1e8449",lock:!isPremium},
      {id:"love",   label:"혼인운",   color:"#6c3483",lock:!isPremium},
      {id:"money",  label:"재물운",   color:"#8b6914",lock:!isPremium},
      {id:"yearly", label:`${getYear()}년 대운`,color:"#4a7c3f",lock:!isPremium},
    ];
    return(
      <PalaceBG scanY={scanY}>
        <PalaceHeader title="사주팔자 풀이" sub="四柱八字 解說" onBack={goHome}
          rightEl={<PlanBadge plan={userPlan} onClick={()=>setScreen("mypage")}/>}/>

        <div style={{background:"rgba(139,26,26,.1)",border:"1px solid rgba(192,57,43,.22)",
          padding:"14px 18px",marginBottom:14,animation:"inkDrop .4s ease"}}>
          <div style={{fontSize:9,color:"#8b4513",letterSpacing:4,marginBottom:5}}>관상감 명리 칭호</div>
          <div style={{fontSize:"clamp(13px,3vw,17px)",color:"#e8b84b",letterSpacing:3,fontWeight:700}}>{d.title}</div>
          <div style={{marginTop:5,fontSize:13,color:"#b8a080",lineHeight:1.8}}>{d.summary}</div>
        </div>

        {/* 탭 */}
        <div style={{display:"flex",overflowX:"auto",borderBottom:"1px solid rgba(192,152,75,.12)",
          marginBottom:12,scrollbarWidth:"none"}}>
          {SAJU_TABS.map(t=>{const a=activeTab===t.id;return(
            <button key={t.id} onClick={()=>handleTab(t.id)} style={{
              flex:"0 0 auto",padding:"9px 13px",background:a?`${t.color}14`:"transparent",
              border:"none",borderBottom:a?`2px solid ${t.color}`:"2px solid transparent",
              color:a?t.color:"rgba(139,105,20,.45)",cursor:"pointer",
              fontFamily:"inherit",fontSize:"clamp(9px,2vw,11px)",letterSpacing:1,
              whiteSpace:"nowrap",transition:"all .2s"}}>
              {t.label}{t.lock?" 🔒":""}{cache[t.id]&&!t.lock&&<span style={{marginLeft:2,fontSize:7,color:"#e8b84b"}}>●</span>}
            </button>
          );})}
        </div>

        <div style={{background:"rgba(8,6,3,.88)",border:"1px solid rgba(192,152,75,.08)",
          padding:"18px 20px",animation:"unfurl .3s ease"}}>
          {activeTab==="basic"&&(<div>
            <div style={{fontSize:10,color:"#8b6914",letterSpacing:4,marginBottom:12}}>▷ 사주 기둥</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
              {["year","month","day","hour"].map((k,i)=>{
                const v=d.pillars[k];const lbl=["년주","월주","일주","시주"][i];
                return(<div key={k} style={{background:"rgba(10,8,4,.8)",
                  border:"1px solid rgba(192,152,75,.15)",padding:"10px 6px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#8b6914",marginBottom:5,letterSpacing:1}}>{lbl}</div>
                  <div style={{fontSize:22,color:"#e8b84b",letterSpacing:2,fontWeight:700}}>{v.gan}</div>
                  <div style={{fontSize:18,color:"#e8d5b0",letterSpacing:2,marginBottom:3}}>{v.ji}</div>
                  <div style={{fontSize:9,color:"#8b7a5a"}}>{v.ganh}{v.jih}</div>
                  {k==="year"&&<div style={{fontSize:8,color:"#c0a060",marginTop:2}}>({d.pillars.year.zod})</div>}
                </div>);
              })}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {[["格局",d.format,"#e8b84b"],["用神",d.strong_god,"#c0392b"]].map(([l,v,c])=>(
                <div key={l} style={{background:"rgba(10,8,4,.7)",border:`1px solid ${c}1a`,
                  padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#8b6914",letterSpacing:2,marginBottom:4}}>{l}</div>
                  <div style={{fontSize:15,color:c,letterSpacing:2}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{background:"rgba(8,6,3,.7)",border:"1px solid rgba(192,152,75,.08)",
              padding:"14px 16px",marginBottom:12}}>
              <div style={{fontSize:10,color:"#8b6914",letterSpacing:4,marginBottom:10}}>▷ 오행 배합</div>
              {Object.entries(d.elements||{}).map(([el,val])=>(
                <div key={el} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:11,color:EC[el]}}>{EK[el]} {EKR[el]}</span>
                    <span style={{fontSize:10,color:"rgba(139,105,20,.5)"}}>{val}%</span>
                  </div>
                  <div style={{height:3,background:"rgba(255,255,255,.04)"}}>
                    <div style={{height:"100%",width:`${val}%`,background:`linear-gradient(90deg,${EC[el]}55,${EC[el]})`,boxShadow:`0 0 5px ${EC[el]}33`}}/>
                  </div>
                </div>
              ))}
            </div>
            {[["▷ 타고난 운명",d.life_path,"#c0a878"],["▷ 주의 사항",d.caution,"#c0392b"]].map(([l,v,c])=>(
              <div key={l} style={{marginBottom:10,paddingBottom:10,borderBottom:"1px solid rgba(192,152,75,.06)"}}>
                <div style={{fontSize:9,color:"#8b6914",letterSpacing:3,marginBottom:5}}>{l}</div>
                <div style={{fontSize:13,color:c,lineHeight:1.85}}>{v}</div>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["길한 방위",d.lucky_direction,"#1a5276"],["길한 색상",d.lucky_color,"#1e8449"]].map(([l,v,c])=>(
                <div key={l} style={{background:"rgba(8,6,3,.7)",border:`1px solid ${c}18`,padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#8b6914",letterSpacing:2,marginBottom:4}}>{l}</div>
                  <div style={{fontSize:13,color:c}}>{v}</div>
                </div>
              ))}
            </div>

            {/* 비구독자 잠금 유도 */}
            {!isPremium&&(
              <button onClick={()=>setScreen("pricing")} style={{
                width:"100%",marginTop:16,padding:"14px",
                background:"linear-gradient(135deg,rgba(192,57,43,.15),rgba(232,184,75,.1))",
                border:"1px solid rgba(232,184,75,.35)",color:"#e8d5b0",
                fontSize:12,letterSpacing:3,cursor:"pointer",fontFamily:"inherit"}}>
                👑 구독하면 직업·혼인·재물·대운 상세 운세까지 ▷
              </button>
            )}
          </div>)}

          {activeTab!=="basic"&&cache[activeTab]&&(()=>{
            const td=cache[activeTab];
            const tc=SAJU_TABS.find(t=>t.id===activeTab);
            return(<div>
              <div style={{fontSize:10,color:tc?.color,letterSpacing:3,marginBottom:12}}>▷ {tc?.label}</div>
              <div style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:10,color:"#8b6914",letterSpacing:2}}>운세 지수</span>
                  <span style={{fontSize:18,color:tc?.color,fontWeight:700}}>{td.score}</span>
                </div>
                <div style={{height:3,background:"rgba(255,255,255,.04)"}}>
                  <div style={{height:"100%",width:`${td.score}%`,background:`linear-gradient(90deg,${tc?.color}55,${tc?.color})`}}/>
                </div>
              </div>
              <div style={{background:`${tc?.color}10`,border:`1px solid ${tc?.color}22`,
                padding:"11px 14px",marginBottom:12,borderLeft:`2px solid ${tc?.color}`}}>
                <div style={{fontSize:14,color:tc?.color,fontWeight:700,lineHeight:1.7}}>{td.headline}</div>
              </div>
              {Object.entries(td).filter(([k])=>!["score","headline"].includes(k)).map(([k,v])=>(
                <div key={k} style={{marginBottom:11,paddingBottom:11,borderBottom:"1px solid rgba(192,152,75,.06)"}}>
                  <div style={{fontSize:9,color:"#8b6914",letterSpacing:3,marginBottom:4}}>▷ {k.replace(/_/g," ").toUpperCase()}</div>
                  <div style={{fontSize:13,color:"#c0a878",lineHeight:1.85}}>{v}</div>
                </div>
              ))}
            </div>);
          })()}

          {tabLoading&&<div style={{textAlign:"center",padding:"30px"}}>
            <div style={{width:36,height:36,margin:"0 auto 10px",borderRadius:"50%",
              border:"1px solid rgba(232,184,75,.2)",borderTop:"1px solid #e8b84b",
              animation:"spin 1.5s linear infinite"}}/>
            <div style={{fontSize:11,color:"#c0a060",letterSpacing:2}}>관상감 열람 중...</div>
          </div>}
        </div>

        <button onClick={goHome} style={{width:"100%",marginTop:12,padding:"10px",background:"transparent",
          border:"1px solid rgba(192,152,75,.12)",color:"rgba(139,105,20,.45)",
          fontSize:11,letterSpacing:4,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}
          onMouseEnter={e=>{e.target.style.color="#8b6914";}}
          onMouseLeave={e=>{e.target.style.color="rgba(139,105,20,.45)";}}>
          ← 관청 목록으로
        </button>
        <div style={{textAlign:"center",marginTop:16,fontSize:10,color:"rgba(139,105,20,.28)",letterSpacing:3}}>
          朝鮮 命理院 · {getToday()}
        </div>
      </PalaceBG>
    );
  }
  return null;
}
