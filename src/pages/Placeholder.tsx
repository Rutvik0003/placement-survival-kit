import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { emptyCopy } from '../copy'

/** Temporary screen for sections built in later phases. */
export default function Placeholder({ kicker, title, empty }: { kicker: string; title: string; empty?: { title: string; body: string } }) {
  const e = empty ?? emptyCopy.comingSoon
  return (
    <>
      <PageHeader kicker={kicker} title={title} />
      <EmptyState title={e.title} body={e.body} />
    </>
  )
}
