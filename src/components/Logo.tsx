/** Ticket-stub mark. Same shape as the app icon. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden>
      <rect width="512" height="512" rx="112" className="fill-ink" />
      <path
        d="M112 144h288a16 16 0 0 1 16 16v68a28 28 0 0 0 0 56v68a16 16 0 0 1-16 16H112a16 16 0 0 1-16-16v-68a28 28 0 0 0 0-56v-68a16 16 0 0 1 16-16z"
        className="fill-paper"
      />
      <rect x="136" y="196" width="148" height="22" rx="11" className="fill-ink" />
      <rect x="136" y="250" width="112" height="16" rx="8" className="fill-ink" opacity=".4" />
      <circle cx="370" cy="256" r="26" className="fill-marker" />
    </svg>
  )
}
