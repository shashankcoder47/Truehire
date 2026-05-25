import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Crown,
  Flame,
  Lightbulb,
  Mail,
  MapPin,
  Sparkles,
  UploadCloud,
  X
} from 'lucide-react'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'
import apiService from '../../../utils/api'

// Modern, professional PostJob page - responsive + polished UI
export default function PostJob() {
  const router = useRouter()
  const MAX_COMPANY_LOGO_SIZE_BYTES = 3 * 1024 * 1024
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitLockRef = useRef(false)

  // Limits & premium
  const FREE_LIMIT = 5

  // state
  const [jobCount, setJobCount] = useState(0)
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    skills_required: '',
    min_experience_years: '',
    match_percentage: '60',
    type: 'FULL_TIME',
    experience_level: '',
    location: '',
    salary_from_lpa: '',
    salary_to_lpa: '',
    description: '',
    requirements: '',
    benefits: '',
    max_applicants: '',
    deadline: '',
    contact_email: ''
  })
  const [isPremium, setIsPremium] = useState(false)
  const [premiumExpiry, setPremiumExpiry] = useState(null)
  const [urgentHiring, setUrgentHiring] = useState(false)
  const [companyLogoFile, setCompanyLogoFile] = useState(null)
  const inputBase = 'mt-2 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10'
  const textareaBase = `${inputBase} resize-none leading-6`

  // UI modals
  const [openLimitModal, setOpenLimitModal] = useState(false)
  const [openSuccessModal, setOpenSuccessModal] = useState(false)
  const [openErrorModal, setOpenErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successTitle, setSuccessTitle] = useState('Success')
  const [successMessage, setSuccessMessage] = useState('Operation completed successfully.')
  const [showSalaryTerms, setShowSalaryTerms] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('IDLE')
  const [paymentOrderId, setPaymentOrderId] = useState(null)

  const freePostsUsed = Math.min(jobCount, FREE_LIMIT)
  const limitReached = !isPremium && freePostsUsed >= FREE_LIMIT
  const remainingFreePosts = isPremium ? 'Unlimited' : Math.max(FREE_LIMIT - freePostsUsed, 0)
  const completionItems = [
    Boolean(formData.title.trim()),
    Boolean(formData.company.trim()),
    Boolean(formData.location.trim()),
    Boolean(formData.contact_email.trim()),
    Boolean(formData.skills_required.trim()),
    Boolean(formData.requirements.trim() || formData.benefits.trim())
  ]
  const completionScore = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100)
  const salaryPreview = formData.salary_from_lpa && formData.salary_to_lpa
    ? `${formData.salary_from_lpa}-${formData.salary_to_lpa} LPA`
    : 'Salary optional'
  const rolePreview = formData.title.trim() || 'New role'
  const companyPreview = formData.company.trim() || 'Your company'
  const locationPreview = formData.location.trim() || 'Location'

  useEffect(() => {
    try {
      const token = apiService.getToken()
      const parsed = apiService.getUserData()
      if (!token || !parsed) { router.push('/login'); return }
      if (!parsed.role || (parsed.role !== 'recruiter' && parsed.role !== 'sub-recruiter')) {
        router.push('/login'); return
      }
      setUser(parsed)
    } catch (err) {
      console.error(err)
      router.push('/login')
      return
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    const loadPostingState = async () => {
      if (!user) return
      try {
        const [jobsResponse, profileResponse] = await Promise.all([
          apiService.request('/jobs/recruiter/my-jobs', { returnErrorObject: true }),
          apiService.getRecruiterProfile()
        ])

        const jobs = jobsResponse?.jobs || []
        setJobCount(Array.isArray(jobs) ? jobs.length : 0)

        const recruiter = profileResponse?.recruiter
        if (recruiter) {
          const expiry = recruiter.premium_expiry_at || recruiter.subscription_expiry || recruiter.premium_expiry || null
          const expiryDate = expiry ? new Date(expiry) : null
          const isExpired = expiryDate ? expiryDate.setHours(23, 59, 59, 999) < Date.now() : false
          const premiumActive = (recruiter.is_premium || recruiter.subscription_status === 'Premium') && !isExpired
          setIsPremium(premiumActive)
          setPremiumExpiry(expiry)
        }
      } catch (err) {
        console.error('Failed to load posting state', err)
      }
    }

    loadPostingState()
  }, [user])

  useEffect(() => {
    if (paymentStatus !== 'PENDING' || !paymentOrderId) return
    const pollIntervalMs = 3000
    const maxAttempts = 120
    let attempts = 0
    let isActive = true

    const pollStatus = async () => {
      if (!isActive) return
      attempts += 1
      try {
        const statusResponse = await apiService.request(`/payments/status?order_id=${encodeURIComponent(paymentOrderId)}`)
        if (statusResponse?.status === 'ACTIVE') {
          setPaymentStatus('ACTIVE')
          setIsPremium(true)
          setPremiumExpiry(statusResponse.premium_expiry_at || null)
          setOpenLimitModal(false)
          setSuccessTitle('Premium Activated')
          setSuccessMessage('Unlimited job posting is now unlocked.')
          setOpenSuccessModal(true)
          setTimeout(() => setOpenSuccessModal(false), 1800)
          return
        }
        if (statusResponse?.status === 'FAILED') {
          setPaymentStatus('FAILED')
          setErrorMessage('Payment failed or expired. Please try again.')
          setOpenErrorModal(true)
          return
        }
      } catch (err) {
        console.error('Payment status polling failed', err)
      }

      if (attempts >= maxAttempts) {
        setPaymentStatus('IDLE')
        setErrorMessage('Payment is taking longer than expected. Please check again in a moment.')
        setOpenErrorModal(true)
      }
    }

    pollStatus()
    const intervalId = setInterval(pollStatus, pollIntervalMs)
    return () => {
      isActive = false
      clearInterval(intervalId)
    }
  }, [paymentStatus, paymentOrderId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCompanyLogoChange = (e) => {
    const file = e.target.files?.[0] || null
    if (file && file.size > MAX_COMPANY_LOGO_SIZE_BYTES) {
      e.target.value = ''
      setCompanyLogoFile(null)
      setErrorMessage('Company logo must be 3MB or smaller.')
      setOpenErrorModal(true)
      return
    }
    setCompanyLogoFile(file)
  }

  const loadRazorpayScript = () => new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Window not available'))
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.body.appendChild(script)
  })

  const getApiMessage = (response, fallback = 'Request failed') => {
    return (
      response?.details?.details ||
      response?.details?.message ||
      response?.message ||
      response?.error ||
      fallback
    )
  }

  const verifyPremiumPayment = async (gatewayResponse) => {
    const orderId = gatewayResponse?.razorpay_order_id || null
    const paymentId = gatewayResponse?.razorpay_payment_id || null
    const signature = gatewayResponse?.razorpay_signature || null

    if (!orderId || !paymentId) {
      return {
        ok: false,
        message: 'Payment verification failed: missing payment reference from gateway.'
      }
    }

    const payload = {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature
    }

    try {
      console.log('Verifying premium payment payload:', {
        orderId,
        paymentId,
        hasSignature: Boolean(signature)
      })

      const response = await apiService.request('/payments/verify-premium', {
        method: 'POST',
        body: JSON.stringify(payload),
        returnErrorObject: true
      })

      console.log('Verify premium payment API response:', response)

      if (response?.ok === true || response?.success === true) {
        return {
          ok: true,
          orderId,
          status: response?.status || null,
          premiumExpiryAt: response?.premium_expiry_at || null
        }
      }

      return {
        ok: false,
        message: getApiMessage(response, 'Payment verification failed')
      }
    } catch (error) {
      console.error('Payment verification network/runtime error:', error)
      const fallbackReason = error?.statusText || error?.message || 'Payment verification failed'
      return { ok: false, message: fallbackReason }
    }
  }

  const startPremiumCheckout = async () => {
    if (!user) return
    setIsSubmitting(true)
    try {
      let orderResponse = await apiService.request('/payments/create-premium-order', {
        method: 'POST',
        body: JSON.stringify({}),
        returnErrorObject: true
      })

      if (orderResponse?.error || !orderResponse?.orderId) {
        const fallbackOrderResponse = await apiService.request('/recruiters/premium/order', {
          method: 'POST',
          body: JSON.stringify({}),
          returnErrorObject: true
        })

        if (!fallbackOrderResponse?.error && fallbackOrderResponse?.orderId) {
          orderResponse = fallbackOrderResponse
        } else {
          const primaryDetails = typeof orderResponse?.details?.details === 'string'
            ? orderResponse.details.details
            : (orderResponse?.details?.message || '')
          const fallbackDetails = typeof fallbackOrderResponse?.details?.details === 'string'
            ? fallbackOrderResponse.details.details
            : (fallbackOrderResponse?.details?.message || '')
          const errorMsg =
            fallbackOrderResponse?.error ||
            orderResponse?.error ||
            'Unable to create payment order'
          const detailMsg = fallbackDetails || primaryDetails
          throw new Error(detailMsg ? `${errorMsg}: ${detailMsg}` : errorMsg)
        }
      }

      await loadRazorpayScript()

      console.log('Razorpay key from backend:', orderResponse?.key)

      if (!orderResponse?.key) {
        throw new Error('Razorpay key was not returned from the backend.')
      }

      const options = {
        key: orderResponse.key,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: 'TrueHire Premium',
        description: 'Unlimited job postings for recruiters',
        order_id: orderResponse.orderId,
        prefill: {
          name: orderResponse.recruiter?.name || user?.name || '',
          email: orderResponse.recruiter?.email || user?.email || ''
        },
        handler: async (response) => {
          const verifyResult = await verifyPremiumPayment(response)
          if (!verifyResult.ok) {
            setErrorMessage(verifyResult.message || 'Payment confirmation failed. Try again.')
            setOpenErrorModal(true)
            return
          }
          if (verifyResult.status === 'ACTIVE') {
            setPaymentStatus('ACTIVE')
            setIsPremium(true)
            setPremiumExpiry(verifyResult.premiumExpiryAt || null)
            setOpenLimitModal(false)
            setSuccessTitle('Premium Activated')
            setSuccessMessage('Unlimited job posting is now unlocked.')
            setOpenSuccessModal(true)
            setTimeout(() => setOpenSuccessModal(false), 1800)
            return
          }
          setPaymentStatus('PENDING')
          setPaymentOrderId(verifyResult.orderId || response.razorpay_order_id)
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      console.error('Payment failed', err)
      const backendDetails = typeof err?.details?.details === 'string' ? err.details.details : ''
      const friendly =
        err?.status === 401
          ? 'Unauthorized. Please log in as recruiter and try again.'
          : err?.status === 403
            ? 'Recruiter access required for premium upgrade.'
            : backendDetails
              ? `${err.message || 'Payment failed'}: ${backendDetails}`
              : (err.message || 'Payment failed. Try again later.')
      setErrorMessage(friendly)
      setOpenErrorModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitLockRef.current || isSubmitting) return
    if (!user) { router.push('/login'); return }

    if (limitReached) {
      setOpenLimitModal(true)
      return
    }

    const generatedDescription = [formData.requirements, formData.benefits]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join('\n\n')

    if (!formData.title.trim() || !formData.company.trim() ||
        !formData.location.trim() || !generatedDescription ||
        !formData.contact_email.trim() || !formData.skills_required.trim()) {
      setErrorMessage('Please fill required fields.')
      setOpenErrorModal(true)
      return
    }

    if (generatedDescription.length < 20) {
      setErrorMessage('Requirements or benefits must be at least 20 characters long.')
      setOpenErrorModal(true)
      return
    }

    submitLockRef.current = true
    setIsSubmitting(true)
    try {
      const salaryFromRaw = Number(formData.salary_from_lpa)
      const salaryToRaw = Number(formData.salary_to_lpa)

      const hasSalaryFrom = formData.salary_from_lpa !== ''
      const hasSalaryTo = formData.salary_to_lpa !== ''
      if (hasSalaryFrom !== hasSalaryTo) {
        throw new Error('Please enter both From LPA and To LPA values.')
      }

      let salary_min = null
      let salary_max = null
      if (hasSalaryFrom && hasSalaryTo) {
        if (!Number.isFinite(salaryFromRaw) || !Number.isFinite(salaryToRaw)) {
          throw new Error('Salary range must be valid numbers in LPA.')
        }
        if (salaryFromRaw <= 0 || salaryToRaw <= 0) {
          throw new Error('Salary range in LPA must be greater than 0.')
        }
        if (salaryFromRaw > salaryToRaw) {
          throw new Error('From LPA cannot be greater than To LPA.')
        }
        salary_min = salaryFromRaw
        salary_max = salaryToRaw
      }

      const normalizedExperienceLevel = formData.experience_level || 'MID_LEVEL'
      const matchPercentage = formData.match_percentage === '' ? 0 : Number(formData.match_percentage)
      const minExperienceYears = formData.min_experience_years === '' ? null : Number(formData.min_experience_years)

      if (!Number.isFinite(matchPercentage) || matchPercentage < 0 || matchPercentage > 100) {
        throw new Error('Match percentage must be between 0 and 100.')
      }

      if (minExperienceYears !== null && (!Number.isFinite(minExperienceYears) || minExperienceYears < 0)) {
        throw new Error('Minimum experience must be a valid positive number.')
      }

      const payload = {
        title: formData.title,
        company: formData.company,
        location: formData.location,
        employmentType: formData.type,
        employment_type: formData.type,
        experienceLevel: normalizedExperienceLevel,
        experience_level: normalizedExperienceLevel,
        salaryMin: salary_min,
        salary_min,
        salaryMax: salary_max,
        salary_max,
        salaryCurrency: 'LPA',
        salary_currency: 'LPA',
        description: generatedDescription,
        requirements: formData.requirements,
        benefits: formData.benefits,
        skillsRequired: formData.skills_required,
        skills_required: formData.skills_required,
        minExperienceYears,
        min_experience_years: minExperienceYears,
        matchPercentage,
        match_percentage: matchPercentage,
        maxApplicants: formData.max_applicants ? Number(formData.max_applicants) : null,
        max_applicants: formData.max_applicants ? Number(formData.max_applicants) : null,
        applicationDue: formData.deadline || null,
        application_deadline: formData.deadline || null,
        contactEmail: formData.contact_email,
        contact_email: formData.contact_email,
        status: 'OPEN',
        isFeatured: false,
        is_featured: false,
        isUrgent: urgentHiring,
        is_urgent: urgentHiring
      }

      console.log('Post job payload:', payload)

      const requestBody = new FormData()
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          requestBody.append(key, value)
        }
      })
      if (companyLogoFile) {
        requestBody.append('company_logo', companyLogoFile)
      }

      const res = await apiService.request('/jobs', {
        method: 'POST',
        body: requestBody
      })

      if (res && (res.job || res.success)) {
        setJobCount(prev => prev + 1)
        setSuccessTitle('Success')
        setSuccessMessage('Job posted successfully.')
        setOpenSuccessModal(true)
        setTimeout(() => { setOpenSuccessModal(false); router.push('/recruiter-dashboard') }, 1400)
      } else {
        throw new Error(res?.message || 'Failed to post job')
      }
    } catch (err) {
      console.error('Failed to post job:', err?.details || err?.message || err)
      if (err?.status === 403 && err?.details?.code === 'JOB_POST_LIMIT_EXCEEDED') {
        setOpenLimitModal(true)
      } else {
        const missingFields = Array.isArray(err?.details?.missing) ? err.details.missing : null
        const backendDetails = typeof err?.details?.details === 'string' ? err.details.details : ''
        const fieldErrors = err?.details?.details?.fieldErrors || err?.details?.fieldErrors || null
        let friendlyMessage = err?.message || 'Failed to post job'

        if (missingFields?.length) {
          friendlyMessage = `Missing required fields: ${missingFields.join(', ')}`
        } else if (fieldErrors && typeof fieldErrors === 'object') {
          const flattenedFieldErrors = Object.entries(fieldErrors)
            .flatMap(([field, messages]) =>
              Array.isArray(messages) && messages.length
                ? [`${field}: ${messages.join(', ')}`]
                : []
            )
          if (flattenedFieldErrors.length) {
            friendlyMessage = flattenedFieldErrors.join(' | ')
          }
        } else if (err?.status === 401) {
          friendlyMessage = 'Unauthorized. Please log in as recruiter and try again.'
        } else if (err?.status === 413) {
          friendlyMessage = 'Upload too large. If you attached a company logo, use an image smaller than 3MB.'
        } else if (err?.status === 500 && backendDetails) {
          friendlyMessage = `Server error: ${backendDetails}`
        } else if (backendDetails) {
          friendlyMessage = `${friendlyMessage}: ${backendDetails}`
        }

        setErrorMessage(friendlyMessage)
        setOpenErrorModal(true)
      }
    } finally {
      setIsSubmitting(false)
      submitLockRef.current = false
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-[#F3F4FF] to-[#EEF2FF]">
      <div className="animate-spin h-12 w-12 border-4 border-indigo-400 rounded-full border-t-transparent" />
    </div>
  )

  return (
    <>
      <Head>
        <title>Post a Job - TrueHire</title>
        <meta name="description" content="Post jobs on TrueHire" />
      </Head>

      <Header />

      <main className="min-h-screen bg-[#f6f8f4] py-8 text-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
            <div className="grid gap-0 lg:grid-cols-[1.45fr_0.55fr]">
              <div className="p-6 sm:p-8 lg:p-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-teal-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  Recruiter workspace
                </div>
                <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                  Publish a role that feels credible before candidates even apply.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Build a focused listing with transparent pay, sharper expectations, and the right signal for serious applicants.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                    <div className="text-xs uppercase text-slate-400">Plan</div>
                    <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
                      {isPremium ? <Crown className="h-4 w-4 text-amber-300" /> : <BriefcaseBusiness className="h-4 w-4 text-teal-300" />}
                      {isPremium ? 'Premium' : 'Free'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                    <div className="text-xs uppercase text-slate-400">Posts left</div>
                    <div className="mt-1 text-lg font-semibold">{remainingFreePosts}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                    <div className="text-xs uppercase text-slate-400">Readiness</div>
                    <div className="mt-1 text-lg font-semibold">{completionScore}%</div>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 bg-white/[0.04] p-6 sm:p-8 lg:border-l lg:border-t-0">
                <div className="rounded-lg border border-white/10 bg-white text-slate-950 shadow-xl">
                  <div className="border-b border-slate-100 p-5">
                    <div className="text-xs font-semibold uppercase text-slate-500">Live preview</div>
                    <h2 className="mt-2 text-xl font-semibold">{rolePreview}</h2>
                    <p className="mt-1 text-sm text-slate-500">{companyPreview}</p>
                  </div>
                  <div className="space-y-3 p-5 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="h-4 w-4 text-teal-600" />
                      {locationPreview}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <BriefcaseBusiness className="h-4 w-4 text-teal-600" />
                      {formData.type.replace('_', ' ').toLowerCase()}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <BadgeCheck className="h-4 w-4 text-teal-600" />
                      {salaryPreview}
                    </div>
                    {urgentHiring && (
                      <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        <Flame className="h-3.5 w-3.5" />
                        Urgent hiring
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {limitReached && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
              You have used all 5 free job posts. Upgrade to Premium to continue posting jobs.
            </div>
          )}
          {paymentStatus === 'PENDING' && (
            <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800">
              Waiting for payment confirmation...
            </div>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                      <BriefcaseBusiness className="h-4 w-4" />
                      Role identity
                    </div>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">Core job details</h2>
                  </div>
                  <span className="text-xs font-medium text-slate-500">Required fields are marked *</span>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Job Title *</label>
                    <input name="title" value={formData.title} onChange={handleInputChange} className={inputBase} placeholder="Senior Backend Engineer" required />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Company *</label>
                    <input name="company" value={formData.company} onChange={handleInputChange} className={inputBase} placeholder="Your company name" required />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Location *</label>
                    <input name="location" value={formData.location} onChange={handleInputChange} className={inputBase} placeholder="Bengaluru, Remote, or Hybrid" required />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Company Logo</label>
                    <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition hover:border-teal-400 hover:bg-teal-50">
                      <UploadCloud className="h-5 w-5 text-teal-600" />
                      <span className="min-w-0 truncate">{companyLogoFile?.name || 'Upload PNG, JPG, WEBP, or SVG'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                        onChange={handleCompanyLogoChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="mt-2 text-xs text-slate-500">Optional, max 3MB.</p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                  <CalendarDays className="h-4 w-4" />
                  Hiring setup
                </div>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Employment and intake</h2>
                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Type</label>
                    <select name="type" value={formData.type} onChange={handleInputChange} className={inputBase}>
                      <option value="FULL_TIME">Full-time</option>
                      <option value="PART_TIME">Part-time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="FREELANCE">Freelance</option>
                      <option value="INTERNSHIP">Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Application Deadline</label>
                    <input type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} className={inputBase} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Experience Level</label>
                    <select name="experience_level" value={formData.experience_level} onChange={handleInputChange} className={inputBase}>
                      <option value="">Select level</option>
                      <option value="ENTRY_LEVEL">Entry Level</option>
                      <option value="INTERNSHIP_LEVEL">Internship Level</option>
                      <option value="MID_LEVEL">Mid Level</option>
                      <option value="SENIOR_LEVEL">Senior Level</option>
                      <option value="EXECUTIVE_LEVEL">Executive Level</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Maximum Applicants</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      name="max_applicants"
                      value={formData.max_applicants}
                      onChange={handleInputChange}
                      className={inputBase}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Minimum Experience (years)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      inputMode="decimal"
                      name="min_experience_years"
                      value={formData.min_experience_years}
                      onChange={handleInputChange}
                      className={inputBase}
                      placeholder="e.g. 2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Resume Match Threshold (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      inputMode="numeric"
                      name="match_percentage"
                      value={formData.match_percentage}
                      onChange={handleInputChange}
                      className={inputBase}
                      placeholder="e.g. 60"
                    />
                    <p className="mt-2 text-xs text-slate-500">Applicants at or above this score appear as matched.</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Contact Email *</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input type="email" name="contact_email" value={formData.contact_email} onChange={handleInputChange} className={`${inputBase} pl-10`} placeholder="hr@company.com" required />
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                  <BadgeCheck className="h-4 w-4" />
                  Compensation signal
                </div>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Salary and expectations</h2>
                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Min Salary (LPA)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      inputMode="decimal"
                      name="salary_from_lpa"
                      value={formData.salary_from_lpa}
                      onChange={handleInputChange}
                      className={inputBase}
                      placeholder="e.g. 4.0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Max Salary (LPA)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      inputMode="decimal"
                      name="salary_to_lpa"
                      value={formData.salary_to_lpa}
                      onChange={handleInputChange}
                      className={inputBase}
                      placeholder="e.g. 5.0"
                    />
                    <p className="mt-2 text-xs text-slate-500">Enter both min and max values when sharing salary.</p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                  <Lightbulb className="h-4 w-4" />
                  Candidate clarity
                </div>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Requirements and benefits</h2>
                <div className="mt-6 grid grid-cols-1 gap-5">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Required Skills *</label>
                    <textarea
                      name="skills_required"
                      value={formData.skills_required}
                      onChange={handleInputChange}
                      rows={3}
                      className={`${textareaBase} min-h-[110px]`}
                      placeholder="React, Node.js, MySQL, REST APIs"
                      required
                    />
                    <p className="mt-2 text-xs text-slate-500">Separate skills with commas or new lines. These are used for resume filtering.</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Requirements *</label>
                    <textarea name="requirements" value={formData.requirements} onChange={handleInputChange} rows={4} className={`${textareaBase} min-h-[150px]`} placeholder="Must-have skills, responsibilities, qualifications, and working style" required />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Benefits</label>
                    <textarea name="benefits" value={formData.benefits} onChange={handleInputChange} rows={3} className={`${textareaBase} min-h-[125px]`} placeholder="Health benefits, flexibility, learning budget, office perks" />
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <button
                  type="button"
                  onClick={() => setShowSalaryTerms((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                  aria-expanded={showSalaryTerms}
                >
                  <span>
                    <span className="block text-sm font-semibold text-teal-700">Compliance</span>
                    <span className="mt-1 block text-xl font-semibold text-slate-950">Salary terms</span>
                  </span>
                  <ChevronDown className={`h-5 w-5 text-slate-500 transition ${showSalaryTerms ? 'rotate-180' : ''}`} />
                </button>

                {showSalaryTerms && (
                  <ol className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-600">
                    <li><span className="font-semibold text-slate-800">1. Salary Accuracy:</span> The recruiter agrees that the salary mentioned in the job posting is accurate, genuine, and aligned with the company&apos;s actual hiring budget.</li>
                    <li><span className="font-semibold text-slate-800">2. Salary Lock Policy:</span> Once a job posting becomes active or receives its first application, salary details will be locked.</li>
                    <li><span className="font-semibold text-slate-800">3. Salary Range Commitment:</span> If a range is provided, the final offered salary should not be lower than the published minimum.</li>
                    <li><span className="font-semibold text-slate-800">4. Transparency:</span> Salary discussed during interviews must not significantly differ from the listing without candidate consent.</li>
                    <li><span className="font-semibold text-slate-800">5. Candidate Protection:</span> Candidates may report misleading or incorrect salary information.</li>
                    <li><span className="font-semibold text-slate-800">6. Platform Rights:</span> The platform may monitor compliance to maintain fair hiring practices.</li>
                  </ol>
                )}

                <div className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <input id="tos" type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-slate-300 bg-white text-teal-600 focus:ring-2 focus:ring-teal-500/30" />
                  <label htmlFor="tos" className="text-sm font-medium leading-5 text-slate-700">
                    I agree to the Salary Terms
                  </label>
                </div>
              </section>

              <div className="sticky bottom-4 z-10 rounded-lg border border-slate-200 bg-white/95 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    aria-pressed={urgentHiring}
                    onClick={() => setUrgentHiring(prev => !prev)}
                    className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition ${
                      urgentHiring
                        ? 'border-amber-300 bg-amber-100 text-amber-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:text-amber-800'
                    }`}
                  >
                    <Flame className="h-4 w-4" />
                    {urgentHiring ? 'Urgent Enabled' : 'Mark Urgent'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || limitReached}
                    className="inline-flex min-h-11 flex-[1.4] items-center justify-center gap-2 rounded-lg bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Posting...
                      </>
                    ) : (
                      <>
                        Post Job
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
                {urgentHiring && (
                  <p className="mt-3 text-sm text-amber-800">
                    Candidates will see an urgent hiring tag when the listing is posted.
                  </p>
                )}
              </div>
            </form>

            <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">Completion</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-950">{completionScore}%</div>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-teal-600 transition-all" style={{ width: `${completionScore}%` }} />
                </div>
              </div>

              <div className={`rounded-lg border bg-white p-5 shadow-sm ${limitReached ? 'border-amber-300 ring-4 ring-amber-100' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Crown className="h-4 w-4 text-amber-500" />
                  Premium Upgrade
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Upgrade to Premium for unlimited job postings and uninterrupted recruiter workflows.
                </p>
                <button
                  onClick={startPremiumCheckout}
                  disabled={isSubmitting || paymentStatus === 'PENDING'}
                  className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-950 disabled:opacity-60"
                >
                  {paymentStatus === 'PENDING' ? 'Processing...' : 'Upgrade to Premium'}
                </button>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Lightbulb className="h-4 w-4 text-teal-600" />
                  Posting Tips
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-5 text-slate-600">
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />Use a searchable title candidates already recognize.</li>
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />Separate must-have skills from nice-to-have skills.</li>
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />Share the salary range when possible to build trust.</li>
                </ul>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
                <div className="font-semibold text-slate-950">Account</div>
                <div className="mt-2 break-words">Logged in as <span className="font-medium text-slate-800">{user?.email || user?.name || 'Recruiter'}</span></div>
                {isPremium && premiumExpiry && (
                  <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                    Premium valid until {premiumExpiry}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />

      {/* Limit Modal */}
      {openLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-lg border border-white/70 bg-white p-6 text-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.4)]">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                <h4 className="text-xl font-semibold">Posting limit reached</h4>
                <p className="mt-2 text-sm text-slate-600">Your free job posting limit is over. Upgrade to Premium to continue.</p>
                </div>
              </div>
              <button onClick={() => setOpenLimitModal(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setOpenLimitModal(false)}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={startPremiumCheckout}
                disabled={isSubmitting || paymentStatus === 'PENDING'}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-950 disabled:opacity-60"
              >
                {paymentStatus === 'PENDING' ? 'Processing...' : 'Upgrade to Premium'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Success Modal */}
      {openSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-lg border border-white/70 bg-white p-6 text-center text-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.4)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="mt-2 font-semibold">{successTitle}</div>
            <p className="text-sm text-slate-600 mt-1">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {openErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-lg border border-white/70 bg-white p-6 text-center text-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.4)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="mt-2 font-semibold text-rose-700">Error</div>
            <p className="text-sm text-slate-600 mt-1">{errorMessage}</p>
            <div className="mt-4">
              <button onClick={() => setOpenErrorModal(false)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}





