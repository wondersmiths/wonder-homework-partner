import { NextRequest, NextResponse } from "next/server";
import { askClaude, askClaudeWithImage, parseJSON } from "@/lib/claude";
import { SYSTEM_PROMPT, PROMPTS } from "@/lib/prompts";
import { sanitizeStudentContent } from "@/lib/guardrail";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

type ImageMediaType = (typeof ALLOWED_IMAGE_TYPES)[number];

export async function POST(req: NextRequest) {
  try {
    const { studentName, gradeLevel, problems, image, imageType, studentId } =
      await req.json();

    if (!studentName || !gradeLevel || (!problems && !image)) {
      return NextResponse.json(
        { error: "Missing required fields. Provide homework text or a photo." },
        { status: 400 }
      );
    }

    let response: string;

    if (image) {
      const mediaType = (
        ALLOWED_IMAGE_TYPES.includes(imageType as ImageMediaType)
          ? imageType
          : "image/jpeg"
      ) as ImageMediaType;

      const prompt = PROMPTS.gradeHomeworkImage(studentName, gradeLevel);
      response = await askClaudeWithImage(
        SYSTEM_PROMPT,
        prompt,
        image,
        mediaType
      );
    } else {
      const prompt = PROMPTS.gradeHomework(studentName, gradeLevel, problems);
      response = await askClaude(SYSTEM_PROMPT, prompt, true);
    }
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

    // Save to database if student is linked
    if (studentId) {
      try {
        const supabase = await createClient();
        const grades = result.grades || [];
        const correctCount = grades.filter(
          (g: { score: number }) => g.score === 1
        ).length;

        const { data: session } = await supabase
          .from("grading_sessions")
          .insert({
            student_id: studentId,
            input_mode: image ? "photo" : "text",
            problems_text: problems || null,
            overall_score: result.overall_score,
            encouragement: result.encouragement,
            total_problems: grades.length,
            correct_count: correctCount,
          })
          .select("id")
          .single();

        if (session) {
          const resultRows = grades.map(
            (g: {
              problem: string;
              student_answer: string;
              correct_answer: string;
              score: number;
              explanation: string;
              hint: string;
            }) => ({
              session_id: session.id,
              problem: g.problem,
              student_answer: g.student_answer,
              correct_answer: g.correct_answer,
              score: g.score,
              explanation: g.explanation,
              hint: g.hint,
            })
          );
          await supabase.from("grading_results").insert(resultRows);
        }
      } catch (dbError) {
        console.error("Failed to save grading results:", dbError);
        // Don't fail the request if DB save fails
      }
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
