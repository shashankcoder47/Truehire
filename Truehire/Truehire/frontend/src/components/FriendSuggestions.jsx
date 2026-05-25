import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import apiService from '../services/api'

const getInitials = (name = '') =>
  name
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'

export default function FriendSuggestions({ limit = 10, className = '' }) {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadSuggestions = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await apiService.getFriendSuggestions(limit)
        if (active) setSuggestions(Array.isArray(response?.suggestions) ? response.suggestions : [])
      } catch (loadError) {
        if (active) setError(loadError?.message || 'Unable to load friend suggestions.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSuggestions()
    return () => {
      active = false
    }
  }, [limit])

  const handleAddFriend = async (receiverId) => {
    setBusyId(receiverId)
    setError('')
    try {
      await apiService.sendFriendRequest(receiverId)
      setSuggestions((current) => current.filter((user) => String(user.id) !== String(receiverId)))
    } catch (requestError) {
      setError(requestError?.message || 'Unable to send friend request.')
    } finally {
      setBusyId(null)
    }
  }

  const handleDismiss = (userId) => {
    setSuggestions((current) => current.filter((user) => String(user.id) !== String(userId)))
  }

  const openUserProfile = (userId) => {
    router.push(`/users/${userId}`)
  }

  return (
    <section className={`w-fit max-w-full self-center text-slate-950 ${className}`}>
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Network</p>
        <h2 className="mt-0.5 text-sm font-bold text-slate-950">Friend Suggestions</h2>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex gap-2.5 overflow-hidden">
          {[0, 1, 2].map((item) => (
            <div key={item} className="min-w-[138px] animate-pulse rounded-[18px] border border-slate-200 bg-slate-50 p-2.5">
              <div className="mx-auto h-16 w-16 rounded-full bg-slate-200" />
              <div className="mt-3 space-y-1.5">
                <div className="mx-auto h-2.5 w-16 rounded bg-slate-200" />
                <div className="mx-auto h-2.5 w-20 rounded bg-slate-100" />
              </div>
              <div className="mt-3 h-8 rounded-lg bg-slate-200" />
            </div>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
          No friend suggestions available
        </p>
      ) : (
        <div className="friend-suggestions-track -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {suggestions.map((user) => (
            <article
              key={user.id}
              role="button"
              tabIndex={0}
              onClick={() => openUserProfile(user.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openUserProfile(user.id)
                }
              }}
              className="relative flex min-w-[138px] flex-col rounded-[18px] border border-slate-200 bg-white p-2.5 shadow-sm transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  handleDismiss(user.id)
                }}
                aria-label={`Dismiss ${user.name}`}
                className="absolute right-2.5 top-1.5 text-sm leading-none text-slate-400 transition hover:text-slate-700"
              >
                ×
              </button>

              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="mx-auto mt-2.5 h-16 w-16 rounded-full object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="mx-auto mt-2.5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-700 ring-1 ring-slate-200">
                  {getInitials(user.name)}
                </div>
              )}

              <div className="mt-3 min-w-0 text-center">
                <p className="truncate text-xs font-semibold text-slate-950">{user.name}</p>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                  {[user.desiredJobRole, user.currentLocation].filter(Boolean).join(' • ') || 'Suggested for you'}
                </p>
              </div>

              <button
                type="button"
                disabled={busyId === user.id}
                onClick={(event) => {
                  event.stopPropagation()
                  handleAddFriend(user.id)
                }}
                className="mt-3 rounded-lg bg-[#4f63f6] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#6073ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyId === user.id ? 'Requested' : 'Add Friend'}
              </button>
            </article>
          ))}
        </div>
      )}
      <style jsx>{`
        .friend-suggestions-track {
          animation: suggestionSlide 6s ease-in-out infinite alternate;
        }

        @keyframes suggestionSlide {
          0%,
          15% {
            transform: translateX(0);
          }

          85%,
          100% {
            transform: translateX(-18px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .friend-suggestions-track {
            animation: none;
          }
        }
      `}</style>
    </section>
  )
}
