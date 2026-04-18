import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════
// 사주 계산 엔진 (v5 동일 — 수정 불가)
// ═══════════════════════════════════════════════
const CG=["갑","을","병","정","무","기","경","신","임","계"];
const JJ=["자","축","인","묘","진","사","오","미","신","유","술","해"];
function getYearPillar(y,m,d){let yr=y;if(m<2||(m===2&&d<4))yr--;const idx=((yr-1984)%60+600)%60;return{gan:CG[idx%10],ji:JJ[idx%12],ganIdx:idx%10};}
function getMonthPillar(ygi,m){const jb=[1,2,3,4,5,6,7,8,9,10,11,0];const ji=jb[m-1];const gs=[2,4,6,8,0][ygi%5];return{gan:CG[(gs+((ji-2+12)%12))%10],ji:JJ[ji]};}
function getDayPillar(y,m,d){const days=Math.round((new Date(y,m-1,d)-new Date(1900,0,1))/86400000);const idx=((days+10)%60+60)%60;return{gan:CG[idx%10],ji:JJ[idx%12],ganIdx:idx%10};}
function getHourPillar(dgi,h){if(h===null||h===undefined)return{gan:"☽",ji:"☽"};const n=Number(h);const ji=n===23?0:Math.floor((n+1)/2)%12;return{gan:CG[([0,2,4,6,8][dgi%5]+ji)%10],ji:JJ[ji]};}
function calcSaju(y,m,d,h){const yp=getYearPillar(+y,+m,+d);const mp=getMonthPillar(yp.ganIdx,+m);const dp=getDayPillar(+y,+m,+d);const hp=h?getHourPillar(dp.ganIdx,h):{gan:"☽",ji:"☽"};return{year:yp,month:mp,day:dp,hour:hp};}

// ═══════════════════════════════════════════════
// Claude API
// ═══════════════════════════════════════════════
async function callClaude(prompt,tokens=4000){
  const res=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:tokens,
      system:"당신은 달빛 마녀 살롱의 신비로운 점술 AI입니다. 사주를 마법과 달빛의 언어로 해석합니다. 마크다운 코드블록 없이 순수 JSON만 출력. 큰따옴표는 JSON에만 사용.",
      messages:[{role:"user",content:prompt}]})
  });
  if(!res.ok)throw new Error(`마법 연결 오류 (${res.status})`);
  const data=await res.json();
  const text=data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"";
  const cl=text.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
  const s=cl.indexOf("{"),e=cl.lastIndexOf("}");
  if(s===-1||e===-1)throw new Error("비밀 문서 해독 실패");
  return JSON.parse(cl.slice(s,e+1));
}

// ═══════════════════════════════════════════════
// 탭 · 오행 설정
// ═══════════════════════════════════════════════
const TABS=[
  {id:"saju",  label:"사주의 별자리", icon:"✦", color:"#d4b8ff"},
  {id:"today", label:"오늘의 마법",   icon:"🌙", color:"#f9c8e8"},
  {id:"week",  label:"이번 주 달빛",  icon:"☽",  color:"#c8d8f9"},
  {id:"month", label:"이번 달 포션",  icon:"🔮", color:"#b8f0e0"},
  {id:"work",  label:"직업의 룬",     icon:"⚗",  color:"#f0e0b8"},
  {id:"love",  label:"연애의 마법진", icon:"♡",  color:"#ffb8cc"},
  {id:"money", label:"재물의 수정",   icon:"💎", color:"#ffe4b8"},
];
const EC={wood:"#86efac",fire:"#fca5a5",earth:"#fde68a",metal:"#e2e8f0",water:"#93c5fd"};
const EK={wood:"木",fire:"火",earth:"土",metal:"金",water:"水"};
const EKR={wood:"나무",fire:"불",earth:"흙",metal:"금",water:"물"};
const PK={year:"년주",month:"월주",day:"일주",hour:"시주"};
const MOON_PHASES=["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘"];

function getToday(){const d=new Date();return`${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;}
function getMoonPhase(){return MOON_PHASES[Math.floor(Date.now()/86400000/3.69)%8];}

const FORTUNE_PROMPTS={
  today:(p,today)=>`사주: 년주${p.year.gan}${p.year.ji} 월주${p.month.gan}${p.month.ji} 일주${p.day.gan}${p.day.ji} 시주${p.hour.gan}${p.hour.ji}. 오늘(${today}). 달빛 마녀의 언어로 오늘 운세. JSON: {"score":75,"headline":"오늘의 마법 한줄","morning":"오전 에너지 두 문장","afternoon":"오후 에너지 두 문장","lucky_color":"색상명","lucky_crystal":"행운의 크리스털","lucky_number":7,"spell":"오늘의 주문 한 문장"}`,
  week: (p,today)=>`사주: 년주${p.year.gan}${p.year.ji} 월주${p.month.gan}${p.month.ji} 일주${p.day.gan}${p.day.ji} 시주${p.hour.gan}${p.hour.ji}. 기준일: ${today}. 달빛 마녀의 언어로 이번주 운세. JSON: {"score":75,"headline":"이번주 마법 한줄","overview":"이번주 달빛 흐름 두 문장","best_day":"마법이 강한 요일","caution_day":"조심할 요일","potion":"이번주 마법 포션","spell":"이번주 주문 한 문장"}`,
  month:(p,today)=>`사주: 년주${p.year.gan}${p.year.ji} 월주${p.month.gan}${p.month.ji} 일주${p.day.gan}${p.day.ji} 시주${p.hour.gan}${p.hour.ji}. 기준월: ${today}. 달빛 마녀의 언어로 이번달 운세. JSON: {"score":75,"headline":"이번달 마법 한줄","waxing":"초승달~보름달 흐름 두 문장","waning":"보름달~그믐달 흐름 두 문장","ritual":"이번달 의식 한 문장","caution":"조심할 것 한 문장","spell":"이번달 주문 한 문장"}`,
  work: (p)=>`사주: 년주${p.year.gan}${p.year.ji} 월주${p.month.gan}${p.month.ji} 일주${p.day.gan}${p.day.ji} 시주${p.hour.gan}${p.hour.ji}. 달빛 마녀의 언어로 직업/사업운. JSON: {"score":75,"headline":"직업 룬 한줄","power":"직업적 마법 힘 두 문장","shadow":"그림자 영역 한 문장","destiny_career":"운명의 직업","timing":"마법이 열리는 시기","spell":"직업 주문 한 문장"}`,
  love: (p,g)=>`사주: 년주${p.year.gan}${p.year.ji} 월주${p.month.gan}${p.month.ji} 일주${p.day.gan}${p.day.ji} 시주${p.hour.gan}${p.hour.ji}. 성별:${g}. 달빛 마녀의 언어로 연애운. JSON: {"score":75,"headline":"연애 마법진 한줄","love_magic":"연애 마법 스타일 두 문장","soulmate":"소울메이트 특징","moon_timing":"인연의 달 시기","caution":"사랑의 그림자 한 문장","spell":"연애 주문 한 문장"}`,
  money:(p)=>`사주: 년주${p.year.gan}${p.year.ji} 월주${p.month.gan}${p.month.ji} 일주${p.day.gan}${p.day.ji} 시주${p.hour.gan}${p.hour.ji}. 달빛 마녀의 언어로 재물운. JSON: {"score":75,"headline":"재물 수정 한줄","abundance":"풍요 에너지 두 문장","crystal_method":"재물을 부르는 수정 방법","risk":"조심할 그림자 한 문장","golden_timing":"황금 달 시기","spell":"재물 주문 한 문장"}`,
};

// ═══════════════════════════════════════════════
// 파티클 — 별·달·꽃잎
// ═══════════════════════════════════════════════
const PARTICLES=[...Array(60)].map((_,i)=>({
  id:i,
  sym:["✦","✧","·","⋆","˚","°","∗","✩","◦"][i%9],
  x:Math.random()*100, y:Math.random()*100,
  size:Math.random()*14+6,
  dur:4+Math.random()*8,
  del:Math.random()*6,
  opacity:Math.random()*.5+.1,
}));

// ═══════════════════════════════════════════════
// 보조 컴포넌트
// ═══════════════════════════════════════════════
function MoonBar({score,color}){
  const filled=Math.round(score/20);
  return(
    <div style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{fontSize:11,color:"#9b7db8",letterSpacing:2,fontFamily:"Georgia,serif"}}>달빛 에너지</span>
        <span style={{fontSize:20,color,fontFamily:"Georgia,serif"}}>{score}</span>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:6}}>
        {[...Array(5)].map((_,i)=>(
          <div key={i} style={{flex:1,height:6,borderRadius:3,
            background:i<filled?`linear-gradient(90deg,${color}88,${color})`:"rgba(155,125,184,.15)",
            boxShadow:i<filled?`0 0 8px ${color}66`:"none",transition:"all .3s"}}/>
        ))}
      </div>
      <div style={{fontSize:13,color,letterSpacing:4}}>{"🌙".repeat(filled)}{"○".repeat(5-filled)}</div>
    </div>
  );
}

function SpellRow({label,value,color="#c8b8e8",icon="✦"}){
  return(
    <div style={{marginBottom:14,paddingBottom:14,borderBottom:"1px solid rgba(155,125,184,.12)"}}>
      <div style={{fontSize:9,color:"#7a5a98",letterSpacing:3,marginBottom:5,fontFamily:"Georgia,serif"}}>
        {icon} {label}
      </div>
      <div style={{fontSize:13,color,lineHeight:1.85,fontFamily:"Georgia,serif"}}>{value}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Wrapper (App 외부 — 키보드 포커스 유지)
// ═══════════════════════════════════════════════
function MoonBG({children,canvasRef,scanY}){
  return(
    <div style={{minHeight:"100vh",
      background:"linear-gradient(160deg,#0d0618 0%,#120824 40%,#0a1020 100%)",
      color:"#e8d8f8",fontFamily:"Georgia,'Noto Serif KR',serif",
      position:"relative",overflow:"hidden",cursor:"default"}}>
      <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,opacity:.5}}/>
      {/* 파티클 */}
      {PARTICLES.map(p=>(
        <div key={p.id} style={{
          position:"fixed",left:`${p.x}%`,top:`${p.y}%`,
          fontSize:p.size,color:"rgba(220,180,255,.6)",
          pointerEvents:"none",zIndex:1,
          animation:`tw ${p.dur}s ease-in-out ${p.del}s infinite`,
          opacity:p.opacity,
        }}>{p.sym}</div>
      ))}
      {/* 달빛 오로라 */}
      <div style={{position:"fixed",top:"-30%",left:"20%",width:"60%",height:"60%",
        background:"radial-gradient(ellipse,rgba(140,80,200,.12) 0%,transparent 70%)",
        pointerEvents:"none",zIndex:1,
        animation:"auraPulse 8s ease-in-out infinite"}}/>
      <div style={{position:"fixed",bottom:"-20%",right:"10%",width:"50%",height:"50%",
        background:"radial-gradient(ellipse,rgba(80,120,200,.08) 0%,transparent 70%)",
        pointerEvents:"none",zIndex:1}}/>
      {/* 스캔라인 (달빛) */}
      <div style={{position:"fixed",left:0,right:0,height:"1px",zIndex:2,pointerEvents:"none",
        top:`${scanY}%`,background:"linear-gradient(90deg,transparent,rgba(200,160,255,.08),transparent)"}}/>
      <div style={{position:"relative",zIndex:3,maxWidth:680,margin:"0 auto",padding:"40px 20px 70px"}}>
        {children}
      </div>
      <style>{`
        @keyframes tw{0%,100%{opacity:.08;transform:scale(.9)}50%{opacity:.7;transform:scale(1.1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes auraPulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
        @keyframes moonRise{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes shimmer{0%,100%{opacity:.6}50%{opacity:1}}
        *{box-sizing:border-box}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        ::-webkit-scrollbar{width:4px;background:#0d0618}
        ::-webkit-scrollbar-thumb{background:rgba(155,125,184,.3)}
        ::placeholder{color:rgba(155,125,184,.4)}
      `}</style>
    </div>
  );
}

function MoonHeader({sub,moonPhase}){
  return(
    <div style={{textAlign:"center",marginBottom:36,animation:"moonRise .8s ease both"}}>
      <div style={{fontSize:28,marginBottom:8,animation:"shimmer 3s ease-in-out infinite"}}>{moonPhase}</div>
      <div style={{fontSize:10,letterSpacing:6,color:"#9b7db8",marginBottom:8,opacity:.8}}>
        ✦ MOONLIGHT WITCH SALON ✦
      </div>
      <h1 style={{fontSize:"clamp(24px,5vw,38px)",fontWeight:700,margin:0,
        fontFamily:"'Noto Serif KR',Georgia,serif",
        background:"linear-gradient(135deg,#e8c8ff,#f9c8e8,#c8d8f9,#e8c8ff)",
        backgroundSize:"200%",
        WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
        letterSpacing:2}}>
        달빛 마녀 살롱
      </h1>
      <div style={{fontSize:"clamp(12px,2.5vw,15px)",color:"#9b7db8",letterSpacing:3,marginTop:6,fontStyle:"italic"}}>
        {sub}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,margin:"18px 0"}}>
        <div style={{flex:1,height:"1px",background:"linear-gradient(90deg,transparent,rgba(180,140,220,.4))"}}/>
        <span style={{color:"#c8a8e8",fontSize:14}}>✦</span>
        <div style={{flex:1,height:"1px",background:"linear-gradient(90deg,rgba(180,140,220,.4),transparent)"}}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// 메인 앱
// ═══════════════════════════════════════════════
export default function MoonWitchSalon(){
  const [step,setStep]=useState("input");
  const [form,setForm]=useState({year:"",month:"",day:"",hour:"",gender:"여"});
  const [result,setResult]=useState(null);
  const [pillars,setPillars]=useState(null);
  const [error,setError]=useState("");
  const [loadText,setLoadText]=useState("");
  const [activeTab,setActiveTab]=useState("saju");
  const [cache,setCache]=useState({});
  const [tabLoading,setTabLoading]=useState(false);
  const [tabError,setTabError]=useState("");
  const [scanY,setScanY]=useState(0);
  const [moonPhase]=useState(getMoonPhase());
  const canvasRef=useRef(null);
  const animRef=useRef(null);

  // 별자리 캔버스 (달빛 파티클)
  useEffect(()=>{
    const c=canvasRef.current;if(!c)return;
    const ctx=c.getContext("2d");
    c.width=window.innerWidth;c.height=window.innerHeight;
    const stars=Array.from({length:120},()=>({
      x:Math.random()*c.width,y:Math.random()*c.height,
      r:Math.random()*1.2+.2,s:Math.random()*.15+.03,
      hue:Math.random()*60+260, // 보라~파랑
    }));
    let f=0;
    const draw=()=>{
      ctx.fillStyle="rgba(13,6,24,.18)";ctx.fillRect(0,0,c.width,c.height);
      stars.forEach(s=>{
        ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        const op=.2+Math.sin(f*.015+s.x*.01)*.15;
        ctx.fillStyle=`hsla(${s.hue},70%,80%,${op})`;ctx.fill();
        s.y+=s.s;if(s.y>c.height){s.y=0;s.x=Math.random()*c.width;}
      });
      f++;animRef.current=requestAnimationFrame(draw);
    };
    draw();return()=>cancelAnimationFrame(animRef.current);
  },[]);

  useEffect(()=>{const iv=setInterval(()=>setScanY(v=>(v+1)%100),35);return()=>clearInterval(iv);},[]);

  const runLoad=async()=>{
    const msgs=[
      "🌙 달빛 에너지 수집 중...",
      "✦ 별자리 사주 계산 중...",
      "🔮 수정구슬 활성화 중...",
      "⚗ 마법 포션 조합 중...",
      "🌿 운명의 허브 배합 중...",
      "✦ 달빛 마녀의 비밀 문서 해독 중...",
    ];
    for(let i=0;i<msgs.length;i++){setLoadText(msgs[i]);await new Promise(r=>setTimeout(r,500));}
  };

  const handleSubmit=async()=>{
    if(!form.year||!form.month||!form.day){setError("생년월일을 입력해 주세요.");return;}
    setError("");setStep("loading");runLoad();
    try{
      const p=calcSaju(form.year,form.month,form.day,form.hour||null);
      setPillars(p);
      const prompt=`생년월일시: ${form.year}년 ${form.month}월 ${form.day}일 ${form.hour?form.hour+"시":"시간 미상"}, 성별: ${form.gender}
계산된 사주 4주 (이 값 그대로 사용):
년주: ${p.year.gan}${p.year.ji} / 월주: ${p.month.gan}${p.month.ji} / 일주: ${p.day.gan}${p.day.ji} / 시주: ${p.hour.gan}${p.hour.ji}

달빛 마녀 살롱의 신비로운 언어로 해석. 반드시 JSON만:
{"title":"마법 코드명(예:MOONLIGHT-木火-WITCH)","saju_summary":"운명 한줄 15자","pillars":{"year":{"gan":"${p.year.gan}","ji":"${p.year.ji}","desc":"년주 마법 해석 한 문장"},"month":{"gan":"${p.month.gan}","ji":"${p.month.ji}","desc":"월주 마법 해석 한 문장"},"day":{"gan":"${p.day.gan}","ji":"${p.day.ji}","desc":"일주 마법 해석 한 문장"},"hour":{"gan":"${p.hour.gan}","ji":"${p.hour.ji}","desc":"시주 마법 해석 한 문장"}},"elements":{"wood":20,"fire":20,"earth":20,"metal":20,"water":20},"dominant_element":"wood","moon_reading":["달빛 메시지1","달빛 메시지2","달빛 메시지3","달빛 메시지4"],"soul_mission":"영혼 미션 한 문장","shadow":"그림자 주의 한 문장","lucky_crystal":"행운의 수정 이름","spell":"이 사람을 위한 마법 주문 한 문장"}`;

      const parsed=await callClaude(prompt);
      // 4주 강제 덮어쓰기
      if(!parsed.pillars)parsed.pillars={};
      ["year","month","day","hour"].forEach(k=>{
        if(!parsed.pillars[k])parsed.pillars[k]={};
        parsed.pillars[k].gan=p[k].gan;
        parsed.pillars[k].ji=p[k].ji;
      });
      setResult(parsed);setActiveTab("saju");setCache({});setStep("result");
    }catch(e){setError("마법 연결 실패: "+e.message);setStep("input");}
  };

  const handleTab=async(id)=>{
    setActiveTab(id);
    if(id==="saju"||cache[id]||!pillars)return;
    setTabLoading(true);setTabError("");
    const today=getToday();
    const fn=FORTUNE_PROMPTS[id];
    const prompt=id==="love"?fn(pillars,form.gender):(id==="today"||id==="week"||id==="month")?fn(pillars,today):fn(pillars);
    try{const d=await callClaude(prompt);setCache(prev=>({...prev,[id]:d}));}
    catch(e){setTabError("마법 연결 실패: "+e.message);}
    setTabLoading(false);
  };

  const reset=()=>{setStep("input");setResult(null);setPillars(null);setCache({});setActiveTab("saju");setForm({year:"",month:"",day:"",hour:"",gender:"여"});setError("");};

  // ── 입력 스타일 (v5 동일 구조 유지, 달빛 테마 적용) ──
  const inputStyle={
    width:"100%",
    background:"rgba(30,10,50,.7)",
    border:"1px solid rgba(155,125,184,.3)",
    color:"#e8d8f8",
    padding:"11px 14px",fontSize:15,outline:"none",
    fontFamily:"Georgia,serif",borderRadius:2,boxSizing:"border-box",
  };

  // ══════════════════ INPUT ══════════════════
  if(step==="input")return(
    <MoonBG canvasRef={canvasRef} scanY={scanY}>
      <MoonHeader sub="사주 · 달빛 운명 리딩" moonPhase={moonPhase}/>
      <div style={{background:"rgba(20,8,38,.82)",border:"1px solid rgba(155,125,184,.22)",
        borderRadius:4,padding:"32px 28px",
        boxShadow:"0 0 60px rgba(120,60,180,.12),inset 0 0 40px rgba(80,20,120,.08)"}}>
        <div style={{fontSize:11,color:"#c8a8e8",letterSpacing:4,marginBottom:24,fontStyle:"italic"}}>
          ✦ 당신의 별자리 좌표를 알려주세요
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          {[["태어난 해","year","예) 1995"],["태어난 달","month","1 ~ 12"],
            ["태어난 날","day","1 ~ 31"],["태어난 시각","hour","0 ~ 23 (선택)"]].map(([lbl,key,ph])=>(
            <div key={key}>
              <div style={{fontSize:10,color:"#9b7db8",letterSpacing:2,marginBottom:6,fontStyle:"italic"}}>{lbl}</div>
              <input type="number" placeholder={ph} value={form[key]}
                onChange={e=>setForm({...form,[key]:e.target.value})}
                style={inputStyle}
                onFocus={e=>{e.target.style.borderColor="#c8a8e8";e.target.style.boxShadow="0 0 12px rgba(200,168,232,.2)";}}
                onBlur={e=>{e.target.style.borderColor="rgba(155,125,184,.3)";e.target.style.boxShadow="none";}}
              />
            </div>
          ))}
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:10,color:"#9b7db8",letterSpacing:2,marginBottom:8,fontStyle:"italic"}}>달의 성별</div>
          <div style={{display:"flex",gap:10}}>
            {["여","남"].map(g=>(
              <button key={g} onClick={()=>setForm({...form,gender:g})} style={{
                flex:1,padding:"12px 0",fontFamily:"Georgia,serif",fontSize:16,letterSpacing:6,
                cursor:"pointer",borderRadius:2,transition:"all .25s",
                background:form.gender===g?"rgba(155,125,184,.2)":"rgba(20,8,38,.6)",
                border:form.gender===g?"1px solid #c8a8e8":"1px solid rgba(155,125,184,.2)",
                color:form.gender===g?"#e8d8f8":"#6a4a88",
              }}>{g}</button>
            ))}
          </div>
        </div>
        {error&&(
          <div style={{background:"rgba(80,10,30,.6)",border:"1px solid rgba(220,100,140,.3)",
            padding:"12px 16px",marginBottom:16,fontSize:12,color:"#f4aac0",lineHeight:1.8,fontStyle:"italic"}}>
            🌙 {error}
          </div>
        )}
        <button onClick={handleSubmit} style={{
          width:"100%",padding:"15px 0",background:"transparent",cursor:"pointer",
          border:"1px solid rgba(200,168,232,.5)",color:"#e8d8f8",
          fontSize:13,letterSpacing:5,fontFamily:"Georgia,serif",fontStyle:"italic",
          transition:"all .3s",borderRadius:2,
        }}
          onMouseEnter={e=>{e.target.style.background="rgba(155,125,184,.15)";e.target.style.boxShadow="0 0 24px rgba(200,168,232,.25)";e.target.style.borderColor="#e8d8f8";}}
          onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.boxShadow="none";e.target.style.borderColor="rgba(200,168,232,.5)";}}>
          ✦ 달빛 운명 읽기 시작 ✦
        </button>
      </div>
      <div style={{textAlign:"center",marginTop:24,fontSize:11,color:"rgba(155,125,184,.4)",letterSpacing:3,fontStyle:"italic"}}>
        오늘의 달 {moonPhase} · {getToday()}
      </div>
    </MoonBG>
  );

  // ══════════════════ LOADING ══════════════════
  if(step==="loading")return(
    <MoonBG canvasRef={canvasRef} scanY={scanY}>
      <MoonHeader sub="마법 의식 진행 중..." moonPhase={moonPhase}/>
      <div style={{textAlign:"center",padding:"50px 20px"}}>
        {/* 달빛 스피너 */}
        <div style={{position:"relative",width:140,height:140,margin:"0 auto 32px"}}>
          <div style={{position:"absolute",inset:0,borderRadius:"50%",
            border:"1px solid rgba(200,168,232,.15)",borderTop:"1px solid #c8a8e8",
            animation:"spin 3s linear infinite"}}/>
          <div style={{position:"absolute",inset:14,borderRadius:"50%",
            border:"1px solid rgba(249,200,232,.1)",borderRight:"1px solid #f9c8e8",
            animation:"spin 2s linear infinite reverse"}}/>
          <div style={{position:"absolute",inset:28,borderRadius:"50%",
            border:"1px solid rgba(200,216,249,.1)",borderBottom:"1px solid #c8d8f9",
            animation:"spin 4s linear infinite"}}/>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:36,animation:"shimmer 2s ease-in-out infinite"}}>
            {moonPhase}
          </div>
        </div>
        <div style={{fontSize:14,color:"#c8a8e8",letterSpacing:2,minHeight:26,fontStyle:"italic"}}>{loadText}</div>
        <div style={{marginTop:12,fontSize:12,color:"rgba(155,125,184,.5)",letterSpacing:1,fontStyle:"italic"}}>
          달빛 마녀가 당신의 운명을 읽고 있습니다
        </div>
      </div>
    </MoonBG>
  );

  // ══════════════════ RESULT ══════════════════
  if(step==="result"&&result){
    const activeTabInfo=TABS.find(t=>t.id===activeTab);
    return(
      <MoonBG canvasRef={canvasRef} scanY={scanY}>
        <MoonHeader sub="운명 리딩 완료" moonPhase={moonPhase}/>

        {/* 마법 코드 카드 */}
        <div style={{background:"rgba(20,8,38,.9)",
          border:"1px solid rgba(200,168,232,.25)",
          borderRadius:4,padding:"20px 24px",marginBottom:16,
          boxShadow:"0 0 40px rgba(120,60,180,.15)"}}>
          <div style={{fontSize:9,color:"#7a5a98",letterSpacing:4,marginBottom:8,fontStyle:"italic"}}>✦ SPELL CODE</div>
          <div style={{fontSize:"clamp(13px,3vw,17px)",color:"#f0d8ff",letterSpacing:2,fontWeight:700,fontStyle:"italic"}}>
            {result.title}
          </div>
          <div style={{marginTop:8,fontSize:13,color:"#b8a0d0",fontStyle:"italic"}}>{result.saju_summary}</div>
          <div style={{marginTop:10,display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:12,color:"#9b7db8",fontStyle:"italic"}}>행운의 수정:</span>
            <span style={{fontSize:13,color:"#f9c8e8"}}>💎 {result.lucky_crystal}</span>
          </div>
        </div>

        {/* 탭 바 */}
        <div style={{display:"flex",overflowX:"auto",borderBottom:"1px solid rgba(155,125,184,.15)",marginBottom:14,
          scrollbarWidth:"none"}}>
          {TABS.map(tab=>{
            const isA=activeTab===tab.id;
            return(
              <button key={tab.id} onClick={()=>handleTab(tab.id)} style={{
                flex:"0 0 auto",padding:"10px 13px",
                background:isA?`${tab.color}12`:"transparent",
                border:"none",
                borderBottom:isA?`2px solid ${tab.color}`:"2px solid transparent",
                color:isA?tab.color:"rgba(155,125,184,.5)",
                cursor:"pointer",fontFamily:"Georgia,serif",
                fontSize:"clamp(9px,2vw,11px)",letterSpacing:1,
                whiteSpace:"nowrap",transition:"all .2s",fontStyle:"italic",
              }}>
                {tab.icon} {tab.label}
                {cache[tab.id]&&tab.id!=="saju"&&<span style={{marginLeft:3,fontSize:7,color:"#c8a8e8"}}>✦</span>}
              </button>
            );
          })}
        </div>

        {/* 탭 컨텐츠 */}
        <div style={{background:"rgba(16,6,30,.88)",
          border:`1px solid ${activeTabInfo?.color||"#c8a8e8"}18`,
          borderRadius:4,padding:"22px 24px",animation:"moonRise .3s ease"}}>

          {/* ── 사주의 별자리 ── */}
          {activeTab==="saju"&&(<div>
            <div style={{fontSize:10,color:"#9b7db8",letterSpacing:3,marginBottom:16,fontStyle:"italic"}}>✦ 사주의 별자리 · 네 개의 기둥</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:18}}>
              {Object.entries(result.pillars).map(([key,val])=>(
                <div key={key} style={{
                  background:"rgba(30,10,50,.7)",
                  border:"1px solid rgba(155,125,184,.18)",
                  borderRadius:4,padding:16,
                  boxShadow:"inset 0 0 20px rgba(80,20,120,.08)"}}>
                  <div style={{fontSize:9,color:"#7a5a98",letterSpacing:2,marginBottom:8,fontStyle:"italic"}}>
                    {PK[key]} · {key.toUpperCase()}
                  </div>
                  <div style={{fontSize:30,letterSpacing:10,color:"#f0d8ff",marginBottom:8,
                    textShadow:"0 0 20px rgba(200,168,232,.4)"}}>{val.gan}{val.ji}</div>
                  <div style={{fontSize:11,color:"#b8a0d0",lineHeight:1.8,fontStyle:"italic"}}>{val.desc}</div>
                </div>
              ))}
            </div>

            {/* 오행 스펙트럼 */}
            <div style={{background:"rgba(20,8,38,.6)",border:"1px solid rgba(155,125,184,.12)",
              borderRadius:4,padding:"16px 20px",marginBottom:16}}>
              <div style={{fontSize:10,color:"#9b7db8",letterSpacing:3,marginBottom:14,fontStyle:"italic"}}>
                ✦ 오행의 마법 균형
              </div>
              {Object.entries(result.elements||{}).map(([el,val])=>(
                <div key={el} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,color:EC[el],fontStyle:"italic"}}>
                      {EK[el]} {EKR[el]}
                    </span>
                    <span style={{fontSize:11,color:"rgba(155,125,184,.6)"}}>{val}%</span>
                  </div>
                  <div style={{height:4,background:"rgba(255,255,255,.04)",borderRadius:2}}>
                    <div style={{height:"100%",width:`${val}%`,borderRadius:2,
                      background:`linear-gradient(90deg,${EC[el]}55,${EC[el]})`,
                      boxShadow:`0 0 8px ${EC[el]}44`}}/>
                  </div>
                </div>
              ))}
              <div style={{marginTop:12,fontSize:12,color:"#f0d8ff",fontStyle:"italic",letterSpacing:2}}>
                주도 원소: {EK[result.dominant_element?.toLowerCase()]||"—"} {EKR[result.dominant_element?.toLowerCase()]||""}
              </div>
            </div>

            {/* 달빛 메시지 */}
            <div style={{background:"rgba(20,8,38,.6)",border:"1px solid rgba(155,125,184,.12)",borderRadius:4,padding:"16px 20px",marginBottom:16}}>
              <div style={{fontSize:10,color:"#9b7db8",letterSpacing:3,marginBottom:14,fontStyle:"italic"}}>✦ 달빛의 메시지</div>
              {(result.moon_reading||[]).map((msg,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:10}}>
                  <span style={{color:"#c8a8e8",fontSize:12,minWidth:20}}>{MOON_PHASES[i*2]}</span>
                  <span style={{fontSize:12,color:"#b8a0d0",lineHeight:1.8,fontStyle:"italic"}}>{msg}</span>
                </div>
              ))}
            </div>

            {/* 영혼 미션 */}
            <div style={{background:"rgba(40,10,60,.5)",border:"1px solid rgba(200,168,232,.18)",
              borderRadius:4,padding:"16px 20px",marginBottom:16,
              boxShadow:"0 0 20px rgba(120,60,180,.08)"}}>
              <div style={{fontSize:10,color:"#c8a8e8",letterSpacing:3,marginBottom:10,fontStyle:"italic"}}>✦ 영혼의 미션</div>
              <div style={{fontSize:13,color:"#f0d8ff",lineHeight:1.9,fontStyle:"italic"}}>{result.soul_mission}</div>
            </div>

            {/* 그림자 + 주문 */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{background:"rgba(30,5,20,.7)",border:"1px solid rgba(220,100,140,.18)",borderRadius:4,padding:14}}>
                <div style={{fontSize:9,color:"#d4708a",letterSpacing:2,marginBottom:6,fontStyle:"italic"}}>🌑 그림자 주의</div>
                <div style={{fontSize:11,color:"#e8b8c8",lineHeight:1.7,fontStyle:"italic"}}>{result.shadow}</div>
              </div>
              <div style={{background:"rgba(20,10,40,.7)",border:"1px solid rgba(200,168,232,.18)",borderRadius:4,padding:14}}>
                <div style={{fontSize:9,color:"#c8a8e8",letterSpacing:2,marginBottom:6,fontStyle:"italic"}}>✨ 마법 주문</div>
                <div style={{fontSize:11,color:"#f0d8ff",lineHeight:1.7,fontStyle:"italic"}}>"{result.spell}"</div>
              </div>
            </div>
          </div>)}

          {/* ── 운세 탭 공통 ── */}
          {activeTab!=="saju"&&(<div>
            {tabLoading&&(
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{width:50,height:50,margin:"0 auto 16px",borderRadius:"50%",
                  border:`1px solid ${activeTabInfo?.color}33`,borderTop:`1px solid ${activeTabInfo?.color}`,
                  animation:"spin 2s linear infinite"}}/>
                <div style={{fontSize:12,color:activeTabInfo?.color,letterSpacing:2,fontStyle:"italic"}}>
                  {activeTabInfo?.icon} {activeTabInfo?.label} 마법 읽는 중...
                </div>
              </div>
            )}
            {tabError&&<div style={{background:"rgba(80,10,30,.6)",border:"1px solid rgba(220,100,140,.3)",
              padding:12,fontSize:12,color:"#f4aac0",fontStyle:"italic"}}>🌑 {tabError}</div>}
            {cache[activeTab]&&!tabLoading&&(()=>{
              const td=cache[activeTab];
              const tc=activeTabInfo;
              return(<div>
                <div style={{fontSize:10,color:tc?.color,letterSpacing:3,marginBottom:14,fontStyle:"italic"}}>
                  {tc?.icon} {tc?.label} · {getToday()} 기준
                </div>
                <MoonBar score={td.score||70} color={tc?.color||"#c8a8e8"}/>
                <div style={{background:`${tc?.color}0e`,border:`1px solid ${tc?.color}25`,
                  borderRadius:3,padding:"12px 16px",marginBottom:14,borderLeft:`2px solid ${tc?.color}`}}>
                  <div style={{fontSize:14,color:tc?.color,fontWeight:700,fontStyle:"italic"}}>{td.headline}</div>
                </div>
                {activeTab==="today"&&<>
                  <SpellRow icon="☀" label="오전의 달빛" value={td.morning}/>
                  <SpellRow icon="🌆" label="오후의 달빛" value={td.afternoon}/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,margin:"14px 0"}}>
                    {[["색상",td.lucky_color,"🌸"],["수정",td.lucky_crystal,"💎"],["숫자",td.lucky_number,"✦"]].map(([l,v,ic])=>(
                      <div key={l} style={{background:"rgba(30,10,50,.6)",border:"1px solid rgba(155,125,184,.18)",borderRadius:3,padding:"10px 8px",textAlign:"center"}}>
                        <div style={{fontSize:9,color:"#7a5a98",letterSpacing:1,marginBottom:4,fontStyle:"italic"}}>{ic} {l}</div>
                        <div style={{fontSize:13,color:tc?.color,fontStyle:"italic"}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <SpellRow icon="✨" label="오늘의 주문" value={`"${td.spell}"`} color="#f0d8ff"/>
                </>}
                {activeTab==="week"&&<>
                  <SpellRow icon="☽" label="이번주 달빛 흐름" value={td.overview}/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"14px 0"}}>
                    <div style={{background:"rgba(20,30,10,.6)",border:"1px solid rgba(134,239,172,.2)",borderRadius:3,padding:12}}>
                      <div style={{fontSize:9,color:"#7a5a98",marginBottom:4,fontStyle:"italic"}}>🌕 마법이 강한 날</div>
                      <div style={{fontSize:14,color:"#86efac",fontStyle:"italic"}}>{td.best_day}</div>
                    </div>
                    <div style={{background:"rgba(30,10,20,.6)",border:"1px solid rgba(252,165,165,.2)",borderRadius:3,padding:12}}>
                      <div style={{fontSize:9,color:"#7a5a98",marginBottom:4,fontStyle:"italic"}}>🌑 조심할 날</div>
                      <div style={{fontSize:14,color:"#fca5a5",fontStyle:"italic"}}>{td.caution_day}</div>
                    </div>
                  </div>
                  <SpellRow icon="⚗" label="이번주 포션" value={td.potion} color={tc?.color}/>
                  <SpellRow icon="✨" label="이번주 주문" value={`"${td.spell}"`} color="#f0d8ff"/>
                </>}
                {activeTab==="month"&&<>
                  <SpellRow icon="🌒" label="초승달~보름달 (상반월)" value={td.waxing}/>
                  <SpellRow icon="🌘" label="보름달~그믐달 (하반월)" value={td.waning}/>
                  <SpellRow icon="🕯" label="이번달 의식" value={td.ritual} color={tc?.color}/>
                  <SpellRow icon="🌑" label="그림자 주의" value={td.caution} color="#fca5a5"/>
                  <SpellRow icon="✨" label="이번달 주문" value={`"${td.spell}"`} color="#f0d8ff"/>
                </>}
                {activeTab==="work"&&<>
                  <SpellRow icon="⚗" label="직업 마법의 힘" value={td.power}/>
                  <SpellRow icon="🌑" label="그림자 영역" value={td.shadow} color="#fca5a5"/>
                  <SpellRow icon="✦" label="운명의 직업" value={td.destiny_career} color={tc?.color}/>
                  <SpellRow icon="☽" label="마법이 열리는 시기" value={td.timing} color="#86efac"/>
                  <SpellRow icon="✨" label="직업 주문" value={`"${td.spell}"`} color="#f0d8ff"/>
                </>}
                {activeTab==="love"&&<>
                  <SpellRow icon="♡" label="연애 마법 스타일" value={td.love_magic}/>
                  <SpellRow icon="🌙" label="소울메이트 특징" value={td.soulmate} color={tc?.color}/>
                  <SpellRow icon="☽" label="인연의 달 시기" value={td.moon_timing} color="#86efac"/>
                  <SpellRow icon="🌑" label="사랑의 그림자" value={td.caution} color="#fca5a5"/>
                  <SpellRow icon="✨" label="연애 주문" value={`"${td.spell}"`} color="#f0d8ff"/>
                </>}
                {activeTab==="money"&&<>
                  <SpellRow icon="💫" label="풍요 에너지" value={td.abundance}/>
                  <SpellRow icon="💎" label="재물을 부르는 수정" value={td.crystal_method} color={tc?.color}/>
                  <SpellRow icon="🌑" label="조심할 그림자" value={td.risk} color="#fca5a5"/>
                  <SpellRow icon="🌕" label="황금 달 시기" value={td.golden_timing} color="#fde68a"/>
                  <SpellRow icon="✨" label="재물 주문" value={`"${td.spell}"`} color="#f0d8ff"/>
                </>}
              </div>);
            })()}
          </div>)}
        </div>

        <button onClick={reset} style={{
          width:"100%",marginTop:14,padding:"12px 0",background:"transparent",
          border:"1px solid rgba(155,125,184,.2)",color:"rgba(155,125,184,.5)",
          fontSize:11,letterSpacing:4,cursor:"pointer",fontFamily:"Georgia,serif",
          fontStyle:"italic",borderRadius:2,transition:"all .2s",
        }}
          onMouseEnter={e=>{e.target.style.borderColor="rgba(200,168,232,.5)";e.target.style.color="#c8a8e8";}}
          onMouseLeave={e=>{e.target.style.borderColor="rgba(155,125,184,.2)";e.target.style.color="rgba(155,125,184,.5)";}}>
          ✦ 새로운 운명 읽기
        </button>
        <div style={{textAlign:"center",marginTop:24,fontSize:10,color:"rgba(155,125,184,.3)",letterSpacing:3,fontStyle:"italic"}}>
          MOONLIGHT WITCH SALON · {getToday()}
        </div>
      </MoonBG>
    );
  }
  return null;
}
