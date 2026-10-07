// Settings → Notifications, install prompts, check-in screen.

export const notifCopy = {
  sectionTitle: 'Notifications',
  sectionHint: 'Reminders arrive even when the app is closed.',
  device: {
    on: { title: 'On for this device', body: 'This phone/laptop will get reminders.' },
    off: { title: 'Off on this device', body: 'Turn on to get reminders here. You’ll be asked for permission.' },
    denied: {
      title: 'Blocked by the browser',
      body: 'You (or past you) said no. Re-allow notifications for this site in the browser’s site settings, then come back.',
    },
    unsupported: {
      title: 'This browser can’t do push',
      body: 'Use Chrome on Android, the installed app on iPhone, or any desktop browser on the deployed site.',
    },
    noKey: { title: 'Push key missing', body: 'VITE_VAPID_PUBLIC_KEY isn’t set. Add it to .env.local / Vercel and redeploy.' },
    iosInstall: { title: 'iPhone: add to Home Screen first', body: 'Apple only allows notifications from the installed app.' },
    turnOn: 'Turn on',
    turnOff: 'Turn off',
    working: 'One sec…',
  },
  test: {
    button: 'Send test notification',
    sending: 'Sending…',
    sent: (n: number) => (n === 1 ? 'Sent to 1 device. Check your notifications.' : `Sent to ${n} devices.`),
    none: 'No devices registered. Turn notifications on first.',
    failed: 'Couldn’t send. Is the send-test function deployed?',
  },
  master: {
    title: 'Send reminders',
    hint: 'Master switch for all your devices.',
  },
  quiet: {
    title: 'Quiet hours',
    hint: 'Only delays check-ins. Heads-ups still come through — missing an OA is worse than being woken up.',
    from: 'From',
    to: 'To',
    saved: 'Quiet hours saved.',
    off: 'Off',
  },
  schedule: {
    title: 'What you’ll get',
    items: [
      { when: '7:00', what: 'Morning digest of the day' },
      { when: '~45 min', what: 'Heads-up before each event (tap opens the link)' },
      { when: '~10 min', what: 'A louder nag, if you ignored the heads-up' },
      { when: '~1 h after', what: 'How did it go? check-in' },
    ],
  },
  nudge: {
    text: 'Reminders are off on this device.',
    cta: 'Turn on',
    ios: 'Add to Home Screen to get reminders.',
  },
} as const

export const installCopy = {
  title: 'Install the app',
  hint: 'Opens full-screen, works offline, and is the only way iPhone allows notifications.',
  installed: 'Installed. You’re using the app version.',
  button: 'Install',
  ios: {
    steps: [
      { n: '1', text: 'Tap the Share button at the bottom of Safari', icon: 'share' },
      { n: '2', text: 'Scroll and choose “Add to Home Screen”', icon: 'plus' },
      { n: '3', text: 'Open Survival Kit from your Home Screen and turn on notifications there', icon: 'bell' },
    ],
    note: 'Needs iOS 16.4 or newer. Older iPhones can’t receive web notifications at all — not my fault, take it up with Cupertino.',
  },
  other: 'Use your browser menu → “Install app” or “Add to Home screen”.',
} as const

export const checkinCopy = {
  kicker: 'Check-in',
  title: 'How did it go?',
  moods: {
    nailed: { emoji: '🔥', label: 'Nailed it' },
    survived: { emoji: '😐', label: 'Survived' },
    dont_ask: { emoji: '💀', label: 'Don’t ask' },
  },
  reply: {
    nailed: 'Noted. Results in 3–5 business weeks. Try not to refresh.',
    survived: 'Survival is the baseline. Baseline achieved.',
    dont_ask: 'Not asking. Logged quietly. We move.',
  },
  current: 'Your verdict',
  change: 'Change',
  notYet: 'This hasn’t happened yet. Check in afterwards — hindsight is the whole point.',
} as const
