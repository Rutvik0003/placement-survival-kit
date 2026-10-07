// ★ Every push notification's text lives here. Edit freely.
// Used by the reminder function (server) and re-exported to the app via src/copy.
// Placeholders: c.company, c.title, c.mins (minutes left), c.time (HH:mm IST).
// Rule of the house: dry, situational, self-aware. No motivational quotes.

export type NotifEventType = 'ppt' | 'test' | 'gd' | 'interview' | 'deadline' | 'other'
export type Ctx = { company: string; title: string; mins: number; time: string }
type Line = (c: Ctx) => string

export const typeWord: Record<NotifEventType, string> = {
  ppt: 'PPT',
  test: 'test',
  gd: 'GD',
  interview: 'interview',
  deadline: 'deadline',
  other: 'thing',
}

// ─── Heads-up (~45 min before) ───────────────────────────────────────────

export const headsUpTitle = (type: NotifEventType, c: Ctx) =>
  type === 'deadline' ? `${c.company} closes in ${c.mins} min` : `${c.company} ${typeWord[type]} in ${c.mins} min`

export const headsUp: Record<NotifEventType, Line[]> = {
  ppt: [
    () => 'Free snacks may or may not be present. Attendance is mandatory either way.',
    () => 'Prepare to hear the phrase “we are like a family” at least twice.',
    () => 'Sit where you can see the slides but they can’t see you checking your phone.',
    () => 'Somewhere a slide titled “Our Culture” is loading. Brace.',
    (c) => `${c.company} is about to tell you about their work-life balance. Take notes, for comedy.`,
    () => 'The Q&A will feature one person asking about the bond. It may be you.',
    () => 'Reminder: nodding thoughtfully counts as participation.',
    () => 'Ninety slides. One about CTC. Wait for it.',
    () => 'Formal shoes, informal enthusiasm. Go.',
  ],
  test: [
    () => 'Charge the laptop. Close the 47 tabs. Yes, those ones.',
    () => 'Proctoring software is about to judge your eye movements. Look normal.',
    (c) => `${c.company} has prepared questions. You have prepared… well, you’ve prepared.`,
    () => 'Wi-Fi check. Webcam check. Existential check optional.',
    () => 'Somebody in your hostel is about to start a download. Pray it isn’t on your router.',
    () => 'Aptitude section first, probably. Trains will leave stations at different speeds.',
    () => 'Find a quiet room. If that’s impossible, find a less loud room.',
    () => 'Tab-switching is detected. Your nervous habits are not. Mostly.',
    () => 'The timer will start before you’re ready. That’s the format.',
  ],
  gd: [
    () => 'Topic will be “AI: boon or bane”. It is always “AI: boon or bane”.',
    () => 'Strategy: speak early, speak once, sound like you meant it.',
    () => 'Someone will say “to add to his point” and add nothing. Don’t be them.',
    () => 'Ten people, fifteen minutes, one marker. Good luck to the marker.',
    () => 'Remember: “Let’s conclude” is a power move. Use responsibly.',
    () => 'Eye contact with the panel. Not too much. You know the amount.',
    (c) => `${c.company} wants “leadership qualities”. Interrupting politely is a leadership quality.`,
    () => 'Carry a pen. Not to write anything. To hold. It helps.',
  ],
  interview: [
    () => '“Tell me about yourself” is coming. You have rehearsed this. Hopefully.',
    () => 'Check the camera angle. Nobody needs to see the ceiling fan.',
    (c) => `${c.company} will ask where you see yourself in five years. “Employed” is technically correct.`,
    () => 'Strengths: ready. Weaknesses: something that is secretly a strength. You know the drill.',
    () => 'Water nearby. Phone face down. Ego at a reasonable volume.',
    () => 'If they ask “any questions for us?”, the answer is never “no”.',
    () => 'Resume in front of you. You will be asked about the project you barely remember.',
    () => 'Formals on top. What’s below the frame is between you and your conscience.',
    () => 'Breathe. Then breathe again. That’s the whole tip.',
  ],
  deadline: [
    () => 'The form will ask for your 10th marks. Again. Have them ready.',
    () => 'Applications close soon. The portal will crash exactly when you hit submit. Go early.',
    (c) => `${c.company}’s form wants your resume as “Name_Branch_Roll.pdf”. Rename it now.`,
    () => 'Forty-five minutes. Plenty of time, said everyone who missed a deadline.',
    () => 'If the form has 30 fields, 29 of them are already on your resume. Fill them anyway.',
    () => 'Submit, screenshot, then submit the screenshot to your own memory.',
    () => 'The coordinator will not extend this. They said that last time too. Still, go.',
    () => 'Apply now. Regret it at a more convenient time.',
  ],
  other: [
    (c) => `${c.title}. Whatever it is, it starts in ${c.mins} minutes.`,
    () => 'Something is happening soon. You put it here for a reason.',
    () => 'Past you scheduled this. Present you should probably attend.',
    () => 'Unclassified event approaching. Proceed with mild caution.',
    () => 'This is your heads-up. Consider your head up.',
    () => 'Not a test, not a PPT, still counts.',
    () => 'Time to go do the thing.',
    () => 'The calendar said so. The calendar is rarely wrong. You, occasionally.',
  ],
}

/** Mixed in for early events (before 8:00 IST). */
export const earlyMorning: Line[] = [
  (c) => `It’s ${c.time}. The company is also asleep. But here we are.`,
  () => 'Who schedules things this early? Them. Who attends? You. Get up.',
  () => 'The canteen isn’t open yet. Neither are your eyes. Proceed anyway.',
  () => 'Sunrise and a placement event. Romantic, in a bleak way.',
  () => 'Brush teeth first. The webcam is HD.',
]

/** Mixed in for late events (21:00 IST onwards). */
export const lateNight: Line[] = [
  (c) => `${c.time}. A normal company would be closed. This is not a normal company.`,
  () => 'Night shift energy. Hope the role pays for it.',
  () => 'Late-night slot. Coffee is a valid preparation strategy.',
  () => 'Your hostel is asleep. You are not. Character development.',
]

// ─── Nag (~10 min before, heads-up not acknowledged) ─────────────────────

export const nagTitle = (type: NotifEventType, c: Ctx) =>
  type === 'deadline' ? `${c.company} closes in ${c.mins} minutes.` : `Bro. The ${typeWord[type]}. ${c.mins} minutes.`

export const nag: Line[] = [
  () => 'You didn’t open the last one. This is the louder one.',
  (c) => `${c.mins} minutes. That is not “plenty of time”. Move.`,
  () => 'Second warning. There is no third warning. Well, there is no third warning from me.',
  (c) => `${c.company} will start without you. They’ve done it before. To others.`,
  () => 'Hello? Anyone? The event is basically now.',
  () => 'Put the phone down. Wait, no — read this first. Now put it down and go.',
  () => 'Your past self set this reminder. Don’t let them down. They were trying.',
  () => 'This is the nag. You opted into the nag. Here is the nag.',
  () => 'Shoes on. Link open. Panic optional.',
]

// ─── Morning digest (7:00 IST) ───────────────────────────────────────────

export const digestNothingTitle = 'Nothing today'
export const digestNothing: string[] = [
  'No events today. Suspicious. Check the portal anyway.',
  'Empty calendar. Either a day off or an ambush. Historically, ambush.',
  'Nothing scheduled. The placement cell is plotting something.',
  'Zero events. Use the day wisely, or at least use it.',
  'Clear schedule. The emails will arrive at 11 pm, as is tradition.',
  'Nothing today. Enjoy it with the appropriate level of suspicion.',
  'No PPTs, no tests, no interviews. Just you and the refresh button.',
  'A rare quiet day. Don’t say it out loud, they’ll hear you.',
]

export const digestTitle = (n: number) => (n === 1 ? 'Today: 1 thing' : `Today: ${n} things`)

/** One quip appended after the list, by how busy the day is. */
export const digestQuip = (n: number): string[] =>
  n === 1
    ? ['Just the one. Manageable. Probably.', 'One event. Low bar. Clear it.', 'A single item. Don’t be late to the only thing.']
    : n <= 3
      ? ['Busy-ish. Eat something between them.', 'A respectable load. Keep the charger handy.', 'Several things. Formals may be required.']
      : ['That’s a lot. Hydrate. Delegate nothing, because you can’t.', 'Absolute circus today. Good luck to the ringmaster (you).', 'Full day. Your shirt is about to see things.']

export const digestFormalsLine = 'Formals today? Tap to log it.'

// ─── Post-event check-in (~1 h after) ────────────────────────────────────

export const checkinTitle = (c: Ctx) => `How did ${c.company} go?`

export const checkin: Line[] = [
  () => 'Nailed it, survived, or don’t ask? One tap. No essays.',
  () => 'Rate your performance. Honestly. This app won’t tell anyone.',
  (c) => `${c.title} is over. How are we feeling?`,
  () => 'Quick check-in. Choose your emoji, process your trauma later.',
  () => 'It’s done. Whatever happened, log it before you forget or repress it.',
  () => 'One tap for the record. Future you will want the data.',
  () => 'Debrief time. 🔥, 😐 or 💀?',
  () => 'Tell me how it went. I promise to only judge a little.',
]

// ─── Test notification (Settings button) ─────────────────────────────────

export const testTitle = 'Test notification'
export const testBody: string[] = [
  'If you can read this, reminders work. Now you have no excuse.',
  'Testing, testing. This is louder than the placement cell’s announcements.',
  'Notifications: working. Your schedule: still your problem.',
  'This is a test. The real ones will be more urgent and less polite.',
  'Pinged successfully. HR could never.',
]

export function pickLine<T>(lines: readonly T[]): T {
  return lines[Math.floor(Math.random() * lines.length)]
}
