
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "API key is not configured" });
  }

  try {
    const { messages = [] } = req.body || {};

    const contents = messages
      .filter(m => m && ["user", "assistant"].includes(m.role) && m.content)
      .slice(-10)
      .map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content).slice(0, 3000) }]
      }));

    while (contents.length && contents[0].role === "model") {
      contents.shift();
    }

    if (!contents.length) {
      return res.status(400).json({ error: "Please send a message" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "You are SpeakAI, a friendly English speaking partner. Reply naturally and briefly, like a real conversation. Understand the user's latest message and answer it directly. Gently correct important English mistakes and show a natural version when useful. Ask exactly one relevant follow-up question. Avoid repeating phrases and never always say 'Ask me more'. Use simple English suitable for a learner."
            }]
          },
          contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 250
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: data?.error?.message || "AI request failed"
      });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    return res.status(200).json({
      reply: reply || "Could you tell me a little more?"
    });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong on the server" });
  }
}
