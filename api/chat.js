
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing in Vercel Environment Variables."
    });
  }

  try {
    const { messages = [] } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Messages must be an array."
      });
    }

    const contents = messages
      .filter(
        (message) =>
          message &&
          ["user", "assistant"].includes(message.role) &&
          typeof message.content === "string" &&
          message.content.trim()
      )
      .slice(-10)
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [
          {
            text: message.content.trim().slice(0, 3000)
          }
        ]
      }));

    while (contents.length && contents[0].role === "model") {
      contents.shift();
    }

    if (!contents.length) {
      return res.status(400).json({
        error: "Please speak or send a message first."
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "You are SpeakAI, a friendly English speaking partner. " +
                  "Answer the user's latest message directly and naturally. " +
                  "Use simple English suitable for a learner. " +
                  "Gently correct important mistakes when useful. " +
                  "Ask exactly one relevant follow-up question. " +
                  "Avoid repeating previous answers or saying 'Ask me more' repeatedly. " +
                  "Keep replies brief and friendly."
              }
            ]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", response.status, data);

      return res.status(502).json({
        error:
          data?.error?.message ||
          `Gemini API request failed with status ${response.status}.`
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      console.error("Gemini returned no text:", JSON.stringify(data));

      return res.status(502).json({
        error:
          "Gemini returned no reply. Check API availability and quota."
      });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("SpeakAI backend error:", error);

    return res.status(500).json({
      error: "Server error: " + (error.message || "Unknown error")
    });
  }
}
