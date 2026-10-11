/**
 * Utility for flexible Romaji normalization and matching
 */

export function normalizeInput(str: string): string {
  return str.toUpperCase().trim();
}

/**
 * Checks if a typed character matches the target character at the current index.
 * Handles spaces and common alternative keystrokes.
 */
export function checkCharMatch(expectedChar: string, typedChar: string): boolean {
  const exp = expectedChar.toUpperCase();
  const typed = typedChar.toUpperCase();
  return exp === typed;
}
