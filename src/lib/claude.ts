import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export async function askClaude(
  systemPrompt: string,
  userPrompt: string,
  useThinking = false
): Promise<string> {
  if (useThinking) {
    const message = await client.beta.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      thinking: { type: "enabled", budget_tokens: 10000 },
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      betas: ["interleaved-thinking-2025-05-14"],
    });

    // With thinking enabled, find the text block (skip thinking blocks)
    for (const block of message.content) {
      if (block.type === "text") {
        return block.text;
      }
    }
    throw new Error("No text response from Claude");
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = message.content[0];
  if (block.type === "text") {
    return block.text;
  }
  throw new Error("Unexpected response type from Claude");
}

export async function askClaudeWithImage(
  systemPrompt: string,
  userPrompt: string,
  imageBase64: string,
  mediaType: ImageMediaType
): Promise<string> {
  const message = await client.beta.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    thinking: { type: "enabled", budget_tokens: 10000 },
    betas: ["interleaved-thinking-2025-05-14"],
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: userPrompt,
          },
        ],
      },
    ],
  });

  // With thinking enabled, find the text block (skip thinking blocks)
  for (const block of message.content) {
    if (block.type === "text") {
      return block.text;
    }
  }
  throw new Error("No text response from Claude");
}

export function parseJSON(text: string) {
  // Extract JSON from potential markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}
