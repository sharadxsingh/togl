export interface User {
  id: string
  email: string
  name: string | null
  college: string | null
  created_at: string
}

export type ActivityCategory = 'sports' | 'meetup' | 'study'

export interface Activity {
  id: string
  title: string
  description: string | null
  category: ActivityCategory
  location: string
  datetime: string
  max_participants: number
  host_id: string
  host_phone: string | null
  host_bringing: number
  created_at: string
  host?: User
  participant_count?: number
}

export interface ActivityParticipant {
  id: string
  activity_id: string
  user_id: string | null
  joined_at: string
  user_phone?: string | null
  guest_name?: string | null
  guest_phone?: string | null
  user?: User
}
