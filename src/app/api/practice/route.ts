import { NextRequest, NextResponse } from "next/server";
import { askClaude, parseJSON } from "@/lib/claude";
import { SYSTEM_PROMPT, PROMPTS } from "@/lib/prompts";
import { sanitizeStudentContent } from "@/lib/guardrail";

export async function POST(req: NextRequest) {
  try {
    const { studentName, gradeLevel, topics } = await req.json();

    if (!studentName || !gradeLevel || !topics?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = PROMPTS.generatePractice(studentName, gradeLevel, topics);
    const response = await askClaude(SYSTEM_PROMPT, prompt);
    const result = parseJSON(response);

    // Guardrail
    if (result.practice_problems) {
      result.practice_problems = result.practice_problems.map(
        (p: { problem: string; explanation: string }) => ({
          ...p,
          problem: sanitizeStudentContent(p.problem),
          explanation: sanitizeStudentContent(p.explanation),
        })
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Practice API error:", error);
    return NextResponse.json(
      { error: "Failed to generate practice problems" },
      { status: 500 }
    );
  }
}
