import { useNavigate, useParams } from 'react-router-dom'
import { BackBar } from '../components/BackBar'
import { EmptyState } from '../components/EmptyState'
import { Loading } from '../components/Loading'
import { MoodPicker } from '../components/MoodPicker'
import { CompanyTile } from '../components/Stamps'
import { useToast } from '../components/Toast'
import { useEvent, useSaveEvent } from '../hooks/queries'
import { EVENT_META } from '../lib/meta'
import { fmtIST, relDay } from '../lib/time'
import { checkinCopy as c, eventDetailCopy } from '../copy'

/** Where the "How did it go?" notification lands. */
export default function CheckIn() {
  const { id } = useParams()
  const { data: event, isLoading } = useEvent(id)
  const save = useSaveEvent()
  const toast = useToast()
  const navigate = useNavigate()

  if (isLoading) return <Loading />
  if (!event)
    return (
      <>
        <BackBar fallback="/" />
        <EmptyState title={eventDetailCopy.notFound.title} body={eventDetailCopy.notFound.body} />
      </>
    )

  const notYet = Date.parse(event.starts_at) > Date.now()

  return (
    <div className="mx-auto max-w-md">
      <BackBar fallback={`/events/${event.id}`} />
      <div className="rise pt-6 text-center">
        <p className="label">{c.kicker}</p>
        <h1 className="font-display text-[34px] font-bold leading-tight tracking-[-0.03em]">{c.title}</h1>
        <div className="mx-auto mt-5 flex max-w-xs items-center gap-3 rounded-2xl border border-line bg-card px-3 py-2.5 text-left">
          {event.company && <CompanyTile company={event.company} size={40} />}
          <div className="min-w-0">
            <p className="truncate font-display font-semibold">{event.company?.name}</p>
            <p className="truncate text-[13px] text-muted">
              <span className={EVENT_META[event.type].cls.split(' ')[0]}>{EVENT_META[event.type].label}</span> ·{' '}
              {relDay(event.starts_at)}, {fmtIST(event.starts_at, 'HH:mm')}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {notYet ? (
          <p className="text-center text-[15px] text-muted">{c.notYet}</p>
        ) : (
          <MoodPicker
            size="lg"
            value={event.mood}
            disabled={save.isPending}
            onPick={async (mood) => {
              await save.mutateAsync({ id: event.id, mood })
              toast.show({ message: c.reply[mood], duration: 5000 })
              navigate(`/events/${event.id}`, { replace: true })
            }}
          />
        )}
      </div>
    </div>
  )
}
