import Link from 'next/link'
import type { Activity, ActivityCategory } from '@/lib/types'

function formatDate(datetime: string) {
  const d = new Date(datetime)
  const date = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  return { date, time }
}

const CATEGORY_STYLES: Record<ActivityCategory, { banner: string; pill: string; emoji: string; label: string }> = {
  sports: { banner: 'from-emerald-400 to-green-500', pill: 'bg-emerald-50 text-emerald-700', emoji: '🏃', label: 'Sports' },
  study:  { banner: 'from-purple-500 to-violet-500', pill: 'bg-purple-50 text-purple-700',   emoji: '📚', label: 'Study' },
  meetup: { banner: 'from-sky-400 to-cyan-400',      pill: 'bg-sky-50 text-sky-700',         emoji: '🤝', label: 'Meetup' },
}

export default function ActivityCard({ activity }: { activity: Activity }) {
  const count = activity.participant_count ?? 0
  const isFull = count >= activity.max_participants
  const pct = Math.min((count / activity.max_participants) * 100, 100)
  const { date, time } = formatDate(activity.datetime)
  const category = CATEGORY_STYLES[activity.category] ?? CATEGORY_STYLES.meetup

  return (
    <Link href={`/activities/${activity.id}`} className="group block">
      <article className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:-translate-y-1">

        {/* Gradient banner */}
        <div className={`relative h-36 bg-linear-to-br ${category.banner} flex items-center justify-center`}>
          <span className="text-5xl select-none drop-shadow-sm">{category.emoji}</span>
          {/* Status pill — top right */}
          <span className={`absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${
            isFull
              ? 'bg-red-500/90 text-white'
              : 'bg-white/90 text-gray-700'
          }`}>
            {count} / {activity.max_participants} joined
          </span>
          {/* Category pill — top left */}
          <span className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/90 text-gray-700 backdrop-blur-sm">
            {category.label}
          </span>
        </div>

        {/* Card body */}
        <div className="p-4">
          {/* Title */}
          <h2 className="font-bold text-gray-900 text-[15px] leading-snug mb-3 group-hover:text-black line-clamp-2">
            {activity.title}
          </h2>

          {/* Meta row */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
              <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{activity.location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
              <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Event: {date}</span>
              <span className="text-gray-300">·</span>
              <span className="font-medium text-gray-700">{time}</span>
            </div>
          </div>

          {/* Participants progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-[12px] mb-1.5">
              <span className={`font-semibold ${isFull ? 'text-red-500' : 'text-gray-700'}`}>
                {count} / {activity.max_participants} joined
              </span>
              <span className={`${isFull ? 'text-red-400' : 'text-emerald-600'}`}>
                {isFull ? 'Full' : `${activity.max_participants - count} open`}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${isFull ? 'bg-red-400' : 'bg-emerald-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Host + CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-linear-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {activity.host?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="text-[13px] text-gray-500 font-medium">
                {activity.host?.name ?? 'Unknown'}
              </span>
            </div>
            <span className="text-[12px] text-gray-400 group-hover:text-gray-800 group-hover:font-medium transition-all">
              View →
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
