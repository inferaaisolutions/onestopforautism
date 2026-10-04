export function isSafe(text: string, blockedPhrases: string[]): boolean {
  const lower = text.toLowerCase();
  return !blockedPhrases.some(phrase => lower.includes(phrase.toLowerCase()));
}

export function sanitize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function isSafeObject(obj: Record<string, unknown>, blockedPhrases: string[]): boolean {
  const allText = JSON.stringify(obj).toLowerCase();
  return !blockedPhrases.some(phrase => allText.includes(phrase.toLowerCase()));
}
