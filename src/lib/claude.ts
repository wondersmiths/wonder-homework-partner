import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export async function askClaudeStream(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  let result = "";
  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      result += event.delta.text;
    }
  }
  return result;
}

export async function askClaudeStreamWithImage(
  systemPrompt: string,
  userPrompt: string,
  imageBase64: string,
  mediaType: ImageMediaType
): Promise<string> {
  let result = "";
  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
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

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      result += event.delta.text;
    }
  }
  return result;
}

export function parseJSON(text: string) {
  // Try markdown code block first
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1].trim());
  }

  // Try to find JSON object in the text
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return JSON.parse(objectMatch[0]);
  }

  // Last resort: try parsing the whole text
  return JSON.parse(text.trim());
}
