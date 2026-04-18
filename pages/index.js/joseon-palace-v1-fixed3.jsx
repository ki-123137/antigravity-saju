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
// 오행 & 색상
// ═══════════════════════════════════════════════════════
const EC={wood:"#4a7c3f",fire:"#c0392b",earth:"#8b6914",metal:"#7f8c8d",water:"#1a5276"};
const EK={wood:"木",fire:"火",earth:"土",metal:"金",water:"水"};
const EKR={wood:"목",fire:"화",earth:"토",metal:"금",water:"수"};
const EBG={wood:"rgba(74,124,63,.12)",fire:"rgba(192,57,43,.12)",earth:"rgba(139,105,20,.12)",metal:"rgba(127,140,141,.12)",water:"rgba(26,82,118,.12)"};

// ═══════════════════════════════════════════════════════
// Claude API
// ═══════════════════════════════════════════════════════
async function callClaude(system,user,tokens=4000){
  const res=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:tokens,system,
      messages:[{role:"user",content:user}]})
  });
  if(!res.ok){
    const errText=await res.text();
    throw new Error("통신 오류("+res.status+"): "+errText.slice(0,80));
  }
  const data=await res.json();
  if(!data.content?.length) throw new Error("응답이 비어있습니다.");
  const text=data.content.filter(b=>b.type==="text").map(b=>b.text).join("");
  if(!text) throw new Error("텍스트 응답 없음");
  const cl=text.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
  const s=cl.indexOf("{"),e=cl.lastIndexOf("}");
  if(s===-1||e===-1) throw new Error("JSON 형식 오류: "+cl.slice(0,60));
  try{ return JSON.parse(cl.slice(s,e+1)); }
  catch(pe){ throw new Error("JSON 파싱 실패: "+pe.message); }
}

const SYS=`당신은 조선 왕실 사주 관청의 관상감 대제학입니다. 사주를 조선시대 궁중 언어와 전통 역학으로 풀이합니다. 마크다운 코드블록 없이 순수 JSON만 출력. 큰따옴표는 JSON에만 사용. 현대어로 설명하되 격조 있는 문어체를 사용하세요.`;

// ═══════════════════════════════════════════════════════
// 서비스 목록 (멀티앱 플랫폼)
// ═══════════════════════════════════════════════════════
const SERVICES=[
  {id:"saju",    name:"사주팔자",    sub:"四柱八字", icon:"☰", color:"#c0392b", free:true,  desc:"생년월일시로 보는 운명의 네 기둥"},
  {id:"tojeong", name:"토정비결",    sub:"土亭秘訣", icon:"卦", color:"#8b6914", free:true,  desc:"이지함 선생의 64괘 연간 운세"},
  {id:"today",   name:"오늘의 일진", sub:"日辰",     icon:"日", color:"#1a5276", free:true,  desc:"오늘의 천간지지와 길흉 방위"},
  {id:"gung",    name:"궁합",        sub:"宮合",     icon:"♥", color:"#6c3483", free:false, desc:"두 사람의 사주로 보는 인연의 깊이"},
  {id:"yearly",  name:"신년 대운",   sub:"大運",     icon:"運", color:"#1e8449", free:false, desc:"올해와 내년의 큰 운세 흐름"},
  {id:"name",    name:"작명·이름풀이",sub:"命名",    icon:"名", color:"#784212", free:false, desc:"이름의 획수와 오행으로 보는 운명"},
];

function getToday(){const d=new Date();return`${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;}
function getYear(){return new Date().getFullYear();}

// ═══════════════════════════════════════════════════════
// 공통 래퍼 컴포넌트 (App 외부 — 키보드 포커스 유지)
// ═══════════════════════════════════════════════════════
function PalaceBG({children, scanY}){
  return(
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(180deg,#0e0a06 0%,#150f08 50%,#0a0806 100%)",
      color:"#e8d5b0",
      fontFamily:"'Noto Serif KR','Batang',Georgia,serif",
      position:"relative",overflow:"hidden",
    }}>
      {/* 단청 패턴 상단 */}
      <div style={{position:"fixed",top:0,left:0,right:0,height:6,zIndex:10,
        background:"repeating-linear-gradient(90deg,#8b1a1a 0px,#8b1a1a 20px,#c0392b 20px,#c0392b 24px,#e8b84b 24px,#e8b84b 28px,#4a7c3f 28px,#4a7c3f 32px,#1a5276 32px,#1a5276 36px,#e8b84b 36px,#e8b84b 40px)",
      }}/>
      {/* 하단 단청 */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:4,zIndex:10,
        background:"repeating-linear-gradient(90deg,#8b1a1a 0px,#8b1a1a 20px,#c0392b 20px,#c0392b 24px,#e8b84b 24px,#e8b84b 28px,#4a7c3f 28px,#4a7c3f 32px,#1a5276 32px,#1a5276 36px,#e8b84b 36px,#e8b84b 40px)",
      }}/>
      {/* 창살 패턴 오버레이 */}
      <div style={{position:"fixed",inset:0,zIndex:1,pointerEvents:"none",opacity:.03,
        backgroundImage:"linear-gradient(rgba(232,213,176,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(232,213,176,.8) 1px,transparent 1px)",
        backgroundSize:"30px 30px",
      }}/>
      {/* 배경 금빛 번짐 */}
      <div style={{position:"fixed",top:"10%",left:"50%",transform:"translateX(-50%)",
        width:"70%",height:"40%",
        background:"radial-gradient(ellipse,rgba(192,152,75,.06) 0%,transparent 70%)",
        pointerEvents:"none",zIndex:1}}/>
      {/* 스캔라인 */}
      <div style={{position:"fixed",left:0,right:0,height:"1px",zIndex:2,pointerEvents:"none",
        top:`${scanY}%`,background:"linear-gradient(90deg,transparent,rgba(232,213,176,.06),transparent)"}}/>
      {/* 좌우 세로선 */}
      <div style={{position:"fixed",left:0,top:6,bottom:4,width:3,zIndex:5,
        background:"linear-gradient(180deg,#8b1a1a,#c0392b,#e8b84b,#4a7c3f,#1a5276,#e8b84b,#8b1a1a)"}}/>
      <div style={{position:"fixed",right:0,top:6,bottom:4,width:3,zIndex:5,
        background:"linear-gradient(180deg,#8b1a1a,#c0392b,#e8b84b,#4a7c3f,#1a5276,#e8b84b,#8b1a1a)"}}/>

      <div style={{position:"relative",zIndex:3,maxWidth:700,margin:"0 auto",padding:"28px 22px 70px"}}>
        {children}
      </div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes inkDrop{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
        @keyframes brushGlow{0%,100%{opacity:.7}50%{opacity:1}}
        @keyframes unfurl{from{opacity:0;transform:scaleY(.95)}to{opacity:1;transform:none}}
        *{box-sizing:border-box}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        ::placeholder{color:rgba(232,213,176,.3)}
        ::-webkit-scrollbar{width:4px;background:#0e0a06}
        ::-webkit-scrollbar-thumb{background:rgba(192,152,75,.3)}
      `}</style>
    </div>
  );
}

// PalaceHeader — 홈 버튼 크게 + 엔터키 모양
function PalaceHeader({title, sub, onBack}){
  return(
    <div style={{textAlign:"center",marginBottom:32,animation:"inkDrop .6s ease both",position:"relative"}}>
      {onBack&&(
        <button onClick={onBack} style={{
          position:"absolute",right:0,top:0,
          background:"rgba(139,26,26,.3)",
          border:"2px solid rgba(192,57,43,.7)",
          color:"#e8d5b0",
          fontSize:22,
          lineHeight:1,
          cursor:"pointer",
          padding:"8px 12px",
          transition:"all .2s",
          boxShadow:"0 0 14px rgba(192,57,43,.25)",
          borderRadius:2,
          display:"flex",alignItems:"center",gap:6,
        }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(192,57,43,.5)";e.currentTarget.style.boxShadow="0 0 22px rgba(192,57,43,.5)";e.currentTarget.style.color="#e8b84b";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(139,26,26,.3)";e.currentTarget.style.boxShadow="0 0 14px rgba(192,57,43,.25)";e.currentTarget.style.color="#e8d5b0";}}>
          🏠
        </button>
      )}
      <div style={{display:"inline-block",border:"2px solid #8b1a1a",
        padding:"4px 16px",marginBottom:12,background:"rgba(139,26,26,.15)"}}>
        <span style={{fontSize:10,letterSpacing:6,color:"#c0392b"}}>朝鮮 王室 命理院</span>
      </div>
      <h1 style={{fontSize:"clamp(26px,5vw,42px)",fontWeight:700,margin:0,
        color:"#e8d5b0",letterSpacing:4,textShadow:"0 0 30px rgba(192,152,75,.3)"}}>
        {title}
      </h1>
      <div style={{fontSize:"clamp(13px,2.5vw,16px)",color:"#c0a060",letterSpacing:6,marginTop:6}}>
        {sub}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,margin:"16px 0"}}>
        <div style={{flex:1,height:1,background:"linear-gradient(90deg,transparent,#8b6914)",maxWidth:120}}/>
        <span style={{color:"#c0392b",fontSize:18}}>◆</span>
        <div style={{width:40,height:1,background:"#8b6914"}}/>
        <span style={{color:"#e8b84b",fontSize:10}}>◇</span>
        <div style={{width:40,height:1,background:"#8b6914"}}/>
        <span style={{color:"#c0392b",fontSize:18}}>◆</span>
        <div style={{flex:1,height:1,background:"linear-gradient(90deg,#8b6914,transparent)",maxWidth:120}}/>
      </div>
    </div>
  );
}

// ── 공유 기능 ──
function buildShareText(result, form){
  const d = result.data;
  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;
  let text = `╔══════════════════════╗\n 朝鮮 命理院 · 관상감 비밀문서\n╚══════════════════════╝\n`;
  text += `📅 ${dateStr}\n\n`;

  if(result.type==="saju"){
    text += `【 사주팔자 풀이 】\n`;
    text += `▷ ${d.title}\n`;
    text += `▷ ${d.summary}\n\n`;
    text += `◆ 사주 기둥\n`;
    text += `  년주: ${d.pillars?.year?.gan}${d.pillars?.year?.ji} (${d.pillars?.year?.ganh}${d.pillars?.year?.jih})\n`;
    text += `  월주: ${d.pillars?.month?.gan}${d.pillars?.month?.ji}\n`;
    text += `  일주: ${d.pillars?.day?.gan}${d.pillars?.day?.ji}\n`;
    text += `  시주: ${d.pillars?.hour?.gan}${d.pillars?.hour?.ji}\n\n`;
    text += `◆ 격국: ${d.format} · 용신: ${d.strong_god}\n\n`;
    text += `◆ 타고난 운명\n${d.life_path}\n\n`;
    text += `◆ 주의 사항\n${d.caution}\n\n`;
    text += `◆ 길방: ${d.lucky_direction} · 길색: ${d.lucky_color}\n`;
  } else if(result.type==="tojeong"){
    text += `【 토정비결 풀이 】\n`;
    text += `▷ ${d.title}\n`;
    text += `▷ 괘: ${d.gwe_number}\n\n`;
    text += `"${d.gwe_verse}"\n\n`;
    text += `◆ 연간 흐름\n${d.yearly_flow}\n\n`;
    text += `◆ 봄: ${d.spring}\n`;
    text += `◆ 여름: ${d.summer}\n`;
    text += `◆ 가을: ${d.autumn}\n`;
    text += `◆ 겨울: ${d.winter}\n\n`;
    text += `◆ 전성월: ${d.peak_month} · 주의월: ${d.caution_month}\n\n`;
    text += `◆ 올해의 교훈\n${d.life_advice}\n`;
  } else if(result.type==="gung"){
    text += `【 궁합 풀이 】\n`;
    text += `▷ ${d.title}\n`;
    text += `▷ 등급: ${d.grade} · 궁합 지수: ${d.score}\n`;
    text += `▷ ${d.summary}\n\n`;
    text += `◆ 오행 궁합\n${d.ohaeng_match}\n\n`;
    text += `◆ 성격 궁합\n${d.personality_match}\n\n`;
    text += `◆ 인연의 강점\n${d.strength}\n\n`;
    text += `◆ 두 분을 위한 조언\n${d.advice}\n`;
  } else if(result.type==="name"){
    text += `【 이름풀이 】\n`;
    text += `▷ 이름: ${result.nameVal}\n`;
    text += `▷ ${d.title}\n`;
    text += `▷ 총 획수: ${d.strokes} · 행운 숫자: ${d.lucky_number}\n\n`;
    text += `◆ 오행 구성\n${d.ohaeng}\n\n`;
    text += `◆ 이름이 가져오는 운명\n${d.destiny}\n\n`;
    text += `◆ 조언\n${d.advice}\n`;
  }

  text += `\n━━━━━━━━━━━━━━━━━━━\n朝鮮 命理院 · 조선 왕실 운명철학`;
  return text;
}

function ShareBar({result, form}){
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const text = buildShareText(result, form);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(()=>setCopied(false), 2500);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = text; document.body.appendChild(el);
      el.select(); document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(()=>setCopied(false), 2500);
    }
  };

  const handleShare = async () => {
    if(navigator.share){
      try {
        await navigator.share({ title:"조선 명리원 · 운세 결과", text });
        setShared(true);
        setTimeout(()=>setShared(false), 2000);
      } catch {}
    } else {
      handleCopy();
    }
  };

  const btn = (onClick, label, active, color="#e8b84b") => (
    <button onClick={onClick} style={{
      flex:1, padding:"13px 8px",
      background: active ? `${color}22` : "rgba(10,8,4,.7)",
      border: `2px solid ${active ? color : "rgba(192,152,75,.25)"}`,
      color: active ? color : "#c0a878",
      fontSize:13, letterSpacing:2, cursor:"pointer",
      fontFamily:"'Noto Serif KR',Georgia,serif",
      transition:"all .2s", fontWeight: active ? 700 : 400,
    }}
      onMouseEnter={e=>{e.currentTarget.style.background=`${color}18`;e.currentTarget.style.borderColor=color;e.currentTarget.style.color=color;}}
      onMouseLeave={e=>{if(!active){e.currentTarget.style.background="rgba(10,8,4,.7)";e.currentTarget.style.borderColor="rgba(192,152,75,.25)";e.currentTarget.style.color="#c0a878";}}}>
      {label}
    </button>
  );

  return(
    <div style={{marginTop:14,marginBottom:4}}>
      <div style={{fontSize:9,color:"#8b6914",letterSpacing:4,marginBottom:10,textAlign:"center"}}>
        ◆ 결과 공유하기 ◆
      </div>
      <div style={{display:"flex",gap:10}}>
        {btn(handleCopy,  copied  ? "✓ 복사됨" : "📋 텍스트 복사", copied,  "#e8b84b")}
        {btn(handleShare, shared  ? "✓ 공유됨" : "📤 공유하기",    shared,  "#c0392b")}
      </div>
      <div style={{fontSize:10,color:"rgba(139,105,20,.4)",marginTop:8,textAlign:"center",lineHeight:1.7}}>
        복사 후 카카오톡·문자·메모에 붙여넣기 가능합니다
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 메인 앱
// ═══════════════════════════════════════════════════════
export default function PalaceApp(){
  const [screen,setScreen]=useState("home");   // home | service | loading | result
  const [activeService,setActiveService]=useState(null);
  const [form,setForm]=useState({year:"",month:"",day:"",hour:"",gender:"남",name:""});
  const [formB,setFormB]=useState({year:"",month:"",day:"",hour:"",gender:"여",name:""});  // 궁합 상대방
  const [result,setResult]=useState(null);
  const [activeTab,setActiveTab]=useState("basic");
  const [cache,setCache]=useState({});
  const [tabLoading,setTabLoading]=useState(false);
  const [error,setError]=useState("");
  const [loadText,setLoadText]=useState("");
  const [scanY,setScanY]=useState(0);
  const [todayData,setTodayData]=useState(null);
  const animRef=useRef(null);

  useEffect(()=>{const iv=setInterval(()=>setScanY(v=>(v+1.2)%100),40);return()=>clearInterval(iv);},[]);

  // 화면 전환 시 스크롤 맨 위로
  useEffect(()=>{ window.scrollTo(0,0); },[screen]);

  // 오늘 일진 자동 계산
  useEffect(()=>{
    const d=new Date();
    const dp=getDP(d.getFullYear(),d.getMonth()+1,d.getDate());
    setTodayData(dp);
  },[]);

  const runLoad=async()=>{
    const msgs=["▷ 관상감 문서 열람 중...","▷ 천간지지 대조 중...","▷ 오행 배합 분석 중...","▷ 왕실 비문 해독 중...","▷ 대제학 풀이 작성 중..."];
    for(let i=0;i<msgs.length;i++){setLoadText(msgs[i]);await new Promise(r=>setTimeout(r,520));}
  };

  // 사주팔자 분석
  const handleSaju=async()=>{
    if(!form.year||!form.month||!form.day){setError("생년월일을 입력하십시오.");return;}
    setError("");setScreen("loading");runLoad();
    try{
      const p=calcSaju(form.year,form.month,form.day,form.hour||null);
      const prompt=`생년월일시: ${form.year}년 ${form.month}월 ${form.day}일 ${form.hour?form.hour+"시":"시각 미상"}, 성별: ${form.gender}
계산된 사주 4주 (이 값 그대로 사용):
년주: ${p.year.gan}${p.year.ji}(${p.year.ganh}${p.year.jih}) / 월주: ${p.month.gan}${p.month.ji} / 일주: ${p.day.gan}${p.day.ji} / 시주: ${p.hour.gan}${p.hour.ji}

조선 궁중 역학으로 풀이. 순수 JSON만:
{"title":"왕실 명리 칭호","summary":"사주 한줄 풀이 20자","pillars":{"year":{"gan":"${p.year.gan}","ganh":"${p.year.ganh}","ji":"${p.year.ji}","jih":"${p.year.jih}","zod":"${p.year.zod}","desc":"년주 풀이 두 문장"},"month":{"gan":"${p.month.gan}","ganh":"${p.month.ganh}","ji":"${p.month.ji}","jih":"${p.month.jih}","desc":"월주 풀이 두 문장"},"day":{"gan":"${p.day.gan}","ganh":"${p.day.ganh}","ji":"${p.day.ji}","jih":"${p.day.jih}","desc":"일주 풀이 두 문장"},"hour":{"gan":"${p.hour.gan}","ganh":"${p.hour.ganh}","ji":"${p.hour.ji}","jih":"${p.hour.jih}","desc":"시주 풀이 두 문장"}},"elements":{"wood":20,"fire":20,"earth":20,"metal":20,"water":20},"dominant":"wood","format":"격국명","strong_god":"용신 천간","life_path":"이 사주의 타고난 운명 두 문장","caution":"주의 한 문장","lucky_direction":"길한 방위","lucky_color":"길한 색상"}`;
      const parsed=await callClaude(SYS,prompt);
      ["year","month","day","hour"].forEach(k=>{
        if(!parsed.pillars[k])parsed.pillars[k]={};
        const pk=p[k];
        parsed.pillars[k].gan=pk.gan; parsed.pillars[k].ganh=pk.ganh;
        parsed.pillars[k].ji=pk.ji;   parsed.pillars[k].jih=pk.jih;
      });
      parsed._pillars=p;
      setResult({type:"saju",data:parsed,pillars:p});
      setActiveTab("basic");setCache({});setScreen("result");
    }catch(e){setError("오류: "+e.message);setScreen("service");}
  };

  // 토정비결
  const handleTojeong=async()=>{
    if(!form.year||!form.month||!form.day){setError("생년월일을 입력하십시오.");return;}
    setError("");setScreen("loading");runLoad();
    try{
      const p=calcSaju(form.year,form.month,form.day,null);
      const yr=getYear();
      const prompt=`생년: ${form.year}년 ${form.month}월 ${form.day}일, 성별: ${form.gender}. 올해는 ${yr}년.
사주: 년주${p.year.gan}${p.year.ji} 월주${p.month.gan}${p.month.ji} 일주${p.day.gan}${p.day.ji}
토정비결 전통 방식으로 ${yr}년 연간 운세. 순수 JSON만:
{"title":"${yr}년 토정비결 괘명","gwe_number":"괘 번호","gwe_verse":"해당 괘 시구 한시 2행","yearly_flow":"연간 전체 흐름 두 문장","spring":"봄(1-3월) 운세 두 문장","summer":"여름(4-6월) 운세 두 문장","autumn":"가을(7-9월) 운세 두 문장","winter":"겨울(10-12월) 운세 두 문장","peak_month":"가장 좋은 달","caution_month":"조심할 달","life_advice":"올해의 교훈 한 문장","lucky_number":"길한 숫자"}`;
      const parsed=await callClaude(SYS,prompt);
      setResult({type:"tojeong",data:parsed});setScreen("result");
    }catch(e){setError("오류: "+e.message);setScreen("service");}
  };

  // 탭 운세 로드
  const handleTab=async(tabId)=>{
    setActiveTab(tabId);
    if(tabId==="basic"||cache[tabId]||!result?.pillars)return;
    setTabLoading(true);
    const p=result.pillars;
    const sj=`년주${p.year.gan}${p.year.ji} 월주${p.month.gan}${p.month.ji} 일주${p.day.gan}${p.day.ji} 시주${p.hour.gan}${p.hour.ji}`;
    const today=getToday(); const yr=getYear();
    const prompts={
      today: `사주:${sj} 오늘(${today}) 일진 운세를 조선 궁중 역학으로. JSON: {"score":75,"headline":"오늘 운세 한줄","morning":"오전 두 문장","afternoon":"오후 두 문장","lucky_direction":"길방","lucky_color":"길색","caution":"주의 한 문장","advice":"오늘의 가르침 한 문장"}`,
      work:  `사주:${sj} 직업/사업운을 조선 궁중 역학으로. JSON: {"score":75,"headline":"직업운 한줄","aptitude":"타고난 재능 두 문장","career":"어울리는 직업군","peak":"전성기 시기","caution":"주의 한 문장","advice":"직업 가르침 한 문장"}`,
      love:  `사주:${sj} 성별:${form.gender} 혼인/연애운을 조선 궁중 역학으로. JSON: {"score":75,"headline":"혼인운 한줄","character":"인연 특성 두 문장","ideal":"이상적 배우자 특성","timing":"인연 시기","caution":"주의 한 문장","advice":"혼인 가르침 한 문장"}`,
      money: `사주:${sj} 재물/재복을 조선 궁중 역학으로. JSON: {"score":75,"headline":"재물운 한줄","fortune":"재물 기질 두 문장","method":"재물을 모으는 방법","timing":"재물 전성기","caution":"주의 한 문장","advice":"재물 가르침 한 문장"}`,
      yearly:`사주:${sj} ${yr}년 대운 흐름을 조선 궁중 역학으로. JSON: {"score":75,"headline":"${yr}년 운세 한줄","overview":"올해 전체 흐름 두 문장","opportunity":"올해의 기회 한 문장","caution":"올해 주의 한 문장","next_year":"내년 예고 한 문장","advice":"올해의 교훈 한 문장"}`,
    };
    try{const d=await callClaude(SYS,prompts[tabId]);setCache(prev=>({...prev,[tabId]:d}));}
    catch(e){setError("오류: "+e.message);}
    setTabLoading(false);
  };

  const reset=()=>{
    setScreen("home");setResult(null);setActiveTab("basic");setCache({});setError("");
    setForm({year:"",month:"",day:"",hour:"",gender:"남",name:""});
    setFormB({year:"",month:"",day:"",hour:"",gender:"여",name:""});
  };
  const goService=(svc)=>{setActiveService(svc);setScreen("service");setError("");};

  // ── 궁합 분석 ──
  const handleGung=async()=>{
    if(!form.year||!form.month||!form.day){setError("첫 번째 분의 생년월일을 입력하십시오.");return;}
    if(!formB.year||!formB.month||!formB.day){setError("두 번째 분의 생년월일을 입력하십시오.");return;}
    setError("");setScreen("loading");runLoad();
    try{
      const pA=calcSaju(form.year,form.month,form.day,form.hour||null);
      const pB=calcSaju(formB.year,formB.month,formB.day,formB.hour||null);
      const prompt=`첫 번째: ${form.year}년 ${form.month}월 ${form.day}일 ${form.hour?form.hour+"시":"시각 미상"} ${form.gender}성
사주A: 년주${pA.year.gan}${pA.year.ji} 월주${pA.month.gan}${pA.month.ji} 일주${pA.day.gan}${pA.day.ji} 시주${pA.hour.gan}${pA.hour.ji}

두 번째: ${formB.year}년 ${formB.month}월 ${formB.day}일 ${formB.hour?formB.hour+"시":"시각 미상"} ${formB.gender}성
사주B: 년주${pB.year.gan}${pB.year.ji} 월주${pB.month.gan}${pB.month.ji} 일주${pB.day.gan}${pB.day.ji} 시주${pB.hour.gan}${pB.hour.ji}

두 사주의 궁합을 조선 궁중 역학으로 풀이. 순수 JSON만:
{"title":"궁합 칭호","score":75,"grade":"궁합 등급(예:상상지합)","summary":"궁합 한줄 요약","ohaeng_match":"오행 궁합 분석 두 문장","personality_match":"성격 궁합 두 문장","strength":"이 인연의 강점 두 문장","weakness":"주의할 점 한 문장","best_aspect":"가장 잘 맞는 부분","timing":"인연이 깊어지는 시기","advice":"두 사람을 위한 조언 두 문장","lucky_direction":"함께하면 좋은 방위"}`;
      const parsed=await callClaude(SYS,prompt);
      setResult({type:"gung",data:parsed,pA,pB});
      setScreen("result");
    }catch(e){setError("오류: "+e.message);setScreen("service");}
  };

  // ── 작명·이름풀이 ──
  const handleName=async()=>{
    if(!form.name.trim()){setError("이름을 입력하십시오.");return;}
    setError("");setScreen("loading");runLoad();
    try{
      const hasBirth=form.year&&form.month&&form.day;
      let sajuInfo="";
      if(hasBirth){
        const p=calcSaju(form.year,form.month,form.day,null);
        sajuInfo=`사주: 년주${p.year.gan}${p.year.ji} 월주${p.month.gan}${p.month.ji} 일주${p.day.gan}${p.day.ji}`;
      }
      const prompt=`이름: ${form.name.trim()}, 성별: ${form.gender}${hasBirth?", 생년월일: "+form.year+"년 "+form.month+"월 "+form.day+"일":""}
${sajuInfo}
이름의 획수와 오행, 음양으로 운명을 조선 궁중 역학으로 풀이. 순수 JSON만:
{"title":"이름 풀이 칭호","name_reading":"이름 한자 또는 순한글 해설","strokes":"총 획수","ohaeng":"이름의 오행 구성","sound_meaning":"이름 소리의 의미 두 문장","destiny":"이름이 가져오는 운명 두 문장","strength":"이름의 강점 한 문장","caution":"주의할 점 한 문장","lucky_number":"이름의 행운 숫자","advice":"이름 풀이 조언 두 문장"}`;
      const parsed=await callClaude(SYS,prompt);
      setResult({type:"name",data:parsed,nameVal:form.name.trim()});
      setScreen("result");
    }catch(e){setError("오류: "+e.message);setScreen("service");}
  };
  const inp={
    width:"100%",background:"rgba(10,8,4,.8)",
    border:"1px solid rgba(192,152,75,.3)",
    color:"#e8d5b0",padding:"11px 14px",fontSize:15,
    outline:"none",fontFamily:"'Noto Serif KR',Georgia,serif",
    boxSizing:"border-box",letterSpacing:1,
  };

  // ══════════════════ HOME ══════════════════
  if(screen==="home")return(
    <PalaceBG scanY={scanY}>
      <PalaceHeader title="조선 명리원" sub="朝鮮 命理院 · 왕실 운명 철학"/>

      {/* 오늘 일진 배너 */}
      {todayData&&(
        <div style={{background:"rgba(139,26,26,.15)",border:"1px solid rgba(192,57,43,.3)",
          padding:"14px 20px",marginBottom:24,display:"flex",alignItems:"center",gap:16,
          animation:"inkDrop .5s ease both"}}>
          <div style={{textAlign:"center",minWidth:60}}>
            <div style={{fontSize:9,color:"#c0a060",letterSpacing:3,marginBottom:4}}>오늘 일진</div>
            <div style={{fontSize:28,color:"#e8b84b",letterSpacing:4,fontWeight:700}}>
              {todayData.gan}{todayData.ji}
            </div>
            <div style={{fontSize:11,color:"#c0a060"}}>{todayData.ganh}{todayData.jih}일</div>
          </div>
          <div style={{width:1,height:50,background:"rgba(192,152,75,.2)"}}/>
          <div style={{fontSize:12,color:"#b8a080",lineHeight:1.8}}>{getToday()} 오늘의 일진입니다.</div>
        </div>
      )}

      {/* 서비스 목록 */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:10,color:"#8b6914",letterSpacing:5,marginBottom:16,
          textAlign:"center"}}>◆ 관청 서비스 목록 ◆</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {SERVICES.map((svc,idx)=>(
            <button key={svc.id} onClick={()=>goService(svc)} style={{
              display:"flex",alignItems:"center",gap:16,
              background:svc.free?"rgba(10,8,4,.7)":"rgba(15,10,5,.7)",
              border:`1px solid ${svc.free?"rgba(192,152,75,.25)":"rgba(108,52,131,.3)"}`,
              padding:"16px 20px",cursor:"pointer",
              fontFamily:"'Noto Serif KR',Georgia,serif",
              color:"#e8d5b0",textAlign:"left",
              transition:"all .25s",
              animation:`inkDrop .4s ease ${idx*.08}s both`,
            }}
              onMouseEnter={e=>{e.currentTarget.style.background=`${EBG[Object.keys(EBG)[idx%5]]}`;e.currentTarget.style.borderColor=svc.color+"55";}}
              onMouseLeave={e=>{e.currentTarget.style.background=svc.free?"rgba(10,8,4,.7)":"rgba(15,10,5,.7)";e.currentTarget.style.borderColor=svc.free?"rgba(192,152,75,.25)":"rgba(108,52,131,.3)";}}>
              <div style={{width:44,height:44,border:`1px solid ${svc.color}44`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:20,color:svc.color,flexShrink:0}}>
                {svc.icon}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <span style={{fontSize:16,letterSpacing:2,fontWeight:700}}>{svc.name}</span>
                  <span style={{fontSize:11,color:"#8b6914",letterSpacing:1}}>{svc.sub}</span>
                  {!svc.free&&<span style={{fontSize:9,background:"rgba(108,52,131,.3)",
                    border:"1px solid rgba(108,52,131,.5)",color:"#c39bd3",
                    padding:"1px 6px",letterSpacing:1}}>상세</span>}
                  {svc.free&&<span style={{fontSize:9,background:"rgba(26,82,118,.2)",
                    border:"1px solid rgba(26,82,118,.4)",color:"#7fb3d3",
                    padding:"1px 6px",letterSpacing:1}}>무료</span>}
                </div>
                <div style={{fontSize:12,color:"#8b7a5a"}}>{svc.desc}</div>
              </div>
              <div style={{color:"#8b6914",fontSize:16}}>▷</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{textAlign:"center",fontSize:10,color:"rgba(139,105,20,.4)",letterSpacing:3}}>
        朝鮮 命理院 · {getToday()}
      </div>
    </PalaceBG>
  );

  // ══════════════════ SERVICE (입력) ══════════════════
  if(screen==="service"&&activeService)return(
    <PalaceBG scanY={scanY}>
      <PalaceHeader title={activeService.name} sub={activeService.sub} onBack={()=>setScreen("home")}/>
      <div style={{background:"rgba(10,8,4,.85)",border:"1px solid rgba(192,152,75,.22)",
        padding:"28px 26px",animation:"unfurl .4s ease"}}>

        {/* ── 궁합: 2인 입력 ── */}
        {activeService.id==="gung" ? (<>
          {/* 첫 번째 사람 */}
          <div style={{fontSize:11,color:"#c0392b",letterSpacing:4,marginBottom:14}}>
            ▷ 첫 번째 분 입력
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            {[["태어난 해","year","예) 1990"],["태어난 달","month","1~12"],
              ["태어난 날","day","1~31"],["태어난 시각","hour","0~23 (선택)"]].map(([lbl,key,ph])=>(
              <div key={"a-"+key}>
                <div style={{fontSize:10,color:"#8b6914",letterSpacing:2,marginBottom:4}}>{lbl}</div>
                <input type="number" placeholder={ph} value={form[key]}
                  onChange={e=>setForm({...form,[key]:e.target.value})} style={inp}
                  onFocus={e=>{e.target.style.borderColor="#c0392b";}}
                  onBlur={e=>{e.target.style.borderColor="rgba(192,152,75,.3)";}}/>
              </div>
            ))}
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:10,color:"#8b6914",letterSpacing:2,marginBottom:6}}>성별</div>
            <div style={{display:"flex",gap:10}}>
              {["남","여"].map(g=>(
                <button key={g} onClick={()=>setForm({...form,gender:g})} style={{
                  flex:1,padding:"10px 0",fontFamily:"inherit",fontSize:14,letterSpacing:4,cursor:"pointer",
                  background:form.gender===g?"rgba(139,26,26,.25)":"rgba(10,8,4,.5)",
                  border:form.gender===g?"1px solid #c0392b":"1px solid rgba(192,152,75,.2)",
                  color:form.gender===g?"#e8d5b0":"#6b5a3a",transition:"all .2s"}}>{g}</button>
              ))}
            </div>
          </div>

          {/* 구분선 */}
          <div style={{display:"flex",alignItems:"center",gap:10,margin:"4px 0 20px"}}>
            <div style={{flex:1,height:1,background:"rgba(192,152,75,.15)"}}/>
            <span style={{fontSize:12,color:"#8b6914",letterSpacing:3}}>♥ 상대방</span>
            <div style={{flex:1,height:1,background:"rgba(192,152,75,.15)"}}/>
          </div>

          {/* 두 번째 사람 */}
          <div style={{fontSize:11,color:"#6c3483",letterSpacing:4,marginBottom:14}}>
            ▷ 두 번째 분 입력
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            {[["태어난 해","year","예) 1992"],["태어난 달","month","1~12"],
              ["태어난 날","day","1~31"],["태어난 시각","hour","0~23 (선택)"]].map(([lbl,key,ph])=>(
              <div key={"b-"+key}>
                <div style={{fontSize:10,color:"#8b6914",letterSpacing:2,marginBottom:4}}>{lbl}</div>
                <input type="number" placeholder={ph} value={formB[key]}
                  onChange={e=>setFormB({...formB,[key]:e.target.value})} style={{...inp,borderColor:"rgba(108,52,131,.3)"}}
                  onFocus={e=>{e.target.style.borderColor="#6c3483";}}
                  onBlur={e=>{e.target.style.borderColor="rgba(108,52,131,.3)";}}/>
              </div>
            ))}
          </div>
          <div style={{marginBottom:22}}>
            <div style={{fontSize:10,color:"#8b6914",letterSpacing:2,marginBottom:6}}>성별</div>
            <div style={{display:"flex",gap:10}}>
              {["남","여"].map(g=>(
                <button key={g} onClick={()=>setFormB({...formB,gender:g})} style={{
                  flex:1,padding:"10px 0",fontFamily:"inherit",fontSize:14,letterSpacing:4,cursor:"pointer",
                  background:formB.gender===g?"rgba(108,52,131,.25)":"rgba(10,8,4,.5)",
                  border:formB.gender===g?"1px solid #6c3483":"1px solid rgba(108,52,131,.2)",
                  color:formB.gender===g?"#e8d5b0":"#6b5a3a",transition:"all .2s"}}>{g}</button>
              ))}
            </div>
          </div>
        </>) : (<>
          {/* ── 일반 서비스: 1인 입력 ── */}
          <div style={{fontSize:11,color:"#8b6914",letterSpacing:4,marginBottom:20}}>▷ 생년월일 입력</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            {[["태어난 해","year","예) 1980"],["태어난 달","month","1~12"],
              ["태어난 날","day","1~31"],["태어난 시각","hour","0~23 (모르면 공백)"]].map(([lbl,key,ph])=>(
              <div key={key}>
                <div style={{fontSize:10,color:"#8b6914",letterSpacing:2,marginBottom:5}}>{lbl}</div>
                <input type="number" placeholder={ph} value={form[key]}
                  onChange={e=>setForm({...form,[key]:e.target.value})} style={inp}
                  onFocus={e=>{e.target.style.borderColor="#e8b84b";e.target.style.boxShadow="0 0 10px rgba(232,184,75,.15)";}}
                  onBlur={e=>{e.target.style.borderColor="rgba(192,152,75,.3)";e.target.style.boxShadow="none";}}/>
              </div>
            ))}
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:10,color:"#8b6914",letterSpacing:2,marginBottom:7}}>성별</div>
            <div style={{display:"flex",gap:10}}>
              {["남","여"].map(g=>(
                <button key={g} onClick={()=>setForm({...form,gender:g})} style={{
                  flex:1,padding:"11px 0",fontFamily:"'Noto Serif KR',Georgia,serif",
                  fontSize:15,letterSpacing:5,cursor:"pointer",
                  background:form.gender===g?"rgba(139,26,26,.25)":"rgba(10,8,4,.6)",
                  border:form.gender===g?"1px solid #c0392b":"1px solid rgba(192,152,75,.2)",
                  color:form.gender===g?"#e8d5b0":"#6b5a3a",transition:"all .2s"}}>{g}</button>
              ))}
            </div>
          </div>
          {/* 작명·이름풀이 전용 이름 입력 */}
          {activeService.id==="name"&&(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,color:"#8b6914",letterSpacing:2,marginBottom:7}}>
                ▷ 이름 입력 (한글 또는 한자)
              </div>
              <input
                type="text"
                placeholder="예) 김기범 또는 金基範"
                value={form.name}
                onChange={e=>setForm({...form,name:e.target.value})}
                style={{...inp,fontSize:18,letterSpacing:4,textAlign:"center"}}
                onFocus={e=>{e.target.style.borderColor="#e8b84b";e.target.style.boxShadow="0 0 12px rgba(232,184,75,.2)";}}
                onBlur={e=>{e.target.style.borderColor="rgba(192,152,75,.3)";e.target.style.boxShadow="none";}}
              />
              <div style={{fontSize:10,color:"rgba(139,105,20,.5)",marginTop:6,letterSpacing:1}}>
                이름만 풀이하실 경우 생년월일 없이도 가능합니다
              </div>
            </div>
          )}
        </>)}

        {error&&<div style={{background:"rgba(100,5,5,.8)",border:"2px solid rgba(220,50,50,.6)",
          padding:"14px 16px",marginBottom:16,fontSize:13,color:"#ffaaaa",lineHeight:1.9,
          borderLeft:"4px solid #c0392b"}}>
          ⚠ {error}
          <div style={{marginTop:6,fontSize:11,color:"#e88080"}}>잠시 후 다시 시도해 주십시오.</div>
        </div>}

        <button
          onClick={
            activeService.id==="saju"    ? handleSaju :
            activeService.id==="tojeong" ? handleTojeong :
            activeService.id==="gung"    ? handleGung :
            activeService.id==="name"    ? handleName :
            ()=>setError("준비 중인 서비스입니다.")
          }
          style={{width:"100%",padding:"14px 0",background:"rgba(139,26,26,.2)",
            border:"1px solid rgba(192,57,43,.5)",color:"#e8d5b0",
            fontSize:13,letterSpacing:5,cursor:"pointer",
            fontFamily:"'Noto Serif KR',Georgia,serif",transition:"all .3s"}}
          onMouseEnter={e=>{e.target.style.background="rgba(139,26,26,.4)";e.target.style.boxShadow="0 0 20px rgba(192,57,43,.2)";}}
          onMouseLeave={e=>{e.target.style.background="rgba(139,26,26,.2)";e.target.style.boxShadow="none";}}>
          ▷ {activeService.name} 열람하기
        </button>
        <button onClick={()=>setScreen("home")} style={{
          width:"100%",marginTop:10,padding:"10px 0",background:"transparent",
          border:"1px solid rgba(192,152,75,.15)",color:"rgba(139,105,20,.6)",
          fontSize:11,letterSpacing:4,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}
          onMouseEnter={e=>{e.target.style.color="#8b6914";e.target.style.borderColor="rgba(192,152,75,.3)";}}
          onMouseLeave={e=>{e.target.style.color="rgba(139,105,20,.6)";e.target.style.borderColor="rgba(192,152,75,.15)";}}>
          ← 관청 목록으로
        </button>
      </div>
    </PalaceBG>
  );

  // ══════════════════ LOADING ══════════════════
  if(screen==="loading")return(
    <PalaceBG scanY={scanY}>
      <PalaceHeader title="관상감 열람 중" sub="觀象監 閱覽"/>
      <div style={{textAlign:"center",padding:"50px 20px"}}>
        <div style={{position:"relative",width:120,height:120,margin:"0 auto 28px"}}>
          <div style={{position:"absolute",inset:0,borderRadius:"50%",
            border:"1px solid rgba(192,152,75,.2)",borderTop:"1px solid #e8b84b",
            animation:"spin 2s linear infinite"}}/>
          <div style={{position:"absolute",inset:16,borderRadius:"50%",
            border:"1px solid rgba(192,57,43,.15)",borderRight:"1px solid #c0392b",
            animation:"spin 1.4s linear infinite reverse"}}/>
          <div style={{position:"absolute",inset:32,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:28,color:"#e8b84b",animation:"brushGlow 2s ease-in-out infinite"}}>
            ☯
          </div>
        </div>
        <div style={{fontSize:14,color:"#c0a060",letterSpacing:3,minHeight:24,fontStyle:"italic"}}>{loadText}</div>
        <div style={{marginTop:10,fontSize:11,color:"rgba(139,105,20,.5)",letterSpacing:2}}>
          대제학이 명리를 살피고 있습니다
        </div>
      </div>
    </PalaceBG>
  );

  // ══════════════════ RESULT ══════════════════
  if(screen==="result"&&result){
    const isSaju=result.type==="saju";
    const isGung=result.type==="gung";
    const d=result.data;

    // ── 궁합 결과 화면 ──
    if(isGung)return(
      <PalaceBG scanY={scanY}>
        <PalaceHeader title="궁합 풀이" sub="宮合 解說" onBack={reset}/>
        {/* 궁합 점수 */}
        <div style={{background:"rgba(108,52,131,.1)",border:"1px solid rgba(108,52,131,.3)",
          padding:"18px 22px",marginBottom:14,textAlign:"center",animation:"inkDrop .4s ease"}}>
          <div style={{fontSize:9,color:"#8b4513",letterSpacing:4,marginBottom:8}}>궁합 등급</div>
          <div style={{fontSize:26,color:"#e8b84b",fontWeight:700,letterSpacing:4,marginBottom:6}}>{d.grade}</div>
          <div style={{fontSize:14,color:"#c0a060",marginBottom:10}}>{d.title}</div>
          {/* 점수 게이지 */}
          <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center",marginBottom:6}}>
            <span style={{fontSize:11,color:"#8b6914"}}>궁합 지수</span>
            <span style={{fontSize:22,color:"#c0392b",fontWeight:700}}>{d.score}</span>
          </div>
          <div style={{height:6,background:"rgba(255,255,255,.05)",borderRadius:3,maxWidth:300,margin:"0 auto"}}>
            <div style={{height:"100%",width:`${d.score}%`,borderRadius:3,
              background:"linear-gradient(90deg,#8b1a1a,#c0392b,#e8b84b)",
              boxShadow:"0 0 10px rgba(192,57,43,.4)"}}/>
          </div>
          <div style={{marginTop:8,fontSize:13,color:"#b8a080",lineHeight:1.8}}>{d.summary}</div>
        </div>
        {/* 두 사람 사주 요약 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {[["첫 번째",result.pA,"#c0392b"],["두 번째",result.pB,"#6c3483"]].map(([lbl,p,c])=>(
            <div key={lbl} style={{background:"rgba(10,8,4,.8)",border:`1px solid ${c}22`,padding:"12px 14px",textAlign:"center"}}>
              <div style={{fontSize:9,color:c,letterSpacing:3,marginBottom:6}}>{lbl}</div>
              <div style={{fontSize:16,color:"#e8b84b",letterSpacing:4,fontWeight:700}}>
                {p.year.gan}{p.year.ji}
              </div>
              <div style={{fontSize:12,color:"#8b7a5a",marginTop:4}}>
                {p.day.gan}{p.day.ji}일주
              </div>
            </div>
          ))}
        </div>
        {/* 풀이 내용 */}
        <div style={{background:"rgba(8,6,3,.88)",border:"1px solid rgba(192,152,75,.1)",
          padding:"18px 20px",marginBottom:14}}>
          {[
            ["▷ 오행 궁합",d.ohaeng_match,"#c0a878"],
            ["▷ 성격 궁합",d.personality_match,"#c0a878"],
            ["▷ 이 인연의 강점",d.strength,"#4a7c3f"],
            ["▷ 주의할 점",d.weakness,"#c0392b"],
            ["▷ 가장 잘 맞는 부분",d.best_aspect,"#e8b84b"],
            ["▷ 인연이 깊어지는 시기",d.timing,"#1a5276"],
            ["▷ 두 분을 위한 조언",d.advice,"#c0a878"],
            ["▷ 함께하면 좋은 방위",d.lucky_direction,"#1e8449"],
          ].map(([lbl,val,c])=>val&&(
            <div key={lbl} style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid rgba(192,152,75,.07)"}}>
              <div style={{fontSize:9,color:"#8b6914",letterSpacing:3,marginBottom:5}}>{lbl}</div>
              <div style={{fontSize:13,color:c,lineHeight:1.85}}>{val}</div>
            </div>
          ))}
        </div>
        <ShareBar result={result} form={form}/>
        <button onClick={reset} style={{width:"100%",padding:"11px 0",background:"transparent",
          border:"1px solid rgba(192,152,75,.15)",color:"rgba(139,105,20,.5)",
          fontSize:11,letterSpacing:4,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}
          onMouseEnter={e=>{e.target.style.color="#8b6914";}}
          onMouseLeave={e=>{e.target.style.color="rgba(139,105,20,.5)";}}>
          ← 관청 목록으로 돌아가기
        </button>
        <div style={{textAlign:"center",marginTop:14,fontSize:10,color:"rgba(139,105,20,.28)",letterSpacing:3}}>
          朝鮮 命理院 · {getToday()}
        </div>
      </PalaceBG>
    );

    // ── 이름풀이 결과 ──
    if(result.type==="name"){
      const nd=result.data;
      return(
        <PalaceBG scanY={scanY}>
          <PalaceHeader title="작명·이름풀이" sub="命名 解說" onBack={reset}/>
          <div style={{background:"rgba(120,66,18,.1)",border:"1px solid rgba(192,152,75,.3)",
            padding:"18px 22px",marginBottom:14,textAlign:"center",animation:"inkDrop .4s ease"}}>
            <div style={{fontSize:9,color:"#8b4513",letterSpacing:4,marginBottom:6}}>이름 풀이 칭호</div>
            <div style={{fontSize:28,color:"#e8b84b",fontWeight:700,letterSpacing:6,marginBottom:4}}>
              {result.nameVal}
            </div>
            <div style={{fontSize:14,color:"#c0a060",marginBottom:6}}>{nd.title}</div>
            <div style={{display:"inline-flex",gap:16,marginTop:4}}>
              <span style={{fontSize:12,color:"#8b7a5a"}}>총 획수: <span style={{color:"#e8b84b",fontWeight:700}}>{nd.strokes}</span></span>
              <span style={{fontSize:12,color:"#8b7a5a"}}>행운 숫자: <span style={{color:"#c0392b",fontWeight:700}}>{nd.lucky_number}</span></span>
            </div>
          </div>
          <div style={{background:"rgba(8,6,3,.88)",border:"1px solid rgba(192,152,75,.1)",
            padding:"18px 20px",marginBottom:14}}>
            {[
              ["▷ 이름 해설",nd.name_reading,"#e8d5b0"],
              ["▷ 오행 구성",nd.ohaeng,"#4a7c3f"],
              ["▷ 소리의 의미",nd.sound_meaning,"#c0a878"],
              ["▷ 이름이 가져오는 운명",nd.destiny,"#c0a878"],
              ["▷ 이름의 강점",nd.strength,"#1e8449"],
              ["▷ 주의할 점",nd.caution,"#c0392b"],
              ["▷ 이름 풀이 조언",nd.advice,"#e8b84b"],
            ].map(([lbl,val,c])=>val&&(
              <div key={lbl} style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid rgba(192,152,75,.07)"}}>
                <div style={{fontSize:9,color:"#8b6914",letterSpacing:3,marginBottom:5}}>{lbl}</div>
                <div style={{fontSize:13,color:c,lineHeight:1.9}}>{val}</div>
              </div>
            ))}
          </div>
          <ShareBar result={result} form={form}/>
          <button onClick={reset} style={{width:"100%",padding:"11px 0",background:"transparent",
            border:"1px solid rgba(192,152,75,.15)",color:"rgba(139,105,20,.5)",
            fontSize:11,letterSpacing:4,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}
            onMouseEnter={e=>e.target.style.color="#8b6914"}
            onMouseLeave={e=>e.target.style.color="rgba(139,105,20,.5)"}>
            ← 관청 목록으로 돌아가기
          </button>
          <div style={{textAlign:"center",marginTop:14,fontSize:10,color:"rgba(139,105,20,.28)",letterSpacing:3}}>
            朝鮮 命理院 · {getToday()}
          </div>
        </PalaceBG>
      );
    }

    const SAJU_TABS=[
      {id:"basic",  label:"사주 기본",  color:"#c0392b"},
      {id:"today",  label:"오늘 운세",  color:"#1a5276"},
      {id:"work",   label:"직업운",     color:"#1e8449"},
      {id:"love",   label:"혼인운",     color:"#6c3483"},
      {id:"money",  label:"재물운",     color:"#8b6914"},
      {id:"yearly", label:`${getYear()}년 대운`, color:"#4a7c3f"},
    ];
    return(
      <PalaceBG scanY={scanY}>
        <PalaceHeader
          title={isSaju?"사주팔자 풀이":"토정비결 풀이"}
          sub={isSaju?"四柱八字 解說":"土亭秘訣 解說"}
          onBack={reset}/>

        {/* 명리 코드 */}
        <div style={{background:"rgba(139,26,26,.12)",border:"1px solid rgba(192,57,43,.25)",
          padding:"16px 20px",marginBottom:14,animation:"inkDrop .4s ease"}}>
          <div style={{fontSize:9,color:"#8b4513",letterSpacing:4,marginBottom:6}}>관상감 명리 칭호</div>
          <div style={{fontSize:"clamp(14px,3vw,18px)",color:"#e8b84b",letterSpacing:3,fontWeight:700}}>{d.title}</div>
          <div style={{marginTop:6,fontSize:13,color:"#b8a080",lineHeight:1.8}}>{d.summary}</div>
        </div>

        {/* 사주 결과 탭 */}
        {isSaju&&(<>
          <div style={{display:"flex",overflowX:"auto",borderBottom:"1px solid rgba(192,152,75,.15)",
            marginBottom:14,scrollbarWidth:"none"}}>
            {SAJU_TABS.map(t=>{const a=activeTab===t.id;return(
              <button key={t.id} onClick={()=>handleTab(t.id)} style={{
                flex:"0 0 auto",padding:"9px 14px",background:a?`${t.color}15`:"transparent",
                border:"none",borderBottom:a?`2px solid ${t.color}`:"2px solid transparent",
                color:a?t.color:"rgba(139,105,20,.5)",cursor:"pointer",
                fontFamily:"'Noto Serif KR',Georgia,serif",
                fontSize:"clamp(10px,2vw,12px)",letterSpacing:1,whiteSpace:"nowrap",transition:"all .2s"}}>
                {t.label}{cache[t.id]&&t.id!=="basic"&&<span style={{marginLeft:3,fontSize:7,color:"#e8b84b"}}>●</span>}
              </button>
            );})}
          </div>

          <div style={{background:"rgba(8,6,3,.88)",border:"1px solid rgba(192,152,75,.1)",
            padding:"20px 22px",animation:"unfurl .3s ease"}}>

            {/* 사주 기본 */}
            {activeTab==="basic"&&(<div>
              {/* 4주 한자 카드 */}
              <div style={{fontSize:10,color:"#8b6914",letterSpacing:4,marginBottom:14}}>▷ 사주 기둥</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:18}}>
                {["year","month","day","hour"].map((k,i)=>{
                  const v=d.pillars[k]; const lbl=["년주","월주","일주","시주"][i];
                  return(
                    <div key={k} style={{background:"rgba(10,8,4,.8)",
                      border:"1px solid rgba(192,152,75,.18)",
                      padding:"12px 8px",textAlign:"center"}}>
                      <div style={{fontSize:9,color:"#8b6914",letterSpacing:1,marginBottom:6}}>{lbl}</div>
                      <div style={{fontSize:22,color:"#e8b84b",letterSpacing:2,
                        textShadow:"0 0 15px rgba(232,184,75,.3)",fontWeight:700}}>
                        {v.gan}
                      </div>
                      <div style={{fontSize:20,color:"#e8d5b0",letterSpacing:2,marginBottom:4}}>{v.ji}</div>
                      <div style={{fontSize:10,color:"#8b7a5a"}}>{v.ganh}{v.jih}</div>
                      {k==="year"&&<div style={{fontSize:9,color:"#c0a060",marginTop:3}}>({d.pillars.year.zod||v.zod}띠)</div>}
                    </div>
                  );
                })}
              </div>

              {/* 격국·용신 */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                {[["格局 (격국)",d.format,"#e8b84b"],["用神 (용신)",d.strong_god,"#c0392b"]].map(([lbl,val,c])=>(
                  <div key={lbl} style={{background:"rgba(10,8,4,.7)",
                    border:`1px solid ${c}22`,padding:"12px 14px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:"#8b6914",letterSpacing:2,marginBottom:6}}>{lbl}</div>
                    <div style={{fontSize:16,color:c,letterSpacing:3}}>{val}</div>
                  </div>
                ))}
              </div>

              {/* 오행 */}
              <div style={{background:"rgba(8,6,3,.7)",border:"1px solid rgba(192,152,75,.1)",
                padding:"16px 18px",marginBottom:14}}>
                <div style={{fontSize:10,color:"#8b6914",letterSpacing:4,marginBottom:12}}>▷ 오행 배합</div>
                {Object.entries(d.elements||{}).map(([el,val])=>(
                  <div key={el} style={{marginBottom:9}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:12,color:EC[el]}}>{EK[el]} {EKR[el]}</span>
                      <span style={{fontSize:11,color:"rgba(139,105,20,.6)"}}>{val}%</span>
                    </div>
                    <div style={{height:3,background:"rgba(255,255,255,.04)"}}>
                      <div style={{height:"100%",width:`${val}%`,
                        background:`linear-gradient(90deg,${EC[el]}55,${EC[el]})`,
                        boxShadow:`0 0 6px ${EC[el]}44`}}/>
                    </div>
                  </div>
                ))}
                <div style={{marginTop:10,fontSize:11,color:"#e8b84b",letterSpacing:2}}>
                  주도 오행: {EK[d.dominant]||"—"} {EKR[d.dominant]||""}
                </div>
              </div>

              {/* 운명·주의·길흉 */}
              <div style={{marginBottom:14}}>
                {[["▷ 타고난 운명",d.life_path,"#c0a878"],["▷ 주의 사항",d.caution,"#c0392b"]].map(([lbl,val,c])=>(
                  <div key={lbl} style={{marginBottom:10,paddingBottom:10,borderBottom:"1px solid rgba(192,152,75,.08)"}}>
                    <div style={{fontSize:9,color:"#8b6914",letterSpacing:3,marginBottom:5}}>{lbl}</div>
                    <div style={{fontSize:13,color:c,lineHeight:1.85}}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["길한 방위",d.lucky_direction,"#1a5276"],["길한 색상",d.lucky_color,"#1e8449"]].map(([lbl,val,c])=>(
                  <div key={lbl} style={{background:"rgba(8,6,3,.7)",border:`1px solid ${c}22`,padding:"12px 14px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:"#8b6914",letterSpacing:2,marginBottom:5}}>{lbl}</div>
                    <div style={{fontSize:14,color:c}}>{val}</div>
                  </div>
                ))}
              </div>
            </div>)}

            {/* 운세 탭 공통 */}
            {activeTab!=="basic"&&(<div>
              {tabLoading&&<div style={{textAlign:"center",padding:"36px"}}>
                <div style={{width:40,height:40,margin:"0 auto 12px",borderRadius:"50%",
                  border:"1px solid rgba(232,184,75,.2)",borderTop:"1px solid #e8b84b",
                  animation:"spin 1.5s linear infinite"}}/>
                <div style={{fontSize:12,color:"#c0a060",letterSpacing:2}}>관상감 열람 중...</div>
              </div>}
              {!tabLoading&&cache[activeTab]&&(()=>{
                const td=cache[activeTab];
                const tc=SAJU_TABS.find(t=>t.id===activeTab);
                return(<div>
                  <div style={{fontSize:10,color:tc?.color,letterSpacing:3,marginBottom:14}}>
                    ▷ {tc?.label}
                  </div>
                  {/* 점수 */}
                  <div style={{marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:10,color:"#8b6914",letterSpacing:2}}>운세 지수</span>
                      <span style={{fontSize:18,color:tc?.color,fontWeight:700}}>{td.score}</span>
                    </div>
                    <div style={{height:3,background:"rgba(255,255,255,.04)"}}>
                      <div style={{height:"100%",width:`${td.score}%`,background:`linear-gradient(90deg,${tc?.color}55,${tc?.color})`}}/>
                    </div>
                  </div>
                  <div style={{background:`${tc?.color}12`,border:`1px solid ${tc?.color}25`,
                    padding:"12px 16px",marginBottom:14,borderLeft:`2px solid ${tc?.color}`}}>
                    <div style={{fontSize:14,color:tc?.color,fontWeight:700,lineHeight:1.7}}>{td.headline}</div>
                  </div>
                  {Object.entries(td).filter(([k])=>!["score","headline"].includes(k)).map(([k,v])=>(
                    <div key={k} style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid rgba(192,152,75,.07)"}}>
                      <div style={{fontSize:9,color:"#8b6914",letterSpacing:3,marginBottom:5}}>▷ {k.replace(/_/g," ").toUpperCase()}</div>
                      <div style={{fontSize:13,color:"#c0a878",lineHeight:1.85}}>{v}</div>
                    </div>
                  ))}
                </div>);
              })()}
            </div>)}
          </div>
        </>)}

        {/* 토정비결 결과 */}
        {!isSaju&&(<div style={{background:"rgba(8,6,3,.88)",border:"1px solid rgba(192,152,75,.1)",padding:"20px 22px"}}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:24,color:"#e8b84b",letterSpacing:6,marginBottom:4}}>{d.gwe_number}</div>
            <div style={{fontSize:14,color:"#c0a060",fontStyle:"italic",lineHeight:1.9,letterSpacing:2}}>
              {d.gwe_verse}
            </div>
          </div>
          <div style={{marginBottom:16,paddingBottom:14,borderBottom:"1px solid rgba(192,152,75,.1)"}}>
            <div style={{fontSize:9,color:"#8b6914",letterSpacing:4,marginBottom:6}}>▷ 연간 전체 흐름</div>
            <div style={{fontSize:13,color:"#c0a878",lineHeight:1.9}}>{d.yearly_flow}</div>
          </div>
          {[["봄 (1~3월)","spring","#4a7c3f"],["여름 (4~6월)","summer","#c0392b"],
            ["가을 (7~9월)","autumn","#8b6914"],["겨울 (10~12월)","winter","#1a5276"]].map(([lbl,key,c])=>(
            <div key={key} style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid rgba(192,152,75,.07)"}}>
              <div style={{fontSize:9,color:c,letterSpacing:3,marginBottom:5}}>▷ {lbl}</div>
              <div style={{fontSize:13,color:"#c0a878",lineHeight:1.85}}>{d[key]}</div>
            </div>
          ))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}>
            {[["전성월",d.peak_month,"#e8b84b"],["주의월",d.caution_month,"#c0392b"]].map(([lbl,val,c])=>(
              <div key={lbl} style={{background:"rgba(10,8,4,.7)",border:`1px solid ${c}22`,padding:"12px 14px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#8b6914",letterSpacing:2,marginBottom:5}}>▷ {lbl}</div>
                <div style={{fontSize:14,color:c}}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:14,background:"rgba(139,26,26,.1)",border:"1px solid rgba(192,57,43,.2)",
            padding:"12px 16px"}}>
            <div style={{fontSize:9,color:"#8b6914",letterSpacing:4,marginBottom:5}}>▷ 올해의 교훈</div>
            <div style={{fontSize:13,color:"#e8d5b0",lineHeight:1.85,fontStyle:"italic"}}>{d.life_advice}</div>
          </div>
        </div>)}

        <ShareBar result={result} form={form}/>
        <button onClick={reset} style={{
          width:"100%",marginTop:10,padding:"11px 0",background:"transparent",
          border:"1px solid rgba(192,152,75,.15)",color:"rgba(139,105,20,.5)",
          fontSize:11,letterSpacing:4,cursor:"pointer",
          fontFamily:"'Noto Serif KR',Georgia,serif",transition:"all .2s",
        }}
          onMouseEnter={e=>{e.target.style.borderColor="rgba(192,152,75,.4)";e.target.style.color="#8b6914";}}
          onMouseLeave={e=>{e.target.style.borderColor="rgba(192,152,75,.15)";e.target.style.color="rgba(139,105,20,.5)";}}>
          ← 관청 목록으로 돌아가기
        </button>
        <div style={{textAlign:"center",marginTop:20,fontSize:10,color:"rgba(139,105,20,.3)",letterSpacing:3}}>
          朝鮮 命理院 · {getToday()}
        </div>
      </PalaceBG>
    );
  }
  return null;
}
