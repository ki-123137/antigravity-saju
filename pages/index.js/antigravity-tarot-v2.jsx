import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════
// 사주 계산 엔진
// ═══════════════════════════════════════════════
const CG = ["갑","을","병","정","무","기","경","신","임","계"];
const JJ = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
function getYearPillar(y,m,d){let yr=y;if(m<2||(m===2&&d<4))yr--;const idx=((yr-1984)%60+600)%60;return{gan:CG[idx%10],ji:JJ[idx%12],ganIdx:idx%10};}
function getMonthPillar(ygi,m){const jb=[1,2,3,4,5,6,7,8,9,10,11,0];const ji=jb[m-1];const gs=[2,4,6,8,0][ygi%5];return{gan:CG[(gs+((ji-2+12)%12))%10],ji:JJ[ji]};}
function getDayPillar(y,m,d){const days=Math.round((new Date(y,m-1,d)-new Date(1900,0,1))/86400000);const idx=((days+10)%60+60)%60;return{gan:CG[idx%10],ji:JJ[idx%12],ganIdx:idx%10};}
function getHourPillar(dgi,h){if(h===null||h===undefined)return{gan:"?",ji:"?"};const n=Number(h);const ji=n===23?0:Math.floor((n+1)/2)%12;return{gan:CG[([0,2,4,6,8][dgi%5]+ji)%10],ji:JJ[ji]};}
function calcSaju(y,m,d,h){const yp=getYearPillar(+y,+m,+d);const mp=getMonthPillar(yp.ganIdx,+m);const dp=getDayPillar(+y,+m,+d);const hp=h?getHourPillar(dp.ganIdx,h):{gan:"?",ji:"?"};return{year:yp,month:mp,day:dp,hour:hp};}

// ═══════════════════════════════════════════════
// 타로 78장 덱
// ═══════════════════════════════════════════════
const MAJOR = [
  {id:0,name:"바보",en:"The Fool",sym:"🌟",color:"#ffd060",meaning:"새로운 시작, 순수한 도전"},
  {id:1,name:"마법사",en:"The Magician",sym:"⚡",color:"#f97316",meaning:"의지력, 창조적 능력"},
  {id:2,name:"여사제",en:"High Priestess",sym:"🌙",color:"#818cf8",meaning:"직관, 내면의 지혜"},
  {id:3,name:"여황제",en:"The Empress",sym:"🌿",color:"#4ade80",meaning:"풍요, 창의성, 모성"},
  {id:4,name:"황제",en:"The Emperor",sym:"👑",color:"#f87171",meaning:"권위, 안정, 리더십"},
  {id:5,name:"교황",en:"The Hierophant",sym:"✦",color:"#fbbf24",meaning:"전통, 가르침, 믿음"},
  {id:6,name:"연인",en:"The Lovers",sym:"♥",color:"#f472b6",meaning:"선택, 조화, 사랑"},
  {id:7,name:"전차",en:"The Chariot",sym:"▲",color:"#38bdf8",meaning:"승리, 의지, 추진력"},
  {id:8,name:"힘",en:"Strength",sym:"🔥",color:"#fb923c",meaning:"내면의 강함, 인내"},
  {id:9,name:"은둔자",en:"The Hermit",sym:"🕯",color:"#94a3b8",meaning:"내면 탐구, 성찰"},
  {id:10,name:"운명의 수레바퀴",en:"Wheel of Fortune",sym:"◎",color:"#ffd060",meaning:"변화, 행운, 순환"},
  {id:11,name:"정의",en:"Justice",sym:"⚖",color:"#60a5fa",meaning:"균형, 공정, 진실"},
  {id:12,name:"매달린 사람",en:"The Hanged Man",sym:"🔄",color:"#a78bfa",meaning:"희생, 새 관점, 기다림"},
  {id:13,name:"죽음",en:"Death",sym:"🦋",color:"#6b7280",meaning:"변환, 끝과 시작, 전환"},
  {id:14,name:"절제",en:"Temperance",sym:"∞",color:"#34d399",meaning:"균형, 조화, 인내"},
  {id:15,name:"악마",en:"The Devil",sym:"⛓",color:"#7c3aed",meaning:"속박, 집착, 물질욕"},
  {id:16,name:"탑",en:"The Tower",sym:"⚡",color:"#ef4444",meaning:"급변, 붕괴, 각성"},
  {id:17,name:"별",en:"The Star",sym:"★",color:"#38bdf8",meaning:"희망, 치유, 영감"},
  {id:18,name:"달",en:"The Moon",sym:"🌙",color:"#818cf8",meaning:"환상, 불안, 무의식"},
  {id:19,name:"태양",en:"The Sun",sym:"☀",color:"#fbbf24",meaning:"기쁨, 성공, 활력"},
  {id:20,name:"심판",en:"Judgement",sym:"📯",color:"#f97316",meaning:"각성, 부활, 변화"},
  {id:21,name:"세계",en:"The World",sym:"🌐",color:"#4ade80",meaning:"완성, 성취, 통합"},
];
const SUITS = ["완드","컵","검","펜타클"];
const SUIT_COLORS = {완드:"#f97316",컵:"#38bdf8",검:"#94a3b8",펜타클:"#fbbf24"};
const SUIT_SYMS  = {완드:"🔥",컵:"💧",검:"⚔",펜타클:"◆"};
const RANKS = ["에이스","2","3","4","5","6","7","8","9","10","기사","여왕","왕","페이지"];
const MINOR = SUITS.flatMap(s=>RANKS.map(r=>({id:`${s}-${r}`,name:`${s}의 ${r}`,en:`${r} of ${s}`,sym:SUIT_SYMS[s],color:SUIT_COLORS[s],suit:s})));
const DECK = [...MAJOR,...MINOR];

function drawCards(n){
  const shuffled=[...DECK].sort(()=>Math.random()-0.5);
  return shuffled.slice(0,n).map(c=>({...c,reversed:Math.random()>0.6}));
}

// ═══════════════════════════════════════════════
// Claude API
// ═══════════════════════════════════════════════
async function callClaude(system, user, tokens=4000){
  const res=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:tokens,
      system,messages:[{role:"user",content:user}]})
  });
  if(!res.ok)throw new Error(`API 오류 (${res.status})`);
  const data=await res.json();
  const text=data.content?.map(b=>b.text||"").join("")||"";
  const cl=text.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
  const s=cl.indexOf("{"),e=cl.lastIndexOf("}");
  if(s===-1||e===-1)throw new Error("JSON 파싱 실패");
  return JSON.parse(cl.slice(s,e+1));
}

// ═══════════════════════════════════════════════
// 탭 설정
// ═══════════════════════════════════════════════
const TABS=[
  {id:"unified",  label:"통합 리딩",  icon:"◈", color:"#00ffcc"},
  {id:"saju",     label:"사주 분석",  icon:"☯", color:"#00d4ff"},
  {id:"tarot",    label:"타로 해석",  icon:"✦", color:"#a78bfa"},
  {id:"today",    label:"오늘 에너지",icon:"☀", color:"#ffd060"},
  {id:"love",     label:"연애운",     icon:"♥", color:"#f472b6"},
  {id:"money",    label:"재물운",     icon:"◆", color:"#fbbf24"},
];

const EC={wood:"#4ade80",fire:"#f97316",earth:"#eab308",metal:"#94a3b8",water:"#38bdf8"};
const EK={wood:"木",fire:"火",earth:"土",metal:"金",water:"水"};
const PK={year:"년주",month:"월주",day:"일주",hour:"시주"};

function getToday(){const d=new Date();return`${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;}

// ═══════════════════════════════════════════════
// 타로 카드 컴포넌트
// ═══════════════════════════════════════════════
function TarotCard({card, label, revealed, onClick, small=false}){
  const w=small?70:100, h=small?110:158;
  if(!revealed) return(
    <div onClick={onClick} style={{width:w,height:h,cursor:"pointer",position:"relative",
      background:"linear-gradient(135deg,#0a0a2e,#0d1b4b)",
      border:"1px solid rgba(0,180,255,.4)",borderRadius:6,
      display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",
      boxShadow:"0 0 20px rgba(0,100,200,.3)",transition:"transform .2s",}}
      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-4px) scale(1.03)"}
      onMouseLeave={e=>e.currentTarget.style.transform="none"}>
      <div style={{fontSize:small?20:28,opacity:.4}}>✦</div>
      <div style={{fontSize:8,color:"rgba(0,180,255,.5)",letterSpacing:2,marginTop:6}}>TAP</div>
      {label&&<div style={{position:"absolute",bottom:-22,fontSize:9,color:"#5b8ccc",letterSpacing:1,whiteSpace:"nowrap"}}>{label}</div>}
    </div>
  );
  return(
    <div style={{width:w,height:h,position:"relative",
      background:`linear-gradient(145deg,${card.color}18,rgba(0,10,30,.95))`,
      border:`1px solid ${card.color}55`,borderRadius:6,
      display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",
      boxShadow:`0 0 20px ${card.color}33`,
      transform:card.reversed?"rotate(180deg)":"none",
      transition:"all .4s",padding:8}}>
      <div style={{fontSize:small?22:32,marginBottom:4,filter:`drop-shadow(0 0 6px ${card.color})`}}>{card.sym}</div>
      <div style={{fontSize:small?8:10,color:card.color,letterSpacing:1,textAlign:"center",fontWeight:700,lineHeight:1.3}}>{card.name}</div>
      {!small&&<div style={{fontSize:8,color:"rgba(255,255,255,.3)",marginTop:4,letterSpacing:1}}>{card.reversed?"역방향":"정방향"}</div>}
      {label&&<div style={{position:"absolute",bottom:-22,fontSize:9,color:"#5b8ccc",letterSpacing:1,whiteSpace:"nowrap",transform:card.reversed?"rotate(180deg)":"none"}}>{label}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════
// 점수 게이지
// ═══════════════════════════════════════════════
function ScoreBar({score,color}){
  return(
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:10,color:"#5b8ccc",letterSpacing:2}}>FORTUNE SCORE</span>
        <span style={{fontSize:18,color,fontWeight:700}}>{score}</span>
      </div>
      <div style={{height:5,background:"rgba(255,255,255,.06)",borderRadius:3}}>
        <div style={{height:"100%",width:`${score}%`,borderRadius:3,
          background:`linear-gradient(90deg,${color}55,${color})`,boxShadow:`0 0 8px ${color}55`}}/>
      </div>
    </div>
  );
}

function Row({label,value,color="#8ab0d0"}){
  return(
    <div style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid rgba(0,100,180,.1)"}}>
      <div style={{fontSize:9,color:"#5b8ccc",letterSpacing:3,marginBottom:4}}>{label}</div>
      <div style={{fontSize:13,color,lineHeight:1.75}}>{value}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 메인 컴포넌트
// ═══════════════════════════════════════════════
// ── BG, Header: App 밖에 정의 → 키 입력시 remount 없음 ──
function BG({children, canvasRef, scanY}){
  return(
    <div style={{minHeight:"100vh",background:"#020412",color:"#c9e0ff",fontFamily:"'Courier New',monospace",position:"relative",overflow:"hidden"}}>
      <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,opacity:.7}}/>
      <div style={{position:"fixed",inset:0,zIndex:1,pointerEvents:"none",backgroundImage:"linear-gradient(rgba(0,180,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,255,.04) 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>
      <div style={{position:"fixed",left:0,right:0,height:"2px",zIndex:2,pointerEvents:"none",top:`${scanY}%`,background:"linear-gradient(90deg,transparent,rgba(0,200,255,.15),transparent)"}}/>
      <div style={{position:"relative",zIndex:3,maxWidth:700,margin:"0 auto",padding:"36px 18px 60px"}}>{children}</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}@keyframes floatUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}*{box-sizing:border-box}input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}::-webkit-scrollbar{width:4px;background:#020412}::-webkit-scrollbar-thumb{background:rgba(0,150,220,.3)}`}</style>
    </div>
  );
}

function Header({sub, glitch}){
  return(
    <div style={{textAlign:"center",marginBottom:32}}>
      <div style={{fontSize:10,letterSpacing:7,color:"#0af",marginBottom:6,animation:"pulse 2.5s ease-in-out infinite"}}>◈ ANTI-GRAVITY SYSTEM v5.0 ◈</div>
      <h1 style={{fontSize:"clamp(20px,5vw,34px)",fontWeight:900,margin:0,fontFamily:"Georgia,serif",
        background:"linear-gradient(135deg,#00d4ff,#a78bfa,#00ffcc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
        ...(glitch?{textShadow:"2px 0 #f0f,-2px 0 #0ff"}:{})}}>
        안티그래비티 프로그램
      </h1>
      <div style={{fontSize:"clamp(11px,2vw,15px)",color:"#5b8ccc",letterSpacing:4,marginTop:4,fontFamily:"Georgia,serif"}}>{sub}</div>
      <div style={{height:1,maxWidth:440,margin:"14px auto 0",background:"linear-gradient(90deg,transparent,#a78bfa,#00d4ff,transparent)"}}/>
    </div>
  );
}

export default function App(){
  const [step,setStep]=useState("input");
  const [form,setForm]=useState({year:"",month:"",day:"",hour:"",gender:"남"});
  const [drawnCards,setDrawnCards]=useState(null);
  const [revealedIdx,setRevealedIdx]=useState(-1);
  const [sajuData,setSajuData]=useState(null);
  const [sajuPillars,setSajuPillars]=useState(null);
  const [activeTab,setActiveTab]=useState("unified");
  const [tabCache,setTabCache]=useState({});
  const [tabLoading,setTabLoading]=useState(false);
  const [tabError,setTabError]=useState("");
  const [error,setError]=useState("");
  const [loadText,setLoadText]=useState("");
  const [scanY,setScanY]=useState(0);
  const [glitch,setGlitch]=useState(false);
  const canvasRef=useRef(null);
  const animRef=useRef(null);

  // 별자리
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");
    canvas.width=window.innerWidth;canvas.height=window.innerHeight;
    const stars=Array.from({length:200},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.5+.2,s:Math.random()*.3+.05}));
    let f=0;
    const draw=()=>{
      ctx.fillStyle="rgba(2,4,18,.22)";ctx.fillRect(0,0,canvas.width,canvas.height);
      stars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(180,210,255,${.25+Math.sin(f*.02+s.x)*.2})`;ctx.fill();s.y+=s.s;if(s.y>canvas.height){s.y=0;s.x=Math.random()*canvas.width;}});
      f++;animRef.current=requestAnimationFrame(draw);
    };draw();return()=>cancelAnimationFrame(animRef.current);
  },[]);
  useEffect(()=>{const iv=setInterval(()=>setScanY(v=>(v+2)%100),30);return()=>clearInterval(iv);},[]);
  useEffect(()=>{const iv=setInterval(()=>{setGlitch(true);setTimeout(()=>setGlitch(false),160);},5000);return()=>clearInterval(iv);},[]);

  const runLoad=async()=>{
    const msgs=["▶ ANTI-GRAVITY ENGINE BOOT...","▶ 사주 4주 계산 중...","▶ 타로 덱 셔플 중...","▶ 오행 + 아르카나 벡터 합성...","▶ 운명 매트릭스 해석 중...","▶ DESTINY PROTOCOL 실행..."];
    for(let i=0;i<msgs.length;i++){setLoadText(msgs[i]);await new Promise(r=>setTimeout(r,500));}
  };

  const handleSubmit=async()=>{
    if(!form.year||!form.month||!form.day){setError("생년월일을 입력하세요.");return;}
    setError("");setStep("loading");runLoad();
    try{
      const p=calcSaju(form.year,form.month,form.day,form.hour||null);
      setSajuPillars(p);
      const cards=drawCards(4);
      setDrawnCards(cards);
      setRevealedIdx(-1);

      const cardDesc=cards.map((c,i)=>`${["운명","현재","미래","조언"][i]}카드: ${c.name}(${c.reversed?"역":"정"})`).join(", ");
      const sys=`당신은 안티그래비티 프로그램 제작기의 우주 운명 해석 AI입니다. 사주와 타로를 결합해 통합 리딩을 제공합니다. 마크다운 코드블록 없이 순수 JSON만 출력. 큰따옴표는 JSON에만 사용.`;
      const usr=`사주: 년주${p.year.gan}${p.year.ji} 월주${p.month.gan}${p.month.ji} 일주${p.day.gan}${p.day.ji} 시주${p.hour.gan}${p.hour.ji}. 성별:${form.gender}
타로카드: ${cardDesc}
위 사주+타로를 통합하여 해석. JSON형식: {"title":"코드명","summary":"통합리딩 한줄20자","saju":{"pillars":{"year":{"gan":"${p.year.gan}","ji":"${p.year.ji}","desc":"년주해석"},"month":{"gan":"${p.month.gan}","ji":"${p.month.ji}","desc":"월주해석"},"day":{"gan":"${p.day.gan}","ji":"${p.day.ji}","desc":"일주해석"},"hour":{"gan":"${p.hour.gan}","ji":"${p.hour.ji}","desc":"시주해석"}},"elements":{"wood":20,"fire":20,"earth":20,"metal":20,"water":20},"dominant":"wood"},"tarot":{"cards":[{"position":"운명","reading":"카드와사주연결해석두문장"},{"position":"현재","reading":"현재에너지해석"},{"position":"미래","reading":"미래흐름해석"},{"position":"조언","reading":"실천조언"}]},"unified":{"core_message":"사주+타로통합메시지두문장","life_mission":"인생미션한문장","destiny_log":["로그1","로그2","로그3"],"lucky_code":"AG-TAROT-0000","caution":"주의한문장"}}`;
      const parsed=await callClaude(sys,usr,4000);

      // ── 계산된 4주 강제 덮어쓰기 (Claude 임의 변경 완전 차단) ──
      if(!parsed.saju) parsed.saju={pillars:{},elements:{wood:20,fire:20,earth:20,metal:20,water:20},dominant:"wood"};
      if(!parsed.saju.pillars) parsed.saju.pillars={year:{},month:{},day:{},hour:{}};
      ["year","month","day","hour"].forEach(k=>{
        if(!parsed.saju.pillars[k]) parsed.saju.pillars[k]={};
      });
      parsed.saju.pillars.year.gan  = p.year.gan;
      parsed.saju.pillars.year.ji   = p.year.ji;
      parsed.saju.pillars.month.gan = p.month.gan;
      parsed.saju.pillars.month.ji  = p.month.ji;
      parsed.saju.pillars.day.gan   = p.day.gan;
      parsed.saju.pillars.day.ji    = p.day.ji;
      parsed.saju.pillars.hour.gan  = p.hour.gan;  // 시각 미입력시 "?" 그대로
      parsed.saju.pillars.hour.ji   = p.hour.ji;
      parsed._cards=cards;
      setSajuData(parsed);
      setActiveTab("unified");
      setTabCache({unified:true});
      setStep("reveal");
    }catch(e){setError("오류: "+e.message);setStep("input");}
  };

  // 카드 한 장씩 공개
  const handleReveal=()=>{
    if(revealedIdx<3){setRevealedIdx(v=>v+1);}
    else{setStep("result");}
  };

  // 탭 전환 & 추가 API 호출
  const handleTab=async(id)=>{
    setActiveTab(id);
    if(tabCache[id]||!sajuPillars||!sajuData)return;
    setTabLoading(true);setTabError("");
    const p=sajuPillars;
    const cards=sajuData._cards;
    const cardStr=cards.map((c,i)=>`${["운명","현재","미래","조언"][i]}:${c.name}(${c.reversed?"역":"정"})`).join(",");
    const sajuStr=`년주${p.year.gan}${p.year.ji} 월주${p.month.gan}${p.month.ji} 일주${p.day.gan}${p.day.ji} 시주${p.hour.gan}${p.hour.ji}`;
    const sys=`안티그래비티 프로그램 제작기 운명 AI. 마크다운 코드블록 없이 순수 JSON만. 큰따옴표는 JSON에만.`;
    try{
      let result;
      if(id==="today"){
        result=await callClaude(sys,`사주:${sajuStr} 타로:${cardStr} 오늘(${getToday()}) 에너지를 사주+타로 통합으로. JSON: {"score":75,"headline":"오늘에너지한줄","morning":"오전두문장","afternoon":"오후두문장","card_energy":"타로카드오늘메시지","lucky_color":"색상","lucky_number":7,"advice":"조언한문장"}`);
      }else if(id==="love"){
        result=await callClaude(sys,`사주:${sajuStr} 타로:${cardStr} 성별:${form.gender} 연애운을 사주+타로 통합으로. JSON: {"score":75,"headline":"연애운한줄","style":"연애스타일두문장","ideal":"이상형특징","card_message":"타로카드연애메시지","timing":"인연시기","caution":"주의한문장","advice":"조언한문장"}`);
      }else if(id==="money"){
        result=await callClaude(sys,`사주:${sajuStr} 타로:${cardStr} 재물운을 사주+타로 통합으로. JSON: {"score":75,"headline":"재물운한줄","pattern":"재물패턴두문장","card_message":"타로카드재물메시지","best_timing":"좋은시기","risk":"주의한문장","advice":"조언한문장"}`);
      }
      setTabCache(prev=>({...prev,[id]:result}));
    }catch(e){setTabError("로딩 실패: "+e.message);}
    setTabLoading(false);
  };

  const reset=()=>{setStep("input");setSajuData(null);setSajuPillars(null);setDrawnCards(null);setRevealedIdx(-1);setTabCache({});setActiveTab("unified");setForm({year:"",month:"",day:"",hour:"",gender:"남"});};

  const cardLabels=["운명 카드","현재 에너지","가까운 미래","조언 카드"];

  // ── 공통 배경 ──


  // ══════════════════ INPUT (v5 동일 스타일) ══════════════════
  if(step==="input")return(
    <BG canvasRef={canvasRef} scanY={scanY}>
      <Header glitch={glitch} sub="제작기 · 사주 × 타로 통합 리딩"/>
      <div style={{background:"rgba(0,20,50,.7)",border:"1px solid rgba(0,180,255,.2)",borderRadius:2,padding:"32px 28px",
        boxShadow:"0 0 40px rgba(0,100,200,.15),inset 0 0 30px rgba(0,20,60,.5)"}}>
        <div style={{fontSize:11,color:"#0af",letterSpacing:3,marginBottom:24}}>▶ INITIALIZE · 운명 좌표 입력</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          {[["출생연도","year","예) 1995"],["출생월","month","1–12"],["출생일","day","1–31"],["출생시각(시)","hour","0–23 (선택)"]].map(([lbl,key,ph])=>(
            <div key={key}>
              <div style={{fontSize:10,color:"#5b8ccc",letterSpacing:2,marginBottom:6}}>{lbl.toUpperCase()}</div>
              <input type="number" placeholder={ph} value={form[key]}
                onChange={e=>setForm({...form,[key]:e.target.value})}
                style={{width:"100%",background:"rgba(0,30,70,.8)",border:"1px solid rgba(0,150,220,.3)",
                  color:"#c9e0ff",padding:"10px 12px",fontSize:14,outline:"none",
                  fontFamily:"inherit",borderRadius:1,boxSizing:"border-box"}}
                onFocus={e=>e.target.style.borderColor="#0af"}
                onBlur={e=>e.target.style.borderColor="rgba(0,150,220,.3)"}/>
            </div>
          ))}
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:10,color:"#5b8ccc",letterSpacing:2,marginBottom:8}}>성별 SECTOR</div>
          <div style={{display:"flex",gap:10}}>
            {["남","여"].map(g=>(
              <button key={g} onClick={()=>setForm({...form,gender:g})} style={{
                flex:1,padding:"10px 0",
                background:form.gender===g?"rgba(0,160,255,.2)":"rgba(0,30,70,.5)",
                border:form.gender===g?"1px solid #0af":"1px solid rgba(0,150,220,.2)",
                color:form.gender===g?"#0af":"#5b8ccc",
                cursor:"pointer",fontSize:14,letterSpacing:4,fontFamily:"inherit",borderRadius:1}}>
                {g}
              </button>
            ))}
          </div>
        </div>
        {error&&<div style={{background:"rgba(80,0,0,.6)",border:"1px solid rgba(255,80,80,.5)",
          padding:"12px 16px",marginBottom:16,fontSize:12,color:"#ff9999",lineHeight:1.8}}>⚠ {error}</div>}
        <button onClick={handleSubmit} style={{width:"100%",padding:"14px 0",background:"transparent",
          border:"1px solid #0af",color:"#0af",fontSize:13,letterSpacing:6,
          cursor:"pointer",fontFamily:"inherit",transition:"all .3s"}}
          onMouseEnter={e=>{e.target.style.background="rgba(0,170,255,.1)";e.target.style.boxShadow="0 0 20px rgba(0,170,255,.3)"}}
          onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.boxShadow="none"}}>
          ✦ LAUNCH DESTINY READING
        </button>
      </div>
    </BG>
  );

  // ══════════════════ LOADING ══════════════════
  if(step==="loading")return(
    <BG canvasRef={canvasRef} scanY={scanY}>
      <Header glitch={glitch} sub="사주 × 타로 분석 중..."/>
      <div style={{textAlign:"center",padding:"50px 20px"}}>
        <div style={{position:"relative",width:130,height:130,margin:"0 auto 28px"}}>
          <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"2px solid rgba(140,100,255,.2)",borderTop:"2px solid #a78bfa",animation:"spin 1.2s linear infinite"}}/>
          <div style={{position:"absolute",inset:18,borderRadius:"50%",border:"1px solid rgba(0,200,255,.15)",borderBottom:"1px solid #0af",animation:"spin .8s linear infinite reverse"}}/>
          <div style={{position:"absolute",inset:36,borderRadius:"50%",border:"1px solid rgba(0,255,180,.1)",borderLeft:"1px solid #0fc",animation:"spin 2s linear infinite"}}/>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>✦</div>
        </div>
        <div style={{fontSize:13,color:"#a78bfa",letterSpacing:2,minHeight:24}}>{loadText}</div>
        <div style={{marginTop:10,fontSize:11,color:"#2a2a5a"}}>사주와 타로를 통합하는 중입니다</div>
      </div>
    </BG>
  );

  // ══════════════════ REVEAL (카드 공개) ══════════════════
  if(step==="reveal"&&drawnCards)return(
    <BG canvasRef={canvasRef} scanY={scanY}>
      <Header glitch={glitch} sub="타로 카드를 한 장씩 공개하세요"/>
      <div style={{background:"rgba(10,5,40,.85)",border:"1px solid rgba(140,100,255,.25)",padding:"28px 20px",textAlign:"center"}}>
        <div style={{fontSize:11,color:"#a78bfa",letterSpacing:3,marginBottom:24}}>
          {revealedIdx<3?"▶ 카드를 탭하여 운명을 공개하세요":"▶ 모든 카드가 공개되었습니다"}
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:14,flexWrap:"wrap",marginBottom:32,paddingBottom:28}}>
          {drawnCards.map((card,i)=>(
            <TarotCard key={i} card={card} label={cardLabels[i]}
              revealed={i<=revealedIdx}
              onClick={()=>{if(i===revealedIdx+1)handleReveal();}}/>
          ))}
        </div>
        {revealedIdx>=3?(
          <button onClick={()=>setStep("result")} style={{padding:"14px 40px",background:"transparent",border:"1px solid #00ffcc",color:"#00ffcc",fontSize:13,letterSpacing:5,cursor:"pointer",fontFamily:"inherit"}}
            onMouseEnter={e=>{e.target.style.background="rgba(0,255,180,.08)";}}
            onMouseLeave={e=>{e.target.style.background="transparent";}}>
            ◈ 통합 리딩 보기
          </button>
        ):(
          <button onClick={handleReveal} style={{padding:"14px 40px",background:"transparent",border:"1px solid #a78bfa",color:"#a78bfa",fontSize:13,letterSpacing:5,cursor:"pointer",fontFamily:"inherit"}}
            onMouseEnter={e=>e.target.style.background="rgba(140,100,255,.1)"}
            onMouseLeave={e=>e.target.style.background="transparent"}>
            ✦ {revealedIdx<0?"첫 번째 카드 공개":"다음 카드 공개"} ({revealedIdx+2}/4)
          </button>
        )}
      </div>
    </BG>
  );

  // ══════════════════ RESULT ══════════════════
  if(step==="result"&&sajuData){
    const d=sajuData;
    const tab=TABS.find(t=>t.id===activeTab);
    return(
      <BG canvasRef={canvasRef} scanY={scanY}>
        <Header glitch={glitch} sub="제작기 · 통합 운명 리딩 완료"/>

        {/* PROGRAM ID */}
        <div style={{background:"rgba(5,2,30,.95)",border:"1px solid rgba(140,100,255,.35)",padding:"18px 22px",marginBottom:14,boxShadow:"0 0 30px rgba(100,50,200,.15)"}}>
          <div style={{fontSize:9,color:"#6b4fbb",letterSpacing:3,marginBottom:6}}>DESTINY PROGRAM ID</div>
          <div style={{fontSize:"clamp(13px,3vw,17px)",color:"#00ffcc",letterSpacing:2,fontWeight:700}}>{d.title}</div>
          <div style={{marginTop:6,fontSize:12,color:"#8ab0d0"}}>{d.summary}</div>
        </div>

        {/* 카드 미니 표시 */}
        <div style={{display:"flex",gap:8,marginBottom:14,justifyContent:"center",paddingBottom:4}}>
          {d._cards.map((card,i)=>(
            <div key={i} style={{textAlign:"center"}}>
              <TarotCard card={card} revealed small/>
              <div style={{fontSize:8,color:"#3a3a6a",marginTop:20,letterSpacing:1}}>{cardLabels[i]}</div>
            </div>
          ))}
        </div>

        {/* 탭 바 */}
        <div style={{display:"flex",gap:0,marginBottom:14,overflowX:"auto",borderBottom:"1px solid rgba(100,50,200,.2)"}}>
          {TABS.map(t=>{
            const isA=activeTab===t.id;
            return(
              <button key={t.id} onClick={()=>handleTab(t.id)} style={{
                flex:"0 0 auto",padding:"9px 13px",background:isA?`${t.color}14`:"transparent",
                border:"none",borderBottom:isA?`2px solid ${t.color}`:"2px solid transparent",
                color:isA?t.color:"#3a3a6a",cursor:"pointer",fontFamily:"inherit",
                fontSize:"clamp(9px,2.2vw,11px)",letterSpacing:1,whiteSpace:"nowrap",transition:"all .2s"}}>
                {t.icon} {t.label}
                {tabCache[t.id]&&t.id!=="unified"&&<span style={{marginLeft:3,fontSize:7,color:"#00ffaa"}}>●</span>}
              </button>
            );
          })}
        </div>

        {/* 탭 컨텐츠 */}
        <div style={{background:"rgba(5,2,30,.88)",border:`1px solid ${tab?.color||"#a78bfa"}22`,padding:"20px 22px",animation:"floatUp .35s ease"}}>

          {/* ── 통합 리딩 ── */}
          {activeTab==="unified"&&(
            <div>
              <div style={{fontSize:10,color:"#00ffcc",letterSpacing:3,marginBottom:16}}>◈ UNIFIED READING · 사주 × 타로 통합</div>
              <div style={{background:"rgba(0,255,180,.06)",border:"1px solid rgba(0,255,180,.2)",padding:"16px 18px",marginBottom:16,borderLeft:"3px solid #00ffcc"}}>
                <div style={{fontSize:14,color:"#00ffcc",lineHeight:1.85}}>{d.unified?.core_message}</div>
              </div>
              <Row label="LIFE MISSION · 인생 미션" value={d.unified?.life_mission} color="#c0ffe0"/>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:9,color:"#5b8ccc",letterSpacing:3,marginBottom:10}}>DESTINY LOG · 운명 기록</div>
                {d.unified?.destiny_log?.map((log,i)=>(
                  <div key={i} style={{display:"flex",gap:10,marginBottom:10}}>
                    <span style={{color:"#a78bfa",fontSize:10,minWidth:22}}>[{String(i+1).padStart(2,"0")}]</span>
                    <span style={{fontSize:12,color:"#a0c0e0",lineHeight:1.7}}>{log}</span>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div style={{background:"rgba(50,10,10,.7)",border:"1px solid rgba(255,80,80,.2)",padding:14}}>
                  <div style={{fontSize:9,color:"#ff6b6b",letterSpacing:2,marginBottom:6}}>⚠ CAUTION</div>
                  <div style={{fontSize:11,color:"#ffaaaa",lineHeight:1.7}}>{d.unified?.caution}</div>
                </div>
                <div style={{background:"rgba(0,30,20,.7)",border:"1px solid rgba(0,255,150,.2)",padding:14}}>
                  <div style={{fontSize:9,color:"#00ffaa",letterSpacing:2,marginBottom:6}}>✦ LUCKY CODE</div>
                  <div style={{fontSize:11,color:"#80ffcc",letterSpacing:1}}>{d.unified?.lucky_code}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── 사주 분석 ── */}
          {activeTab==="saju"&&(
            <div>
              <div style={{fontSize:10,color:"#00d4ff",letterSpacing:3,marginBottom:14}}>◈ FOUR PILLARS · 사주 기둥</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:14}}>
                {Object.entries(d.saju.pillars).map(([k,v])=>(
                  <div key={k} style={{background:"rgba(0,15,40,.85)",border:"1px solid rgba(0,140,200,.2)",padding:14}}>
                    <div style={{fontSize:9,color:"#0af",letterSpacing:2,marginBottom:6}}>{PK[k]} · {k.toUpperCase()}</div>
                    <div style={{fontSize:26,letterSpacing:8,color:"#e0f0ff",marginBottom:6,fontFamily:"Georgia,serif"}}>{v.gan}{v.ji}</div>
                    <div style={{fontSize:11,color:"#7a9abf",lineHeight:1.7}}>{v.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:10,color:"#5b8ccc",letterSpacing:3,marginBottom:12}}>◈ ELEMENT SPECTRUM · 오행</div>
              {Object.entries(d.saju.elements).map(([el,val])=>(
                <div key={el} style={{marginBottom:9}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:11,color:EC[el]}}>{EK[el]} {el.toUpperCase()}</span>
                    <span style={{fontSize:11,color:"#4a6a8a"}}>{val}%</span>
                  </div>
                  <div style={{height:4,background:"rgba(255,255,255,.05)",borderRadius:2}}>
                    <div style={{height:"100%",width:`${val}%`,background:`linear-gradient(90deg,${EC[el]}66,${EC[el]})`,borderRadius:2}}/>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── 타로 해석 ── */}
          {activeTab==="tarot"&&(
            <div>
              <div style={{fontSize:10,color:"#a78bfa",letterSpacing:3,marginBottom:16}}>◈ TAROT READING · 카드 해석</div>
              {d.tarot?.cards?.map((c,i)=>(
                <div key={i} style={{display:"flex",gap:14,marginBottom:16,alignItems:"flex-start",
                  background:"rgba(50,20,100,.2)",border:`1px solid ${d._cards[i]?.color||"#a78bfa"}33`,padding:"14px"}}>
                  <div style={{flexShrink:0}}>
                    <TarotCard card={d._cards[i]} revealed small/>
                  </div>
                  <div style={{paddingTop:4}}>
                    <div style={{fontSize:9,color:"#6b4fbb",letterSpacing:2,marginBottom:5}}>{c.position?.toUpperCase()}</div>
                    <div style={{fontSize:12,color:d._cards[i]?.color||"#a78bfa",fontWeight:700,marginBottom:6}}>
                      {d._cards[i]?.name} {d._cards[i]?.reversed?"(역방향)":"(정방향)"}
                    </div>
                    <div style={{fontSize:12,color:"#a0b8d0",lineHeight:1.75}}>{c.reading}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── 오늘/연애/재물 (lazy load) ── */}
          {["today","love","money"].includes(activeTab)&&(
            <div>
              {tabLoading&&(
                <div style={{textAlign:"center",padding:"40px 0"}}>
                  <div style={{width:50,height:50,margin:"0 auto 14px",borderRadius:"50%",border:`2px solid ${tab?.color}44`,borderTop:`2px solid ${tab?.color}`,animation:"spin 1s linear infinite"}}/>
                  <div style={{fontSize:12,color:tab?.color,letterSpacing:2}}>{tab?.label} 분석 중...</div>
                </div>
              )}
              {tabError&&<div style={{background:"rgba(80,0,0,.5)",border:"1px solid rgba(255,80,80,.4)",padding:"12px",fontSize:12,color:"#ff9999"}}>⚠ {tabError}</div>}
              {tabCache[activeTab]&&!tabLoading&&(()=>{
                const td=tabCache[activeTab];
                return(
                  <div>
                    <div style={{fontSize:10,letterSpacing:3,marginBottom:14,color:tab?.color}}>{tab?.icon} {tab?.label?.toUpperCase()} · {getToday()} 기준</div>
                    <ScoreBar score={td.score||70} color={tab?.color||"#a78bfa"}/>
                    <div style={{background:`${tab?.color}10`,border:`1px solid ${tab?.color}33`,padding:"12px 16px",marginBottom:14,borderLeft:`3px solid ${tab?.color}`}}>
                      <div style={{fontSize:14,color:tab?.color,fontWeight:700}}>{td.headline}</div>
                    </div>
                    {activeTab==="today"&&<>
                      <Row label="오전 에너지 ☀ AM" value={td.morning}/>
                      <Row label="오후 에너지 🌆 PM" value={td.afternoon}/>
                      <Row label="타로 카드 메시지" value={td.card_energy} color={tab?.color}/>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"14px 0"}}>
                        <div style={{background:"rgba(0,20,50,.7)",border:"1px solid rgba(0,140,200,.2)",padding:"12px"}}>
                          <div style={{fontSize:9,color:"#5b8ccc",letterSpacing:2,marginBottom:4}}>LUCKY COLOR</div>
                          <div style={{fontSize:14,color:tab?.color}}>{td.lucky_color}</div>
                        </div>
                        <div style={{background:"rgba(0,20,50,.7)",border:"1px solid rgba(0,140,200,.2)",padding:"12px"}}>
                          <div style={{fontSize:9,color:"#5b8ccc",letterSpacing:2,marginBottom:4}}>LUCKY NUMBER</div>
                          <div style={{fontSize:22,color:tab?.color,fontWeight:700}}>{td.lucky_number}</div>
                        </div>
                      </div>
                      <Row label="오늘의 조언" value={td.advice} color="#00ffcc"/>
                    </>}
                    {activeTab==="love"&&<>
                      <Row label="연애 스타일" value={td.style}/>
                      <Row label="이상형 특징" value={td.ideal} color={tab?.color}/>
                      <Row label="타로 카드 메시지" value={td.card_message} color={tab?.color}/>
                      <Row label="인연 시기" value={td.timing} color="#00ffcc"/>
                      <Row label="주의할 점" value={td.caution} color="#ff9999"/>
                      <Row label="연애 조언" value={td.advice}/>
                    </>}
                    {activeTab==="money"&&<>
                      <Row label="재물 패턴" value={td.pattern}/>
                      <Row label="타로 카드 메시지" value={td.card_message} color={tab?.color}/>
                      <Row label="재물운 좋은 시기" value={td.best_timing} color="#00ffcc"/>
                      <Row label="리스크" value={td.risk} color="#ff9999"/>
                      <Row label="재물운 조언" value={td.advice}/>
                    </>}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <button onClick={reset} style={{width:"100%",marginTop:14,padding:"12px 0",background:"transparent",border:"1px solid rgba(100,50,200,.3)",color:"#4a3a7a",fontSize:11,letterSpacing:5,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}
          onMouseEnter={e=>{e.target.style.borderColor="#a78bfa";e.target.style.color="#a78bfa"}}
          onMouseLeave={e=>{e.target.style.borderColor="rgba(100,50,200,.3)";e.target.style.color="#4a3a7a"}}>
          ↺ REINITIALIZE · 다시 리딩
        </button>
        <div style={{textAlign:"center",marginTop:32,fontSize:10,color:"#1a1040",letterSpacing:3}}>ANTI-GRAVITY SAJU×TAROT MODULE · BUILD 2026.04.15</div>
      </BG>
    );
  }
  return null;
}
