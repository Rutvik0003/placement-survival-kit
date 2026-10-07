// The fun layer: graveyard, badges, nicknames, chaos meter, PPT ratings,
// offer ceremony, Wrapped, formals. Edit freely. Dry > cheerful.

// ─── Ghost graveyard ─────────────────────────────────────────────────────
export const graveyardCopy = {
  kicker: 'Here lie',
  title: 'Ghost Graveyard',
  partyTitle: 'Graveyard Party',
  partyKicker: 'You got an offer. The dead are celebrating.',
  empty: { title: 'The graveyard is empty.', body: 'Nobody has ghosted you yet. Give it time. They’re busy “evaluating profiles”.' },
  rip: 'RIP',
  daysSilent: (n: number) => (n === 1 ? '1 day of silence' : `${n} days of silence`),
  appliedOn: 'Applied',
  lastHeard: 'Last heard',
  suspectsTitle: 'Suspects',
  suspectsHint: (days: number) => `No update in ${days}+ days. Possibly haunted.`,
  markGhosted: 'Bury',
  snooze: 'Not yet',
  snoozed: 'Fine. Another week of hope.',
  buried: (name: string) => `${name} has been laid to rest.`,
  suspectsLine: (n: number) => (n === 1 ? '1 company might be ghosting you' : `${n} companies might be ghosting you`),
  epitaphs: [
    'Said “we’ll get back to you”. Did not.',
    'Gone to a better place. Probably a different college.',
    'Last seen: “shortlist will be shared by EOD”.',
    'Here lies a company that left you on read.',
    'Survived by 3 unanswered follow-up emails.',
    'Their HR is in a meeting. Forever.',
    'Process ongoing since the dawn of time.',
    'Rest in peace. Or in “under review”.',
    'Died as they lived: without updating the portal.',
    'Gone, but their 40-question form lives on.',
    'Promised “next steps”. Delivered next to nothing.',
    'Will haunt your inbox only as spam.',
  ],
} as const

// ─── Badges ──────────────────────────────────────────────────────────────
export const badgesCopy = {
  kicker: 'Collectibles',
  title: 'Badges',
  progress: (got: number, total: number) => `${got} of ${total} collected`,
  locked: 'Locked',
  earned: 'Earned',
  unlocked: (name: string) => `Badge unlocked: ${name}`,
  emptyHint: 'Badges unlock from rejections, ghostings and other character-building events. Enjoy having none.',
} as const

/** Each badge: emoji, name, how to earn it (shown even while locked). */
export const badgeDefs = {
  first_rejection: { emoji: '🎟️', name: 'Welcome to the Club', how: 'Get your first rejection' },
  rejected_before_lunch: { emoji: '🥪', name: 'Rejected Before Lunch', how: 'Get rejected before 12:00' },
  rejected_monday: { emoji: '📅', name: 'Rejected on a Monday', how: 'Start the week right' },
  rejected_weekend: { emoji: '🛋️', name: 'They Work Weekends?', how: 'Get rejected on a Saturday or Sunday' },
  rejected_night: { emoji: '🦉', name: 'Night Owl HR', how: 'Get rejected after 10 pm' },
  three_in_week: { emoji: '🎯', name: 'Three in One Week', how: 'Three rejections within 7 days' },
  double_tap: { emoji: '✌️', name: 'Double Tap', how: 'Two rejections on the same day' },
  speedrun: { emoji: '⏱️', name: 'Speedrun', how: 'Rejected the same day you added the company' },
  so_close: { emoji: '🤏', name: 'So Close', how: 'Rejected after reaching the interview stage' },
  frequent_flyer: { emoji: '✈️', name: 'Frequent Flyer', how: 'Collect 5 rejections' },
  loyalty_program: { emoji: '💳', name: 'Loyalty Program', how: 'Collect 10 rejections' },
  seen_zoned: { emoji: '👀', name: 'Seen-zoned', how: 'Get ghosted for the first time' },
  ghosted_by_unicorn: { emoji: '🦄', name: 'Ghosted by a Unicorn', how: 'Get ghosted by a 20+ LPA company' },
  haunted_house: { emoji: '🏚️', name: 'Haunted House', how: 'Get ghosted 3 times' },
  plot_armour: { emoji: '🛡️', name: 'Plot Armour', how: 'Land an offer after 3+ rejections' },
} as const

// ─── Company nicknames (auto-earned) ─────────────────────────────────────
export const nicknameDefs = {
  rescheduler: { label: 'The Rescheduler', emoji: '🔄', why: 'Moved their events 2+ times' },
  last_minute: { label: 'Last-Minute Larry', emoji: '⏰', why: 'Sent a link less than 15 min before start' },
  monologue: { label: 'The Monologue', emoji: '🎤', why: 'PPT ran over time' },
  email: { label: 'Could’ve Been an Email', emoji: '📧', why: 'You said so yourself' },
  snack_royalty: { label: 'Snack Royalty', emoji: '🥟', why: 'Five-samosa PPT' },
  snack_desert: { label: 'Snack Desert', emoji: '🏜️', why: 'One-samosa PPT, if that' },
  night_shift: { label: 'Night Shift', emoji: '🌙', why: 'Scheduled something after 9 pm' },
  early_bird: { label: 'The Early Bird Nobody Asked For', emoji: '🐓', why: 'Scheduled something before 8 am' },
  clingy: { label: 'Clingy', emoji: '📎', why: '4+ events. They really like you. Or their process.' },
  vanisher: { label: 'The Vanisher', emoji: '🫥', why: 'Ghosted after an interview' },
} as const

// ─── Chaos meter ─────────────────────────────────────────────────────────
export const chaosCopy = {
  label: 'Chaos meter',
  levels: [
    { name: 'Suspiciously calm', line: 'Nothing much this week. That’s how they get you.' },
    { name: 'Manageable', line: 'A normal amount of chaos. Hydrate.' },
    { name: 'Busy', line: 'Multiple things. Charge everything you own.' },
    { name: 'Absolute circus', line: 'Clown shoes optional. Formals mandatory.' },
  ],
  detail: (events: number, clashes: number) =>
    `${events} event${events === 1 ? '' : 's'} this week${clashes ? ` · ${clashes} clash${clashes === 1 ? '' : 'es'}` : ''}`,
} as const

// ─── PPT rating ──────────────────────────────────────────────────────────
export const pptCopy = {
  title: 'Rate the PPT',
  snacks: 'Snacks',
  snacksScale: ['None. Criminal.', 'A biscuit, maybe', 'Acceptable', 'Good spread', 'Samosa heaven'],
  length: 'Length',
  lengthScale: ['Mercifully short', 'Fine', 'Long-ish', 'Felt like a semester', 'Still going, spiritually'],
  email: 'Could this have been an email?',
  ranOver: 'Did it run over time?',
  yes: 'Yes',
  no: 'No',
  save: 'Save rating',
  saved: 'Rating filed. HR will never see it.',
  skip: 'Skip',
} as const

// ─── Offer ceremony ──────────────────────────────────────────────────────
export const offerCopy = {
  drumroll: 'And the offer goes to…',
  reveal: 'YOU.',
  from: 'Presented by',
  lines: [
    'Please hold your applause. Actually, don’t.',
    'Thank you to the samosas, without whom this would not be possible.',
    'You may now stop refreshing the portal. You won’t, but you may.',
    'Acceptance speech optional. Screenshots mandatory.',
  ],
  toGraveyard: 'See the graveyard party',
  done: 'Back to reality',
} as const

// ─── Formals ─────────────────────────────────────────────────────────────
export const formalsCopy = {
  ask: 'Formals today?',
  askHint: 'There’s a PPT, GD or interview on the schedule.',
  yes: 'Suited up',
  no: 'Not today',
  logged: 'Formals logged.',
  count: (n: number) => (n === 1 ? 'Worn formals 1 time' : `Worn formals ${n} times`),
  milestones: {
    1: 'First outing. The shirt still smells like the shop.',
    3: 'Three times. You now own exactly one “interview shirt”.',
    5: 'Your shirt has seen things.',
    10: 'Iron is now a personal relationship.',
    15: 'The tie knows your fears.',
    20: 'Twenty. Your formals deserve a stipend.',
    30: 'At this point the blazer is a co-applicant.',
  } as Record<number, string>,
} as const

// ─── Wrapped ─────────────────────────────────────────────────────────────
export const wrappedCopy = {
  kicker: 'Placement Wrapped',
  hubTitle: 'Placement Wrapped',
  hubBody: 'Your season, recapped like a streaming service that knows too much.',
  open: 'Play',
  tapHint: 'Tap to continue',
  intro: { title: 'Your placement season, wrapped.', sub: 'Brace yourself. There are numbers.' },
  companies: (n: number) => ({ big: n, title: n === 1 ? 'company applied to' : 'companies applied to', sub: 'Each one a small act of optimism.' }),
  events: { title: 'You showed up to', ppt: 'PPTs', test: 'tests', interview: 'interviews', gd: 'GDs' },
  busiest: { title: 'Your busiest day', sub: (n: number) => `${n} events. You were in ${n} places, emotionally.` },
  ghosts: { title: 'Most-ghosted month', none: 'Nobody ghosted you. Statistically impressive.', sub: (n: number) => `${n} compan${n === 1 ? 'y' : 'ies'} vanished.` },
  snacks: { title: 'Best PPT snacks', none: 'No PPTs rated. A missed culinary opportunity.', sub: (s: number) => `${s}/5 🥟. Truly the work-life balance they promised.` },
  moods: { title: 'How it went, apparently', none: 'No check-ins. Mysterious. Possibly for the best.' },
  formals: { title: 'Formals worn', sub: (n: number) => (n ? formalsCopy.milestones[[30, 20, 15, 10, 5, 3, 1].find((m) => n >= m)!] : 'Zero. Either all online or a bold fashion statement.') },
  samosas: { title: 'Estimated samosas eaten', sub: 'Based on PPTs attended. Science.' },
  rejections: { title: 'Rejections collected', sub: (b: number) => `Plus ${b} badge${b === 1 ? '' : 's'}. Every “no” was content.` },
  outro: {
    offers: (n: number) => (n === 0 ? 'Offers so far: 0' : n === 1 ? '1 offer.' : `${n} offers.`),
    sub: (n: number) => (n === 0 ? 'The season isn’t over. Neither is the portal.' : 'All that chaos, and you came out employed. Show-off.'),
    again: 'Watch again',
    close: 'Close',
  },
} as const

// ─── Season hub ──────────────────────────────────────────────────────────
export const seasonCopy = {
  kicker: 'Season so far',
  title: 'Season',
  graveyard: { title: 'Ghost Graveyard', body: (n: number) => (n ? `${n} resting in peace` : 'Empty. For now.') },
  badges: { title: 'Badges', body: (got: number, total: number) => `${got}/${total} collected` },
  wrapped: { title: 'Placement Wrapped', body: 'The recap. Swipe through it.' },
} as const

// ─── Settings → Fun ──────────────────────────────────────────────────────
export const funSettingsCopy = {
  title: 'Fun settings',
  hint: 'Calibrate the jokes.',
  ghost: { label: 'Ghost after (days)', hint: 'No update for this long and the app starts suggesting a burial.' },
  samosas: { label: 'Samosas per PPT', hint: 'For the Wrapped estimate. Be honest.' },
  saved: 'Saved. The jokes have been recalibrated.',
} as const
