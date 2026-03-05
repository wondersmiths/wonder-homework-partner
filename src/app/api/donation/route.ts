import { NextRequest, NextResponse } from "next/server";
import { askClaude, parseJSON } from "@/lib/claude";
import { PROMPTS } from "@/lib/prompts";

const PARENT_SYSTEM = `You are a message generator for Wonder Mentorship, a nonprofit homework platform. Generate gentle, impact-based donation messages for parents. Never pressure. Return structured JSON only.`;

export async function POST(req: NextRequest) {
  try {
    const { type, ...data } = await req.json();

    let prompt: string;

    if (type === "thank_you") {
      prompt = PROMPTS.thankYou(data.amount || 10, data.frequency || "one-time");
    } else {
      prompt = PROMPTS.donationMessage(
        data.problemsCompleted || 0,
        data.donorStatus || "non-donor"
      );
    }

    const response = await askClaude(PARENT_SYSTEM, prompt);
    const result = parseJSON(response);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Donation API error:", error);
    return NextResponse.json(
      { error: "Failed to generate message" },
      { status: 500 }
    );
  }
}
