export const SYSTEM_PROMPT = `You are an AI math tutor for Wonder Mentorship, a nonprofit homework partner for students in grades 3-8. You are encouraging, patient, and mentor-like. You promote a growth mindset. You NEVER mention donations, costs, or payment. Return ONLY valid JSON, no other text.

IMPORTANT: Always verify your arithmetic by substituting answers back into the original equation. Getting the math right is your #1 priority.`;

export const PROMPTS = {
  gradeHomework: (studentName: string, gradeLevel: string, problems: string) => `
Grade ${studentName}'s homework (grade ${gradeLevel}).

For EACH problem:
1. Write "work" field FIRST: solve step-by-step and verify by substituting back
2. Then set correct_answer and score based on your verified solution
3. Write a clear explanation (2-3 sentences) that teaches the concept, not just states right/wrong
4. For wrong answers: show where they went wrong and the correct approach
5. For correct answers: reinforce what they did well

Problems:
${problems}

Return ONLY this JSON:
{
  "grades": [
    {
      "work": "your solution steps + verification",
      "problem": "problem text",
      "student_answer": "their answer",
      "correct_answer": "verified answer",
      "score": 1,
      "explanation": "2-3 sentence explanation teaching the concept",
      "hint": "actionable tip for improvement or reinforcement"
    }
  ],
  "overall_score": "X/Y",
  "encouragement": "encouraging message about their effort"
}`,

  gradeHomeworkImage: (studentName: string, gradeLevel: string) => `
Read the homework photo carefully. Grade ${studentName}'s work (grade ${gradeLevel}).

For EACH problem you can read from the image:
1. Write "work" field FIRST: solve step-by-step and verify by substituting back
2. Then set correct_answer and score based on your verified solution
3. Write a clear explanation (2-3 sentences) that teaches the concept
4. For wrong answers: show where they went wrong and the correct approach
5. For correct answers: reinforce what they did well

Return ONLY this JSON:
{
  "grades": [
    {
      "work": "your solution steps + verification",
      "problem": "problem text from image",
      "student_answer": "their written answer",
      "correct_answer": "verified answer",
      "score": 1,
      "explanation": "2-3 sentence explanation teaching the concept",
      "hint": "actionable tip"
    }
  ],
  "overall_score": "X/Y",
  "encouragement": "encouraging message"
}`,

  generatePractice: (studentName: string, gradeLevel: string, topics: string[]) => `
Generate 5 practice problems for ${studentName} (grade ${gradeLevel}) on: ${topics.join(", ")}.

Each problem should be grade-appropriate. Verify each solution by substituting back.

Return ONLY this JSON:
{
  "practice_problems": [
    {
      "problem": "clear problem statement",
      "solution": "the answer",
      "explanation": "step-by-step solution showing how to get the answer"
    }
  ]
}`,

  practiceFromMistakes: (studentName: string, gradeLevel: string, mistakes: { problem: string; student_answer: string; correct_answer: string; explanation: string }[]) => `
${studentName} (grade ${gradeLevel}) got these problems wrong. Generate 3 similar practice problems for EACH mistake to help them master the concept. Make problems progressively harder.

Mistakes:
${mistakes.map((m, i) => `${i + 1}. Problem: ${m.problem} | Their answer: ${m.student_answer} | Correct: ${m.correct_answer}`).join("\n")}

Return ONLY this JSON:
{
  "practice_sets": [
    {
      "original_problem": "the problem they got wrong",
      "concept": "the concept being practiced (e.g. 'solving equations with fractions')",
      "problems": [
        {
          "problem": "similar practice problem",
          "solution": "the answer",
          "explanation": "step-by-step solution"
        }
      ]
    }
  ]
}`,

  weeklyReport: (data: {
    studentName: string;
    gradeLevel: string;
    topicsPracticed: string[];
    problemsCompleted: number;
    accuracyAverage: number;
    improvementAreas: string[];
    strengths: string[];
  }) => `
Generate a weekly progress report for a parent.

INPUT:
- Student: ${data.studentName}
- Grade: ${data.gradeLevel}
- Topics Practiced: ${data.topicsPracticed.join(", ")}
- Problems Completed: ${data.problemsCompleted}
- Accuracy: ${Math.round(data.accuracyAverage * 100)}%
- Improvement Areas: ${data.improvementAreas.join(", ")}
- Strengths: ${data.strengths.join(", ")}

TASK:
1. Summarize learning progress.
2. Highlight improvements and strengths.
3. Positive and encouraging tone.
4. Include actionable suggestions.

Return JSON:
{
  "weekly_summary": "the full report text",
  "highlights": ["key highlight 1", "key highlight 2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`,

  donationMessage: (problemsCompleted: number, donorStatus: string) => `
Generate a gentle, impact-based donation message for a parent (NOT a student).

INPUT:
- Problems their child completed: ${problemsCompleted}
- Cost per student per month: $0.50
- Donor status: ${donorStatus}

TASK:
- Softly encourage donation via the PayPal QR code shown on the page.
- ${problemsCompleted > 0 ? `Mention that their child has completed ${problemsCompleted} problems.` : "Focus on the mission of keeping tutoring free for all students."}
- Do NOT mention specific dollar amounts like $5, $10, $25 — the donor chooses their own amount.
- Keep message under 100 words.
- Never pressure. Be warm and genuine.
- Vary your tone — do not always use the same structure or phrases.

Return JSON:
{
  "donation_message": "the message text"
}`,

  thankYou: (amount: number, frequency: string) => `
Generate a thank-you message after a donation.

INPUT:
- Amount: $${amount}
- Frequency: ${frequency}
- Estimated students helped: ${Math.floor(amount / 0.5)}

TASK:
- Express gratitude.
- Show impact.
- Keep under 150 words.

Return JSON:
{
  "thank_you_message": "the message text"
}`,
};
