// pages/api/claude.js
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
    const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
    const cl = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const s = cl.indexOf("{"), e = cl.lastIndexOf("}");
    if (s === -1 || e === -1) throw new Error("JSON 파싱 실패");
    const parsed = JSON.parse(cl.slice(s, e + 1));

    return res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
