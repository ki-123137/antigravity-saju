// pages/api/claude.js
// ?€?€ ?œë²„?¬ì´???„ë¡?? API ?¤ê? ë¸Œë¼?°ì????ˆë? ?¸ì¶œ?˜ì? ?ŠìŒ ?€?€

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { system, user, tokens = 4000 } = req.body;
  if (!system || !user) return res.status(400).json({ error: "system/user ?„ë“œ ?„ìš”" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
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

    // JSON ?ˆì „ ì¶”ì¶œ
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const s = cleaned.indexOf("{"), e = cleaned.lastIndexOf("}");
    if (s === -1 || e === -1) throw new Error("JSON??ì°¾ì„ ???†ìŠµ?ˆë‹¤");
    const parsed = JSON.parse(cleaned.slice(s, e + 1));

    return res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    console.error("Claude API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
