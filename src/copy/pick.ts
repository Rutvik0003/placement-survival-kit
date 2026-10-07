/** Pick a random line from a copy bank. */
export function pick<T>(lines: readonly T[]): T {
  return lines[Math.floor(Math.random() * lines.length)]
}
