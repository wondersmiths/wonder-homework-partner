import { NextRequest, NextResponse } from "next/server";
import { askClaudeStream, parseJSON } from "@/lib/claude";
import { SYSTEM_PROMPT, PROMPTS } from "@/lib/prompts";
import { sanitizeStudentContent } from "@/lib/guardrail";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { studentName, gradeLevel, mistakes } = await req.json();

    if (!studentName || !gradeLevel || !mistakes?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = PROMPTS.practiceFromMistakes(
      studentName,
      gradeLevel,
      mistakes
    );
    const response = await askClaudeStream(SYSTEM_PROMPT, prompt);
    const result = parseJSON(response);

    // Sanitize student-facing text
    if (result.practice_sets) {
      result.practice_sets = result.practice_sets.map(
        (set: { problems: { problem: string; explanation: string }[] }) => ({
          ...set,
          problems: set.problems.map((p) => ({
            ...p,
            problem: sanitizeStudentContent(p.problem),
            explanation: sanitizeStudentContent(p.explanation),
          })),
        })
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Practice-mistakes API error:", error);
    return NextResponse.json(
      { error: "Failed to generate practice problems" },
      { status: 500 }
    );
  }
}
