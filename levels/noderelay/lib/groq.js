/**
 * groq.js — NULL Challenge // Protocol 17
 *
 * Thin wrapper around the Groq chat completions API.
 * Uses llama-3.1-8b-instant with temperature 0 for deterministic grading.
 *
 * We call the raw REST endpoint rather than the Groq SDK to keep
 * this project zero-dependency on the server side.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Send a message array to Groq and return the raw text content of
 * the first choice.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>} — the model's raw reply
 * @throws {Error} if the API call fails or returns an unexpected shape
 */
async function chat(messages) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      max_tokens: 16,       // We only need "PASS" or "FAIL"
      messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "(unreadable)");
    throw new Error(`Groq API error ${response.status}: ${body}`);
  }

  const data = await response.json();

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Groq response missing expected content field");
  }

  return content;
}

module.exports = { chat };