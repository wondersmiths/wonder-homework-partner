import { NextRequest, NextResponse } from "next/server";
import { askClaude, parseJSON } from "@/lib/claude";
import { PROMPTS } from "@/lib/prompts";

const PARENT_SYSTEM = `You are a report generator for Wonder Mentorship, a nonprofit homework platform. Generate clear, appreciative, impact-focused reports for parents. Return structured JSON only.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentName,
      gradeLevel,
      topicsPracticed,
      problemsCompleted,
      accuracyAverage,
      improvementAreas,
      strengths,
    } = body;

    if (!studentName || !gradeLevel) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = PROMPTS.weeklyReport({
      studentName,
      gradeLevel,
      topicsPracticed: topicsPracticed || [],
      problemsCompleted: problemsCompleted || 0,
      accuracyAverage: accuracyAverage || 0,
      improvementAreas: improvementAreas || [],
      strengths: strengths || [],
    });

    const response = await askClaude(PARENT_SYSTEM, prompt);
    const result = parseJSON(response);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Report API error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
