import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { useNow } from '../hooks/useNow'
import { fmtIST, greetingIST } from '../lib/time'
import { emptyCopy, homeCopy } from '../copy'

export default function Home() {
  const now = useNow()
  const part = greetingIST(now)
  return (
    <>
      <PageHeader
        kicker={
          <>
            {fmtIST(now, 'EEE · d MMM')} <span className="text-marker">·</span>{' '}
            <span className="tabular-nums">{fmtIST(now, 'HH:mm')} IST</span>
          </>
        }
        title={homeCopy.greeting[part]}
      />
      <EmptyState title={emptyCopy.today.title} body={emptyCopy.today.body} />
    </>
  )
}
