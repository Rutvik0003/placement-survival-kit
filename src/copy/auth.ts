// Login screen copy.
export const authCopy = {
  kicker: 'Admit card · Season 2026–27',
  title: 'Placement Survival Kit',
  subtitle:
    'Tracks companies, PPTs, tests and interviews. Pings your phone before things happen. Judges you quietly.',
  emailLabel: 'Your email',
  emailPlaceholder: 'you@college.edu',
  send: 'Send login code',
  sending: 'Sending…',
  codeSentTitle: 'Check your inbox',
  codeSentBody: (email: string) =>
    `We sent a code and a link to ${email}. On a phone home-screen app, type the code here — the link opens in the browser instead.`,
  codeLabel: 'Code from the email',
  verify: 'Let me in',
  verifying: 'Checking…',
  resend: 'Use a different email',
  footer: 'Single-seat app. You are the only candidate. For once.',
  errors: {
    rate: 'Supabase only sends a few emails an hour. Wait a bit — like you do for every result.',
    badCode: 'That code didn’t work. Either it expired or you typed it like an OA under time pressure.',
    signupsClosed: 'Sign-ups are closed. This kit has exactly one owner.',
    generic: 'Something broke. Not you, for once. Try again.',
  },
} as const
