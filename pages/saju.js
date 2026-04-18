import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// 사주 4주 계산 엔진
// ─────────────────────────────────────────────────────────────
const CG = ["갑","을","병","정","무","기","경","신","임","계"];
const JJ = ["자","축","인","묘","진","사","오","미","신","유","술","해"];

function getYearPillar(y, m, d) {
  let yr = y;
  if (m < 2 || (m === 2 && d < 4)) yr--;
  const idx = ((yr - 1984) % 60 + 600) % 60;
  return { gan: CG[idx % 10], ji: JJ[idx % 12], ganIdx: idx % 10 };
}
function getMonthPillar(yearGanIdx, m) {
  const jiBase = [1,2,3,4,5,6,7,8,9,10,11,0];
  const jiIdx  = jiBase[m - 1];
  const ganStart = [2,4,6,8,0][yearGanIdx % 5];
  const ganIdx   = (ganStart + ((jiIdx - 2 + 12) % 12)) % 10;
  return { gan: CG[ganIdx], ji: JJ[jiIdx] };
}
function getDayPillar(y, m, d) {
  const days = Math.round((new Date(y, m-1, d) - new Date(1900, 0, 1)) / 86400000);
  const idx  = ((days + 10) % 60 + 60) % 60;
  return { gan: CG[idx % 10], ji: JJ[idx % 12], ganIdx: idx % 10 };
}
function getHourPillar(dayGanIdx, hour) {
  if (!hour && hour !== 0) return { gan: "?", ji: "?" };
  const h = Number(hour);
  const jiIdx  = h === 23 ? 0 : Math.floor((h + 1) / 2) % 12;
  const ganIdx = ([0,2,4,6,8][dayGanIdx % 5] + jiIdx) % 10;
  return { gan: CG[ganIdx], ji: JJ[jiIdx] };
}
function calcSaju(year, month, day, hour) {
  const y = Number(year), m = Number(month), d = Number(day);
  const yearP  = getYearPillar(y, m, d);
  const monthP = getMonthPillar(yearP.ganIdx, m);
  const dayP   = getDayPillar(y, m, d);
  const hourP  = hour ? getHourPillar(dayP.ganIdx, hour) : { gan: "?", ji: "?" };
  return { year: yearP, month: monthP, day: dayP, hour: hourP };
}

// ─────────────────────────────────────────────────────────────
// 탭 설정
// ─────────────────────────────────────────────────────────────
const TABS = [
  { id:"saju",  label:"사주기본", icon:"◈", color:"#00d4ff" },
  { id:"today", label:"오늘운세", icon:"☀", color:"#ffd060" },
  { id:"week",  label:"이번주",   icon:"📅", color:"#a78bfa" },
  { id:"month", label:"이번달",   icon:"🌙", color:"#38bdf8" },
  { id:"work",  label:"직장운",   icon:"⚙", color:"#4ade80" },
  { id:"love",  label:"연애운",   icon:"♥", color:"#f472b6" },
  { id:"money", label:"재물운",   icon:"◆", color:"#fbbf24" },
];

const FORTUNE_PROMPTS = {
  today: (saju, today) => `사주: 년주${saju.year.gan}${saju.year.ji} 월주${saju.month.gan}${saju.month.ji} 일주${saju.day.gan}${saju.day.ji} 시주${saju.hour.gan}${saju.hour.ji}. 오늘 날짜: ${today}. 오늘 하루 운세를 안티그래비티 세계관 언어로 분석해줘. 순수 JSON만: {"score":75,"headline":"오늘운세 한줄","morning":"오전 운세 두 문장","afternoon":"오후 운세 두 문장","lucky_color":"색상명","lucky_number":7,"advice":"오늘의 조언 한 문장"}`,
  week:  (saju, today) => `사주: 년주${saju.year.gan}${saju.year.ji} 월주${saju.month.gan}${saju.month.ji} 일주${saju.day.gan}${saju.day.ji} 시주${saju.hour.gan}${saju.hour.ji}. 기준일: ${today}. 이번주 운세를 안티그래비티 세계관 언어로. 순수 JSON만: {"score":75,"headline":"이번주 한줄","overview":"이번주 전체 흐름 두 문장","best_day":"가장 좋은 요일","worst_day":"조심할 요일","focus":"이번주 집중 키워드","advice":"이번주 조언 한 문장"}`,
  month: (saju, today) => `사주: 년주${saju.year.gan}${saju.year.ji} 월주${saju.month.gan}${saju.month.ji} 일주${saju.day.gan}${saju.day.ji} 시주${saju.hour.gan}${saju.hour.ji}. 기준월: ${today}. 이번달 운세를 안티그래비티 세계관 언어로. 순수 JSON만: {"score":75,"headline":"이번달 한줄","first_half":"상반월 흐름 두 문장","second_half":"하반월 흐름 두 문장","opportunity":"이번달 기회 한 문장","caution":"이번달 주의 한 문장","advice":"이번달 조언 한 문장"}`,
  work:  (saju) => `사주: 년주${saju.year.gan}${saju.year.ji} 월주${saju.month.gan}${saju.month.ji} 일주${saju.day.gan}${saju.day.ji} 시주${saju.hour.gan}${saju.hour.ji}. 직장운/사업운을 안티그래비티 세계관 언어로. 순수 JSON만: {"score":75,"headline":"직장운 한줄","strength":"직업적 강점 두 문장","weakness":"주의할 점 한 문장","best_career":"어울리는 직종","timing":"좋은 시기","advice":"직장운 조언 한 문장"}`,
  love:  (saju) => `사주: 년주${saju.year.gan}${saju.year.ji} 월주${saju.month.gan}${saju.month.ji} 일주${saju.day.gan}${saju.day.ji} 시주${saju.hour.gan}${saju.hour.ji}. 연애운/결혼운을 안티그래비티 세계관 언어로. 순수 JSON만: {"score":75,"headline":"연애운 한줄","personality":"연애 스타일 두 문장","ideal_partner":"이상형 특징","timing":"인연 시기","caution":"조심할 점 한 문장","advice":"연애 조언 한 문장"}`,
  money: (saju) => `사주: 년주${saju.year.gan}${saju.year.ji} 월주${saju.month.gan}${saju.month.ji} 일주${saju.day.gan}${saju.day.ji} 시주${saju.hour.gan}${saju.hour.ji}. 재물운/금전운을 안티그래비티 세계관 언어로. 순수 JSON만: {"score":75,"headline":"재물운 한줄","pattern":"재물 흐름 패턴 두 문장","best_investment":"맞는 투자 성향","risk":"조심할 것 한 문장","timing":"재물 운이 좋은 시기","advice":"재물운 조언 한 문장"}`,
};

const EC = { wood:"#4ade80", fire:"#f97316", earth:"#eab308", metal:"#94a3b8", water:"#38bdf8" };
const EK = { wood:"木", fire:"火", earth:"土", metal:"金", water:"水" };

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;
}

async function callClaude(prompt) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: "당신은 안티그래비티 프로그램 제작기의 우주 운명 해석 AI입니다. 마크다운 코드블록 없이 순수 JSON만 출력하세요. 큰따옴표는 JSON 구조에만 사용하세요.",
      user: prompt,
      tokens: 4000,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "API 오류");
  return data.data;
}

// ─────────────────────────────────────────────────────────────
// 점수 게이지
// ─────────────────────────────────────────────────────────────
function ScoreGauge({ score, color }) {
  const grade = score >= 90 ? "◆◆◆◆◆" : score >= 75 ? "◆◆◆◆◇" : score >= 60 ? "◆◆◆◇◇" : score >= 45 ? "◆◆◇◇◇" : "◆◇◇◇◇";
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:11, color:"#5b8ccc", letterSpacing:2 }}>FORTUNE SCORE</span>
        <span style={{ fontSize:18, color, fontWeight:700 }}>{score}</span>
      </div>
      <div style={{ height:6, background:"rgba(255,255,255,.06)", borderRadius:3 }}>
        <div style={{ height:"100%", width:`${score}%`, borderRadius:3,
          background:`linear-gradient(90deg, ${color}66, ${color})`,
          boxShadow:`0 0 10px ${color}66`, transition:"width 1s ease" }}/>
      </div>
      <div style={{ marginTop:6, fontSize:14, color, letterSpacing:4 }}>{grade}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 운세 카드 행
// ─────────────────────────────────────────────────────────────
function FortuneRow({ label, value, color="#8ab0d0" }) {
  return (
    <div style={{ marginBottom:12, borderBottom:"1px solid rgba(0,100,180,.12)", paddingBottom:12 }}>
      <div style={{ fontSize:9, color:"#5b8ccc", letterSpacing:3, marginBottom:5 }}>{label}</div>
      <div style={{ fontSize:13, color, lineHeight:1.75 }}>{value}</div>
    </div>
  );
}

export default function AntiGravitySaju() {
  const [step, setStep]           = useState("input");
  const [form, setForm]           = useState({ year:"", month:"", day:"", hour:"", gender:"남" });
  const [result, setResult]       = useState(null);
  const [sajuPillars, setSajuPillars] = useState(null);
  const [error, setError]         = useState("");
  const [loadingText, setLoadingText] = useState("");
  const [glitchActive, setGlitchActive] = useState(false);
  const [scanLine, setScanLine]   = useState(0);
  const [activeTab, setActiveTab] = useState("saju");
  const [fortuneCache, setFortuneCache] = useState({});
  const [fortuneLoading, setFortuneLoading] = useState(false);
  const [fortuneError, setFortuneError] = useState("");
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const stars = Array.from({length:180}, () => ({
      x: Math.random()*canvas.width, y: Math.random()*canvas.height,
      r: Math.random()*1.5+0.2, speed: Math.random()*0.3+0.05,
    }));
    let frame = 0;
    const draw = () => {
      ctx.fillStyle = "rgba(2,4,18,0.25)"; ctx.fillRect(0,0,canvas.width,canvas.height);
      stars.forEach(s => {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(180,210,255,${0.3+Math.sin(frame*0.02+s.x)*0.2})`; ctx.fill();
        s.y += s.speed; if (s.y > canvas.height) { s.y=0; s.x=Math.random()*canvas.width; }
      });
      frame++; animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  useEffect(() => { const iv=setInterval(()=>setScanLine(v=>(v+2)%100),30); return ()=>clearInterval(iv); }, []);
  useEffect(() => {
    const iv=setInterval(()=>{ setGlitchActive(true); setTimeout(()=>setGlitchActive(false),180); },4500);
    return ()=>clearInterval(iv);
  }, []);

  const runLoading = async () => {
    const msgs=["▶ ANTI-GRAVITY ENGINE BOOT...","▶ 천간지지 데이터 스캔 중...","▶ 오행 벡터 계산 중...","▶ 운명 궤도 최적화...","▶ 사주 중력장 해제 중...","▶ DESTINY PROTOCOL 실행..."];
    for (let i=0;i<msgs.length;i++) { setLoadingText(msgs[i]); await new Promise(r=>setTimeout(r,520)); }
  };

  const handleSubmit = async () => {
    if (!form.year||!form.month||!form.day) { setError("생년월일을 입력하세요."); return; }
    setError(""); setStep("loading"); runLoading();
    try {
      const pillarsCalc = calcSaju(form.year, form.month, form.day, form.hour||null);
      setSajuPillars(pillarsCalc);
      const userMsg = `생년월일시: ${form.year}년 ${form.month}월 ${form.day}일 ${form.hour?form.hour+"시":"시간 미상"}, 성별: ${form.gender}
계산된 사주 4주 (이 값 그대로 사용):
- 년주: ${pillarsCalc.year.gan}${pillarsCalc.year.ji}
- 월주: ${pillarsCalc.month.gan}${pillarsCalc.month.ji}
- 일주: ${pillarsCalc.day.gan}${pillarsCalc.day.ji}
- 시주: ${pillarsCalc.hour.gan}${pillarsCalc.hour.ji}
위 4주를 기반으로 해석해주세요.`;

      const parsed = await callClaude(
        userMsg + `\n\n반드시 이 JSON 형식으로만: {"title":"코드명","saju_summary":"한줄요약15자","pillars":{"year":{"gan":"${pillarsCalc.year.gan}","ji":"${pillarsCalc.year.ji}","desc":"년주해석한문장"},"month":{"gan":"${pillarsCalc.month.gan}","ji":"${pillarsCalc.month.ji}","desc":"월주해석한문장"},"day":{"gan":"${pillarsCalc.day.gan}","ji":"${pillarsCalc.day.ji}","desc":"일주해석한문장"},"hour":{"gan":"${pillarsCalc.hour.gan}","ji":"${pillarsCalc.hour.ji}","desc":"시주해석한문장"}},"elements":{"wood":0,"fire":0,"earth":0,"metal":0,"water":0},"dominant_element":"wood","destiny_log":["로그1","로그2","로그3","로그4"],"life_mission":"인생미션한문장","caution":"주의사항한문장","lucky_code":"GRAVITY-NULL-0000"}`
      );
      parsed.pillars.year.gan=pillarsCalc.year.gan; parsed.pillars.year.ji=pillarsCalc.year.ji;
      parsed.pillars.month.gan=pillarsCalc.month.gan; parsed.pillars.month.ji=pillarsCalc.month.ji;
      parsed.pillars.day.gan=pillarsCalc.day.gan; parsed.pillars.day.ji=pillarsCalc.day.ji;
      if (form.hour) { parsed.pillars.hour.gan=pillarsCalc.hour.gan; parsed.pillars.hour.ji=pillarsCalc.hour.ji; }
      setResult(parsed); setActiveTab("saju"); setFortuneCache({}); setStep("result");
    } catch(e) { setError("분석 오류: "+e.message); setStep("input"); }
  };

  // 탭 클릭 시 운세 API 호출 (캐시 있으면 스킵)
  const handleTabClick = async (tabId) => {
    setActiveTab(tabId);
    if (tabId === "saju" || fortuneCache[tabId]) return;
    if (!sajuPillars) return;
    setFortuneLoading(true); setFortuneError("");
    try {
      const today = getToday();
      const promptFn = FORTUNE_PROMPTS[tabId];
      const prompt = (tabId==="work"||tabId==="love"||tabId==="money")
        ? promptFn(sajuPillars)
        : promptFn(sajuPillars, today);
      const data = await callClaude(prompt);
      setFortuneCache(prev => ({ ...prev, [tabId]: data }));
    } catch(e) { setFortuneError("운세 로딩 실패: "+e.message); }
    setFortuneLoading(false);
  };

  const pillarLabels = { year:"년주", month:"월주", day:"일주", hour:"시주" };

  const renderFortuneTab = (tabId) => {
    const tab = TABS.find(t=>t.id===tabId);
    const color = tab?.color || "#00d4ff";
    if (fortuneLoading) return (
      <div style={{textAlign:"center",padding:"40px 0"}}>
        <div style={{width:60,height:60,margin:"0 auto 16px",borderRadius:"50%",
          border:"2px solid rgba(0,170,255,.2)",borderTop:`2px solid ${color}`,animation:"spin 1s linear infinite"}}/>
        <div style={{fontSize:12,color,letterSpacing:2}}>▶ {tab?.label} 분석 중...</div>
      </div>
    );
    if (fortuneError) return (
      <div style={{background:"rgba(80,0,0,.5)",border:"1px solid rgba(255,80,80,.4)",padding:"14px 16px",fontSize:12,color:"#ff9999"}}>
        ⚠ {fortuneError}
      </div>
    );
    const d = fortuneCache[tabId];
    if (!d) return null;

    return (
      <div>
        <ScoreGauge score={d.score||70} color={color}/>
        <div style={{background:`rgba(0,10,30,.85)`,border:`1px solid ${color}33`,padding:"14px 18px",marginBottom:14,borderLeft:`3px solid ${color}`}}>
          <div style={{fontSize:15,color,fontWeight:700,letterSpacing:1}}>{d.headline}</div>
        </div>
        {tabId==="today" && <>
          <FortuneRow label="오전 운세 ☀ AM" value={d.morning} color="#e0f0ff"/>
          <FortuneRow label="오후 운세 🌆 PM" value={d.afternoon} color="#e0f0ff"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"14px 0"}}>
            <div style={{background:"rgba(0,20,50,.7)",border:"1px solid rgba(0,140,200,.2)",padding:"12px 14px"}}>
              <div style={{fontSize:9,color:"#5b8ccc",letterSpacing:2,marginBottom:4}}>LUCKY COLOR</div>
              <div style={{fontSize:14,color:color}}>{d.lucky_color}</div>
            </div>
            <div style={{background:"rgba(0,20,50,.7)",border:"1px solid rgba(0,140,200,.2)",padding:"12px 14px"}}>
              <div style={{fontSize:9,color:"#5b8ccc",letterSpacing:2,marginBottom:4}}>LUCKY NUMBER</div>
              <div style={{fontSize:22,color:color,fontWeight:700}}>{d.lucky_number}</div>
            </div>
          </div>
          <FortuneRow label="오늘의 조언" value={d.advice} color="#00ffcc"/>
        </>}
        {tabId==="week" && <>
          <FortuneRow label="이번주 전체 흐름" value={d.overview} color="#e0f0ff"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"14px 0"}}>
            <div style={{background:"rgba(0,30,10,.7)",border:"1px solid rgba(0,200,100,.2)",padding:"12px 14px"}}>
              <div style={{fontSize:9,color:"#5b8ccc",letterSpacing:2,marginBottom:4}}>BEST DAY</div>
              <div style={{fontSize:14,color:"#4ade80"}}>{d.best_day}</div>
            </div>
            <div style={{background:"rgba(50,10,10,.7)",border:"1px solid rgba(255,80,80,.2)",padding:"12px 14px"}}>
              <div style={{fontSize:9,color:"#5b8ccc",letterSpacing:2,marginBottom:4}}>CAUTION DAY</div>
              <div style={{fontSize:14,color:"#ff9999"}}>{d.worst_day}</div>
            </div>
          </div>
          <FortuneRow label="이번주 포커스" value={d.focus} color={color}/>
          <FortuneRow label="이번주 조언" value={d.advice} color="#00ffcc"/>
        </>}
        {tabId==="month" && <>
          <FortuneRow label="상반월 흐름 (1~15일)" value={d.first_half} color="#e0f0ff"/>
          <FortuneRow label="하반월 흐름 (16~말일)" value={d.second_half} color="#e0f0ff"/>
          <FortuneRow label="이번달 기회" value={d.opportunity} color="#00ffcc"/>
          <FortuneRow label="이번달 주의" value={d.caution} color="#ff9999"/>
          <FortuneRow label="이번달 조언" value={d.advice} color={color}/>
        </>}
        {tabId==="work" && <>
          <FortuneRow label="직업적 강점" value={d.strength} color="#e0f0ff"/>
          <FortuneRow label="주의할 점" value={d.weakness} color="#ff9999"/>
          <FortuneRow label="어울리는 직종" value={d.best_career} color={color}/>
          <FortuneRow label="좋은 시기" value={d.timing} color="#00ffcc"/>
          <FortuneRow label="직장운 조언" value={d.advice} color="#e0f0ff"/>
        </>}
        {tabId==="love" && <>
          <FortuneRow label="연애 스타일" value={d.personality} color="#e0f0ff"/>
          <FortuneRow label="이상형 특징" value={d.ideal_partner} color={color}/>
          <FortuneRow label="인연 시기" value={d.timing} color="#00ffcc"/>
          <FortuneRow label="조심할 점" value={d.caution} color="#ff9999"/>
          <FortuneRow label="연애 조언" value={d.advice} color="#e0f0ff"/>
        </>}
        {tabId==="money" && <>
          <FortuneRow label="재물 흐름 패턴" value={d.pattern} color="#e0f0ff"/>
          <FortuneRow label="맞는 투자 성향" value={d.best_investment} color={color}/>
          <FortuneRow label="조심할 것" value={d.risk} color="#ff9999"/>
          <FortuneRow label="재물운 좋은 시기" value={d.timing} color="#00ffcc"/>
          <FortuneRow label="재물운 조언" value={d.advice} color="#e0f0ff"/>
        </>}
      </div>
    );
  };

  return (
    <div style={{minHeight:"100vh",background:"#020412",color:"#c9e0ff",fontFamily:"'Courier New',monospace",position:"relative",overflow:"hidden"}}>
      <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,opacity:.7}}/>
      <div style={{position:"fixed",inset:0,zIndex:1,pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(0,180,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,255,0.04) 1px,transparent 1px)",
        backgroundSize:"40px 40px"}}/>
      <div style={{position:"fixed",left:0,right:0,height:"3px",zIndex:2,pointerEvents:"none",
        top:`${scanLine}%`,background:"linear-gradient(90deg,transparent,rgba(0,200,255,.15),transparent)"}}/>

      <div style={{position:"relative",zIndex:3,maxWidth:680,margin:"0 auto",padding:"40px 20px"}}>

        {/* 헤더 */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:11,letterSpacing:8,color:"#0af",marginBottom:8,animation:"pulse 2s ease-in-out infinite"}}>
            ◈ ANTI-GRAVITY SYSTEM v4.7 ◈
          </div>
          <h1 style={{fontSize:"clamp(22px,5vw,36px)",fontWeight:900,margin:0,fontFamily:"'Georgia',serif",
            background:"linear-gradient(135deg,#00d4ff,#7b8fff,#00d4ff)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            ...(glitchActive?{textShadow:"3px 0 #f0f,-3px 0 #0ff"}:{})}}>
            안티그래비티 프로그램
          </h1>
          <h2 style={{fontSize:"clamp(14px,3vw,20px)",fontWeight:400,margin:"4px 0 0",color:"#5b8ccc",letterSpacing:4,fontFamily:"'Georgia',serif"}}>
            제작기 · 사주 분석 모듈
          </h2>
          <div style={{height:1,background:"linear-gradient(90deg,transparent,#0af,transparent)",margin:"20px auto",maxWidth:400}}/>
        </div>

        {/* 입력 */}
        {step==="input" && (
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
                      color:"#c9e0ff",padding:"10px 12px",fontSize:14,outline:"none",fontFamily:"inherit",borderRadius:1,boxSizing:"border-box"}}
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
                    flex:1,padding:"10px 0",background:form.gender===g?"rgba(0,160,255,.2)":"rgba(0,30,70,.5)",
                    border:form.gender===g?"1px solid #0af":"1px solid rgba(0,150,220,.2)",
                    color:form.gender===g?"#0af":"#5b8ccc",cursor:"pointer",fontSize:14,letterSpacing:4,fontFamily:"inherit",borderRadius:1}}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <div style={{background:"rgba(80,0,0,.6)",border:"1px solid rgba(255,80,80,.5)",padding:"12px 16px",marginBottom:16,fontSize:12,color:"#ff9999",lineHeight:1.8}}>
                ⚠ {error}
              </div>
            )}
            <button onClick={handleSubmit} style={{width:"100%",padding:"14px 0",background:"transparent",
              border:"1px solid #0af",color:"#0af",fontSize:13,letterSpacing:6,cursor:"pointer",fontFamily:"inherit",transition:"all .3s"}}
              onMouseEnter={e=>{e.target.style.background="rgba(0,170,255,.1)";e.target.style.boxShadow="0 0 20px rgba(0,170,255,.3)"}}
              onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.boxShadow="none"}}>
              ▶ LAUNCH DESTINY ANALYSIS
            </button>
          </div>
        )}

        {/* 로딩 */}
        {step==="loading" && (
          <div style={{textAlign:"center",padding:"60px 20px"}}>
            <div style={{width:120,height:120,margin:"0 auto 32px",border:"2px solid rgba(0,170,255,.3)",borderTop:"2px solid #0af",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
            <div style={{position:"relative",display:"inline-block",width:80,height:80,marginTop:-110,
              border:"1px solid rgba(0,170,255,.2)",borderBottom:"1px solid #0af",borderRadius:"50%",animation:"spin .6s linear infinite reverse"}}/>
            <div style={{marginTop:40,fontSize:13,color:"#0af",letterSpacing:2,minHeight:24}}>{loadingText}</div>
            <div style={{marginTop:12,fontSize:11,color:"#2a4a6a",letterSpacing:1}}>중력을 벗어나 운명을 분석하는 중입니다</div>
          </div>
        )}

        {/* 결과 */}
        {step==="result" && result && (
          <div>
            {/* PROGRAM ID */}
            <div style={{background:"rgba(0,10,30,.9)",border:"1px solid rgba(0,180,255,.3)",padding:"20px 24px",marginBottom:16,boxShadow:"0 0 30px rgba(0,100,200,.2)"}}>
              <div style={{fontSize:10,color:"#5b8ccc",letterSpacing:3,marginBottom:8}}>PROGRAM ID</div>
              <div style={{fontSize:"clamp(14px,3vw,18px)",color:"#00ffcc",letterSpacing:2,fontWeight:700}}>{result.title}</div>
              <div style={{marginTop:8,fontSize:13,color:"#8ab0d0"}}>{result.saju_summary}</div>
            </div>

            {/* ── 탭 바 ── */}
            <div style={{display:"flex",gap:0,marginBottom:16,overflowX:"auto",borderBottom:"1px solid rgba(0,140,200,.2)"}}>
              {TABS.map(tab=>{
                const isActive = activeTab===tab.id;
                return (
                  <button key={tab.id} onClick={()=>handleTabClick(tab.id)} style={{
                    flex:"0 0 auto",padding:"10px 14px",background:isActive?`${tab.color}18`:"transparent",
                    border:"none",borderBottom:isActive?`2px solid ${tab.color}`:"2px solid transparent",
                    color:isActive?tab.color:"#3a5a7a",cursor:"pointer",fontFamily:"inherit",
                    fontSize:"clamp(10px,2.5vw,12px)",letterSpacing:1,whiteSpace:"nowrap",transition:"all .2s"}}>
                    {tab.icon} {tab.label}
                    {fortuneCache[tab.id] && tab.id!=="saju" && <span style={{marginLeft:4,fontSize:8,color:"#00ffaa"}}>●</span>}
                  </button>
                );
              })}
            </div>

            {/* ── 사주기본 탭 ── */}
            {activeTab==="saju" && (
              <div>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:10,color:"#5b8ccc",letterSpacing:3,marginBottom:12}}>◈ FOUR PILLARS · 사주 기둥</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                    {Object.entries(result.pillars).map(([key,val])=>(
                      <div key={key} style={{background:"rgba(0,15,40,.8)",border:"1px solid rgba(0,140,200,.2)",padding:"16px",borderRadius:1}}>
                        <div style={{fontSize:9,color:"#0af",letterSpacing:2,marginBottom:8}}>{pillarLabels[key]} · {key.toUpperCase()}</div>
                        <div style={{fontSize:28,letterSpacing:8,color:"#e0f0ff",marginBottom:8,fontFamily:"'Georgia',serif"}}>{val.gan}{val.ji}</div>
                        <div style={{fontSize:11,color:"#7a9abf",lineHeight:1.7}}>{val.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{background:"rgba(0,10,30,.8)",border:"1px solid rgba(0,140,200,.2)",padding:"20px 24px",marginBottom:16}}>
                  <div style={{fontSize:10,color:"#5b8ccc",letterSpacing:3,marginBottom:16}}>◈ ELEMENT SPECTRUM · 오행 스펙트럼</div>
                  {Object.entries(result.elements).map(([el,val])=>(
                    <div key={el} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:11,color:EC[el]}}>{EK[el]} {el.toUpperCase()}</span>
                        <span style={{fontSize:11,color:"#4a6a8a"}}>{val}%</span>
                      </div>
                      <div style={{height:4,background:"rgba(255,255,255,.05)",borderRadius:2}}>
                        <div style={{height:"100%",width:`${val}%`,background:`linear-gradient(90deg,${EC[el]}88,${EC[el]})`,borderRadius:2,boxShadow:`0 0 8px ${EC[el]}66`}}/>
                      </div>
                    </div>
                  ))}
                  <div style={{marginTop:16,fontSize:12,color:"#00ffcc",letterSpacing:2}}>
                    DOMINANT: {EK[result.dominant_element?.toLowerCase()]||"—"} · {result.dominant_element?.toUpperCase()}
                  </div>
                </div>
                <div style={{background:"rgba(0,10,30,.8)",border:"1px solid rgba(0,140,200,.2)",padding:"20px 24px",marginBottom:16}}>
                  <div style={{fontSize:10,color:"#5b8ccc",letterSpacing:3,marginBottom:16}}>◈ DESTINY LOG · 운명 기록</div>
                  {result.destiny_log?.map((log,i)=>(
                    <div key={i} style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start"}}>
                      <span style={{color:"#0af",fontSize:11,minWidth:24}}>[{String(i+1).padStart(2,"0")}]</span>
                      <span style={{fontSize:12,color:"#a0c0e0",lineHeight:1.7}}>{log}</span>
                    </div>
                  ))}
                </div>
                <div style={{background:"rgba(0,5,20,.9)",border:"1px solid rgba(0,255,180,.2)",padding:"20px 24px",marginBottom:16}}>
                  <div style={{fontSize:10,color:"#00cc88",letterSpacing:3,marginBottom:12}}>◈ LIFE MISSION · 인생 미션</div>
                  <div style={{fontSize:13,color:"#c0ffe0",lineHeight:1.9}}>{result.life_mission}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                  <div style={{background:"rgba(50,10,10,.7)",border:"1px solid rgba(255,80,80,.2)",padding:"16px"}}>
                    <div style={{fontSize:9,color:"#ff6b6b",letterSpacing:2,marginBottom:8}}>⚠ CAUTION</div>
                    <div style={{fontSize:11,color:"#ffaaaa",lineHeight:1.7}}>{result.caution}</div>
                  </div>
                  <div style={{background:"rgba(0,30,20,.7)",border:"1px solid rgba(0,255,150,.2)",padding:"16px"}}>
                    <div style={{fontSize:9,color:"#00ffaa",letterSpacing:2,marginBottom:8}}>✦ LUCKY CODE</div>
                    <div style={{fontSize:11,color:"#80ffcc",letterSpacing:1,lineHeight:1.7}}>{result.lucky_code}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── 운세 탭들 ── */}
            {activeTab!=="saju" && (
              <div style={{background:"rgba(0,10,30,.85)",border:`1px solid ${TABS.find(t=>t.id===activeTab)?.color||"#0af"}22`,padding:"20px 24px"}}>
                <div style={{fontSize:10,letterSpacing:3,marginBottom:16,color:TABS.find(t=>t.id===activeTab)?.color||"#0af"}}>
                  {TABS.find(t=>t.id===activeTab)?.icon} {TABS.find(t=>t.id===activeTab)?.label?.toUpperCase()} · {getToday()} 기준
                </div>
                {renderFortuneTab(activeTab)}
                {!fortuneCache[activeTab] && !fortuneLoading && !fortuneError && (
                  <div style={{textAlign:"center",padding:"30px 0",fontSize:12,color:"#3a5a7a"}}>탭을 클릭하면 자동으로 분석합니다...</div>
                )}
              </div>
            )}

            <button onClick={()=>{setStep("input");setResult(null);setSajuPillars(null);setFortuneCache({});setForm({year:"",month:"",day:"",hour:"",gender:"남"});setActiveTab("saju");}}
              style={{width:"100%",marginTop:16,padding:"12px 0",background:"transparent",border:"1px solid rgba(0,150,200,.3)",
                color:"#5b8ccc",fontSize:11,letterSpacing:5,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}
              onMouseEnter={e=>{e.target.style.borderColor="#0af";e.target.style.color="#0af"}}
              onMouseLeave={e=>{e.target.style.borderColor="rgba(0,150,200,.3)";e.target.style.color="#5b8ccc"}}>
              ↺ REINITIALIZE · 다시 분석
            </button>
          </div>
        )}

        <div style={{textAlign:"center",marginTop:40,fontSize:10,color:"#1a3050",letterSpacing:3}}>
          ANTI-GRAVITY SAJU MODULE · BUILD 2026.04.15
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 4px; background: #020412; }
        ::-webkit-scrollbar-thumb { background: rgba(0,150,220,.3); }
      `}</style>
    </div>
  );
}
