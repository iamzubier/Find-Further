// Convert BD 5.0 scale GPA to common international scales.
export function bdToUs(gpa: number): number {
  if (gpa >= 5.0) return 4.0;
  if (gpa >= 4.5) return 3.7;
  if (gpa >= 4.0) return 3.3;
  if (gpa >= 3.5) return 3.0;
  if (gpa >= 3.0) return 2.7;
  return Math.max(0, +(gpa * 0.7).toFixed(1));
}

export function bdToUk(gpa: number): string {
  if (gpa >= 4.5) return "First Class";
  if (gpa >= 3.8) return "2:1 (Upper Second)";
  if (gpa >= 3.0) return "2:2 (Lower Second)";
  return "Third Class";
}

export function bdToEcts(gpa: number): string {
  if (gpa >= 4.5) return "A";
  if (gpa >= 3.8) return "B";
  if (gpa >= 3.0) return "C";
  if (gpa >= 2.5) return "D";
  return "E";
}

export function gpaConversionLine(bd?: number | null): string | null {
  if (!bd || bd <= 0) return null;
  return `BD ${bd.toFixed(2)}/5.00 ≈ US ${bdToUs(bd).toFixed(1)}/4.0 · UK ${bdToUk(bd)} · ECTS ${bdToEcts(bd)}`;
}
