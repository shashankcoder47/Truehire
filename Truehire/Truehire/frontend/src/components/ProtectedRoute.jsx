import { useEffect } from 'react'
import { useRouter } from 'next/router'
import apiService from '../utils/api'
import { getDashboardPath } from '../services/authService'

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const router = useRouter()
  const normalizedAllowed = allowedRoles.map((role) => String(role).toLowerCase().replace(/_/g, '-'))
  const role = String(apiService.getRole() || apiService.getUserData()?.role || '').toLowerCase().replace(/_/g, '-')
  const token = apiService.getToken()

  useEffect(() => {
    if (!router.isReady) return

    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(router.asPath || '/')}`)
      return
    }

    if (normalizedAllowed.length && !normalizedAllowed.includes(role)) {
      router.replace(getDashboardPath(role))
    }
  }, [normalizedAllowed, role, router, token])

  if (!token || (normalizedAllowed.length && !normalizedAllowed.includes(role))) {
    return null
  }

  return children
}
