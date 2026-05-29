import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../../../context/AuthContext'
import apiService from '../../../utils/api'

const onboardingSteps = [
  { id: 1, label: 'Personal Info' },
  { id: 2, label: 'Company Details' },
  { id: 3, label: 'Verification' },
  { id: 4, label: 'Company & Security' }
]

const industryOptions = [
  'IT / Software',
  'Manufacturing',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Logistics',
  'Media & Advertising',
  'Real Estate',
  'Construction',
  'Hospitality & Travel',
  'Telecommunications',
  'Energy & Utilities',
  'Staffing & HR Services',
  'Government / Public Sector',
  'Other'
]

const companySizeOptions = ['1-10', '11-50', '51-200', '201-500', '500+']

const verificationDocOptions = [
  'GST Certificate',
  'CIN',
  'Shop & Establishment Certificate',
  'MSME / Udyam Registration',
  'Incorporation Certificate',
  'Company PAN'
]

const verificationStatusMeta = {
  Pending: {
    label: 'Pending',
    badge: 'bg-amber-50 border-amber-200 text-amber-700',
    message: 'Verification is pending. You can post public jobs once approved.'
  },
  Verified: {
    label: 'Verified',
    badge: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    message: 'Your company is verified. You can post public jobs.'
  },
  Rejected: {
    label: 'Rejected',
    badge: 'bg-red-50 border-red-200 text-red-700',
    message: 'Verification was rejected. Please review and re-upload documents.'
  }
}

const onboardingStorageKey = 'truehire_recruiter_onboarding'

const defaultCompanyDetails = {
  legalName: '',
  website: '',
  industry: '',
  size: '',
  city: '',
  state: '',
  country: '',
  description: ''
}

const defaultVerificationUpload = {
  docType: '',
  file: null,
  previewUrl: ''
}

const clampStep = (step) => {
  const total = onboardingSteps.length
  return Math.min(Math.max(step || 1, 1), total)
}

const formatIsoDate = (date = new Date()) => date.toISOString()

const parseLocation = (value) => {
  if (!value) {
    return { city: '', state: '', country: '' }
  }
  const parts = String(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  return {
    city: parts[0] || '',
    state: parts[1] || '',
    country: parts.slice(2).join(', ') || parts[2] || ''
  }
}

const buildLocationString = (details) => (
  [details.city, details.state, details.country]
    .map((part) => (part || '').trim())
    .filter(Boolean)
    .join(', ')
)

const calculateCompanyCompletion = (details) => {
  const fields = [
    'legalName',
    'website',
    'industry',
    'size',
    'city',
    'state',
    'country',
    'description'
  ]
  const filled = fields.filter((field) => String(details[field] || '').trim()).length
  return Math.round((filled / fields.length) * 100)
}

export default function RecruiterRegister() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [popupMessage, setPopupMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [awaitingApproval, setAwaitingApproval] = useState(false)
  const [resumeMessage, setResumeMessage] = useState('')
  const [companyDetails, setCompanyDetails] = useState(defaultCompanyDetails)
  const [companyCompletion, setCompanyCompletion] = useState(0)
  const [companySaveMessage, setCompanySaveMessage] = useState('')
  const [verificationStatus, setVerificationStatus] = useState('Pending')
  const [verificationDocs, setVerificationDocs] = useState([])
  const [verificationUpload, setVerificationUpload] = useState(defaultVerificationUpload)
  const [companyImage, setCompanyImage] = useState({ file: null, previewUrl: '' })
  const [verificationUploading, setVerificationUploading] = useState(false)
  const [verificationError, setVerificationError] = useState('')
  const [verificationNote, setVerificationNote] = useState('')
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const { register, user, isAuthenticated, logout } = useAuth()

  const totalSteps = onboardingSteps.length
  const progressPercent = Math.round((currentStep / totalSteps) * 100)
  const isRecruiterAuthenticated = isAuthenticated && user?.role === 'recruiter'
  const hasAuthToken = Boolean(apiService.getToken())
  const canAccessPostRegistrationSteps = isRecruiterAuthenticated && hasAuthToken
  const statusMeta = verificationStatusMeta[verificationStatus] || verificationStatusMeta.Pending
  const isVerificationReady = Boolean(verificationUpload.file && verificationUpload.docType)
  const showApprovalPending = awaitingApproval

  const getFriendlyRegistrationMessage = (message = '') => {
    const normalized = String(message).toLowerCase()
    if (normalized.includes('already exists') || normalized.includes('duplicate')) {
      return 'Company already login'
    }
    return message || 'Registration failed. Please try again.'
  }

  const showPopup = (message) => {
    setPopupMessage(message)
    window.setTimeout(() => setPopupMessage(''), 3500)
  }

  const buildAssetUrl = (path) => {
    if (!path) return '#'
    if (/^https?:\/\//i.test(path)) return path
    let base = ''
    if (apiService && typeof apiService.getEffectiveBaseURL === 'function') {
      base = apiService.getEffectiveBaseURL()
    } else if (apiService?.baseURL) {
      base = apiService.baseURL
    }
    if (!base && typeof window !== 'undefined') {
      base = window.location.origin
    }
    const origin = base ? base.replace(/\/api$/, '').replace(/\/+$/, '') : ''
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return origin ? `${origin}${normalizedPath}` : normalizedPath
  }

  const persistDraft = (stepOverride, overrides = {}) => {
    // Refresh should clear entered values, so draft persistence is intentionally disabled.
    return
  }

  const clearDraft = () => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(onboardingStorageKey)
    } catch (error) {
      console.warn('Failed to clear onboarding draft', error)
    }
  }

  const validateStep = (step) => {
    const newErrors = {}

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Full name is required'
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters'
      }

      if (!formData.email.trim()) {
        newErrors.email = 'Email is required'
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email'
      }

      if (formData.phone.trim() && !/^[0-9+()\-\s]{8,20}$/.test(formData.phone.trim())) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    } else if (step === 2) {
      if (!companyDetails.legalName.trim()) {
        newErrors.legalName = 'Company legal name is required'
      }

      if (!companyDetails.website.trim()) {
        newErrors.website = 'Company website is required'
      } else if (!/^https?:\/\/\S+\.\S+/i.test(companyDetails.website.trim())) {
        newErrors.website = 'Enter a valid website URL (include http:// or https://)'
      }

      if (!companyDetails.industry.trim()) {
        newErrors.industry = 'Industry is required'
      }

      if (!companyDetails.size.trim()) {
        newErrors.size = 'Company size is required'
      }

      if (!companyDetails.city.trim()) {
        newErrors.city = 'City is required'
      }

      if (!companyDetails.state.trim()) {
        newErrors.state = 'State is required'
      }

      if (!companyDetails.country.trim()) {
        newErrors.country = 'Country is required'
      }

      if (!companyDetails.description.trim()) {
        newErrors.description = 'Company description is required'
      }
    } else if (step === 3) {
      const hasUploadedDocument = Array.isArray(verificationDocs) && verificationDocs.length > 0
      const hasQueuedDocument = Boolean(verificationUpload.docType && verificationUpload.file)

      if (!hasUploadedDocument && !hasQueuedDocument) {
        newErrors.document = 'Upload at least one verification document to continue'
      }
    } else if (step === 4) {
      if (!formData.company.trim()) {
        newErrors.company = 'Company name is required'
      } else if (formData.company.trim().length < 2) {
        newErrors.company = 'Company name must be at least 2 characters'
      }

      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters'
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Password must contain uppercase, lowercase, and number'
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleCompanyChange = (e) => {
    const { name, value } = e.target
    setCompanyDetails(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    if (companySaveMessage) {
      setCompanySaveMessage('')
    }
  }

  const handleVerificationFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) {
      setVerificationUpload(prev => ({
        ...prev,
        file: null,
        previewUrl: ''
      }))
      setVerificationNote('')
      return
    }

    setVerificationNote('')
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    setVerificationUpload(prev => ({
      ...prev,
      file,
      previewUrl
    }))
    if (errors.document) {
      setErrors(prev => ({
        ...prev,
        document: ''
      }))
    }
  }

  const handleCompanyImageChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) {
      if (companyImage.previewUrl) {
        URL.revokeObjectURL(companyImage.previewUrl)
      }
      setCompanyImage({ file: null, previewUrl: '' })
      return
    }

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, companyImage: 'Please upload a valid image file.' }))
      if (companyImage.previewUrl) {
        URL.revokeObjectURL(companyImage.previewUrl)
      }
      setCompanyImage({ file: null, previewUrl: '' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, companyImage: 'Image size must be 5MB or less.' }))
      if (companyImage.previewUrl) {
        URL.revokeObjectURL(companyImage.previewUrl)
      }
      setCompanyImage({ file: null, previewUrl: '' })
      return
    }

    if (errors.companyImage) {
      setErrors(prev => ({ ...prev, companyImage: '' }))
    }

    if (companyImage.previewUrl) {
      URL.revokeObjectURL(companyImage.previewUrl)
    }
    const previewUrl = URL.createObjectURL(file)
    setCompanyImage({ file, previewUrl })
  }

  const loadVerificationStatus = async () => {
    if (!isRecruiterAuthenticated) return
    const response = await apiService.getRecruiterVerification()
    if (response && response.error) return
    setVerificationStatus(response.status || 'Pending')
    setVerificationDocs(response.documents || [])
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const next = clampStep(currentStep + 1)
      setCurrentStep(next)
      persistDraft(next)
    }
  }

  const prevStep = () => {
    const prev = clampStep(currentStep - 1)
    setCurrentStep(prev)
    persistDraft(prev)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (currentStep !== 4) {
      return
    }

    if (!validateStep(currentStep)) {
      return
    }

    setIsLoading(true)
    try {
      if (!isRecruiterAuthenticated) {
        const userData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          company: formData.company.trim()
        }

        const response = await register(userData, 'recruiter')
        if (response && response.error) {
          showPopup(getFriendlyRegistrationMessage(response.error))
          return
        }
      }

      const profilePayload = {
        company_name: companyDetails.legalName || formData.company.trim() || null,
        website: companyDetails.website || null,
        industry: companyDetails.industry || null,
        company_size: companyDetails.size || null,
        headquarters_location: buildLocationString(companyDetails) || null,
        detailed_description: companyDetails.description || null,
        official_email: formData.email.trim().toLowerCase() || null,
        phone_number: formData.phone.trim() || null,
        company_profile_complete: companyCompletion === 100,
        onboarding_step: 4,
        onboarding_completed_at: formatIsoDate()
      }

      const profileResponse = await apiService.updateCurrentRecruiterProfile(profilePayload)
      if (profileResponse && profileResponse.error) {
        console.warn('Failed to save recruiter details after registration', profileResponse.error)
      }

      if (verificationUpload.file && verificationUpload.docType) {
        const verificationForm = new FormData()
        verificationForm.append('doc_type', verificationUpload.docType)
        verificationForm.append('document', verificationUpload.file)
        const uploadResponse = await apiService.uploadRecruiterVerificationDoc(verificationForm)
        if (uploadResponse && uploadResponse.error) {
          console.warn('Failed to upload verification document', uploadResponse.error)
        }
      }

      if (companyImage.file) {
        const companyImageForm = new FormData()
        companyImageForm.append('doc_type', 'Company Image')
        companyImageForm.append('document', companyImage.file)
        const imageUploadResponse = await apiService.uploadRecruiterVerificationDoc(companyImageForm)
        if (imageUploadResponse && imageUploadResponse.error) {
          throw new Error(imageUploadResponse.error || 'Failed to upload company image')
        }
      }

      setRegistrationComplete(true)
      setAwaitingApproval(true)
      setResumeMessage('Your account is under review. Approval typically takes 24–72 hours (sometimes faster).')
      clearDraft()
      logout()
    } catch (error) {
      console.warn('Registration error:', error?.message || error)
      showPopup(getFriendlyRegistrationMessage(error?.message))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCompanyDetails = async (advance) => {
    if (!validateStep(2)) {
      return
    }

    const next = advance ? 3 : 2

    if (companyDetails.legalName && !formData.company.trim()) {
      setFormData(prev => ({
        ...prev,
        company: companyDetails.legalName
      }))
    }

    setCompanySaveMessage('')

    if (!canAccessPostRegistrationSteps) {
      setCurrentStep(next)
      persistDraft(next)
      setCompanySaveMessage(advance ? 'Company details saved. Continue to verification.' : 'Company details saved.')
      return
    }

    const payload = {
      company_name: companyDetails.legalName || formData.company.trim() || null,
      website: companyDetails.website || null,
      industry: companyDetails.industry || null,
      company_size: companyDetails.size || null,
      headquarters_location: buildLocationString(companyDetails) || null,
      detailed_description: companyDetails.description || null,
      official_email: formData.email.trim().toLowerCase() || null,
      phone_number: formData.phone.trim() || null,
      company_profile_complete: companyCompletion === 100,
      onboarding_step: next
    }

    const response = await apiService.updateCurrentRecruiterProfile(payload)
    if (response && response.error) {
      setCompanySaveMessage(response.error || 'Failed to save company details.')
      return
    }

    setCurrentStep(next)
    persistDraft(next, { registrationComplete: true })
    setCompanySaveMessage(advance ? 'Company details saved. Continue to verification.' : 'Company details saved.')
  }

  const handleVerificationUpload = async () => {
    setVerificationError('')
    setVerificationNote('')

    if (!verificationUpload.docType) {
      setVerificationError('Select a document type before uploading.')
      return
    }

    if (!verificationUpload.file) {
      setVerificationError('Select a document file before uploading.')
      return
    }

    if (!canAccessPostRegistrationSteps) {
      setVerificationNote('Document queued. It will upload after you create your account.')
      return
    }

    setVerificationUploading(true)
    const form = new FormData()
    form.append('doc_type', verificationUpload.docType)
    form.append('document', verificationUpload.file)

    const response = await apiService.uploadRecruiterVerificationDoc(form)
    if (response && response.error) {
      setVerificationError(response.error || 'Failed to upload document.')
      setVerificationUploading(false)
      return
    }

    setVerificationUpload(defaultVerificationUpload)
    await loadVerificationStatus()
    setVerificationUploading(false)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    clearDraft()
    setHasDraft(false)
    setDraftLoaded(true)
  }, [])

  useEffect(() => {
    setCompanyCompletion(calculateCompanyCompletion(companyDetails))
  }, [companyDetails])

  useEffect(() => {
    if (isRecruiterAuthenticated) {
      setRegistrationComplete(true)
    }
  }, [isRecruiterAuthenticated])

  useEffect(() => {
    if (!draftLoaded || !isRecruiterAuthenticated) return

    const loadProfile = async () => {
      const response = await apiService.getRecruiterProfile()
      if (response && response.error) {
        return
      }
      const recruiter = response?.recruiter || {}
      const location = parseLocation(recruiter.headquarters_location)

      setFormData(prev => ({
        ...prev,
        name: prev.name || recruiter.name || '',
        email: prev.email || recruiter.email || '',
        phone: prev.phone || recruiter.phone_number || '',
        company: prev.company || recruiter.company || recruiter.company_name || ''
      }))

      setCompanyDetails(prev => ({
        ...prev,
        legalName: prev.legalName || recruiter.company_name || recruiter.company || '',
        website: prev.website || recruiter.website || '',
        industry: prev.industry || recruiter.industry || '',
        size: prev.size || recruiter.company_size || '',
        city: prev.city || location.city,
        state: prev.state || location.state,
        country: prev.country || location.country,
        description: prev.description || recruiter.detailed_description || recruiter.short_overview || ''
      }))

      if (!hasDraft) {
        const rawStep = Number(recruiter.onboarding_step || 0)
        const nextStep = rawStep ? clampStep(rawStep) : 2
        setCurrentStep(nextStep)
        setResumeMessage('Welcome back! Continue where you left off.')
      }

      await loadVerificationStatus()
    }

    loadProfile()
  }, [draftLoaded, hasDraft, isRecruiterAuthenticated])

  useEffect(() => {
    if (!isRecruiterAuthenticated || !registrationComplete) return
    apiService.updateCurrentRecruiterProfile({ onboarding_step: currentStep })
  }, [currentStep, isRecruiterAuthenticated, registrationComplete])

  useEffect(() => {
    return () => {
      if (verificationUpload.previewUrl) {
        URL.revokeObjectURL(verificationUpload.previewUrl)
      }
      if (companyImage.previewUrl) {
        URL.revokeObjectURL(companyImage.previewUrl)
      }
    }
  }, [verificationUpload.previewUrl, companyImage.previewUrl])

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '' }
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^A-Za-z\d]/.test(password)) strength++

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
    return { strength, label: labels[strength] }
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const preventClipboardActions = (event) => {
    event.preventDefault()
  }

  if (showApprovalPending) {
    return (
      <>
        <Head>
          <title>Recruiter Account Under Review - TrueHire</title>
          <meta name="description" content="Your recruiter account is under review by the TrueHire team." />
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="flex justify-center mb-8">
              <img
                src="/images/truerizelogon.png"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = '/images/truerizelogon.png.jpg'
                }}
                alt="TrueHire Logo"
                width="120"
                height="40"
                className="object-contain"
              />
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="px-8 py-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-full mb-4">
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 3c-4.97 0-9 3.58-9 8a8.76 8.76 0 004.2 7.42c.38.23.8.58.8 1.08v.5h8v-.5c0-.5.42-.85.8-1.08A8.76 8.76 0 0021 11c0-4.42-4.03-8-9-8z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Under Review</h1>
                <p className="text-slate-600 text-sm">
                  Your account is under review. Approval typically takes 24–72 hours (sometimes faster).
                </p>
                <p className="text-slate-500 text-sm mt-3">
                  We'll email you as soon as your recruiter account is approved.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="/login"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700"
                  >
                    Return to Login
                  </a>
                  <a
                    href="/"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold transition hover:bg-slate-50"
                  >
                    Back to Home
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Join as Recruiter - TrueHire</title>
        <meta name="description" content="Create your recruiter account and start hiring top talent" />
      </Head>

      <div className="relative min-h-screen overflow-hidden px-4 py-8">
        {popupMessage && (
          <div className="fixed right-4 top-4 z-[100] max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800 shadow-[0_18px_45px_-22px_rgba(15,23,42,0.45)]">
            {popupMessage}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.12),_transparent_24%),radial-gradient(circle_at_75%_20%,_rgba(56,189,248,0.14),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.25),_transparent_50%)]" />
          <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="recruiter-grid absolute inset-0 opacity-25" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[1.02fr_1.08fr]">
            <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(165deg,#111827_0%,#172554_48%,#0f766e_100%)] p-8 text-white shadow-[0_40px_120px_-40px_rgba(2,6,23,0.95)] sm:p-10 lg:p-12">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
                  <img
                    src="/images/truerizelogon.png"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = '/images/truerizelogon.png.jpg'
                    }}
                    alt="TrueHire Logo"
                    className="h-8 w-8 object-contain"
                  />
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-100">TrueHire</span>
              </Link>

              <span className="mt-8 inline-flex rounded-full border border-amber-200/25 bg-amber-200/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
                Recruiter Signup
              </span>
              <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
                Build your hiring engine with a cleaner recruiter setup.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
                Create your recruiter account, complete verification, and move from signup to active hiring with a guided onboarding flow.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-2xl font-semibold text-white">4</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-200/80">guided steps</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-2xl font-semibold text-white">Secure</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-200/80">verification flow</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-2xl font-semibold text-white">Ready</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-200/80">for approvals</p>
                </div>
              </div>

              <div className="mt-10 rounded-[24px] border border-white/10 bg-slate-950/20 p-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">How onboarding works</p>
                <div className="mt-4 space-y-3">
                  {onboardingSteps.map((step) => (
                    <div key={step.id} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        currentStep >= step.id ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-slate-200'
                      }`}>
                        {step.id}
                      </span>
                      <p className="text-sm text-slate-100">{step.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-200/75">Need recruiter access later?</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  Already have an account? Use the recruiter login page and continue from your existing workspace.
                </p>
                <Link href="/login" className="mt-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15">
                  Go to recruiter login
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-[0_40px_120px_-50px_rgba(15,23,42,0.85)] border border-white/10 overflow-hidden">
              <div className="px-8 pt-8 pb-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-amber-50">
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Join as Recruiter</h1>
                <p className="text-slate-600 text-sm">Create your account and start building your dream team</p>
              </div>

            {resumeMessage && (
              <div className="mx-8 mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                {resumeMessage}
              </div>
            )}

              <div className="px-8 mb-6">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                  <span>Progress</span>
                  <span>{progressPercent}%</span>
                </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-[linear-gradient(135deg,#f59e0b,#0ea5e9)] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  {onboardingSteps.map((step, index) => (
                    <div className="flex items-center w-full" key={step.id}>
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                          currentStep >= step.id ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {step.id}
                      </div>
                      {index !== onboardingSteps.length - 1 && (
                        <div
                          className={`flex-1 h-1 mx-2 rounded ${
                            currentStep > step.id ? 'bg-sky-500' : 'bg-slate-200'
                          }`}
                        ></div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 mt-2 text-xs text-slate-600">
                  {onboardingSteps.map((step) => (
                    <span key={step.id} className="text-center">{step.label}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-8 pb-8">
              <form onSubmit={handleSubmit} onBlurCapture={() => persistDraft()} className="space-y-6">
                {errors.general && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-700 text-sm">{errors.general}</span>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <>
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <input
                          id="name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          required
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                            errors.name ? 'border-red-300 bg-red-50' : 'border-slate-300'
                          }`}
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={handleChange}
                        />
                        {errors.name && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                        Official Work Email ID
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                            errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
                          }`}
                          placeholder="Enter your work email"
                          value={formData.email}
                          onChange={handleChange}
                        />
                        {errors.email && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        Company email is strongly recommended for faster approval and credibility.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                        Mobile Number (Optional)
                      </label>
                      <div className="relative">
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                            errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-300'
                          }`}
                          placeholder="Enter mobile number"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                        {errors.phone && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        You can verify this number with OTP after registration.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={nextStep}
                      className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
                    >
                      Continue
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {currentStep === 4 && (
                  <>
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">
                        Company Name
                      </label>
                      <div className="relative">
                        <input
                          id="company"
                          name="company"
                          type="text"
                          autoComplete="organization"
                          required
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                            errors.company ? 'border-red-300 bg-red-50' : 'border-slate-300'
                          }`}
                          placeholder="Enter your company name"
                          value={formData.company}
                          onChange={handleChange}
                        />
                        {errors.company && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {errors.company && (
                        <p className="mt-1 text-sm text-red-600">{errors.company}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="companyImage" className="block text-sm font-medium text-slate-700 mb-2">
                        Company Image (Optional)
                      </label>
                      <input
                        id="companyImage"
                        name="companyImage"
                        type="file"
                        accept="image/*"
                        onChange={handleCompanyImageChange}
                        className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      />
                      {errors.companyImage && (
                        <p className="mt-1 text-sm text-red-600">{errors.companyImage}</p>
                      )}
                      {companyImage.previewUrl && (
                        <div className="mt-3 inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                          <img
                            src={companyImage.previewUrl}
                            alt="Company preview"
                            className="h-12 w-12 rounded-md border border-slate-200 object-cover"
                          />
                          <span className="text-xs text-slate-600">{companyImage.file?.name || 'Selected image'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          onCopy={preventClipboardActions}
                          onCut={preventClipboardActions}
                          onPaste={preventClipboardActions}
                          onContextMenu={preventClipboardActions}
                          onDrop={preventClipboardActions}
                          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                            errors.password ? 'border-red-300 bg-red-50' : 'border-slate-300'
                          }`}
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <svg className="w-5 h-5 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {formData.password && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-600">Password strength:</span>
                            <span className={`text-xs font-medium ${
                              passwordStrength.strength <= 2 ? 'text-red-600' :
                              passwordStrength.strength <= 3 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full transition-all duration-300 ${
                                passwordStrength.strength <= 2 ? 'bg-red-500' :
                                passwordStrength.strength <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          onCopy={preventClipboardActions}
                          onCut={preventClipboardActions}
                          onPaste={preventClipboardActions}
                          onContextMenu={preventClipboardActions}
                          onDrop={preventClipboardActions}
                          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                            errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-300'
                          }`}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <svg className="w-5 h-5 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 bg-slate-200 text-slate-700 py-3 px-4 rounded-lg font-medium hover:bg-slate-300 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating account...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Create Account
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Company profile completion</p>
                          <p className="text-xs text-slate-500">Fill all required company details to continue.</p>
                        </div>
                        <span className="text-sm font-semibold text-indigo-600">{companyCompletion}%</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
                          style={{ width: `${companyCompletion}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label htmlFor="legalName" className="block text-sm font-medium text-slate-700 mb-2">
                          Company Legal / Registered Name
                        </label>
                        <input
                          id="legalName"
                          name="legalName"
                          type="text"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${errors.legalName ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                          placeholder="Enter registered company name"
                          value={companyDetails.legalName}
                          onChange={handleCompanyChange}
                        />
                        {errors.legalName && (
                          <p className="mt-1 text-sm text-red-600">{errors.legalName}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="website" className="block text-sm font-medium text-slate-700 mb-2">
                          Company Website URL
                        </label>
                        <input
                          id="website"
                          name="website"
                          type="url"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${errors.website ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                          placeholder="https://www.company.com"
                          value={companyDetails.website}
                          onChange={handleCompanyChange}
                        />
                        {errors.website && (
                          <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-2">
                          Industry Type
                        </label>
                        <select
                          id="industry"
                          name="industry"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${errors.industry ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                          value={companyDetails.industry}
                          onChange={handleCompanyChange}
                        >
                          <option value="">Select industry</option>
                          {industryOptions.map((option) => (
                            <option value={option} key={option}>{option}</option>
                          ))}
                        </select>
                        {errors.industry && (
                          <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="size" className="block text-sm font-medium text-slate-700 mb-2">
                          Company Size
                        </label>
                        <select
                          id="size"
                          name="size"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${errors.size ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                          value={companyDetails.size}
                          onChange={handleCompanyChange}
                        >
                          <option value="">Select size</option>
                          {companySizeOptions.map((option) => (
                            <option value={option} key={option}>{option}</option>
                          ))}
                        </select>
                        {errors.size && (
                          <p className="mt-1 text-sm text-red-600">{errors.size}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">
                          City
                        </label>
                        <input
                          id="city"
                          name="city"
                          type="text"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${errors.city ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                          placeholder="City"
                          value={companyDetails.city}
                          onChange={handleCompanyChange}
                        />
                        {errors.city && (
                          <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-2">
                          State
                        </label>
                        <input
                          id="state"
                          name="state"
                          type="text"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${errors.state ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                          placeholder="State"
                          value={companyDetails.state}
                          onChange={handleCompanyChange}
                        />
                        {errors.state && (
                          <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-2">
                          Country
                        </label>
                        <input
                          id="country"
                          name="country"
                          type="text"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${errors.country ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                          placeholder="Country"
                          value={companyDetails.country}
                          onChange={handleCompanyChange}
                        />
                        {errors.country && (
                          <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                          Company Description / Profile
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          rows={4}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${errors.description ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                          placeholder="Tell candidates about your company, culture, and mission"
                          value={companyDetails.description}
                          onChange={handleCompanyChange}
                        />
                        {errors.description && (
                          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                      </div>
                    </div>

                    {companySaveMessage && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {companySaveMessage}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 bg-slate-200 text-slate-700 py-3 px-4 rounded-lg font-medium hover:bg-slate-300 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveCompanyDetails(true)}
                        className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        Save & Continue
                      </button>
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <div className={`rounded-xl border px-4 py-4 ${statusMeta.badge}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">Verification Status: {statusMeta.label}</p>
                          <p className="text-xs mt-1">{statusMeta.message}</p>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wide">Trust Ready</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-800 mb-3">Upload verification documents</p>
                      <p className="text-xs text-slate-500 mb-4">
                        Upload verification details to continue.
                      </p>
                      {!canAccessPostRegistrationSteps && (
                        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          Select documents now. They will upload automatically after you create your account.
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="docType" className="block text-sm font-medium text-slate-700 mb-2">
                            Document Type
                          </label>
                          <select
                            id="docType"
                            name="docType"
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 border-slate-300"
                            value={verificationUpload.docType}
                            onChange={(e) => setVerificationUpload(prev => ({ ...prev, docType: e.target.value }))}
                          >
                            <option value="">Select document</option>
                            {verificationDocOptions.map((option) => (
                              <option value={option} key={option}>{option}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="document" className="block text-sm font-medium text-slate-700 mb-2">
                            Upload File (PDF or Image)
                          </label>
                          <input
                            id="document"
                            name="document"
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleVerificationFileChange}
                            className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                          />
                        </div>
                      </div>

                      {verificationUpload.file && (
                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-center gap-3">
                          {verificationUpload.previewUrl ? (
                            <img
                              src={verificationUpload.previewUrl}
                              alt="Document preview"
                              className="w-16 h-16 object-cover rounded-md border border-slate-200"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-md border border-slate-200 bg-white flex items-center justify-center text-xs text-slate-500">
                              PDF
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-700">{verificationUpload.file.name}</p>
                            <p className="text-xs text-slate-500">Ready to upload</p>
                          </div>
                        </div>
                      )}

                      {verificationError && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                          {verificationError}
                        </div>
                      )}
                      {errors.document && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                          {errors.document}
                        </div>
                      )}
                      {verificationNote && (
                        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                          {verificationNote}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleVerificationUpload}
                        disabled={verificationUploading || !isVerificationReady}
                        className="mt-4 w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {verificationUploading
                          ? 'Uploading...'
                          : canAccessPostRegistrationSteps
                            ? 'Upload Document'
                            : 'Queue Document'}
                      </button>
                    </div>

                    {verificationDocs.length > 0 && (
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-sm font-semibold text-slate-800 mb-3">Submitted Documents</p>
                        <div className="space-y-3">
                          {verificationDocs.map((doc) => (
                            <div key={doc.id} className="flex items-start justify-between rounded-lg border border-slate-200 p-3">
                              <div>
                                <p className="text-sm font-medium text-slate-800">{doc.doc_type}</p>
                                <a
                                  href={buildAssetUrl(doc.file_path)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-indigo-600 hover:text-indigo-500"
                                >
                                  View document
                                </a>
                                {doc.rejection_reason && (
                                  <p className="text-xs text-red-600 mt-1">Reason: {doc.rejection_reason}</p>
                                )}
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded-full border ${
                                  doc.status === 'Verified'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : doc.status === 'Rejected'
                                      ? 'bg-red-50 border-red-200 text-red-700'
                                      : 'bg-amber-50 border-amber-200 text-amber-700'
                                }`}
                              >
                                {doc.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 bg-slate-200 text-slate-700 py-3 px-4 rounded-lg font-medium hover:bg-slate-300 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={nextStep}
                        className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        Continue to Company & Security
                      </button>
                    </div>
                  </>
                )}

              </form>

              {currentStep <= 2 && !registrationComplete && (
                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-slate-500">Already have an account?</span>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <a
                      href="/login"
                      className="text-emerald-600 hover:text-emerald-500 font-medium transition-colors duration-200"
                    >
                      Sign in instead
                    </a>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-slate-400">
            By creating an account, you agree to our{' '}
            <a href="/terms" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
          </div>
        </div>

        <style jsx>{`
          .recruiter-grid {
            background-image:
              linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
            background-size: 42px 42px;
          }
        `}</style>
      </div>
    </>
  )
}


