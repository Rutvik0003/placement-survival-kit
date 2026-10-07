// Login screen copy.
export const authCopy = {
  kicker: 'Admit card · Season 2026–27',
  title: 'Placement Survival Kit',
  subtitle:
    'Tracks companies, PPTs, tests and interviews. Pings your phone before things happen. Judges you quietly.',
  emailLabel: 'Email',
  emailPlaceholder: 'you@college.edu',
  passwordLabel: 'Password',
  submit: 'Enter the hall',
  submitting: 'Checking admit card…',
  footer: 'Single-seat app. You are the only candidate. For once.',
  errors: {
    badLogin: 'Wrong email or password. Like an OA, but with fewer marks at stake.',
    notConfirmed:
      'Supabase says this account isn’t confirmed. In the dashboard: Authentication → Users → your user → “Confirm email”.',
    badKey: 'The Supabase key in .env.local looks wrong. Re-copy the Publishable key and restart the dev server.',
    network: 'Can’t reach Supabase. Check the Project URL in .env.local and restart the dev server.',
    rate: 'Too many attempts. Take a breather, the portal does it all the time.',
    generic: 'Something broke. Not you, for once. Try again.',
  },
} as const
