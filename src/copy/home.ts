// Home screen copy.
export const homeCopy = {
  greeting: {
    morning: 'Morning. Portal’s already awake.',
    afternoon: 'Afternoon. Results “by EOD”, apparently.',
    evening: 'Evening. HR has logged off. You haven’t.',
    night: 'It’s late. The shortlist isn’t coming tonight.',
  },
} as const

// Settings screen copy.
export const settingsCopy = {
  kicker: 'Control room',
  title: 'Settings',
  appearance: { title: 'Appearance', hint: 'Light, dark, or whatever your phone decides.' },
  account: { title: 'Account', hint: 'One seat. One candidate. You.', signOut: 'Sign out' },
} as const

// Shown when Supabase keys are missing.
export const setupCopy = {
  title: 'Keys missing.',
  body: 'The app can’t find your Supabase URL and key. Create a .env.local file (copy .env.example) and restart the dev server — or add them in Vercel → Settings → Environment Variables and redeploy.',
} as const

// Shown at the top when the phone has no internet.
export const offlineCopy = 'Offline. Showing what I remember. Changes need a connection.'
