const BLOCKED_PATTERNS = [
  /donat/i,
  /contribut(?!.*equation)/i,
  /payment/i,
  /paypal/i,
  /cost per student/i,
  /fundrais/i,
  /sponsor/i,
  /tax.deducti/i,
];

export function sanitizeStudentContent(text: string): string {
  let clean = text;
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(clean)) {
      // Remove sentences containing blocked words
      clean = clean
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => !pattern.test(sentence))
        .join(" ");
    }
  }
  return clean;
}

export function isStudentSafe(text: string): boolean {
  return !BLOCKED_PATTERNS.some((p) => p.test(text));
}
