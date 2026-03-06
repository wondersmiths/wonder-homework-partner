import { NextRequest, NextResponse } from "next/server";
import { askClaude, parseJSON } from "@/lib/claude";
import { SYSTEM_PROMPT, PROMPTS } from "@/lib/prompts";
import { sanitizeStudentContent } from "@/lib/guardrail";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const { studentName, gradeLevel, topics, studentId } = await req.json();

    if (!studentName || !gradeLevel || !topics?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = PROMPTS.generatePractice(studentName, gradeLevel, topics);
    const response = await askClaude(SYSTEM_PROMPT, prompt);
    const result = parseJSON(response);

    // Strip internal work field and sanitize student-facing text
    if (result.practice_problems) {
      result.practice_problems = result.practice_problems.map(
        (p: { work?: string; problem: string; explanation: string }) => {
          const { work: _work, ...rest } = p;
          return {
            ...rest,
            problem: sanitizeStudentContent(p.problem),
            explanation: sanitizeStudentContent(p.explanation),
          };
        }
      );
    }

    // Save to database if student is linked
    if (studentId) {
      try {
        const supabase = await createClient();
        await supabase.from("practice_sessions").insert({
          student_id: studentId,
          topics,
          problem_count: result.practice_problems?.length || 0,
        });
      } catch (dbError) {
        console.error("Failed to save practice session:", dbError);
      }
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
