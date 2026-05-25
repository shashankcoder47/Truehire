import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import apiService from "../../utils/api"

const defaultSettings = {
  loginType: null,
  password: null
}

export default function RecruiterSettings() {
  const router = useRouter()
  const [recruiterUser, setRecruiterUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState(defaultSettings)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false
  })
  const [passwordError, setPasswordError] = useState(null)
  const [passwordSuccess, setPasswordSuccess] = useState(null)
  const [passwordSaving, setPasswordSaving] = useState(false)

  const isRecruiterRole = recruiterUser?.role === "recruiter" || recruiterUser?.role === "sub-recruiter"
  const isGoogleOnly = settings.loginType === "google" && settings.password === null

  useEffect(() => {
    if (typeof window === "undefined") return
    const token = apiService.getToken()
    const parsedUser = apiService.getUserData()
    if (!token || !parsedUser) {
      router.push("/login")
      return
    }
    try {
      if (parsedUser.role !== "recruiter" && parsedUser.role !== "sub-recruiter") {
        router.push("/login")
        return
      }
      setRecruiterUser(parsedUser)
      setIsLoading(false)
    } catch (error) {
      router.push("/login")
    }
  }, [router])

  useEffect(() => {
    const loadSettings = async () => {
      if (!recruiterUser || !isRecruiterRole) return
      const response = await apiService.request("/recruiters/settings", { returnErrorObject: true })
      if (response?.error) {
        setPasswordError(response.error)
        return
      }
      const nextSettings = response?.settings || response?.data
      if (nextSettings && typeof nextSettings === "object") {
        setSettings((prev) => ({ ...prev, ...nextSettings }))
      }
    }
    loadSettings()
  }, [recruiterUser, isRecruiterRole])

  const headerLabel = useMemo(
    () => (isGoogleOnly ? "Create password" : "Change password"),
    [isGoogleOnly]
  )

  const handlePasswordChange = async (event) => {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (isGoogleOnly) {
      if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
        setPasswordError("New password and confirmation are required.")
        return
      }
      if (passwordForm.newPassword.length < 8) {
        setPasswordError("New password must be at least 8 characters.")
        return
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError("New password and confirmation do not match.")
        return
      }
    } else {
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        setPasswordError("Current, new, and confirmation passwords are required.")
        return
      }
      if (passwordForm.newPassword.length < 8) {
        setPasswordError("New password must be at least 8 characters.")
        return
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError("New password and confirmation do not match.")
        return
      }
      if (passwordForm.currentPassword === passwordForm.newPassword) {
        setPasswordError("New password must be different from current password.")
        return
      }
    }

    setPasswordSaving(true)
    const response = await apiService.request("/recruiters/change-password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword: isGoogleOnly ? undefined : passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      }),
      returnErrorObject: true
    })
    setPasswordSaving(false)

    if (response?.error) {
      setPasswordError(response.error)
      return
    }

    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    if (isGoogleOnly) {
      setSettings((prev) => ({
        ...prev,
        loginType: "google+password",
        password: true
      }))
    }
    setPasswordSuccess("Password updated successfully.")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-[#F3F4FF] to-[#EEF2FF] text-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!recruiterUser || !isRecruiterRole) {
    return null
  }

  return (
    <>
      <Head>
        <title>Recruiter Settings | TrueHire</title>
      </Head>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#F9FAFB] via-[#F3F4FF] to-[#EEF2FF] text-slate-900">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-6rem] top-[-6rem] h-72 w-72 rounded-full bg-indigo-200/70 blur-[120px]" />
          <div className="absolute right-[-8rem] top-[-2rem] h-64 w-64 rounded-full bg-sky-200/70 blur-[110px]" />
          <div className="absolute inset-x-0 bottom-[-10rem] h-64 bg-gradient-to-t from-[#EEF2FF] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
          <section className="rounded-[32px] border border-slate-200/70 bg-white/90 p-8 shadow-[0_25px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Recruiter</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Account settings</h1>
                <p className="mt-3 text-sm text-slate-600">
                  Manage your recruiter login and security preferences.
                </p>
              </div>
              <button
                type="button"
                data-testid="back-dashboard-btn"
                onClick={() => router.push("/recruiter-dashboard")}
                className="inline-flex items-center justify-center rounded-full border border-slate-200/70 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Back to Dashboard
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.3)] backdrop-blur">
            <h2 className="text-xl font-semibold text-slate-900">Account Security</h2>
            <p className="mt-2 text-sm text-slate-600">Update your password for recruiter access.</p>
            {isGoogleOnly && (
              <p className="mt-3 text-sm text-indigo-600">
                You're using Google login. Create a password to enable email login.
              </p>
            )}

            <form className="mt-6 space-y-4" onSubmit={handlePasswordChange}>
              <div>
                <label htmlFor="currentPassword" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Current Password
                </label>
                <div className="mt-2 flex items-center rounded-2xl border border-slate-200/70 bg-white px-4 py-2 focus-within:border-indigo-400">
                  <input
                    id="currentPassword"
                    data-testid="current-password"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                    className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    data-testid="current-password-toggle"
                    onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                    className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
                    aria-label={showPasswords.current ? "Hide current password" : "Show current password"}
                  >
                    {showPasswords.current ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M3 3l18 18M10.477 10.48a3 3 0 014.24 4.24"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M9.88 5.09A10.94 10.94 0 0112 5c5.5 0 9.5 4.5 9.5 7-.52 1.07-1.25 2.17-2.14 3.18M6.33 6.33C4.05 8.03 2.5 10.24 2.5 12c0 2.5 4 7 9.5 7 1.15 0 2.25-.2 3.27-.54"
                        />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M2.5 12s4-7 9.5-7 9.5 7 9.5 7-4 7-9.5 7-9.5-7-9.5-7z"
                        />
                        <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
                      </svg>
                    )}
                  </button>
                </div>
                {isGoogleOnly && (
                  <p className="mt-2 text-xs text-slate-500">Current password is optional for Google-only recruiter accounts.</p>
                )}
              </div>
              <div>
                <label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  New Password
                </label>
                <div className="mt-2 flex items-center rounded-2xl border border-slate-200/70 bg-white px-4 py-2 focus-within:border-indigo-400">
                  <input
                    id="newPassword"
                    data-testid="new-password"
                    type={showPasswords.next ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                    className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    data-testid="new-password-toggle"
                    onClick={() => setShowPasswords((prev) => ({ ...prev, next: !prev.next }))}
                    className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
                    aria-label={showPasswords.next ? "Hide new password" : "Show new password"}
                  >
                    {showPasswords.next ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M3 3l18 18M10.477 10.48a3 3 0 014.24 4.24"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M9.88 5.09A10.94 10.94 0 0112 5c5.5 0 9.5 4.5 9.5 7-.52 1.07-1.25 2.17-2.14 3.18M6.33 6.33C4.05 8.03 2.5 10.24 2.5 12c0 2.5 4 7 9.5 7 1.15 0 2.25-.2 3.27-.54"
                        />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M2.5 12s4-7 9.5-7 9.5 7 9.5 7-4 7-9.5 7-9.5-7-9.5-7z"
                        />
                        <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Confirm Password
                </label>
                <div className="mt-2 flex items-center rounded-2xl border border-slate-200/70 bg-white px-4 py-2 focus-within:border-indigo-400">
                  <input
                    id="confirmPassword"
                    data-testid="confirm-password"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    data-testid="confirm-password-toggle"
                    onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                    className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
                    aria-label={showPasswords.confirm ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showPasswords.confirm ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M3 3l18 18M10.477 10.48a3 3 0 014.24 4.24"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M9.88 5.09A10.94 10.94 0 0112 5c5.5 0 9.5 4.5 9.5 7-.52 1.07-1.25 2.17-2.14 3.18M6.33 6.33C4.05 8.03 2.5 10.24 2.5 12c0 2.5 4 7 9.5 7 1.15 0 2.25-.2 3.27-.54"
                        />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M2.5 12s4-7 9.5-7 9.5 7 9.5 7-4 7-9.5 7-9.5-7-9.5-7z"
                        />
                        <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-sm text-emerald-600">{passwordSuccess}</p>
              )}
              <button
                type="submit"
                data-testid="change-password-btn"
                disabled={passwordSaving}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(79,70,229,0.28)] transition hover:from-indigo-600 hover:to-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordSaving ? "Saving..." : headerLabel}
              </button>
            </form>
          </section>
        </div>
      </div>
    </>
  )
}





