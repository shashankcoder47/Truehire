import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import { useAuth } from '../../../context/AuthContext'
import apiService from '../../../services/api'

const defaultSettings = {
  email_notifications: true,
  job_alerts: true,
  last_login_at: null,
  last_login_device: null,
  loginType: null,
  password: null
}

export default function Settings() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState(defaultSettings)
  const [savingKey, setSavingKey] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(null)
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
  const isGoogleOnly = settings.loginType === "google" && settings.password === null

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
    if (user) {
      setIsLoading(false)
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return
      const response = await apiService.request("/users/settings", { returnErrorObject: true })
      if (response?.error) {
        setSaveError(response.error)
        return
      }
      if (response?.settings) {
        setSettings((prev) => ({ ...prev, ...response.settings }))
      }
    }
    loadSettings()
  }, [user])

  const lastLoginLabel = useMemo(() => {
    if (!settings.last_login_at) return "Not available"
    const date = new Date(settings.last_login_at)
    if (Number.isNaN(date.getTime())) return "Not available"
    const dateLabel = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
    const timeLabel = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    })
    return `${dateLabel} • ${timeLabel}`
  }, [settings.last_login_at])

  const handleToggle = async (key) => {
    const nextValue = !settings[key]
    const previousValue = settings[key]
    setSettings((prev) => ({ ...prev, [key]: nextValue }))
    setSavingKey(key)
    setSaveError(null)
    setSaveSuccess(null)

    const response = await apiService.request("/users/settings", {
      method: "PUT",
      body: JSON.stringify({ [key]: nextValue }),
      returnErrorObject: true
    })

    if (response?.error) {
      setSettings((prev) => ({ ...prev, [key]: previousValue }))
      setSaveError(response.error)
    } else {
      setSettings((prev) => ({ ...prev, ...(response.settings || {}) }))
      setSaveSuccess(key === "job_alerts" ? "Weekly job alert preference updated." : "Notification preference updated.")
    }
    setSavingKey(null)
  }

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
        setPasswordError("All password fields are required.")
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
    const response = await apiService.request("/users/settings/password", {
      method: "PUT",
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#11172a] to-[#151c38] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Head>
        <title>Settings | TrueHire</title>
      </Head>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#020617] via-[#11172a] to-[#151c38] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-6rem] top-[-6rem] h-72 w-72 rounded-full bg-indigo-500/30 blur-[120px]" />
          <div className="absolute right-[-8rem] top-[-2rem] h-64 w-64 rounded-full bg-cyan-500/30 blur-[110px]" />
          <div className="absolute inset-x-0 bottom-[-10rem] h-64 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_25px_80px_rgba(2,6,23,0.65)] backdrop-blur-3xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Settings</p>
                <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Account preferences</h1>
                <p className="mt-3 text-sm text-slate-300">
                  Keep your account secure and control the alerts you receive.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/overview")}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Back to Overview
              </button>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_45px_rgba(2,6,23,0.55)] backdrop-blur-3xl">
              <h2 className="text-xl font-semibold text-white">Account Security</h2>
              <p className="mt-2 text-sm text-slate-300">Update your password and review login activity.</p>
              {isGoogleOnly && (
                <p className="mt-3 text-sm text-cyan-200">
                  You’re using Google login. Create a password to enable email login.
                </p>
              )}

              <form className="mt-6 space-y-4" onSubmit={handlePasswordChange}>
                {!isGoogleOnly && (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current password</label>
                    <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 focus-within:border-blue-400">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                        className="w-full bg-transparent text-sm text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                        className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
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
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">New password</label>
                  <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 focus-within:border-blue-400">
                    <input
                      type={showPasswords.next ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                      className="w-full bg-transparent text-sm text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, next: !prev.next }))}
                      className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
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
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Confirm password</label>
                  <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 focus-within:border-blue-400">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                      className="w-full bg-transparent text-sm text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                      className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
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
                  <p className="text-sm text-red-300">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-sm text-emerald-300">{passwordSuccess}</p>
                )}
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(79,70,229,0.35)] transition hover:from-indigo-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {passwordSaving ? "Saving..." : isGoogleOnly ? "Create Password" : "Change Password"}
                </button>
              </form>

              <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Last login</p>
                <p className="mt-2 text-sm text-white">{lastLoginLabel}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {settings.last_login_device || "Device information unavailable"}
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_45px_rgba(2,6,23,0.55)] backdrop-blur-3xl">
              <h2 className="text-xl font-semibold text-white">Notification Settings</h2>
              <p className="mt-2 text-sm text-slate-300">Control the alerts you receive.</p>
              <div className="mt-6 space-y-5 text-sm text-slate-200">
                <ToggleRow
                  label="Email notifications"
                  description="Application updates and important activity."
                  checked={settings.email_notifications}
                  disabled={savingKey === "email_notifications"}
                  onChange={() => handleToggle("email_notifications")}
                />
                <ToggleRow
                  label="Enable Weekly Job Alerts"
                  description="Receive active jobs that match your skills every Sunday."
                  checked={settings.job_alerts}
                  disabled={savingKey === "job_alerts"}
                  onChange={() => handleToggle("job_alerts")}
                />
                {saveSuccess && (
                  <p className="text-xs text-emerald-300">{saveSuccess}</p>
                )}
                {saveError && (
                  <p className="text-xs text-red-300">Unable to save settings: {saveError}</p>
                )}
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  )
}

function ToggleRow({ label, description, checked, disabled, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
          checked
            ? "border-cyan-400/60 bg-cyan-500/30"
            : "border-white/10 bg-slate-900/60"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        aria-pressed={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  )
}



