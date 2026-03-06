import { NextRequest, NextResponse } from "next/server";
import { askClaude, parseJSON } from "@/lib/claude";
import { PROMPTS } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";

const PARENT_SYSTEM = `You are a report generator for Wonder Mentorship, a nonprofit homework platform. Generate clear, appreciative, impact-focused reports for parents. Return structured JSON only.`;

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId } = body;

    let reportData = body;

    // If studentId is provided, pull real data from the database
    if (studentId) {
      const supabase = await createClient();

      const { data: student } = await supabase
        .from("students")
        .select("name, grade_level")
        .eq("id", studentId)
        .single();

      if (!student) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 }
        );
      }

      // Get grading sessions from the last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: sessions } = await supabase
        .from("grading_sessions")
        .select("total_problems, correct_count, created_at")
        .eq("student_id", studentId)
        .gte("created_at", weekAgo.toISOString());

      const { data: practices } = await supabase
        .from("practice_sessions")
        .select("topics, problem_count")
        .eq("student_id", studentId)
        .gte("created_at", weekAgo.toISOString());

      const totalProblems = (sessions || []).reduce(
        (sum, s) => sum + (s.total_problems || 0),
        0
      );
      const totalCorrect = (sessions || []).reduce(
        (sum, s) => sum + (s.correct_count || 0),
        0
      );
      const accuracy = totalProblems > 0 ? totalCorrect / totalProblems : 0;

      // Gather topics from practice sessions
      const allTopics = (practices || []).flatMap((p) => p.topics || []);
      const uniqueTopics = [...new Set(allTopics)];

      const practiceCount = (practices || []).reduce(
        (sum, p) => sum + (p.problem_count || 0),
        0
      );

      reportData = {
        studentName: student.name,
        gradeLevel: String(student.grade_level),
        topicsPracticed: uniqueTopics,
        problemsCompleted: totalProblems + practiceCount,
        accuracyAverage: accuracy,
        improvementAreas: body.improvementAreas || [],
        strengths: body.strengths || [],
      };
    }

    const {
      studentName,
      gradeLevel,
      topicsPracticed,
      problemsCompleted,
      accuracyAverage,
      improvementAreas,
      strengths,
    } = reportData;

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
