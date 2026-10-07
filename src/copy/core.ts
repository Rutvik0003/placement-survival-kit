// Companies, events, timeline, clashes. Edit freely.

export const statusLabels = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  test: 'Test',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  ghosted: 'Ghosted',
} as const

export const eventTypeLabels = {
  ppt: 'PPT',
  test: 'Test / OA',
  gd: 'GD',
  interview: 'Interview',
  deadline: 'Deadline',
  other: 'Other',
} as const

/** Used when you leave the event title blank. */
export const defaultEventTitles = {
  ppt: 'Pre-placement talk',
  test: 'Online assessment',
  gd: 'Group discussion',
  interview: 'Interview',
  deadline: 'Application deadline',
  other: 'Event',
} as const

export const statusCopy = {
  pickerTitle: 'Move to…',
  pickerExits: 'Or, more realistically',
  advanced: (name: string, to: string) => `${name} → ${to}. Progress, allegedly.`,
  rejected: (name: string) => `${name}: rejected. Swiped left, fittingly.`,
  moved: (name: string, to: string) => `${name} is now “${to}”.`,
  endOfLine: 'Already at the end of the pipeline. There is no next.',
  undo: 'Undo',
  swipeRight: 'Advance',
  swipeLeft: 'Reject',
  markRejected: 'Mark rejected',
  markGhosted: 'Mark ghosted',
} as const

export const clashCopy = {
  badge: 'Clash',
  overlapsWith: 'Overlaps with',
  formOne: 'Overlaps with another event. You can save it — you just can’t attend both.',
  formMany: (n: number) => `Overlaps with ${n} events. Ambitious.`,
  timeline: 'Two places at once. Pick one, or learn to teleport.',
} as const

export const nextUpCopy = {
  kicker: 'Next up',
  live: 'Happening now',
  startsIn: 'Starts in',
  endsIn: 'Ends in',
  openLink: 'Open link',
  noneTitle: 'Nothing coming up.',
  noneBody: 'Either it’s a quiet week or the portal is sitting on something.',
} as const

export const timelineCopy = {
  today: 'Today',
  week: 'Rest of the week',
  todayEmpty: 'No events today. Suspicious. Check the portal anyway.',
  weekEmpty: 'Nothing else this week. Don’t get used to it.',
  done: 'Done',
  now: 'Now',
  weekAtAGlance: 'This week',
  pipeline: 'Pipeline',
  addEvent: 'Add event',
} as const

export const companiesCopy = {
  kicker: 'The roster',
  title: 'Companies',
  add: 'Add company',
  addShort: 'Company',
  search: 'Search companies',
  swipeHint: 'Swipe right to advance · left to reject',
  filters: { active: 'Active', offer: 'Offers', rejected: 'Rejected', ghosted: 'Ghosted', all: 'All' },
  emptyFilter: {
    active: { title: 'No active companies.', body: 'Either you’re done or you haven’t started. Both are valid. One is rarer.' },
    offer: { title: 'No offers yet.', body: 'This tab is waiting. Patiently. Unlike you.' },
    rejected: { title: 'No rejections.', body: 'Clean record. Statistically, enjoy it while it lasts.' },
    ghosted: { title: 'Nobody’s ghosted you.', body: 'Yet. HR teams are just warming up.' },
    all: { title: 'No companies yet.', body: 'A clean slate. Enjoy it, it won’t last.' },
  },
  noMatch: 'No company by that name. Maybe they haven’t visited campus yet.',
  next: 'Next',
  noUpcoming: 'Nothing scheduled',
} as const

export const companyFormCopy = {
  newTitle: 'New company',
  editTitle: 'Edit company',
  kicker: 'The roster',
  name: 'Company name',
  namePlaceholder: 'e.g. Acme Corp',
  emoji: 'Emoji',
  nickname: 'Your nickname for them',
  nicknamePlaceholder: 'e.g. The one with the 9-round process',
  role: 'Role',
  rolePlaceholder: 'SDE, Analyst, GET…',
  ctc: 'CTC (LPA)',
  cgpa: 'CGPA cutoff',
  location: 'Location',
  locationPlaceholder: 'Bengaluru, Remote, “Pan India” (good luck)',
  status: 'Status',
  notes: 'Notes',
  notesPlaceholder: 'Bond period, eligibility fine print, the HR’s name…',
  save: 'Save company',
  saving: 'Saving…',
  nameRequired: 'A company needs a name. Even the shady ones.',
  deleteTitle: 'Delete this company?',
  deleteBody: (name: string) => `${name} and all its events will be gone. Unlike their HR, this is permanent.`,
  delete: 'Delete',
  cancel: 'Keep it',
} as const

export const companyDetailCopy = {
  events: 'Events',
  upcoming: 'Upcoming',
  past: 'Past',
  noEvents: 'No events yet. They’ll announce something at 11 pm, probably.',
  addEvent: 'Add event',
  edit: 'Edit',
  pipeline: 'Pipeline',
  notes: 'Notes',
  ctc: 'CTC',
  cgpa: 'Cutoff',
  lpa: 'LPA',
  lastContact: (days: number) =>
    days === 0 ? 'Heard from them today' : days === 1 ? 'Last heard from yesterday' : `Last heard from ${days} days ago`,
} as const

export const eventFormCopy = {
  newTitle: 'New event',
  editTitle: 'Edit event',
  kicker: 'Schedule',
  company: 'Company',
  companyPlaceholder: 'Type to search or add',
  createCompany: (name: string) => `Add “${name}” as a new company`,
  type: 'Type',
  title: 'Title',
  titlePlaceholder: 'Optional — defaults to the type',
  date: 'Date (IST)',
  time: 'Starts',
  duration: 'Duration',
  noEnd: 'No end',
  endTime: 'Ends',
  venue: 'Venue',
  venuePlaceholder: 'Seminar hall, Lab 3, “TBA” (classic)',
  link: 'Link',
  linkPlaceholder: 'Meet / Zoom / test link',
  notes: 'Notes',
  notesPlaceholder: 'Dress code, documents to carry, what to bring…',
  more: 'Venue, link, notes',
  save: 'Save event',
  saving: 'Saving…',
  needCompany: 'Pick a company. Events don’t schedule themselves. Well, they do, but at bad times.',
  needTime: 'Needs a date and start time.',
  endBeforeStart: 'Ends before it starts. Even HR can’t pull that off.',
} as const

export const eventDetailCopy = {
  kicker: 'Event',
  when: 'When',
  venue: 'Venue',
  link: 'Link',
  notes: 'Notes',
  openLink: 'Open link',
  copyLink: 'Copy',
  copied: 'Copied.',
  edit: 'Edit',
  rescheduled: (n: number) => (n === 1 ? 'Rescheduled once' : `Rescheduled ${n} times`),
  deleteTitle: 'Delete this event?',
  deleteBody: 'Gone for good. If only rejections worked like this.',
  delete: 'Delete',
  cancel: 'Keep it',
  notFound: { title: 'Event not found.', body: 'It was deleted, or it never existed. Much like some job postings.' },
} as const

export const commonCopy = {
  back: 'Back',
  saved: 'Saved.',
  deleted: 'Deleted.',
  error: 'That didn’t save. Check your connection and try again.',
} as const

// The "+" button menu and the first-run nudge on Today.
export const addCopy = {
  title: 'What are we adding?',
  company: { title: 'Company', hint: 'Just applied? The name is enough. Events can come later.' },
  event: { title: 'Event', titleHere: 'Event for this company', hint: 'PPT, test, GD, interview or a deadline.' },
  sidebarCompany: 'Company',
  sidebarEvent: 'Event',
  firstRun: {
    title: 'Start with the companies.',
    body: 'Add every company you’ve applied to — just the name is fine. PPTs, tests and interviews go inside each one when they’re announced.',
    cta: 'Add a company',
  },
} as const
