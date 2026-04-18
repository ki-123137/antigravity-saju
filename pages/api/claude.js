// pages/api/claude.js
// ── 서버사이드 프록시: API 키가 브라우저에 절대 노출되지 않음 ──

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { system, user, tokens = 4000 } = req.body;
  if (!system || !user) return res.status(400).json({ error: "system/user 필드 필요" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: tokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("") || "";

    // JSON 안전 추출
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const s = cleaned.indexOf("{"), e = cleaned.lastIndexOf("}");
    if (s === -1 || e === -1) throw new Error("JSON을 찾을 수 없습니다");
    const parsed = JSON.parse(cleaned.slice(s, e + 1));

    return res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    console.error("Claude API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
