// pages/api/saju.js
// ── 서버사이드 프록시: API 키가 클라이언트에 절대 노출되지 않음 ──

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 '안티그래비티 프로그램 제작기'의 우주 운명 해석 AI입니다.
사용자의 생년월일시를 받아 사주풀이를 제공합니다.

반드시 아래 JSON 형식으로만 응답하세요 (마크다운 코드블록 없이 순수 JSON):
{
  "title": "프로그램 코드명 (예: DESTINY-PROTOCOL-木火)",
  "saju_summary": "사주 한 줄 요약 (20자 이내)",
  "pillars": {
    "year":  {"gan":"천간","ji":"지지","desc":"년주 해설 2-3문장"},
    "month": {"gan":"천간","ji":"지지","desc":"월주 해설 2-3문장"},
    "day":   {"gan":"천간","ji":"지지","desc":"일주 해설 2-3문장"},
    "hour":  {"gan":"천간","ji":"지지","desc":"시주 해설 2-3문장"}
  },
  "elements": {"wood":0,"fire":0,"earth":0,"metal":0,"water":0},
  "dominant_element": "오행 중 가장 강한 것",
  "destiny_log": ["항목1","항목2","항목3","항목4"],
  "life_mission": "인생 미션 2-3문장",
  "caution": "주의사항 한 문장",
  "lucky_code": "행운 코드 (예: GRAVITY-NULL-POINT-7749)"
}
오행 비율 합계는 100. 실제 사주 이론 기반으로 안티그래비티 세계관 언어로 서술.`;

export default async function handler(req, res) {
  // POST 만 허용
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { year, month, day, hour, gender, creditToken } = req.body;

  // ── 필수값 검증 ──
  if (!year || !month || !day || !gender) {
    return res.status(400).json({ error: "생년월일과 성별을 모두 입력하세요." });
  }

  // ── 크레딧 토큰 검증 (lib/credits.js 참고) ──
  const tokenValid = verifyAndConsumeToken(creditToken);
  if (!tokenValid) {
    return res.status(402).json({ error: "유효한 크레딧이 없습니다. 결제 후 이용해 주세요." });
  }

  try {
    const userMsg = `생년: ${year}년 ${month}월 ${day}일 ${hour ? hour + "시" : "시간 미상"}, 성별: ${gender}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    });

    const raw = message.content.map((b) => b.text || "").join("");
    const data = JSON.parse(raw.replace(/```json|```/g, "").trim());

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Anthropic API error:", err);
    return res.status(500).json({ error: "분석 중 오류가 발생했습니다." });
  }
}

// ── 간단한 인메모리 토큰 관리 (프로덕션: DB로 교체 권장) ──
// 실제 서비스는 Redis / Supabase / PlanetScale 사용 권장
const tokenStore = new Map(); // token → { credits: number }

export function issueToken(sessionId, credits) {
  tokenStore.set(sessionId, { credits });
  return sessionId;
}

function verifyAndConsumeToken(token) {
  if (!token) return false;
  const entry = tokenStore.get(token);
  if (!entry || entry.credits <= 0) return false;
  entry.credits -= 1;
  if (entry.credits === 0) tokenStore.delete(token);
  return true;
}
