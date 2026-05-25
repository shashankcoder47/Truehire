import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Header from "../../Portal/Header"
import Footer from "../../Portal/Footer"
import { useAuth } from "../../context/AuthContext"
import apiService from "../../utils/api"

export default function UserChatRedirectPage() {
  const router = useRouter()
  const { userId } = router.query
  const numericUserId = useMemo(() => Number.parseInt(userId, 10), [userId])
  const { user, loading } = useAuth()
  const [error, setError] = useState("")

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push("/login")
      return
    }
    if (!Number.isFinite(numericUserId) || numericUserId <= 0) return

    let active = true

    ;(async () => {
      const response = await apiService.request(`/messages/conversation/${numericUserId}`, {
        method: "POST",
        returnErrorObject: true
      })

      if (!active) return

      if (response?.error) {
        setError(response.message || response.error || "Unable to open conversation.")
        return
      }

      router.replace(`/messages/direct/${response.conversationId}`)
    })()

    return () => {
      active = false
    }
  }, [loading, numericUserId, router, user])

  return (
    <>
      <Head>
        <title>Opening Chat - TrueHire</title>
      </Head>
      <Header />
      <main className="min-h-screen bg-slate-50 pt-16">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-600">Opening conversation...</p>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
