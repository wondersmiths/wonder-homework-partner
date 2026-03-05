import { NextRequest, NextResponse } from "next/server";
import { askClaude, parseJSON } from "@/lib/claude";
import { SYSTEM_PROMPT, PROMPTS } from "@/lib/prompts";
import { sanitizeStudentContent } from "@/lib/guardrail";

export async function POST(req: NextRequest) {
  try {
    const { studentName, gradeLevel, problems } = await req.json();

    if (!studentName || !gradeLevel || !problems) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = PROMPTS.gradeHomework(studentName, gradeLevel, problems);
    const response = await askClaude(SYSTEM_PROMPT, prompt);
    const result = parseJSON(response);

    // Guardrail: sanitize all student-facing text
    if (result.grades) {
      result.grades = result.grades.map(
        (g: { explanation: string; hint: string }) => ({
          ...g,
          explanation: sanitizeStudentContent(g.explanation),
          hint: sanitizeStudentContent(g.hint),
        })
      );
    }
    if (result.encouragement) {
      result.encouragement = sanitizeStudentContent(result.encouragement);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Grade API error:", error);
    return NextResponse.json(
      { error: "Failed to grade homework" },
      { status: 500 }
    );
  }
}
