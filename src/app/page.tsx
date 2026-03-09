export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import ActivityFeed from '@/components/ActivityFeed'
import type { Activity } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()

  const now = new Date().toISOString()

  const { data: activities } = await supabase
    .from('activities')
    .select(`
      *,
      host:users(id, name, email),
      participant_count:activity_participants(count)
    `)
    .gt('datetime', now)
    .order('datetime', { ascending: true })

  const enriched: Activity[] = (activities ?? []).map((a) => {
    const dbCount = Array.isArray(a.participant_count)
      ? (a.participant_count[0] as { count: number })?.count ?? 0
      : 0
    return {
      ...a,
      host: Array.isArray(a.host) ? a.host[0] : a.host,
      participant_count: dbCount + (a.host_bringing ?? 0),
    }
  })

  return (
    <div>
      {/* ── Hero ── */}
      <section className="pt-12 pb-10 sm:pt-16 sm:pb-14">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {enriched.length > 0 ? `${enriched.length} activities live right now` : 'Be the first to post an activity'}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.08]">
            Find people.<br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-600 to-indigo-500">
              Join activities.
            </span>
          </h1>

          <p className="mt-5 text-lg text-gray-500 leading-relaxed max-w-lg">
            Discover badminton games, study groups, startup meetups and more near you. No friction — just show up.
          </p>
        </div>
      </section>

      {/* ── Activity grid with category filters ── */}
      <ActivityFeed activities={enriched} />
    </div>
  )
}
