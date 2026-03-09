'use client'

import { useState } from 'react'
import ActivityCard from './ActivityCard'
import type { Activity } from '@/lib/types'

const CATEGORY_TABS = [
  { key: 'sports', label: 'Sports' },
  { key: 'study',  label: 'Study' },
  { key: 'meetup', label: 'Meetups' },
]

export default function ActivityFeed({ activities }: { activities: Activity[] }) {
  const [filter, setFilter] = useState<string | null>(null)

  // Only show tabs for categories that have at least one activity
  const activeTabs = CATEGORY_TABS.filter((tab) =>
    activities.some((a) => a.category === tab.key)
  )

  const displayed = filter
    ? activities.filter((a) => a.category === filter)
    : activities

  const hasActivities = activities.length > 0

  return (
    <section className="pb-16">
      {hasActivities && (
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Upcoming activities</h2>
          <span className="text-sm text-gray-400">{activities.length} total</span>
        </div>
      )}

      {/* Category filter chips — only when activities exist */}
      {hasActivities && activeTabs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setFilter(null)}
            className={`text-sm font-medium px-4 py-1.5 rounded-full border transition-colors ${
              filter === null
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            All
          </button>
          {activeTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(filter === tab.key ? null : tab.key)}
              className={`text-sm font-medium px-4 py-1.5 rounded-full border transition-colors ${
                filter === tab.key
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {!hasActivities ? (
        <div className="flex flex-col items-center justify-center py-28 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center text-4xl mb-5">
            🏃
          </div>
          <p className="text-gray-400 text-sm max-w-xs mb-7 leading-relaxed">
            You're the first here — post something and share the link with your campus group.
          </p>
          <a
            href="/activities/new"
            className="bg-gray-900 text-white text-sm font-semibold px-6 py-3 rounded-2xl hover:bg-gray-700 transition-colors shadow-sm"
          >
            + Create Activity
          </a>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No activities in this category right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </section>
  )
}
