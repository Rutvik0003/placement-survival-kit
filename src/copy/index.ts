// ★ All funny copy lives in this folder. Edit freely — no code knowledge needed,
//   just keep the quotes and commas intact.
export { pick } from './pick'
export { loadingLines } from './loading'
export { authCopy } from './auth'
export { emptyCopy } from './empty'
export { homeCopy, settingsCopy, setupCopy } from './home'
export {
  statusLabels,
  eventTypeLabels,
  defaultEventTitles,
  statusCopy,
  clashCopy,
  nextUpCopy,
  timelineCopy,
  companiesCopy,
  companyFormCopy,
  companyDetailCopy,
  eventFormCopy,
  eventDetailCopy,
  commonCopy,
} from './core'
export { notifCopy, installCopy, checkinCopy } from './notifications'
// Push notification text is shared with the server — edit it here:
export * as pushCopy from '../../supabase/functions/_shared/notificationCopy'
export {
  graveyardCopy,
  badgesCopy,
  badgeDefs,
  nicknameDefs,
  chaosCopy,
  pptCopy,
  offerCopy,
  formalsCopy,
  wrappedCopy,
  seasonCopy,
  funSettingsCopy,
} from './fun'
