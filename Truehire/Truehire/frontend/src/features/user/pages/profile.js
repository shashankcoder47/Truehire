import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import { useAuth } from '../../../context/AuthContext'
import apiService from '../../../services/api'

export default function Profile() {
  const { user: authUser, loading, updateProfile, updateProfilePhoto } = useAuth()
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [connectTargetId, setConnectTargetId] = useState(null)
  const [canShowConnect, setCanShowConnect] = useState(false)
  const [sendingConnection, setSendingConnection] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [uploadingCertificationIndex, setUploadingCertificationIndex] = useState(null)
  const router = useRouter()

  const syncStoredUser = (sourceUser = {}) => {
    if (typeof window === "undefined") return

    const mergedUser = {
      ...(authUser || {}),
      ...(sourceUser || {})
    }

    apiService.setUserData(mergedUser)
  }

  const parseList = (value, fallback = []) => {
    if (!value) return fallback
    if (Array.isArray(value)) return value.filter(Boolean)
    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    }
    return fallback
  }

  const parseJsonList = (value, fallback = []) => {
    if (!value) return fallback
    if (Array.isArray(value)) return value
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : fallback
      } catch (error) {
        return fallback
      }
    }
    return fallback
  }

  const parseLanguageList = (value, fallback = []) => {
    if (!value) return fallback
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed.startsWith("[")) {
        return parseJsonList(trimmed, fallback)
      }
      return parseList(trimmed, fallback)
    }
    if (Array.isArray(value)) return value
    return fallback
  }

  const splitCommaList = (value) => {
    if (value === null || value === undefined) return []
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }

  const parseBoolean = (value, fallback = false) => {
    if (value === true || value === false) return value
    if (value === 1 || value === "1") return true
    if (value === 0 || value === "0") return false
    if (value === null || value === undefined) return fallback
    return Boolean(value)
  }

  const toNumberOrZero = (value) => {
    if (value === null || value === undefined || value === "") return 0
    const num = Number(value)
    return Number.isFinite(num) ? num : 0
  }

  const toDateInputValue = (value) => {
    if (!value) return ""
    if (typeof value === "string") {
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (match) return `${match[1]}-${match[2]}-${match[3]}`
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${date.getFullYear()}-${month}-${day}`
  }

  const formatDateDisplay = (value) => {
    if (!value) return ""
    const parts = value.split("-")
    if (parts.length !== 3) return value
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  }

  const normalizeProjects = (value) => {
    const list = parseJsonList(value, Array.isArray(value) ? value : [])
    return list
      .map((project) => {
        if (!project || typeof project !== "object") return null
        const techStack = parseList(project.techStack || project.technologies_used || project.tech_stack || "")
        return {
          title: project.title || "",
          description: project.description || "",
          techStack,
          link: project.link || project.live_link || project.github_link || ""
        }
      })
      .filter(Boolean)
  }

  const normalizeCertifications = (value) => {
    const list = parseJsonList(value, Array.isArray(value) ? value : [])
    return list
      .map((cert) => {
        if (!cert || typeof cert !== "object") return null
        const issueDate = cert.issue_date || cert.year || ""
        const year = typeof issueDate === "string" ? issueDate.slice(0, 4) : ""
        return {
          name: cert.name || "",
          issuer: cert.issuer || cert.issuing_organization || "",
          year: cert.year || year || "",
          documentName: cert.documentName || cert.document_name || cert.fileName || cert.file_name || "",
          documentPath: cert.documentPath || cert.document_path || cert.documentUrl || cert.document_url || ""
        }
      })
      .filter(Boolean)
  }

  const mapUserToFormState = (sourceUser = {}) => ({
    name: sourceUser.name || "",
    email: sourceUser.email || "",
    phone: sourceUser.contact_number || sourceUser.phone || "",
    currentRole:
      sourceUser.desired_job_role ||
      sourceUser.current_role ||
      sourceUser.currentRole ||
      sourceUser.job_title ||
      sourceUser.jobTitle ||
      sourceUser.designation ||
      "",
    location: sourceUser.current_location || sourceUser.location || "",
    bio: sourceUser.professional_summary || sourceUser.bio || "",
    dateOfBirth: toDateInputValue(sourceUser.date_of_birth || sourceUser.dateOfBirth || ""),
    skills: parseList(sourceUser.core_skills ?? sourceUser.skills, []),
    softSkills: parseList(sourceUser.soft_skills, sourceUser.softSkills || []),
    languagesKnown: parseLanguageList(
      sourceUser.languages_known || sourceUser.languagesKnown || [],
      sourceUser.languagesKnown || []
    ),
    projects: normalizeProjects(sourceUser.projects || sourceUser.projectList || []),
    certifications: normalizeCertifications(sourceUser.certifications || sourceUser.certificationList || []),
    currentSalary: toNumberOrZero(sourceUser.current_salary ?? sourceUser.currentSalary ?? ""),
    expectedSalary: toNumberOrZero(sourceUser.expected_salary ?? sourceUser.expectedSalary ?? ""),
    salaryConfidential: parseBoolean(
      sourceUser.salary_confidential ?? sourceUser.salaryConfidential,
      false
    ),
    summary: sourceUser.professional_summary || sourceUser.summary || "",
    socialLinks: {
      linkedin: sourceUser.linkedin_url || sourceUser.linkedin || "",
      github: sourceUser.github_url || sourceUser.github || "",
      portfolio: sourceUser.portfolio_url || sourceUser.portfolio || ""
    },
    hobbiesInterests: sourceUser.hobbies_interests || sourceUser.hobbiesInterests || "",
    relocated: parseBoolean(
      sourceUser.relocated ?? sourceUser.open_to_relocation,
      false
    ),
    profilePhoto: sourceUser.profile_photo || sourceUser.profilePhoto || null,
    resumeFile: sourceUser.resume_file || sourceUser.resumeFile || "",
    resumeName: sourceUser.resume_name || sourceUser.resumeName || "",
    visibility: sourceUser.profile_visibility || sourceUser.visibility || "public",
    profileCompleteness: Number(
      sourceUser.profileCompleteness ??
      sourceUser.profile_completeness_percentage ??
      sourceUser.profile_completeness ??
      sourceUser.profile_complete ??
      0
    ) || 0
  })

  const hasValue = (value) => {
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === "string") return value.trim().length > 0
    return value !== null && value !== undefined
  }

  const calculateProfileCompletion = (profile = {}) => {
    const safeProfile = profile || {}
    const sections = [
      { weight: 20, fields: [safeProfile.name, safeProfile.email, safeProfile.phone, safeProfile.location, safeProfile.profilePhoto] },
      { weight: 20, fields: [safeProfile.summary || safeProfile.bio, safeProfile.skills, safeProfile.languagesKnown] },
      { weight: 20, fields: [safeProfile.projects, safeProfile.certifications] },
      { weight: 10, fields: [safeProfile.hobbiesInterests] },
      { weight: 10, fields: [safeProfile.relocated] },
      { weight: 20, fields: [safeProfile.currentSalary, safeProfile.expectedSalary, safeProfile.softSkills] }
    ]

    let total = 0
    sections.forEach((section) => {
      const filled = section.fields.filter(hasValue).length
      total += (filled / section.fields.length) * section.weight
    })
    return Math.round(Math.max(0, Math.min(100, total)))
  }

  useEffect(() => {
    if (loading) return

    if (!authUser) {
      router.push("/login")
      return
    }

    let cancelled = false

    ;(async () => {
      let latestUser = authUser

      try {
        const profileResponse = await apiService.getProfile()
        if (profileResponse?.user) {
          latestUser = profileResponse.user
        }
      } catch (error) {
        console.error("Failed to load latest profile:", error)
      }

      if (cancelled) return

      syncStoredUser(latestUser)
      setUser(mapUserToFormState(latestUser))
      setIsLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [authUser, loading, router])

  useEffect(() => {
    if (!router.isReady || !authUser?.id) return

    const rawId = Array.isArray(router.query?.userId)
      ? router.query.userId[0]
      : router.query?.userId

    const targetId = Number.parseInt(rawId, 10)
    if (!Number.isFinite(targetId) || targetId <= 0 || Number(targetId) === Number(authUser.id)) {
      setConnectTargetId(null)
      setCanShowConnect(false)
      return
    }

    setConnectTargetId(targetId)

    let cancelled = false
    ;(async () => {
      const result = await apiService.getMyConnections()
      const acceptedConnections = Array.isArray(result?.data) ? result.data : []
      const isAlreadyConnected = acceptedConnections.some(
        (item) => Number(item?.user_id) === Number(targetId)
      )
      if (!cancelled) {
        setCanShowConnect(!isAlreadyConnected)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authUser?.id, router.isReady, router.query?.userId])

  const buildPayload = () => ({
    name: user.name,
    contact_number: user.phone,
    desired_job_role: user.currentRole,
    current_location: user.location,
    professional_summary: user.bio,
    core_skills: user.skills.join(","),
    date_of_birth: user.dateOfBirth || null,
    soft_skills: user.softSkills.join(","),
    languages_known: JSON.stringify(user.languagesKnown || []),
    projects: user.projects || [],
    certifications: user.certifications || [],
    current_salary: user.currentSalary ? Number(user.currentSalary) : null,
    expected_salary: user.expectedSalary ? Number(user.expectedSalary) : null,
    salary_confidential: Boolean(user.salaryConfidential),
    linkedin_url: user.socialLinks?.linkedin || "",
    github_url: user.socialLinks?.github || "",
    portfolio_url: user.socialLinks?.portfolio || "",
    hobbies_interests: user.hobbiesInterests,
    relocated: Boolean(user.relocated),
    profile_visibility: user.visibility,
    profile_photo: user.profilePhoto
  })

  const toHref = (value) => {
    if (!value) return ""
    const trimmed = String(value).trim()
    if (!trimmed) return ""
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
  }

  const isValidSalary = (value) => {
    if (value === "" || value === null || value === undefined) return true
    const num = Number(value)
    return Number.isFinite(num) && num >= 0
  }

  const isValidDate = (value) => {
    if (!value) return true
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date <= today
  }

  const handleSave = async () => {
    try {
      if (!isValidDate(user.dateOfBirth)) {
        alert("Please select a valid date of birth that is not in the future.")
        return
      }
      if (!isValidSalary(user.currentSalary) || !isValidSalary(user.expectedSalary)) {
        alert("Please enter valid salary values in LPA.")
        return
      }
      const payload = buildPayload()
      const response = await updateProfile(payload)

      if (response && response.error) {
        alert(response.error || "Failed to update profile.")
        return
      }

      if (response && response.user) {
        syncStoredUser(response.user)
        const updated = mapUserToFormState(response.user)
        setUser(updated)
        alert("Profile updated successfully!")
        setIsEditing(false)
      } else {
        alert("Failed to update profile.")
      }
    } catch (error) {
      console.error("Profile update error:", error)
      alert("Something went wrong while updating your profile.")
    }
  }

  const handlePhotoUpload = async (e) => {
    if (!isEditing) return
    const file = e.target.files?.[0]
    if (!file) return

    const response = await updateProfilePhoto(file)
    if (response?.error) {
      alert(response.error || "Failed to upload photo.")
      return
    }

    if (response?.user) {
      syncStoredUser(response.user)
      const updated = mapUserToFormState(response.user)
      setUser(updated)
    }
  }

  const handleCertificationDocumentUpload = async (index, e) => {
    if (!isEditing) return
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCertificationIndex(index)
    try {
      const response = await apiService.uploadCertificationDocument(file)
      if (response?.error) {
        alert(response.error || "Failed to upload certification document.")
        return
      }

      const uploadedFile = response?.file || response?.data || {}
      const filePath = uploadedFile.path || uploadedFile.filePath || uploadedFile.url || ""
      if (!filePath) {
        alert("Document uploaded, but the file link was not returned.")
        return
      }

      updateCertification(index, {
        documentName: uploadedFile.name || file.name,
        documentPath: filePath
      })
    } catch (error) {
      console.error("Certification document upload error:", error)
      alert("Something went wrong while uploading the certification document.")
    } finally {
      setUploadingCertificationIndex(null)
      e.target.value = ""
    }
  }

  const handleResumeUpload = async (e) => {
    if (!isEditing) return
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]

    if (!allowedTypes.includes(file.type)) {
      alert("Only PDF, DOC, and DOCX files are allowed for resumes.")
      e.target.value = ""
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Resume file must be 5MB or smaller.")
      e.target.value = ""
      return
    }

    setUploadingResume(true)
    try {
      const response = await apiService.uploadProfileResume(file)
      if (response?.error) {
        alert(response.error || "Failed to upload resume.")
        return
      }

      if (response?.user) {
        syncStoredUser(response.user)
        const updated = mapUserToFormState(response.user)
        setUser({
          ...updated,
          resumeName: response?.file?.name || file.name
        })
      } else {
        const uploadedFile = response?.file || response?.data || {}
        const filePath = uploadedFile.path || uploadedFile.filePath || uploadedFile.url || ""
        if (!filePath) {
          alert("Resume uploaded, but the file link was not returned.")
          return
        }
        setUser({
          ...user,
          resumeFile: filePath,
          resumeName: uploadedFile.name || file.name
        })
      }
    } catch (error) {
      console.error("Resume upload error:", error)
      alert("Something went wrong while uploading your resume.")
    } finally {
      setUploadingResume(false)
      e.target.value = ""
    }
  }

  const sendConnection = async (targetUserId) => {
    if (!targetUserId || sendingConnection) return

    setSendingConnection(true)
    try {
      const token = apiService.getToken()
      if (!token) {
        alert("Please login first.")
        return
      }

      const rawBase = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/+$/, "")
      const endpoint = rawBase.endsWith("/api")
        ? `${rawBase}/connections/send`
        : `${rawBase}/api/connections/send`

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ receiver_id: targetUserId })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || data?.success === false) {
        alert(data?.message || "Failed to send connection request.")
        return
      }

      alert(data?.message || "Connection request sent.")
      setCanShowConnect(false)
    } catch (error) {
      console.error("sendConnection error:", error)
      alert("Unable to send connection request.")
    } finally {
      setSendingConnection(false)
    }
  }

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "")
  const assetBase = apiBase.replace(/\/api$/, "")
  const toFileHref = (value) => {
    if (!value) return ""
    const trimmed = String(value).trim()
    if (!trimmed) return ""
    return trimmed.startsWith("http") ? trimmed : `${assetBase}${trimmed}`
  }
  const photoSrc = user?.profilePhoto
    ? user.profilePhoto.startsWith("http")
      ? user.profilePhoto
      : `${assetBase}${user.profilePhoto}`
    : null
  const isPrivateVisibility = String(user?.visibility || "")
    .trim()
    .toLowerCase() === "private"
  const todayDate = new Date().toISOString().split("T")[0]
  const languagesKnown = user?.languagesKnown || []
  const softSkills = user?.softSkills || []
  const projects = user?.projects || []
  const certifications = user?.certifications || []
  const resumeHref = toFileHref(user?.resumeFile)
  const fallbackCompletion = calculateProfileCompletion(user)
  const profileCompletionRaw = Number(user?.profileCompleteness || 0)
  const normalizedServerCompletion = Number.isFinite(profileCompletionRaw)
    ? Math.max(0, Math.min(100, profileCompletionRaw))
    : 0
  // Keep UI completion consistent with the fields shown on this page.
  // Some backend responses use a stricter formula and can report a lower value right after save.
  const profileCompletion = Math.max(normalizedServerCompletion, fallbackCompletion)
  const completionStatus = profileCompletion >= 80 ? "Ready for applications" : "Needs attention"
  const completionTone = profileCompletion >= 80
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-800"
  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const updateProject = (index, key, value) => {
    const updated = [...projects]
    updated[index] = { ...updated[index], [key]: value }
    setUser({ ...user, projects: updated })
  }

  const addProject = () => {
    setUser({
      ...user,
      projects: [...projects, { title: "", description: "", techStack: [], link: "" }]
    })
  }

  const removeProject = (index) => {
    const updated = projects.filter((_, idx) => idx !== index)
    setUser({ ...user, projects: updated })
  }

  const updateCertification = (index, key, value) => {
    const updated = [...certifications]
    const nextValues = typeof key === "object" ? key : { [key]: value }
    updated[index] = { ...updated[index], ...nextValues }
    setUser({ ...user, certifications: updated })
  }

  const addCertification = () => {
    setUser({
      ...user,
      certifications: [...certifications, { name: "", issuer: "", year: "", documentName: "", documentPath: "" }]
    })
  }

  const removeCertification = (index) => {
    const updated = certifications.filter((_, idx) => idx !== index)
    setUser({ ...user, certifications: updated })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Under Review":
        return "bg-yellow-100 text-yellow-800"
      case "Interview Scheduled":
        return "bg-blue-100 text-blue-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      case "Accepted":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-700">Loading Profile...</p>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Profile - TrueHire</title>
      </Head>

      <main className="min-h-screen bg-[#f4f0ea] text-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-400 hover:bg-stone-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="grid items-start gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-lg border border-stone-300 bg-[#171412] text-white shadow-[0_26px_70px_-45px_rgba(23,20,18,0.8)]">
                <div className="p-6">
                  <div className="mx-auto h-32 w-32 overflow-hidden rounded-lg border border-white/10 bg-white/10">
                    {photoSrc ? (
                      <img src={photoSrc} className="h-full w-full object-cover" alt={`${user.name || "User"} profile`} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl font-semibold text-stone-100">{initials}</div>
                    )}
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-400">Candidate</p>
                    <h1 className="mt-3 text-2xl font-semibold tracking-tight">{user.name || "Complete your profile"}</h1>
                    <p className="mt-2 text-sm leading-6 text-stone-300">{user.email}</p>
                  </div>

                  <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.06] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">Profile Score</p>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${completionTone}`}>
                        {completionStatus}
                      </span>
                    </div>
                    <p className="mt-3 text-5xl font-semibold tracking-tight">{profileCompletion}%</p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#d6ff64] transition-all duration-300"
                        style={{ width: `${profileCompletion}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
                      <p className="text-xs text-stone-400">Visibility</p>
                      <p className="mt-1 font-semibold capitalize">{user.visibility}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
                      <p className="text-xs text-stone-400">Relocation</p>
                      <p className="mt-1 font-semibold">{user.relocated ? "Open" : "No"}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3">
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="rounded-full bg-[#d6ff64] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#c8f454]"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleSave}
                          className="rounded-full bg-[#d6ff64] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#c8f454]"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {canShowConnect && connectTargetId && (
                      <button
                        onClick={() => sendConnection(connectTargetId)}
                        disabled={sendingConnection}
                        className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {sendingConnection ? "Sending..." : "Connect"}
                      </button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="border-t border-white/10 p-6">
                    <p className="text-sm font-semibold text-white">Profile photo</p>
                    <p className="mt-1 text-sm leading-6 text-stone-400">Use a clear professional photo for recruiter recognition.</p>
                    <label
                      htmlFor="photo-upload"
                      className="mt-4 inline-flex cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:bg-white/10"
                    >
                      Upload Photo
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                )}

                <div className="border-t border-white/10 p-6">
                  <p className="text-sm font-semibold text-white">Resume</p>
                  <p className="mt-1 text-sm leading-6 text-stone-400">
                    This resume will be shared with recruiters when you apply without uploading a new one.
                  </p>
                  <div className="mt-4 flex flex-col gap-3">
                    {resumeHref ? (
                      <a
                        href={resumeHref}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-sm font-semibold text-indigo-200 hover:text-white hover:underline"
                      >
                        {user.resumeName || "View uploaded resume"}
                      </a>
                    ) : (
                      <p className="text-sm text-stone-400">No resume uploaded yet.</p>
                    )}
                    {isEditing && (
                      <>
                        <label
                          htmlFor="resume-upload"
                          className="inline-flex w-fit cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:bg-white/10"
                        >
                          {uploadingResume ? "Uploading..." : resumeHref ? "Replace Resume" : "Upload Resume"}
                        </label>
                        <input
                          id="resume-upload"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          disabled={uploadingResume}
                          onChange={handleResumeUpload}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            <div className="min-w-0 space-y-6">
              <section className="rounded-lg border border-stone-300 bg-[#fffdf8] p-6 shadow-[0_20px_60px_-48px_rgba(23,20,18,0.65)] sm:p-8">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-stone-500">Profile Workspace</p>
                    <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                      Shape how recruiters read your experience.
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
                      This layout separates your identity, readiness score, and editable profile sections so updates feel faster and easier to scan.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="min-w-[96px] rounded-lg border border-stone-200 bg-white p-4">
                      <p className="text-2xl font-semibold">{user.skills.length}</p>
                      <p className="mt-1 text-xs text-stone-500">Core skills</p>
                    </div>
                    <div className="min-w-[96px] rounded-lg border border-stone-200 bg-white p-4">
                      <p className="text-2xl font-semibold">{projects.length}</p>
                      <p className="mt-1 text-xs text-stone-500">Projects</p>
                    </div>
                    <div className="min-w-[96px] rounded-lg border border-stone-200 bg-white p-4">
                      <p className="text-2xl font-semibold">{certifications.length}</p>
                      <p className="mt-1 text-xs text-stone-500">Certificates</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-stone-300 bg-[#fffdf8] p-6 text-slate-900 shadow-[0_20px_60px_-48px_rgba(23,20,18,0.65)] sm:p-8">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
              <div className="min-w-0 space-y-6">
                <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-6">
                  <h2 className="text-xl font-semibold text-slate-900">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500">Name</p>
                      {isEditing ? (
                        <input
                          value={user.name}
                          onChange={(e) => setUser({ ...user, name: e.target.value })}
                          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        />
                      ) : (
                        <p className="text-base text-slate-900">{user.name}</p>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500">Email</p>
                      <p className="break-all text-base text-slate-900">{user.email}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500">Contact Number</p>
                      {isEditing ? (
                        <input
                          value={user.phone}
                          onChange={(e) => setUser({ ...user, phone: e.target.value })}
                          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        />
                      ) : (
                        <p className="text-base text-slate-900">{user.phone || "Not provided"}</p>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500">Current Role</p>
                      {isEditing ? (
                        <input
                          value={user.currentRole}
                          onChange={(e) => setUser({ ...user, currentRole: e.target.value })}
                          placeholder="Example: Software Engineer"
                          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        />
                      ) : (
                        <p className="text-base text-slate-900">{user.currentRole || "Not provided"}</p>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500">Current Location</p>
                      {isEditing ? (
                        <input
                          value={user.location}
                          onChange={(e) => setUser({ ...user, location: e.target.value })}
                          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        />
                      ) : (
                        <p className="text-base text-slate-900">{user.location || "Not provided"}</p>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500">Date of Birth</p>
                      {isEditing ? (
                        <input
                          type="date"
                          max={todayDate}
                          value={user.dateOfBirth}
                          onChange={(e) => setUser({ ...user, dateOfBirth: e.target.value })}
                          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        />
                      ) : (
                        <p className="text-base text-slate-900">
                          {isPrivateVisibility ? "Hidden" : formatDateDisplay(user.dateOfBirth) || "Not provided"}
                        </p>
                      )}
                      {isEditing && <p className="text-xs text-slate-500 mt-1">Format: DD/MM/YYYY</p>}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900">Professional Summary</h2>
                  {isEditing ? (
                    <textarea
                      value={user.bio}
                      onChange={(e) => setUser({ ...user, bio: e.target.value })}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 min-h-[120px]"
                    />
                  ) : (
                    <p className="text-sm text-slate-700">{user.bio || "No summary provided yet."}</p>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900">Compensation</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Current Salary (LPA)</p>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={user.currentSalary ? user.currentSalary : ""}
                          onChange={(e) => setUser({ ...user, currentSalary: e.target.value })}
                          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        />
                      ) : (
                        <p className="text-base text-slate-900">
                          {user.salaryConfidential
                            ? "Hidden"
                            : user.currentSalary
                              ? user.currentSalary
                              : "Not provided"}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Expected Salary (LPA)</p>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={user.expectedSalary ? user.expectedSalary : ""}
                          onChange={(e) => setUser({ ...user, expectedSalary: e.target.value })}
                          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        />
                      ) : (
                        <p className="text-base text-slate-900">
                          {user.salaryConfidential
                            ? "Hidden"
                            : user.expectedSalary
                              ? user.expectedSalary
                              : "Not provided"}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        id="salary-confidential"
                        type="checkbox"
                        checked={user.salaryConfidential}
                        disabled={!isEditing}
                        onChange={(e) => setUser({ ...user, salaryConfidential: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      />
                      <label htmlFor="salary-confidential" className="text-sm text-slate-700">
                        Keep salary confidential
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 space-y-6">
                <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">Core Skills</h2>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">{user.skills.length} tags</span>
                  </div>
                  {isEditing ? (
                    <input
                      value={user.skillsInput ?? user.skills.join(", ")}
                      onChange={(e) => {
                        const nextValue = e.target.value
                        setUser({
                          ...user,
                          skillsInput: nextValue,
                          skills: splitCommaList(nextValue)
                        })
                      }}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(user.skills.length ? user.skills : ["Not provided"]).map((skill, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            user.skills.length
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">Languages Known</h2>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">
                      {languagesKnown.length} tags
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      value={user.languagesKnownInput ?? languagesKnown.join(", ")}
                      onChange={(e) => {
                        const nextValue = e.target.value
                        setUser({
                          ...user,
                          languagesKnownInput: nextValue,
                          languagesKnown: splitCommaList(nextValue)
                        })
                      }}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(languagesKnown.length ? languagesKnown : ["Not provided"]).map((lang, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">Soft Skills</h2>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">
                      {softSkills.length} tags
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      value={user.softSkillsInput ?? softSkills.join(", ")}
                      onChange={(e) => {
                        const nextValue = e.target.value
                        setUser({
                          ...user,
                          softSkillsInput: nextValue,
                          softSkills: splitCommaList(nextValue)
                        })
                      }}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(softSkills.length ? softSkills : ["Not provided"]).map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900">Hobbies & Interests</h2>
                  {isEditing ? (
                    <input
                      value={user.hobbiesInterests}
                      onChange={(e) => setUser({ ...user, hobbiesInterests: e.target.value })}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  ) : (
                    <p className="text-sm text-slate-700">{user.hobbiesInterests || "Not provided"}</p>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900">Relocated</h2>
                  {isEditing ? (
                    <select
                      value={user.relocated ? "yes" : "no"}
                      onChange={(e) => setUser({ ...user, relocated: e.target.value === "yes" })}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  ) : (
                    <p className="text-sm text-slate-700">{user.relocated ? "Yes" : "No"}</p>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900">Social Links</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: "LinkedIn", key: "linkedin" },
                      { label: "GitHub", key: "github" },
                      { label: "Portfolio", key: "portfolio" }
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
                        {isEditing ? (
                          <input
                            value={user.socialLinks?.[key] || ""}
                            onChange={(e) =>
                              setUser({
                                ...user,
                                socialLinks: { ...(user.socialLinks || {}), [key]: e.target.value }
                              })
                            }
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                          />
                        ) : (
                          <p className="text-sm text-slate-700">{user.socialLinks?.[key] || "Not provided"}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Projects</h2>
                {isEditing && (
                  <button
                    onClick={addProject}
                    className="px-4 py-2 text-sm font-semibold rounded-md bg-slate-950 text-white shadow hover:bg-slate-800"
                  >
                    Add Project
                  </button>
                )}
              </div>
              {projects.length === 0 && !isEditing && (
                <p className="text-sm text-slate-600">No projects added yet.</p>
              )}
              <div className="space-y-4">
                {projects.map((project, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        Project {index + 1}
                      </p>
                      {isEditing && (
                        <button
                          onClick={() => removeProject(index)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Title</p>
                        {isEditing ? (
                          <input
                            value={project.title}
                            onChange={(e) => updateProject(index, "title", e.target.value)}
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                          />
                        ) : (
                          <p className="text-sm text-slate-700">{project.title || "Not provided"}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Tech Stack</p>
                        {isEditing ? (
                          <input
                            value={(project.techStack || []).join(", ")}
                            onChange={(e) =>
                              updateProject(
                                index,
                                "techStack",
                                e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                              )
                            }
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                          />
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {(project.techStack && project.techStack.length
                              ? project.techStack
                              : ["Not provided"]
                            ).map((tech, techIndex) => (
                              <span
                                key={techIndex}
                                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs font-semibold text-slate-500">Description</p>
                        {isEditing ? (
                          <textarea
                            value={project.description}
                            onChange={(e) => updateProject(index, "description", e.target.value)}
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 min-h-[90px]"
                          />
                        ) : (
                          <p className="text-sm text-slate-700">
                            {project.description || "Not provided"}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs font-semibold text-slate-500">Project Link</p>
                        {isEditing ? (
                          <input
                            value={project.link}
                            onChange={(e) => updateProject(index, "link", e.target.value)}
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                          />
                        ) : project.link ? (
                          <a
                            href={toHref(project.link)}
                            className="text-sm text-indigo-600 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {project.link}
                          </a>
                        ) : (
                          <p className="text-sm text-slate-700">Not provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Certifications</h2>
                {isEditing && (
                  <button
                    onClick={addCertification}
                    className="px-4 py-2 text-sm font-semibold rounded-md bg-slate-950 text-white shadow hover:bg-slate-800"
                  >
                    Add Certification
                  </button>
                )}
              </div>
              {certifications.length === 0 && !isEditing && (
                <p className="text-sm text-slate-600">No certifications added yet.</p>
              )}
              <div className="space-y-4">
                {certifications.map((cert, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        Certification {index + 1}
                      </p>
                      {isEditing && (
                        <button
                          onClick={() => removeCertification(index)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Name</p>
                        {isEditing ? (
                          <input
                            value={cert.name}
                            onChange={(e) => updateCertification(index, "name", e.target.value)}
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                          />
                        ) : (
                          <p className="text-sm text-slate-700">{cert.name || "Not provided"}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Issuer</p>
                        {isEditing ? (
                          <input
                            value={cert.issuer}
                            onChange={(e) => updateCertification(index, "issuer", e.target.value)}
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                          />
                        ) : (
                          <p className="text-sm text-slate-700">{cert.issuer || "Not provided"}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Year</p>
                        {isEditing ? (
                          <input
                            type="number"
                            min="1950"
                            max={new Date().getFullYear()}
                            value={cert.year}
                            onChange={(e) => updateCertification(index, "year", e.target.value)}
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                          />
                        ) : (
                          <p className="text-sm text-slate-700">{cert.year || "Not provided"}</p>
                        )}
                      </div>
                      <div className="md:col-span-3">
                        <p className="text-xs font-semibold text-slate-500">Document</p>
                        {isEditing ? (
                          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <label
                              htmlFor={`certification-document-${index}`}
                              className="inline-flex w-fit cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              {uploadingCertificationIndex === index ? "Uploading..." : "Upload Document"}
                            </label>
                            <input
                              id={`certification-document-${index}`}
                              type="file"
                              accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp,image/svg+xml"
                              className="hidden"
                              disabled={uploadingCertificationIndex === index}
                              onChange={(e) => handleCertificationDocumentUpload(index, e)}
                            />
                            {cert.documentPath ? (
                              <a
                                href={toFileHref(cert.documentPath)}
                                className="text-sm font-medium text-indigo-600 hover:underline"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {cert.documentName || "View uploaded document"}
                              </a>
                            ) : (
                              <span className="text-sm text-slate-500">PDF, DOC, DOCX, or image</span>
                            )}
                          </div>
                        ) : cert.documentPath ? (
                          <a
                            href={toFileHref(cert.documentPath)}
                            className="text-sm font-medium text-indigo-600 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {cert.documentName || "View document"}
                          </a>
                        ) : (
                          <p className="text-sm text-slate-700">Not uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

              </section>
            </div>
          </div>
        </div>
      </main>

    </>
  )
}
