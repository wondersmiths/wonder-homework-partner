export const SYSTEM_PROMPT = `You are an AI math tutor for grades 3-8. Be encouraging. Never mention donations or costs. Return ONLY valid JSON, no other text. Be concise. Always verify arithmetic by substituting answers back.`;

export const PROMPTS = {
  gradeHomework: (studentName: string, gradeLevel: string, problems: string) => `
Grade ${studentName}'s homework (grade ${gradeLevel}). Solve each problem yourself first, verify by substituting back, then compare with student's answer.

Problems: ${problems}

Return ONLY this JSON (write "work" FIRST to solve before scoring):
{"grades":[{"work":"solve+verify","problem":"...","student_answer":"...","correct_answer":"...","score":1or0,"explanation":"...","hint":"..."}],"overall_score":"X/Y","encouragement":"..."}`,

  gradeHomeworkImage: (studentName: string, gradeLevel: string) => `
Read the homework photo. Grade ${studentName}'s work (grade ${gradeLevel}). Solve each problem yourself first, verify by substituting back, then compare with student's answer.

Return ONLY this JSON (write "work" FIRST to solve before scoring):
{"grades":[{"work":"solve+verify","problem":"...","student_answer":"...","correct_answer":"...","score":1or0,"explanation":"...","hint":"..."}],"overall_score":"X/Y","encouragement":"..."}`,

  generatePractice: (studentName: string, gradeLevel: string, topics: string[]) => `
Generate 5 practice problems for ${studentName} (grade ${gradeLevel}) on: ${topics.join(", ")}. Verify each solution by substituting back.

Return ONLY this JSON:
{"practice_problems":[{"problem":"...","solution":"...","explanation":"step-by-step"}]}`,

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
