// Empty states. Dry, never motivational.
export const emptyCopy = {
  today: {
    title: 'Nothing scheduled.',
    body: 'Either it’s a quiet day or the portal hasn’t told you yet. Historically, it’s the second one.',
  },
  companies: {
    title: 'No companies yet.',
    body: 'A clean slate. Enjoy it, it won’t last.',
  },
  stats: {
    title: 'No numbers to judge yet.',
    body: 'Stats appear once there’s something to count. Give it a week.',
  },
  comingSoon: {
    title: 'Under construction.',
    body: 'This screen is being built. Like your resume, it’s a work in progress.',
  },
} as const
