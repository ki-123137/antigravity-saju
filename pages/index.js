// pages/index.js — 운명철학 플랫폼 허브
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const APPS = [
  {
    id: "joseon",
    name: "조선 명리원",
    nameH: "朝鮮 命理院",
    desc: "사주·토정비결·궁합·이름풀이",
    detail: "조선 왕실 풍수 세계관 · 전통 역학",
    icon: "☯",
    color: "#c0392b",
    accent: "#e8b84b",
    bg: "rgba(139,26,26,.15)",
    border: "rgba(192,57,43,.35)",
    badge: "구독 서비스",
    badgeColor: "#e8b84b",
    href: "/joseon",
  },
  {
    id: "saju",
    name: "안티그래비티",
    nameH: "ANTI-GRAVITY",
    desc: "사주·오늘운세·직장운·연애운·재물운",
    detail: "SF 우주 세계관 · 7탭 운세 분석",
    icon: "◈",
    color: "#00d4ff",
    accent: "#00ffaa",
    bg: "rgba(0,100,200,.1)",
    border: "rgba(0,180,255,.3)",
    badge: "인기",
    badgeColor: "#00d4ff",
    href: "/saju",
  },
  {
    id: "tarot",
    name: "사주 × 타로",
    nameH: "DESTINY READING",
    desc: "사주 + 타로 78장 통합 리딩",
    detail: "SF 우주 세계관 · 카드 공개 연출",
    icon: "✦",
    color: "#a78bfa",
    accent: "#00ffcc",
    bg: "rgba(100,50,200,.1)",
    border: "rgba(140,100,255,.3)",
    badge: "NEW",
    badgeColor: "#a78bfa",
    href: "/tarot",
  },
  {
    id: "moon",
    name: "달빛 마녀 살롱",
    nameH: "MOONLIGHT SALON",
    desc: "사주·달빛운세·연애·재물·수정 리딩",
    detail: "신비 마법 세계관 · 여성 특화",
    icon: "🌙",
    color: "#f472b6",
    accent: "#c8a8e8",
    bg: "rgba(120,60,160,.1)",
    border: "rgba(200,160,232,.3)",
    badge: "준비중",
    badgeColor: "#9b7db8",
    href: "/moon",
    soon: true,
  },
];

export default function Hub() {
  const router = useRouter();
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      dur: 3 + Math.random() * 5,
      del: Math.random() * 4,
    }))
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#06030f 0%,#0e0818 50%,#06050a 100%)",
      color: "#e8d5b0",
      fontFamily: "'Noto Serif KR','Batang',Georgia,serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* 배경 파티클 */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: "fixed",
          left: `${p.left}%`, top: `${p.top}%`,
          width: p.size, height: p.size,
          borderRadius: "50%",
          background: "rgba(200,180,255,.5)",
          pointerEvents: "none", zIndex: 0,
          animation: `tw ${p.dur}s ease-in-out ${p.del}s infinite`,
        }}/>
      ))}

      {/* 상단 단청 */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 5, zIndex: 10,
        background: "repeating-linear-gradient(90deg,#8b1a1a 0px,#8b1a1a 18px,#c0392b 18px,#c0392b 22px,#e8b84b 22px,#e8b84b 26px,#4a7c3f 26px,#4a7c3f 30px,#1a5276 30px,#1a5276 34px,#a78bfa 34px,#a78bfa 38px)",
      }}/>
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 4, zIndex: 10,
        background: "repeating-linear-gradient(90deg,#8b1a1a 0px,#8b1a1a 18px,#c0392b 18px,#c0392b 22px,#e8b84b 22px,#e8b84b 26px,#4a7c3f 26px,#4a7c3f 30px,#1a5276 30px,#1a5276 34px,#a78bfa 34px,#a78bfa 38px)",
      }}/>

      <div style={{ position: "relative", zIndex: 3, maxWidth: 720, margin: "0 auto", padding: "40px 20px 70px" }}>
        {/* 헤더 */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-block", border: "2px solid #8b1a1a",
            padding: "4px 20px", marginBottom: 14,
            background: "rgba(139,26,26,.12)",
          }}>
            <span style={{ fontSize: 10, letterSpacing: 6, color: "#c0392b" }}>運命哲學 플랫폼</span>
          </div>
          <h1 style={{
            fontSize: "clamp(28px,6vw,48px)", fontWeight: 700, margin: 0,
            background: "linear-gradient(135deg,#e8b84b,#c0392b,#a78bfa,#00d4ff)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: 4, lineHeight: 1.2,
          }}>
            운명 철학 플랫폼
          </h1>
          <div style={{ fontSize: 13, color: "#8b7a5a", letterSpacing: 4, marginTop: 8 }}>
            사주 · 타로 · 풍수 · 달빛 운세
          </div>
          {/* 장식선 */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, margin:"20px 0" }}>
            <div style={{ flex:1, height:1, background:"linear-gradient(90deg,transparent,#8b6914)", maxWidth:140 }}/>
            <span style={{ color:"#c0392b", fontSize:18 }}>◆</span>
            <div style={{ width:36, height:1, background:"#8b6914" }}/>
            <span style={{ color:"#a78bfa", fontSize:10 }}>◇</span>
            <div style={{ width:36, height:1, background:"#8b6914" }}/>
            <span style={{ color:"#c0392b", fontSize:18 }}>◆</span>
            <div style={{ flex:1, height:1, background:"linear-gradient(90deg,#8b6914,transparent)", maxWidth:140 }}/>
          </div>
        </div>

        {/* 앱 카드 목록 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {APPS.map((app, idx) => (
            <button
              key={app.id}
              onClick={() => !app.soon && router.push(app.href)}
              style={{
                display: "flex", alignItems: "center", gap: 18,
                background: app.bg,
                border: `1px solid ${app.border}`,
                padding: "20px 22px",
                cursor: app.soon ? "default" : "pointer",
                fontFamily: "inherit", color: "#e8d5b0", textAlign: "left",
                opacity: app.soon ? 0.55 : 1,
                transition: "all .25s",
                animation: `fadeUp .4s ease ${idx * .1}s both`,
                position: "relative", overflow: "hidden",
              }}
              onMouseEnter={e => {
                if (!app.soon) {
                  e.currentTarget.style.borderColor = app.color;
                  e.currentTarget.style.boxShadow = `0 0 24px ${app.color}22`;
                  e.currentTarget.style.background = `${app.bg.replace(".1)", ".18)")}`;
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = app.border;
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.background = app.bg;
              }}
            >
              {/* 아이콘 */}
              <div style={{
                width: 56, height: 56, flexShrink: 0,
                border: `1px solid ${app.color}55`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, color: app.color,
                background: `${app.color}10`,
              }}>
                {app.icon}
              </div>
              {/* 텍스트 */}
              <div style={{ flex: 1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:17, fontWeight:700, letterSpacing:2 }}>{app.name}</span>
                  <span style={{ fontSize:11, color:"#8b6914", letterSpacing:1 }}>{app.nameH}</span>
                  <span style={{
                    fontSize: 9, padding: "1px 7px",
                    border: `1px solid ${app.badgeColor}55`,
                    color: app.badgeColor, letterSpacing: 1,
                  }}>{app.badge}</span>
                </div>
                <div style={{ fontSize: 13, color: "#c0a878", marginBottom:3 }}>{app.desc}</div>
                <div style={{ fontSize: 11, color: "#6b5a3a" }}>{app.detail}</div>
              </div>
              {/* 화살표 */}
              {!app.soon && (
                <div style={{ fontSize: 20, color: app.color, opacity: .7 }}>▷</div>
              )}
            </button>
          ))}
        </div>

        <div style={{ textAlign:"center", marginTop:36, fontSize:10, color:"rgba(139,105,20,.3)", letterSpacing:3 }}>
          運命哲學 플랫폼 · {new Date().getFullYear()}
        </div>
      </div>

      <style>{`
        @keyframes tw { 0%,100%{opacity:.08} 50%{opacity:.7} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; background:#06030f; }
        ::-webkit-scrollbar-thumb { background:rgba(192,152,75,.3); }
      `}</style>
    </div>
  );
}
