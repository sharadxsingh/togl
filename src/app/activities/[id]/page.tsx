export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import JoinButton from '@/components/JoinButton'
import DeleteActivityButton from '@/components/DeleteActivityButton'
import Link from 'next/link'
import ShareButton from '@/components/ShareButton'
import RemoveParticipantButton from '@/components/RemoveParticipantButton'
import type { ActivityParticipant } from '@/lib/types'

function InfoBlock({
  icon,
  label,
  value,
  extra,
  locked,
}: {
  icon: string
  label: string
  value: string
  extra?: React.ReactNode
  locked?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
        <span>{icon}</span> {label}
      </p>
      {locked ? (
        <p className="text-sm text-gray-400 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Visible after joining
        </p>
      ) : (
        <p className="text-sm font-medium text-gray-800">{value}</p>
      )}
      {extra}
    </div>
  )
}

function formatDate(datetime: string) {
  return new Date(datetime).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: activity } = await supabase
    .from('activities')
    .select(`*, host:users(id, name, email, college)`)
    .eq('id', id)
    .single()

  if (!activity) notFound()

  const host = Array.isArray(activity.host) ? activity.host[0] : activity.host

  const { data: participantsRaw } = await supabase
    .from('activity_participants')
    .select(`*, user:users(id, name, email, college)`)
    .eq('activity_id', id)
    .order('joined_at', { ascending: true })

  const participants: ActivityParticipant[] = (participantsRaw ?? []).map((p) => ({
    ...p,
    user: Array.isArray(p.user) ? p.user[0] : p.user,
  }))

  const hostBringing = activity.host_bringing ?? 0
  const count = participants.length + hostBringing
  const isFull = count >= activity.max_participants
  const isExpired = new Date(activity.datetime) < new Date()
  const hasJoined = user ? participants.some((p) => p.user_id === user.id) : false
  const isHost = user?.id === activity.host_id
  const canSeePhone = hasJoined || isHost
  const pct = Math.min((count / activity.max_participants) * 100, 100)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{activity.title}</h1>
            <p className="text-gray-500 text-sm mt-1.5 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-linear-to-br from-violet-400 to-indigo-500 inline-flex items-center justify-center text-white text-xs font-semibold">
                {host?.name?.[0]?.toUpperCase() ?? '?'}
              </span>
              Hosted by {host?.name ?? 'Unknown'}
              <span className="text-gray-300">·</span>
              Posted {new Date(activity.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${
            isExpired ? 'bg-gray-100 text-gray-400' :
            isFull    ? 'bg-red-50 text-red-500'    :
                        'bg-green-50 text-green-600'
          }`}>
            {isExpired ? 'Expired' : isFull ? 'Full' : 'Open'}
          </span>
        </div>
      </div>

      {/* Details card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        {activity.description && (
          <p className="text-gray-600 text-sm leading-relaxed mb-5 pb-5 border-b border-gray-100">
            {activity.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-5">
          <InfoBlock icon="📍" label="Location" value={activity.location} />
          <InfoBlock icon="🕐" label="Event Date & Time" value={formatDate(activity.datetime)} />
          <InfoBlock
            icon="👥"
            label="Spots"
            value={`${count} / ${activity.max_participants} joined`}
            extra={
              <div className="w-full bg-gray-100 rounded-full h-1 mt-2">
                <div
                  className={`h-1 rounded-full ${isFull ? 'bg-red-400' : 'bg-green-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            }
          />
          <InfoBlock
            icon="📞"
            label="Host contact"
            value={activity.host_phone ?? 'Not provided'}
            locked={!canSeePhone}
          />
        </div>
      </div>

      {/* Join / host actions */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <JoinButton
            activityId={activity.id}
            activityTitle={activity.title}
            hostId={activity.host_id}
            userId={user?.id ?? null}
            hasJoined={hasJoined}
            isFull={isFull}
            isHost={isHost}
            isExpired={isExpired}
          />
          <ShareButton />
        </div>
        {isHost && (
          <div className="flex items-center gap-2">
            <Link
              href={`/activities/${activity.id}/edit`}
              className="text-sm font-medium text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              Edit
            </Link>
            <DeleteActivityButton activityId={activity.id} />
          </div>
        )}
      </div>

      {/* Expired banner */}
      {isExpired && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-500">This activity has already taken place and is no longer accepting participants.</p>
        </div>
      )}

      {/* Host phone reveal banner — shown after joining */}
      {hasJoined && activity.host_phone && (
        <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
          <span className="text-green-500 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-medium text-green-700">Host contact</p>
            <p className="text-sm font-bold text-green-900">{activity.host_phone}</p>
          </div>
        </div>
      )}

      {/* Participants list */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          Participants
          <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">
            {count} / {activity.max_participants} going
          </span>
        </h2>
        {hostBringing > 0 && (
          <p className="text-xs text-gray-400 mb-2">
            + {hostBringing} extra {hostBringing === 1 ? 'person' : 'people'} coming with the host
          </p>
        )}

        {participants.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <p className="text-sm">No one has joined yet.</p>
            <p className="text-xs mt-1">Be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {participants.map((p, i) => {
              const name = p.guest_name ?? p.user?.name ?? 'Unknown'
              const phone = p.user_phone ?? p.guest_phone ?? null
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {name[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                      {name}
                      {p.user_id === activity.host_id && (
                        <span className="text-xs bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full font-normal">
                          host
                        </span>
                      )}
                      {!p.user_id && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-normal">
                          guest
                        </span>
                      )}
                    </p>
                    {p.user?.college && (
                      <p className="text-xs text-gray-400 truncate">{p.user.college}</p>
                    )}
                    {isHost && phone && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {phone}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-300">#{i + 1}</span>
                    {isHost && p.user_id !== activity.host_id && (
                      <RemoveParticipantButton participantId={p.id} participantName={name} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
