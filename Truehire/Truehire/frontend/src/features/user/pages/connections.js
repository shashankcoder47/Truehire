import { useEffect, useMemo, useState } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'
import { useAuth } from '../../../context/AuthContext'
import apiService from '../../../services/api'
import FriendSuggestions from '../../../components/FriendSuggestions'

export default function ConnectionsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [pendingRequests, setPendingRequests] = useState([])
  const [connections, setConnections] = useState([])
  const [users, setUsers] = useState([])
  const [statusMap, setStatusMap] = useState({})
  const [conversationMeta, setConversationMeta] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [pageLoading, setPageLoading] = useState(true)

  const loadData = async () => {
    setPageLoading(true)
    try {
      const [pendingRes, myRes, usersRes] = await Promise.all([
        apiService.getPendingConnectionRequests(),
        apiService.getMyConnections(),
        apiService.getFriendSuggestions(20)
      ])

      const pendingData = Array.isArray(pendingRes?.data) ? pendingRes.data : []
      const myConnections = Array.isArray(myRes?.data) ? myRes.data : []
      const allUsers = Array.isArray(usersRes?.suggestions) ? usersRes.suggestions : []

      setPendingRequests(pendingData)
      setConnections(myConnections)
      setUsers(allUsers)

      setConversationMeta({})

      const statuses = {}
      await Promise.all(
        allUsers.map(async (item) => {
          const res = await apiService.getConnectionStatus(item.id)
          statuses[item.id] = res?.data?.status || "none"
        })
      )
      setStatusMap(statuses)
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => {
    if (loading) return
    if (!user) {
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      return
    }
    loadData()
  }, [loading, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async (receiverId) => {
    setBusyId(`connect-${receiverId}`)
    try {
      const result = await apiService.sendConnectionRequest(receiverId)
      if (result?.error) {
        alert(result.error || "Failed to send request.")
        return
      }
      await loadData()
    } finally {
      setBusyId(null)
    }
  }

  const handleAction = async (requestId, action) => {
    setBusyId(`request-${requestId}`)
    try {
      const result =
        action === "accept"
          ? await apiService.acceptConnectionRequest(requestId)
          : await apiService.rejectConnectionRequest(requestId)

      if (result?.error) {
        alert(result.error || "Failed to update request.")
        return
      }

      await loadData()
    } finally {
      setBusyId(null)
    }
  }

  const networkRows = useMemo(() => {
    const rows = []

    pendingRequests.forEach((request) => {
      rows.push({
        key: `incoming-${request.id}`,
        id: request.sender_id,
        name: request.sender_name || `User #${request.sender_id}`,
        email: request.sender_email || "No email",
        status: "pending_incoming",
        requestId: request.id
      })
    })

    connections.forEach((item) => {
      const meta = conversationMeta[item.user_id] || {}
      rows.push({
        key: `connected-${item.id}`,
        id: item.user_id,
        name: item.name || `User #${item.user_id}`,
        email: item.email || "No email",
        status: "connected",
        unreadCount: Number(meta.unreadCount || 0),
        lastMessage: meta.lastMessage || ""
      })
    })

    users.forEach((item) => {
      const status = statusMap[item.id] || "none"
      const alreadyShown = rows.some((row) => Number(row.id) === Number(item.id))
      if (!alreadyShown) {
        rows.push({
          key: `discover-${item.id}`,
          id: item.id,
          name: item.name || `User #${item.id}`,
          email: item.email || "No email",
          status
        })
      }
    })

    return rows
  }, [connections, conversationMeta, pendingRequests, statusMap, users])

  const renderRightAction = (row) => {
    if (row.status === "connected") {
      return (
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
            Connected
          </span>
          {row.unreadCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-semibold">
              {row.unreadCount}
            </span>
          )}
          <button
            onClick={() => router.push(`/chat/${row.id}`)}
            className="px-6 py-2 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700"
          >
            Message
          </button>
        </div>
      )
    }

    if (row.status === "pending_incoming") {
      return (
        <div className="flex items-center gap-2">
          <button
            disabled={busyId === `request-${row.requestId}`}
            onClick={() => handleAction(row.requestId, "accept")}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-60"
          >
            Accept
          </button>
          <button
            disabled={busyId === `request-${row.requestId}`}
            onClick={() => handleAction(row.requestId, "reject")}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      )
    }

    if (row.status === "pending_outgoing") {
      return (
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold">
          Pending
        </span>
      )
    }

    return (
      <button
        disabled={busyId === `connect-${row.id}`}
        onClick={() => handleConnect(row.id)}
        className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
      >
        Connect
      </button>
    )
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-700">Loading connections...</p>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Connections - TrueHire</title>
      </Head>
      <Header />
      <main className="min-h-screen bg-slate-100 pt-20">
        <div className="max-w-5xl mx-auto px-4 pb-12 space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white px-8 py-10">
            <h1 className="text-3xl font-bold text-slate-900">User Network</h1>
            <p className="text-slate-500 mt-3 text-lg">Connect with other users.</p>
          </section>

          <FriendSuggestions limit={10} />

          {networkRows.map((row) => (
            <section
              key={row.key}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-2xl font-semibold text-slate-900">{row.name}</p>
                <p className="text-slate-600 mt-2 text-lg">{row.email}</p>
                {row.status === "connected" && row.lastMessage && (
                  <p className="text-slate-500 mt-2 text-sm">Last message: {row.lastMessage}</p>
                )}
              </div>
              {renderRightAction(row)}
            </section>
          ))}

          {networkRows.length === 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white px-8 py-10 text-slate-600 text-lg">
              Your network will appear here once users are available.
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}




