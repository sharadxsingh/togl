'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  activityId: string
  activityTitle: string
  hostId: string
  userId: string | null
  hasJoined: boolean
  isFull: boolean
  isHost: boolean
  isExpired?: boolean
}

export default function JoinButton({
  activityId,
  activityTitle,
  hostId,
  userId,
  hasJoined,
  isFull,
  isHost,
  isExpired = false,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [phone, setPhone] = useState('')
  const [guestName, setGuestName] = useState('')
  const router = useRouter()

  if (isHost) {
    return (
      <span className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-semibold px-6 py-3 rounded-2xl border border-violet-100">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        You&apos;re hosting this
      </span>
    )
  }

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-400 text-sm font-semibold px-6 py-3 rounded-2xl cursor-not-allowed">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Activity ended
      </span>
    )
  }

  async function handleJoinConfirm() {
    if (!phone.trim()) return
    if (!userId && !guestName.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()

    if (userId) {
      // Authenticated join
      const { data: profile } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single()
      const userName = profile?.name ?? 'Someone'

      const { error: joinError } = await supabase
        .from('activity_participants')
        .insert({ activity_id: activityId, user_id: userId, user_phone: phone.trim() })

      if (joinError) {
        setError(joinError.message)
        setLoading(false)
        return
      }

      await supabase.from('notifications').insert({
        user_id: hostId,
        message: `📣 ${userName} joined your activity "${activityTitle}".`,
      })
    } else {
      // Guest join — no account needed
      const { error: joinError } = await supabase
        .from('activity_participants')
        .insert({
          activity_id: activityId,
          user_id: null,
          guest_name: guestName.trim(),
          guest_phone: phone.trim(),
        })

      if (joinError) {
        setError(joinError.message)
        setLoading(false)
        return
      }

      await supabase.from('notifications').insert({
        user_id: hostId,
        message: `📣 ${guestName.trim()} joined your activity "${activityTitle}" as a guest.`,
      })
    }

    setShowModal(false)
    setPhone('')
    setGuestName('')
    router.refresh()
    setLoading(false)
  }

  async function handleLeave() {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data: profile } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId!)
      .single()
    const userName = profile?.name ?? 'Someone'

    const { error } = await supabase
      .from('activity_participants')
      .delete()
      .eq('activity_id', activityId)
      .eq('user_id', userId!)

    if (error) {
      setError(error.message)
    } else {
      await supabase.from('notifications').insert({
        user_id: hostId,
        message: `👋 ${userName} left your activity "${activityTitle}".`,
      })
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      {/* Join modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">Join activity</h2>
              <p className="text-sm text-gray-500 mt-1">
                {userId
                  ? 'Share your phone number with the host so they can coordinate with you.'
                  : 'No account needed — just your name and phone number.'}
              </p>
            </div>

            <div className="space-y-3 mb-5">
              {!userId && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Your name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="What should we call you?"
                    autoFocus
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-400 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Your phone number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinConfirm()}
                  placeholder="+91 98765 43210"
                  autoFocus={!!userId}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-400 bg-gray-50 focus:bg-white transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Shared only with the host. Not visible to other participants.
                </p>
              </div>
            </div>

            {!userId && (
              <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Want to host your own activities?{' '}
                <a href="/login" className="text-violet-600 hover:underline font-medium">Create an account</a>
              </p>
            )}

            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => { setShowModal(false); setPhone(''); setGuestName(''); setError(null) }}
                className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinConfirm}
                disabled={loading || !phone.trim() || (!userId && !guestName.trim())}
                className="flex-1 bg-black text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Joining…' : 'Confirm & join'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main button */}
      <div className="flex flex-col items-start gap-2">
        {hasJoined ? (
          <button
            onClick={handleLeave}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-base font-semibold px-8 py-3.5 rounded-2xl hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-all disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Leaving…
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Joined · click to leave
              </>
            )}
          </button>
        ) : isFull ? (
          <button
            disabled
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-400 text-base font-semibold px-8 py-3.5 rounded-2xl cursor-not-allowed border border-gray-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            Activity is full
          </button>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-base font-semibold px-8 py-3.5 rounded-2xl hover:bg-gray-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
          >
            Join activity
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    </>
  )
}
