'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CreateActivityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'sports' as 'sports' | 'meetup' | 'study',
    location: '',
    datetime: '',
    max_participants: 10,
    host_bringing: 0,
    host_phone: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: (name === 'max_participants' || name === 'host_bringing') ? Number(value) : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirectTo=/activities/new')
      return
    }

    const { data, error } = await supabase
      .from('activities')
      .insert({
        ...form,
        host_id: user.id,
        datetime: new Date(form.datetime).toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Auto-add host as participant
      await supabase
        .from('activity_participants')
        .insert({ activity_id: data.id, user_id: user.id, user_phone: form.host_phone || null })
      router.push(`/activities/${data.id}`)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create an activity</h1>
        <p className="text-gray-500 mt-1.5 text-sm">Fill in the details and start gathering people.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Activity title" hint="Be specific so people know what to expect">
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="e.g. Badminton at Central Park"
              className={inputClass}
            />
          </Field>

          <Field label="Description" hint="Optional — share what to bring, skill level, etc.">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="What's this activity about?"
              className={inputClass}
            />
          </Field>

          <Field label="Category" hint="Helps people find your activity">
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="sports">Sports</option>
              <option value="meetup">Meetup</option>
              <option value="study">Study</option>
            </select>
          </Field>

          <Field label="Location">
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              placeholder="e.g. Central Park, Court 3"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Total people needed" hint="Including yourself">
              <input
                name="max_participants"
                type="number"
                value={form.max_participants}
                onChange={handleChange}
                required
                min={1}
                max={500}
                className={inputClass}
              />
            </Field>

            <Field label="Extra people you're bringing" hint="Friends coming with you">
              <input
                name="host_bringing"
                type="number"
                value={form.host_bringing}
                onChange={handleChange}
                min={0}
                max={499}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Date & time">
            <input
              name="datetime"
              type="datetime-local"
              value={form.datetime}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </Field>

          <Field label="Your phone number" hint="Shown to participants so they can reach you">
            <input
              name="host_phone"
              value={form.host_phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className={inputClass}
            />
          </Field>

          {error && (
            <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating...' : 'Create activity →'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputClass =
  'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-400 transition-colors bg-gray-50 focus:bg-white'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}
