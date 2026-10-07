export type CompanyStatus = 'applied' | 'shortlisted' | 'test' | 'interview' | 'offer' | 'rejected' | 'ghosted'
export type EventType = 'ppt' | 'test' | 'gd' | 'interview' | 'deadline' | 'other'
export type CheckinMood = 'nailed' | 'survived' | 'dont_ask'

export interface Company {
  id: string
  user_id: string
  name: string
  nickname: string | null
  emoji: string | null
  role: string | null
  ctc_lpa: number | null
  cgpa_cutoff: number | null
  location: string | null
  notes: string | null
  status: CompanyStatus
  status_changed_at: string
  last_contact_at: string
  ghost_suggest_snoozed_until: string | null
  created_at: string
  updated_at: string
}

export type CompanyLite = Pick<Company, 'id' | 'name' | 'emoji' | 'nickname' | 'status'>

export interface EventRow {
  id: string
  user_id: string
  company_id: string
  type: EventType
  title: string
  starts_at: string
  ends_at: string | null
  venue: string | null
  link: string | null
  notes: string | null
  reschedule_count: number
  link_added_at: string | null
  mood: CheckinMood | null
  checked_in_at: string | null
  created_at: string
  updated_at: string
  company?: CompanyLite | null
}

export type CompanyInput = Partial<Omit<Company, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & { id?: string }
export type EventInput = Partial<Omit<EventRow, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'company'>> & {
  id?: string
}
