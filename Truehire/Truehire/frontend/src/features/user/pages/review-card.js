import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import apiService from '../../../services/api'

const DEFAULT_PROFILE_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%23e2e8f0"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" fill="%23475569">U</text></svg>'

export default function ReviewCardPage() {
  const [fileInputKey, setFileInputKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    rating: 5,
    review_message: '',
    user_name: '',
    job_title: '',
    company_name: '',
    profile_image: ''
  })

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        profile_image: typeof reader.result === 'string' ? reader.result : ''
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    const payload = {
      rating: Number(formData.rating) || 0,
      review_message: String(formData.review_message || '').trim(),
      user_name: String(formData.user_name || '').trim(),
      job_title: String(formData.job_title || '').trim(),
      company_name: String(formData.company_name || '').trim(),
      profile_image: String(formData.profile_image || '').trim() || null
    }

    if (
      !payload.user_name ||
      !payload.job_title ||
      !payload.company_name ||
      !payload.review_message ||
      !payload.profile_image ||
      !payload.rating ||
      payload.rating < 1 ||
      payload.rating > 5
    ) {
      alert('Please fill all fields before submitting.')
      return
    }

    try {
      setSubmitting(true)
      const response = await apiService.request('/reviews', {
        method: 'POST',
        body: JSON.stringify(payload),
        returnErrorObject: true
      })
      if (response?.error) {
        alert(response.error || 'Unable to submit review right now.')
        return
      }
      alert('Thanks for sharing your experience with us.')
    } catch (error) {
      alert('Unable to submit review right now.')
      return
    } finally {
      setSubmitting(false)
    }

    setFormData({
      rating: 5,
      review_message: '',
      user_name: '',
      job_title: '',
      company_name: '',
      profile_image: ''
    })
    setFileInputKey((prev) => prev + 1)
  }

  return (
    <>
      <Head>
        <title>Review Card - TrueHire</title>
      </Head>

      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_45%),linear-gradient(135deg,#F8FAFF_0%,#EEF2FF_55%,#E9EEFF_100%)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Share Feedback</p>
              <h1 className="mt-1 text-3xl font-extrabold text-slate-900 sm:text-4xl">Review Card</h1>
              <p className="mt-2 text-sm text-slate-600">Tell us about your TrueHire experience in one quick form.</p>
            </div>
            <Link
              href="/overview"
              className="rounded-2xl border border-white/80 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 no-underline shadow-[0_10px_28px_-20px_rgba(15,23,42,0.35)] transition hover:bg-white"
            >
              Back to Overview
            </Link>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mb-6 overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-[0_24px_55px_-32px_rgba(15,23,42,0.4)]"
          >
            <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-[260px_1fr] md:p-8">
              <aside className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-5">
                <div className="flex flex-col items-center text-center">
                  <img
                    src={formData.profile_image || DEFAULT_PROFILE_IMAGE}
                    alt="Profile preview"
                    className="h-24 w-24 rounded-full border border-slate-200 object-cover shadow-sm"
                  />
                  <p className="mt-3 text-sm font-semibold text-slate-900">{formData.user_name || 'Your Name'}</p>
                  <p className="text-xs text-slate-500">{formData.job_title || 'Job Title'}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {formData.company_name || 'Company'}
                  </p>
                </div>
                <div className="mt-5">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Profile Image
                  </label>
                  <input
                    key={fileInputKey}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              </aside>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">User Name</span>
                    <input
                      type="text"
                      name="user_name"
                      value={formData.user_name}
                      onChange={handleInputChange}
                      placeholder="Enter your name"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Job Title</span>
                    <input
                      type="text"
                      name="job_title"
                      value={formData.job_title}
                      onChange={handleInputChange}
                      placeholder="Enter job title"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Company Name</span>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      placeholder="Enter company name"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Rating (1-5)</span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      name="rating"
                      value={formData.rating}
                      onChange={handleInputChange}
                      placeholder="5"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Review Message</span>
                  <textarea
                    name="review_message"
                    value={formData.review_message}
                    onChange={handleInputChange}
                    placeholder="Write your feedback..."
                    rows={4}
                    required
                    className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>
            </div>

            <div className="border-t border-slate-200/70 bg-white/70 px-6 py-4 md:px-8">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_-18px_rgba(79,70,229,0.45)] transition hover:from-indigo-700 hover:to-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}



