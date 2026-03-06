import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, PROMPTS } from "@/lib/prompts";
import { sanitizeStudentContent } from "@/lib/guardrail";
import { parseJSON } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

type ImageMediaType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const maxDuration = 60;

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

    // Build the messages array
    let messages: Anthropic.MessageParam[];
    if (image) {
      const mediaType = (
        ALLOWED_IMAGE_TYPES.includes(imageType as ImageMediaType)
          ? imageType
          : "image/jpeg"
      ) as ImageMediaType;

      const prompt = PROMPTS.gradeHomeworkImage(studentName, gradeLevel);
      messages = [
        {
          role: "user" as const,
          content: [
            {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: mediaType,
                data: image,
              },
            },
            { type: "text" as const, text: prompt },
          ],
        },
      ];
    } else {
      const prompt = PROMPTS.gradeHomework(studentName, gradeLevel, problems);
      messages = [{ role: "user" as const, content: prompt }];
    }

    // Stream from Claude — this keeps the Vercel connection alive
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullText = "";
          const claudeStream = client.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            messages,
          });

          // Send a heartbeat so Vercel knows we're alive
          controller.enqueue(encoder.encode(" "));

          for await (const event of claudeStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              fullText += event.delta.text;
            }
          }

          // Parse and process the result
          let result = parseJSON(fullText);

          // Strip work field and sanitize
          if (result.grades) {
            result.grades = result.grades.map(
              (g: { work?: string; explanation: string; hint: string }) => {
                const { work: _work, ...rest } = g;
                return {
                  ...rest,
                  explanation: sanitizeStudentContent(g.explanation),
                  hint: sanitizeStudentContent(g.hint),
                };
              }
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
            }
          }

          // Send the final JSON result
          controller.enqueue(encoder.encode(JSON.stringify(result)));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          const message =
            error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ error: "Failed to grade homework", debug: message })
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/json",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Grade API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to grade homework", debug: message },
      { status: 500 }
    );
  }
}
