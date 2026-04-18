import { useState, useEffect, useRef } from "react";

// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??// ?¬ì£¼ ê³„ì‚° ?”ì§„
// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??const CG=["??,"ä¹?,"ä¸?,"ä¸?,"??,"å·?,"åº?,"è¾?,"å£?,"??];
const CG_KR=["ê°?,"??,"ë³?,"??,"ë¬?,"ê¸?,"ê²?,"??,"??,"ê³?];
const JJ=["å­?,"ä¸?,"å¯?,"??,"è¾?,"å·?,"??,"??,"??,"??,"??,"äº?];
const JJ_KR=["??,"ì¶?,"??,"ë¬?,"ì§?,"??,"??,"ë¯?,"??,"??,"??,"??];
const JJ_ZOD=["ì¥?,"??,"ë²?,"? ë¼","??,"ë±€","ë§?,"??,"?ìˆ­??,"??,"ê°?,"?¼ì?"];
function getYP(y,m,d){let yr=y;if(m<2||(m===2&&d<4))yr--;const i=((yr-1984)%60+600)%60;return{gan:CG[i%10],ganh:CG_KR[i%10],ji:JJ[i%12],jih:JJ_KR[i%12],zod:JJ_ZOD[i%12],gi:i%10};}
function getMP(ygi,m){const jb=[1,2,3,4,5,6,7,8,9,10,11,0];const ji=jb[m-1];const gs=[2,4,6,8,0][ygi%5];const gi=(gs+((ji-2+12)%12))%10;return{gan:CG[gi],ganh:CG_KR[gi],ji:JJ[ji],jih:JJ_KR[ji],gi};}
function getDP(y,m,d){const days=Math.round((new Date(y,m-1,d)-new Date(1900,0,1))/86400000);const i=((days+10)%60+60)%60;return{gan:CG[i%10],ganh:CG_KR[i%10],ji:JJ[i%12],jih:JJ_KR[i%12],gi:i%10};}
function getHP(dgi,h){if(!h&&h!==0)return{gan:"??,ganh:"??,ji:"??,jih:"ì£?,gi:-1};const n=+h;const ji=n===23?0:Math.floor((n+1)/2)%12;const gi=([0,2,4,6,8][dgi%5]+ji)%10;return{gan:CG[gi],ganh:CG_KR[gi],ji:JJ[ji],jih:JJ_KR[ji],gi};}
function calcSaju(y,m,d,h){const yp=getYP(+y,+m,+d);const mp=getMP(yp.gi,+m);const dp=getDP(+y,+m,+d);const hp=h?getHP(dp.gi,h):getHP(dp.gi,null);return{year:yp,month:mp,day:dp,hour:hp};}

// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??// êµ¬ë… ?Œëœ ?•ì˜
// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??const PLANS = {
  free: {
    id:"free", name:"ë¬´ë£Œ ?´ëŒ", nameH:"?¡æ–™ ?±è¦½",
    price:0, priceLabel:"ë¬´ë£Œ",
    color:"#7f8c8d",
    features:[
      "?¬ì£¼?”ì ê¸°ë³¸ ?€??,
      "? ì •ë¹„ê²° ê¸°ë³¸ ?°ê°„??,
      "?¤ëŠ˜???¼ì§„ ?•ì¸",
      "?¤í–‰ ë°°í•© ë¶„ì„",
    ],
    locked:[
      "ì§ì—…Â·?¼ì¸Â·?¬ë¬¼ ?ì„¸??,
      "ê¶í•© å®?ˆ",
      "? ë…„ ?€??å¤§é‹",
      "?‘ëª…Â·?´ë¦„?€??,
      "ë§¤ì›” ? ê·œ ?´ì„¸ ë¦¬í¬??,
      "ë¬´ì œ???¬ì¡°??,
    ],
  },
  basic: {
    id:"basic", name:"ê´€??êµ¬ë…", nameH:"å®˜å“¡ ?£è?",
    price:9900, priceLabel:"??9,900??,
    color:"#c0392b",
    badge:"?¸ê¸°",
    features:[
      "?¬ì£¼?”ì ?„ì²´ ?€??(6??",
      "? ì •ë¹„ê²° ?ì„¸ ?€??,
      "?¤ëŠ˜???¼ì§„ + ì£¼ê°„ ?¼ì§„",
      "?¤í–‰ ë°°í•© + ê²©êµ­Â·?©ì‹ ",
      "ì§ì—…Â·?¼ì¸Â·?¬ë¬¼ ?ì„¸??,
      "? ë…„ ?€??å¤§é‹",
      "ë¬´ì œ???¬ì¡°??,
    ],
    locked:[
      "ê¶í•© å®?ˆ",
      "?‘ëª…Â·?´ë¦„?€??,
      "?€?œí•™ 1:1 ?ë‹´ (??1??",
    ],
  },
  premium: {
    id:"premium", name:"?€ê°?êµ¬ë…", nameH:"å¤§ç›£ ?£è?",
    price:29900, priceLabel:"??29,900??,
    color:"#e8b84b",
    badge:"ìµœê³ ",
    features:[
      "ê´€??êµ¬ë… ?„ì²´ ?¬í•¨",
      "ê¶í•© å®?ˆ ë¬´ì œ??,
      "?‘ëª…Â·?´ë¦„?€??,
      "?€?œí•™ 1:1 ?ë‹´ (??3??",
      "ë§¤ì›” ?´ì„¸ ë¦¬í¬??PDF",
      "? ë…„ ?¬ì£¼ ê°ì •??(??1??",
      "ê°€ì¡?ê³„ì • ì¶”ê? 2ëª?,
    ],
    locked:[],
  },
};

// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??// ?¤í–‰ & ?‰ìƒ
// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??const EC={wood:"#4a7c3f",fire:"#c0392b",earth:"#8b6914",metal:"#7f8c8d",water:"#1a5276"};
const EK={wood:"??,fire:"??,earth:"??,metal:"??,water:"æ°?};
const EKR={wood:"ëª?,fire:"??,earth:"??,metal:"ê¸?,water:"??};

// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??// Claude API
// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??async function callClaude(system,user,tokens=4000){
  const res=await fetch("/api/claude",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({system,user,tokens})
  });
  const data=await res.json();
  if(!res.ok||!data.success) throw new Error(data.error||"API ?¤ë¥˜");
  return data.data;
}
const SYS=`?¹ì‹ ?€ ì¡°ì„  ?•ì‹¤ ?¬ì£¼ ê´€ì²?˜ ê´€?ê° ?€?œí•™?…ë‹ˆ?? ?¬ì£¼ë¥?ì¡°ì„ ?œë? ê¶ì¤‘ ?¸ì–´?€ ?„í†µ ??•™?¼ë¡œ ?€?´í•©?ˆë‹¤. ë§ˆí¬?¤ìš´ ì½”ë“œë¸”ë¡ ?†ì´ ?œìˆ˜ JSONë§?ì¶œë ¥. ?°ë”°?´í‘œ??JSON?ë§Œ ?¬ìš©. ?„ë??´ë¡œ ?¤ëª…?˜ë˜ ê²©ì¡° ?ˆëŠ” ë¬¸ì–´ì²´ë? ?¬ìš©?˜ì„¸??`;

function getToday(){const d=new Date();return`${d.getFullYear()}??${d.getMonth()+1}??${d.getDate()}??;}
function getYear(){return new Date().getFullYear();}
function getNextMonth(){const d=new Date();d.setMonth(d.getMonth()+1);return`${d.getFullYear()}??${d.getMonth()+1}??${d.getDate()}??;}

// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??// ê³µí†µ ?˜í¼ (App ?¸ë? ???¤ë³´???¬ì»¤??? ì?)
// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??function PalaceBG({children,scanY}){
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
          ???Œì•„ê°€ê¸?        </button>
      )}
      {rightEl&&<div style={{position:"absolute",right:22,top:34}}>{rightEl}</div>}
      <div style={{display:"inline-block",border:"2px solid #8b1a1a",
        padding:"3px 14px",marginBottom:10,background:"rgba(139,26,26,.12)"}}>
        <span style={{fontSize:10,letterSpacing:5,color:"#c0392b"}}>?é? ?‹å? ?½ç†??/span>
      </div>
      <h1 style={{fontSize:"clamp(24px,5vw,40px)",fontWeight:700,margin:0,
        color:"#e8d5b0",letterSpacing:4,textShadow:"0 0 30px rgba(192,152,75,.25)"}}>{title}</h1>
      <div style={{fontSize:"clamp(12px,2.5vw,15px)",color:"#c0a060",letterSpacing:5,marginTop:5}}>{sub}</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,margin:"14px 0"}}>
        <div style={{flex:1,height:1,background:"linear-gradient(90deg,transparent,#8b6914)",maxWidth:100}}/>
        <span style={{color:"#c0392b",fontSize:16}}>??/span>
        <div style={{width:32,height:1,background:"#8b6914"}}/>
        <span style={{color:"#e8b84b",fontSize:9}}>??/span>
        <div style={{width:32,height:1,background:"#8b6914"}}/>
        <span style={{color:"#c0392b",fontSize:16}}>??/span>
        <div style={{flex:1,height:1,background:"linear-gradient(90deg,#8b6914,transparent)",maxWidth:100}}/>
      </div>
    </div>
  );
}

// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??// êµ¬ë… ?íƒœ ë°°ì?
// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??function PlanBadge({plan,onClick}){
  const p=PLANS[plan];
  if(!p)return null;
  return(
    <button onClick={onClick} style={{background:`${p.color}18`,
      border:`1px solid ${p.color}55`,padding:"4px 10px",cursor:"pointer",
      fontFamily:"inherit",transition:"all .2s"}}>
      <span style={{fontSize:9,color:p.color,letterSpacing:2}}>
        {plan==="free"?"ë¬´ë£Œ":"?‘‘ "}{p.name}
      </span>
    </button>
  );
}

// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??// ë©”ì¸ ??// ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•??export default function PalaceApp(){
  // êµ¬ë… ?íƒœ (localStorage ê¸°ë°˜ ?°ëª¨)
  const [userPlan,setUserPlan]=useState(()=>{
    try{return localStorage.getItem("joseon_plan")||"free";}catch{return"free";}
  });
  const [subExpiry,setSubExpiry]=useState(()=>{
    try{return localStorage.getItem("joseon_expiry")||null;}catch{return null;}
  });

  const [screen,setScreen]=useState("home"); // home|pricing|subscribe|service|loading|result|mypage
  const [activeService,setActiveService]=useState(null);
  const [form,setForm]=useState({year:"",month:"",day:"",hour:"",gender:"??});
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

  // êµ¬ë… ?œì„±??(?°ëª¨?????¤ì œ??ê²°ì œ API ?°ë™)
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
    const msgs=["??ê´€?ê° ë¬¸ì„œ ?´ëŒ ì¤?..","??ì²œê°„ì§€ì§€ ?€ì¡?ì¤?..","???¤í–‰ ë°°í•© ë¶„ì„ ì¤?..","???•ì‹¤ ë¹„ë¬¸ ?´ë… ì¤?..","???€?œí•™ ?€???‘ì„± ì¤?.."];
    for(let i=0;i<msgs.length;i++){setLoadText(msgs[i]);await new Promise(r=>setTimeout(r,500));}
  };

  // ?€?€ ?¬ì£¼ ë¶„ì„ ?€?€
  const handleSaju=async()=>{
    if(!form.year||!form.month||!form.day){setError("?ë…„?”ì¼???…ë ¥?˜ì‹­?œì˜¤.");return;}
    setError("");setScreen("loading");runLoad();
    try{
      const p=calcSaju(form.year,form.month,form.day,form.hour||null);
      const prompt=`?ë…„?”ì¼?? ${form.year}??${form.month}??${form.day}??${form.hour?form.hour+"??:"?œê° ë¯¸ìƒ"}, ?±ë³„: ${form.gender}
ê³„ì‚°??4ì£? ?„ì£¼${p.year.gan}${p.year.ji} ?”ì£¼${p.month.gan}${p.month.ji} ?¼ì£¼${p.day.gan}${p.day.ji} ?œì£¼${p.hour.gan}${p.hour.ji}
ì¡°ì„  ê¶ì¤‘ ??•™?¼ë¡œ ?€?? ?œìˆ˜ JSON:
{"title":"?•ì‹¤ ëª…ë¦¬ ì¹?˜¸","summary":"?¬ì£¼ ?œì¤„ ?€??20??,"pillars":{"year":{"gan":"${p.year.gan}","ganh":"${p.year.ganh}","ji":"${p.year.ji}","jih":"${p.year.jih}","zod":"${p.year.zod}","desc":"?„ì£¼ ?€????ë¬¸ì¥"},"month":{"gan":"${p.month.gan}","ganh":"${p.month.ganh}","ji":"${p.month.ji}","jih":"${p.month.jih}","desc":"?”ì£¼ ?€????ë¬¸ì¥"},"day":{"gan":"${p.day.gan}","ganh":"${p.day.ganh}","ji":"${p.day.ji}","jih":"${p.day.jih}","desc":"?¼ì£¼ ?€????ë¬¸ì¥"},"hour":{"gan":"${p.hour.gan}","ganh":"${p.hour.ganh}","ji":"${p.hour.ji}","jih":"${p.hour.jih}","desc":"?œì£¼ ?€????ë¬¸ì¥"}},"elements":{"wood":20,"fire":20,"earth":20,"metal":20,"water":20},"dominant":"wood","format":"ê²©êµ­ëª?,"strong_god":"?©ì‹  ì²œê°„","life_path":"?€ê³ ë‚œ ?´ëª… ??ë¬¸ì¥","caution":"ì£¼ì˜ ??ë¬¸ì¥","lucky_direction":"ê¸¸ë°©","lucky_color":"ê¸¸ìƒ‰"}`;
      const parsed=await callClaude(SYS,prompt);
      ["year","month","day","hour"].forEach(k=>{
        if(!parsed.pillars[k])parsed.pillars[k]={};
        parsed.pillars[k].gan=p[k].gan;parsed.pillars[k].ganh=p[k].ganh;
        parsed.pillars[k].ji=p[k].ji;parsed.pillars[k].jih=p[k].jih;
      });
      setResult({type:"saju",data:parsed,pillars:p});
      setActiveTab("basic");setCache({});setScreen("result");
    }catch(e){setError("?¤ë¥˜: "+e.message);setScreen("service");}
  };

  // ?€?€ ???´ì„¸ ?€?€
  const handleTab=async(tabId)=>{
    if(!isPremium&&tabId!=="basic"){setScreen("pricing");return;}
    setActiveTab(tabId);
    if(tabId==="basic"||cache[tabId]||!result?.pillars)return;
    setTabLoading(true);
    const p=result.pillars;
    const sj=`?„ì£¼${p.year.gan}${p.year.ji} ?”ì£¼${p.month.gan}${p.month.ji} ?¼ì£¼${p.day.gan}${p.day.ji} ?œì£¼${p.hour.gan}${p.hour.ji}`;
    const prompts={
      today:`?¬ì£¼:${sj} ?¤ëŠ˜(${getToday()}) ?¼ì§„ ?´ì„¸ ì¡°ì„  ??•™?¼ë¡œ. JSON: {"score":75,"headline":"?¤ëŠ˜ ?´ì„¸ ?œì¤„","morning":"?¤ì „ ??ë¬¸ì¥","afternoon":"?¤í›„ ??ë¬¸ì¥","lucky_direction":"ê¸¸ë°©","lucky_color":"ê¸¸ìƒ‰","caution":"ì£¼ì˜ ??ë¬¸ì¥","advice":"?¤ëŠ˜??ê°€ë¥´ì¹¨"}`,
      work: `?¬ì£¼:${sj} ì§ì—…/?¬ì—…??ì¡°ì„  ??•™?¼ë¡œ. JSON: {"score":75,"headline":"ì§ì—…???œì¤„","aptitude":"?€ê³ ë‚œ ?¬ëŠ¥ ??ë¬¸ì¥","career":"?´ìš¸ë¦¬ëŠ” ì§ì—…êµ?,"peak":"?„ì„±ê¸??œê¸°","caution":"ì£¼ì˜ ??ë¬¸ì¥","advice":"ì§ì—… ê°€ë¥´ì¹¨"}`,
      love: `?¬ì£¼:${sj} ?±ë³„:${form.gender} ?¼ì¸/?°ì• ??ì¡°ì„  ??•™?¼ë¡œ. JSON: {"score":75,"headline":"?¼ì¸???œì¤„","character":"?¸ì—° ?¹ì„± ??ë¬¸ì¥","ideal":"?´ìƒ??ë°°ìš°???¹ì„±","timing":"?¸ì—° ?œê¸°","caution":"ì£¼ì˜ ??ë¬¸ì¥","advice":"?¼ì¸ ê°€ë¥´ì¹¨"}`,
      money:`?¬ì£¼:${sj} ?¬ë¬¼/?¬ë³µ ì¡°ì„  ??•™?¼ë¡œ. JSON: {"score":75,"headline":"?¬ë¬¼???œì¤„","fortune":"?¬ë¬¼ ê¸°ì§ˆ ??ë¬¸ì¥","method":"?¬ë¬¼ ëª¨ìœ¼??ë°©ë²•","timing":"?¬ë¬¼ ?„ì„±ê¸?,"caution":"ì£¼ì˜ ??ë¬¸ì¥","advice":"?¬ë¬¼ ê°€ë¥´ì¹¨"}`,
      yearly:`?¬ì£¼:${sj} ${getYear()}???€??ì¡°ì„  ??•™?¼ë¡œ. JSON: {"score":75,"headline":"${getYear()}???´ì„¸ ?œì¤„","overview":"?¬í•´ ?„ì²´ ?ë¦„ ??ë¬¸ì¥","opportunity":"?¬í•´??ê¸°íšŒ ??ë¬¸ì¥","caution":"?¬í•´ ì£¼ì˜ ??ë¬¸ì¥","next_year":"?´ë…„ ?ˆê³  ??ë¬¸ì¥","advice":"?¬í•´??êµí›ˆ"}`,
    };
    try{const d=await callClaude(SYS,prompts[tabId]);setCache(prev=>({...prev,[tabId]:d}));}
    catch(e){setError("?¤ë¥˜: "+e.message);}
    setTabLoading(false);
  };

  const goHome=()=>{setScreen("home");setResult(null);setActiveTab("basic");setCache({});setError("");};
  const inp={width:"100%",background:"rgba(10,8,4,.8)",border:"1px solid rgba(192,152,75,.3)",
    color:"#e8d5b0",padding:"11px 14px",fontSize:15,outline:"none",
    fontFamily:"'Noto Serif KR',Georgia,serif",boxSizing:"border-box",letterSpacing:1};

  // ?â•?â•?â•?â•?â•?â•?â•?â•?â• ???â•?â•?â•?â•?â•?â•?â•?â•?â•
  if(screen==="home")return(
    <PalaceBG scanY={scanY}>
      <PalaceHeader title="ì¡°ì„  ëª…ë¦¬?? sub="?é? ?½ç†??
        rightEl={<PlanBadge plan={userPlan} onClick={()=>setScreen("mypage")}/>}/>

      {/* ?¤ëŠ˜ ?¼ì§„ */}
      {todayPillar&&(
        <div style={{background:"rgba(139,26,26,.1)",border:"1px solid rgba(192,57,43,.25)",
          padding:"12px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:14,
          animation:"inkDrop .4s ease"}}>
          <div style={{textAlign:"center",minWidth:56}}>
            <div style={{fontSize:9,color:"#8b6914",letterSpacing:2,marginBottom:3}}>?¤ëŠ˜ ?¼ì§„</div>
            <div style={{fontSize:24,color:"#e8b84b",fontWeight:700,letterSpacing:3}}>
              {todayPillar.gan}{todayPillar.ji}
            </div>
            <div style={{fontSize:10,color:"#c0a060"}}>{todayPillar.ganh}{todayPillar.jih}??/div>
          </div>
          <div style={{width:1,height:44,background:"rgba(192,152,75,.18)"}}/>
          <div style={{fontSize:12,color:"#8b7a5a",lineHeight:1.8}}>{getToday()}</div>
        </div>
      )}

      {/* êµ¬ë… ? ë„ ë°°ë„ˆ (ë¹„êµ¬?…ì?ê²Œë§? */}
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
            <div style={{fontSize:10,color:"#e8b84b",letterSpacing:3,marginBottom:4}}>?‘‘ ?•ì‹¤ êµ¬ë… ?œíƒ</div>
            <div style={{fontSize:13,color:"#e8d5b0"}}>??9,900?ìœ¼ë¡?ëª¨ë“  ?œë¹„??ë¬´ì œ???´ìš©</div>
          </div>
          <div style={{fontSize:14,color:"#e8b84b"}}>??/div>
        </button>
      )}

      {/* ?œë¹„??ëª©ë¡ */}
      <div style={{fontSize:10,color:"#8b6914",letterSpacing:5,marginBottom:14,textAlign:"center"}}>
        ??ê´€ì²??œë¹„????      </div>
      {[
        {id:"saju",    name:"?¬ì£¼?”ì",   sub:"?›æŸ±?«å­—",icon:"??,color:"#c0392b",free:true, desc:"?ë…„?”ì¼?œë¡œ ë³´ëŠ” ?´ëª…????ê¸°ë‘¥"},
        {id:"tojeong", name:"? ì •ë¹„ê²°",   sub:"?Ÿäº­ç§˜è¨£",icon:"??,color:"#8b6914",free:true, desc:"?´ì???? ìƒ??64ê´??°ê°„ ?´ì„¸"},
        {id:"gung",    name:"ê¶í•©",       sub:"å®?ˆ",    icon:"??,color:"#6c3483",free:false,desc:"???¬ëŒ???¬ì£¼ë¡?ë³´ëŠ” ?¸ì—°??ê¹Šì´"},
        {id:"yearly",  name:"? ë…„ ?€??,  sub:"å¤§é‹",    icon:"??,color:"#1e8449",free:false,desc:"?¬í•´?€ ?´ë…„?????´ì„¸ ?ë¦„"},
        {id:"name",    name:"?‘ëª…Â·?´ë¦„?€??,sub:"?½å",  icon:"??,color:"#784212",free:false,desc:"?´ë¦„???ìˆ˜?€ ?¤í–‰?¼ë¡œ ë³´ëŠ” ?´ëª…"},
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
                  ?<span style={{fontSize:9,border:"1px solid rgba(26,82,118,.4)",color:"#7fb3d3",padding:"1px 5px"}}>ë¬´ë£Œ</span>
                  :locked
                    ?<span style={{fontSize:9,border:"1px solid rgba(192,184,75,.3)",color:"#c8b840",padding:"1px 5px"}}>êµ¬ë… ?„ìš©</span>
                    :<span style={{fontSize:9,border:"1px solid rgba(192,57,43,.4)",color:"#e8806a",padding:"1px 5px"}}>êµ¬ë… ì¤?/span>
                }
              </div>
              <div style={{fontSize:11,color:locked?"#4a3a2a":"#8b7a5a"}}>{svc.desc}</div>
            </div>
            <div style={{color:locked?"#4a3a2a":"#8b6914",fontSize:14}}>{locked?"?”’":"??}</div>
          </button>
        );
      })}

      <div style={{textAlign:"center",marginTop:20,fontSize:10,color:"rgba(139,105,20,.35)",letterSpacing:3}}>
        ?é? ?½ç†??Â· {getToday()}
      </div>
    </PalaceBG>
  );

  // ?â•?â•?â•?â•?â•?â•?â•?â•?â• êµ¬ë… ?”ê¸ˆ???â•?â•?â•?â•?â•?â•?â•?â•?â•
  if(screen==="pricing")return(
    <PalaceBG scanY={scanY}>
      <PalaceHeader title="?•ì‹¤ êµ¬ë…" sub="?‹å? ?£è? Â· ?”ê¸ˆ?? onBack={goHome}/>

      {/* ?„ì¬ êµ¬ë… ?íƒœ */}
      {isPremium&&(
        <div style={{background:"rgba(192,57,43,.1)",border:"1px solid rgba(192,57,43,.3)",
          padding:"12px 18px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,color:"#8b6914",letterSpacing:2,marginBottom:3}}>?„ì¬ êµ¬ë…</div>
            <div style={{fontSize:14,color:"#e8b84b"}}>{PLANS[userPlan].name}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"#8b6914",letterSpacing:1,marginBottom:2}}>?¤ìŒ ê²°ì œ??/div>
            <div style={{fontSize:11,color:"#c0a060"}}>{subExpiry}</div>
          </div>
        </div>
      )}

      {/* ?”ê¸ˆ??ì¹´ë“œ */}
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
              {/* ë°°ì? */}
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
                  ?„ì¬ ?´ìš© ì¤?                </div>
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
                  {plan.price>0&&<div style={{fontSize:10,color:"rgba(139,105,20,.5)"}}>/ ??/div>}
                </div>
              </div>

              {/* ?¬í•¨ ê¸°ëŠ¥ */}
              <div style={{marginBottom:plan.locked.length>0?12:0}}>
                {plan.features.map((f,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
                    <span style={{color:"#4a7c3f",fontSize:11,marginTop:1}}>??/span>
                    <span style={{fontSize:12,color:"#c0a878"}}>{f}</span>
                  </div>
                ))}
              </div>

              {/* ë¯¸í¬??*/}
              {plan.locked.length>0&&(
                <div style={{borderTop:"1px solid rgba(100,80,50,.15)",paddingTop:10}}>
                  {plan.locked.map((f,i)=>(
                    <div key={i} style={{display:"flex",gap:8,marginBottom:5,alignItems:"flex-start"}}>
                      <span style={{color:"rgba(100,80,50,.4)",fontSize:11,marginTop:1}}>??/span>
                      <span style={{fontSize:12,color:"rgba(100,80,50,.5)"}}>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* êµ¬ë… ë²„íŠ¼ */}
              {!isCurrent&&plan.price>0&&(
                <button onClick={()=>{setSelectedPlan(plan.id);setPayStep("confirm");setScreen("subscribe");}}
                  style={{width:"100%",marginTop:16,padding:"12px 0",
                    background:`${plan.color}22`,border:`1px solid ${plan.color}66`,
                    color:"#e8d5b0",fontSize:13,letterSpacing:4,cursor:"pointer",
                    fontFamily:"inherit",transition:"all .25s"}}
                  onMouseEnter={e=>{e.target.style.background=`${plan.color}33`;}}
                  onMouseLeave={e=>{e.target.style.background=`${plan.color}22`;}}>
                  ??{plan.name} ?œì‘?˜ê¸°
                </button>
              )}
              {!isCurrent&&plan.price===0&&(
                <div style={{marginTop:14,fontSize:11,color:"rgba(139,105,20,.4)",textAlign:"center"}}>
                  ?„ì¬ ?´ìš© ì¤‘ì´??‹ˆ??                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ?´ì? (êµ¬ë…?ì—ê²Œë§Œ) */}
      {isPremium&&(
        <button onClick={()=>{setUserPlan("free");setSubExpiry(null);
          try{localStorage.removeItem("joseon_plan");localStorage.removeItem("joseon_expiry");}catch{}
          setScreen("home");}} style={{
          width:"100%",padding:"10px 0",background:"transparent",
          border:"1px solid rgba(100,80,50,.2)",color:"rgba(100,80,50,.5)",
          fontSize:11,letterSpacing:3,cursor:"pointer",fontFamily:"inherit"}}>
          êµ¬ë… ?´ì?
        </button>
      )}
    </PalaceBG>
  );

  // ?â•?â•?â•?â•?â•?â•?â•?â•?â• ê²°ì œ ?â•?â•?â•?â•?â•?â•?â•?â•?â•
  if(screen==="subscribe"){
    const plan=PLANS[selectedPlan];
    return(
      <PalaceBG scanY={scanY}>
        <PalaceHeader title="êµ¬ë… ? ì²­" sub="?£è? ?³è«‹" onBack={()=>setScreen("pricing")}/>

        {payStep==="confirm"&&(
          <div style={{animation:"unfurl .4s ease"}}>
            <div style={{background:"rgba(8,6,3,.85)",border:"1px solid rgba(192,152,75,.2)",
              padding:"24px 22px",marginBottom:14}}>
              <div style={{fontSize:10,color:"#8b6914",letterSpacing:4,marginBottom:16}}>??? ì²­ ?´ì—­ ?•ì¸</div>
              {[["êµ¬ë… ?í’ˆ",plan.name+" "+plan.nameH],
                ["??êµ¬ë…ë£?,plan.priceLabel],
                ["ì²?ê²°ì œ??,getToday()],
                ["?¤ìŒ ê²°ì œ??,getNextMonth()],
                ["?ë™ ê°±ì‹ ","ë§¤ì›” ?ë™ ê²°ì œ"],
              ].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",
                  padding:"10px 0",borderBottom:"1px solid rgba(192,152,75,.08)"}}>
                  <span style={{fontSize:12,color:"#8b7a5a"}}>{k}</span>
                  <span style={{fontSize:13,color:"#e8d5b0"}}>{v}</span>
                </div>
              ))}
            </div>

            {/* ê²°ì œ ?˜ë‹¨ ? íƒ */}
            <div style={{background:"rgba(8,6,3,.85)",border:"1px solid rgba(192,152,75,.15)",
              padding:"20px 22px",marginBottom:14}}>
              <div style={{fontSize:10,color:"#8b6914",letterSpacing:4,marginBottom:14}}>??ê²°ì œ ?˜ë‹¨</div>
              {[["?’³ ? ìš©ì¹´ë“œÂ·ì²´í¬ì¹´ë“œ","card"],["?“± ì¹´ì¹´?¤í˜??,"kakao"],["?”µ ?¤ì´ë²„í˜??,"naver"]].map(([lbl,id])=>(
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
              ??êµ¬ë…?€ ë§¤ì›” ?ë™ ê°±ì‹ ?©ë‹ˆ?? ?¸ì œ? ì? ?´ì? ê°€?¥í•©?ˆë‹¤.<br/>
              ???¤ì œ ?œë¹„?¤ì—?œëŠ” ? ìŠ¤?˜ì´ë¨¼ì¸  ê²°ì œê°€ ?°ë™?©ë‹ˆ??
            </div>

            <button onClick={()=>activatePlan(selectedPlan)} style={{
              width:"100%",padding:"15px 0",
              background:"linear-gradient(135deg,rgba(192,57,43,.3),rgba(232,184,75,.2))",
              border:"1px solid rgba(232,184,75,.5)",color:"#e8d5b0",
              fontSize:14,letterSpacing:5,cursor:"pointer",fontFamily:"inherit",
              transition:"all .3s"}}
              onMouseEnter={e=>{e.target.style.boxShadow="0 0 20px rgba(232,184,75,.2)";}}
              onMouseLeave={e=>{e.target.style.boxShadow="none";}}>
              ??{plan.priceLabel} ê²°ì œ?˜ê¸°
            </button>
          </div>
        )}

        {payStep==="done"&&(
          <div style={{textAlign:"center",padding:"40px 20px",animation:"inkDrop .5s ease"}}>
            <div style={{fontSize:40,marginBottom:16}}>??/div>
            <div style={{fontSize:20,color:"#e8b84b",letterSpacing:4,marginBottom:10,fontWeight:700}}>
              êµ¬ë… ?„ë£Œ
            </div>
            <div style={{fontSize:13,color:"#c0a878",lineHeight:1.9,marginBottom:24}}>
              {plan.name} êµ¬ë…???œì‘?˜ì—ˆ?µë‹ˆ??<br/>
              ?¤ìŒ ê²°ì œ?? {subExpiry}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10,maxWidth:300,margin:"0 auto"}}>
              <button onClick={()=>{setScreen("home");}} style={{
                padding:"13px 0",background:"rgba(192,57,43,.2)",
                border:"1px solid rgba(192,57,43,.4)",color:"#e8d5b0",
                fontSize:13,letterSpacing:4,cursor:"pointer",fontFamily:"inherit"}}>
                ??ê´€ì²?œ¼ë¡??Œì•„ê°€ê¸?              </button>
            </div>
          </div>
        )}
      </PalaceBG>
    );
  }

  // ?â•?â•?â•?â•?â•?â•?â•?â•?â• ë§ˆì´?˜ì´ì§€ ?â•?â•?â•?â•?â•?â•?â•?â•?â•
  if(screen==="mypage")return(
    <PalaceBG scanY={scanY}>
      <PalaceHeader title="?˜ì˜ ?œì²©" sub="ç§??¸ç‰’" onBack={goHome}/>
      <div style={{animation:"unfurl .4s ease"}}>
        {/* êµ¬ë… ?„í™© */}
        <div style={{background:"rgba(8,6,3,.85)",border:`1px solid ${PLANS[userPlan].color}33`,
          padding:"22px 24px",marginBottom:14}}>
          <div style={{fontSize:10,color:"#8b6914",letterSpacing:4,marginBottom:14}}>??êµ¬ë… ?„í™©</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <div style={{fontSize:18,color:PLANS[userPlan].color,fontWeight:700,letterSpacing:3,marginBottom:4}}>
                {PLANS[userPlan].name}
              </div>
              <div style={{fontSize:11,color:"#8b7a5a"}}>{PLANS[userPlan].nameH}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:13,color:"#e8d5b0"}}>{PLANS[userPlan].priceLabel}</div>
              {subExpiry&&<div style={{fontSize:11,color:"#8b7a5a",marginTop:3}}>?¤ìŒ ê²°ì œ: {subExpiry}</div>}
            </div>
          </div>
          {/* ?´ìš© ê°€???œë¹„??*/}
          <div style={{borderTop:"1px solid rgba(192,152,75,.1)",paddingTop:12}}>
            <div style={{fontSize:9,color:"#8b6914",letterSpacing:3,marginBottom:8}}>?´ìš© ê°€???œë¹„??/div>
            {PLANS[userPlan].features.map((f,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:5}}>
                <span style={{color:"#4a7c3f",fontSize:10}}>??/span>
                <span style={{fontSize:11,color:"#c0a878"}}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ?…ê·¸?ˆì´??/ êµ¬ë… ë²„íŠ¼ */}
        {userPlan==="free"&&(
          <button onClick={()=>{setScreen("pricing");setPayStep("select");}} style={{
            width:"100%",padding:"14px",marginBottom:10,
            background:"linear-gradient(135deg,rgba(192,57,43,.2),rgba(232,184,75,.15))",
            border:"1px solid rgba(232,184,75,.4)",color:"#e8d5b0",
            fontSize:13,letterSpacing:4,cursor:"pointer",fontFamily:"inherit"}}>
            ?‘‘ ê´€??êµ¬ë… ?œì‘?˜ê¸°
          </button>
        )}
        {userPlan==="basic"&&(
          <button onClick={()=>{setScreen("pricing");setPayStep("select");}} style={{
            width:"100%",padding:"14px",marginBottom:10,
            background:"rgba(232,184,75,.1)",border:"1px solid rgba(232,184,75,.3)",
            color:"#e8d5b0",fontSize:13,letterSpacing:4,cursor:"pointer",fontFamily:"inherit"}}>
            ???€ê°?êµ¬ë…?¼ë¡œ ?…ê·¸?ˆì´??          </button>
        )}
        {isPremium&&(
          <button onClick={()=>{setUserPlan("free");setSubExpiry(null);
            try{localStorage.removeItem("joseon_plan");localStorage.removeItem("joseon_expiry");}catch{}
            setScreen("home");}} style={{
            width:"100%",padding:"10px",background:"transparent",
            border:"1px solid rgba(100,80,50,.2)",color:"rgba(100,80,50,.4)",
            fontSize:11,letterSpacing:3,cursor:"pointer",fontFamily:"inherit"}}>
            êµ¬ë… ?´ì?
          </button>
        )}
      </div>
    </PalaceBG>
  );

  // ?â•?â•?â•?â•?â•?â•?â•?â•?â• ?œë¹„???…ë ¥ ?â•?â•?â•?â•?â•?â•?â•?â•?â•
  if(screen==="service"&&activeService)return(
    <PalaceBG scanY={scanY}>
      <PalaceHeader title={activeService.name} sub={activeService.sub} onBack={goHome}/>
      <div style={{background:"rgba(10,8,4,.85)",border:"1px solid rgba(192,152,75,.2)",
        padding:"26px 24px",animation:"unfurl .4s ease"}}>
        <div style={{fontSize:11,color:"#8b6914",letterSpacing:4,marginBottom:20}}>???ë…„?”ì¼ ?…ë ¥</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          {[["?œì–´????,"year","?? 1980"],["?œì–´????,"month","1~12"],
            ["?œì–´????,"day","1~31"],["?œì–´???œê°","hour","0~23 (? íƒ)"]].map(([lbl,key,ph])=>(
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
          <div style={{fontSize:10,color:"#8b6914",letterSpacing:2,marginBottom:7}}>?±ë³„</div>
          <div style={{display:"flex",gap:10}}>
            {["??,"??].map(g=>(
              <button key={g} onClick={()=>setForm({...form,gender:g})} style={{
                flex:1,padding:"11px 0",fontFamily:"inherit",fontSize:15,letterSpacing:5,cursor:"pointer",
                background:form.gender===g?"rgba(139,26,26,.25)":"rgba(10,8,4,.6)",
                border:form.gender===g?"1px solid #c0392b":"1px solid rgba(192,152,75,.2)",
                color:form.gender===g?"#e8d5b0":"#6b5a3a",transition:"all .2s"}}>{g}</button>
            ))}
          </div>
        </div>
        {error&&<div style={{background:"rgba(80,10,10,.6)",border:"1px solid rgba(192,57,43,.3)",
          padding:"10px 14px",marginBottom:12,fontSize:12,color:"#e8a090"}}>??{error}</div>}
        <button onClick={handleSaju} style={{
          width:"100%",padding:"13px 0",background:"rgba(139,26,26,.2)",
          border:"1px solid rgba(192,57,43,.45)",color:"#e8d5b0",
          fontSize:13,letterSpacing:5,cursor:"pointer",fontFamily:"inherit",transition:"all .3s"}}
          onMouseEnter={e=>{e.target.style.background="rgba(139,26,26,.38)";e.target.style.boxShadow="0 0 16px rgba(192,57,43,.18)";}}
          onMouseLeave={e=>{e.target.style.background="rgba(139,26,26,.2)";e.target.style.boxShadow="none";}}>
          ??{activeService.name} ?´ëŒ?˜ê¸°
        </button>
      </div>
    </PalaceBG>
  );

  // ?â•?â•?â•?â•?â•?â•?â•?â•?â• ë¡œë”© ?â•?â•?â•?â•?â•?â•?â•?â•?â•
  if(screen==="loading")return(
    <PalaceBG scanY={scanY}>
      <PalaceHeader title="ê´€?ê° ?´ëŒ ì¤? sub="è§€è±¡ç›£ ?±è¦½"/>
      <div style={{textAlign:"center",padding:"50px 20px"}}>
        <div style={{position:"relative",width:120,height:120,margin:"0 auto 28px"}}>
          <div style={{position:"absolute",inset:0,borderRadius:"50%",
            border:"1px solid rgba(192,152,75,.15)",borderTop:"1px solid #e8b84b",
            animation:"spin 2s linear infinite"}}/>
          <div style={{position:"absolute",inset:16,borderRadius:"50%",
            border:"1px solid rgba(192,57,43,.12)",borderRight:"1px solid #c0392b",
            animation:"spin 1.5s linear infinite reverse"}}/>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:28,color:"#e8b84b",animation:"brushGlow 2s infinite"}}>??/div>
        </div>
        <div style={{fontSize:14,color:"#c0a060",letterSpacing:3,minHeight:24,fontStyle:"italic"}}>{loadText}</div>
        <div style={{marginTop:10,fontSize:11,color:"rgba(139,105,20,.4)",letterSpacing:2}}>?€?œí•™??ëª…ë¦¬ë¥??´í”¼ê³??ˆìŠµ?ˆë‹¤</div>
      </div>
    </PalaceBG>
  );

  // ?â•?â•?â•?â•?â•?â•?â•?â•?â• ê²°ê³¼ ?â•?â•?â•?â•?â•?â•?â•?â•?â•
  if(screen==="result"&&result){
    const d=result.data;
    const SAJU_TABS=[
      {id:"basic",  label:"?¬ì£¼ ê¸°ë³¸",color:"#c0392b"},
      {id:"today",  label:"?¤ëŠ˜ ?´ì„¸",color:"#1a5276",lock:!isPremium},
      {id:"work",   label:"ì§ì—…??,   color:"#1e8449",lock:!isPremium},
      {id:"love",   label:"?¼ì¸??,   color:"#6c3483",lock:!isPremium},
      {id:"money",  label:"?¬ë¬¼??,   color:"#8b6914",lock:!isPremium},
      {id:"yearly", label:`${getYear()}???€??,color:"#4a7c3f",lock:!isPremium},
    ];
    return(
      <PalaceBG scanY={scanY}>
        <PalaceHeader title="?¬ì£¼?”ì ?€?? sub="?›æŸ±?«å­— è§£èªª" onBack={goHome}
          rightEl={<PlanBadge plan={userPlan} onClick={()=>setScreen("mypage")}/>}/>

        <div style={{background:"rgba(139,26,26,.1)",border:"1px solid rgba(192,57,43,.22)",
          padding:"14px 18px",marginBottom:14,animation:"inkDrop .4s ease"}}>
          <div style={{fontSize:9,color:"#8b4513",letterSpacing:4,marginBottom:5}}>ê´€?ê° ëª…ë¦¬ ì¹?˜¸</div>
          <div style={{fontSize:"clamp(13px,3vw,17px)",color:"#e8b84b",letterSpacing:3,fontWeight:700}}>{d.title}</div>
          <div style={{marginTop:5,fontSize:13,color:"#b8a080",lineHeight:1.8}}>{d.summary}</div>
        </div>

        {/* ??*/}
        <div style={{display:"flex",overflowX:"auto",borderBottom:"1px solid rgba(192,152,75,.12)",
          marginBottom:12,scrollbarWidth:"none"}}>
          {SAJU_TABS.map(t=>{const a=activeTab===t.id;return(
            <button key={t.id} onClick={()=>handleTab(t.id)} style={{
              flex:"0 0 auto",padding:"9px 13px",background:a?`${t.color}14`:"transparent",
              border:"none",borderBottom:a?`2px solid ${t.color}`:"2px solid transparent",
              color:a?t.color:"rgba(139,105,20,.45)",cursor:"pointer",
              fontFamily:"inherit",fontSize:"clamp(9px,2vw,11px)",letterSpacing:1,
              whiteSpace:"nowrap",transition:"all .2s"}}>
              {t.label}{t.lock?" ?”’":""}{cache[t.id]&&!t.lock&&<span style={{marginLeft:2,fontSize:7,color:"#e8b84b"}}>??/span>}
            </button>
          );})}
        </div>

        <div style={{background:"rgba(8,6,3,.88)",border:"1px solid rgba(192,152,75,.08)",
          padding:"18px 20px",animation:"unfurl .3s ease"}}>
          {activeTab==="basic"&&(<div>
            <div style={{fontSize:10,color:"#8b6914",letterSpacing:4,marginBottom:12}}>???¬ì£¼ ê¸°ë‘¥</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
              {["year","month","day","hour"].map((k,i)=>{
                const v=d.pillars[k];const lbl=["?„ì£¼","?”ì£¼","?¼ì£¼","?œì£¼"][i];
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
              {[["?¼å?",d.format,"#e8b84b"],["?¨ç¥",d.strong_god,"#c0392b"]].map(([l,v,c])=>(
                <div key={l} style={{background:"rgba(10,8,4,.7)",border:`1px solid ${c}1a`,
                  padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#8b6914",letterSpacing:2,marginBottom:4}}>{l}</div>
                  <div style={{fontSize:15,color:c,letterSpacing:2}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{background:"rgba(8,6,3,.7)",border:"1px solid rgba(192,152,75,.08)",
              padding:"14px 16px",marginBottom:12}}>
              <div style={{fontSize:10,color:"#8b6914",letterSpacing:4,marginBottom:10}}>???¤í–‰ ë°°í•©</div>
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
            {[["???€ê³ ë‚œ ?´ëª…",d.life_path,"#c0a878"],["??ì£¼ì˜ ?¬í•­",d.caution,"#c0392b"]].map(([l,v,c])=>(
              <div key={l} style={{marginBottom:10,paddingBottom:10,borderBottom:"1px solid rgba(192,152,75,.06)"}}>
                <div style={{fontSize:9,color:"#8b6914",letterSpacing:3,marginBottom:5}}>{l}</div>
                <div style={{fontSize:13,color:c,lineHeight:1.85}}>{v}</div>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["ê¸¸í•œ ë°©ìœ„",d.lucky_direction,"#1a5276"],["ê¸¸í•œ ?‰ìƒ",d.lucky_color,"#1e8449"]].map(([l,v,c])=>(
                <div key={l} style={{background:"rgba(8,6,3,.7)",border:`1px solid ${c}18`,padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#8b6914",letterSpacing:2,marginBottom:4}}>{l}</div>
                  <div style={{fontSize:13,color:c}}>{v}</div>
                </div>
              ))}
            </div>

            {/* ë¹„êµ¬?…ì ? ê¸ˆ ? ë„ */}
            {!isPremium&&(
              <button onClick={()=>setScreen("pricing")} style={{
                width:"100%",marginTop:16,padding:"14px",
                background:"linear-gradient(135deg,rgba(192,57,43,.15),rgba(232,184,75,.1))",
                border:"1px solid rgba(232,184,75,.35)",color:"#e8d5b0",
                fontSize:12,letterSpacing:3,cursor:"pointer",fontFamily:"inherit"}}>
                ?‘‘ êµ¬ë…?˜ë©´ ì§ì—…Â·?¼ì¸Â·?¬ë¬¼Â·?€???ì„¸ ?´ì„¸ê¹Œì? ??              </button>
            )}
          </div>)}

          {activeTab!=="basic"&&cache[activeTab]&&(()=>{
            const td=cache[activeTab];
            const tc=SAJU_TABS.find(t=>t.id===activeTab);
            return(<div>
              <div style={{fontSize:10,color:tc?.color,letterSpacing:3,marginBottom:12}}>??{tc?.label}</div>
              <div style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:10,color:"#8b6914",letterSpacing:2}}>?´ì„¸ ì§€??/span>
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
                  <div style={{fontSize:9,color:"#8b6914",letterSpacing:3,marginBottom:4}}>??{k.replace(/_/g," ").toUpperCase()}</div>
                  <div style={{fontSize:13,color:"#c0a878",lineHeight:1.85}}>{v}</div>
                </div>
              ))}
            </div>);
          })()}

          {tabLoading&&<div style={{textAlign:"center",padding:"30px"}}>
            <div style={{width:36,height:36,margin:"0 auto 10px",borderRadius:"50%",
              border:"1px solid rgba(232,184,75,.2)",borderTop:"1px solid #e8b84b",
              animation:"spin 1.5s linear infinite"}}/>
            <div style={{fontSize:11,color:"#c0a060",letterSpacing:2}}>ê´€?ê° ?´ëŒ ì¤?..</div>
          </div>}
        </div>

        <button onClick={goHome} style={{width:"100%",marginTop:12,padding:"10px",background:"transparent",
          border:"1px solid rgba(192,152,75,.12)",color:"rgba(139,105,20,.45)",
          fontSize:11,letterSpacing:4,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}
          onMouseEnter={e=>{e.target.style.color="#8b6914";}}
          onMouseLeave={e=>{e.target.style.color="rgba(139,105,20,.45)";}}>
          ??ê´€ì²?ëª©ë¡?¼ë¡œ
        </button>
        <div style={{textAlign:"center",marginTop:16,fontSize:10,color:"rgba(139,105,20,.28)",letterSpacing:3}}>
          ?é? ?½ç†??Â· {getToday()}
        </div>
      </PalaceBG>
    );
  }
  return null;
}
