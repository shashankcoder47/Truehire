import apiService from '../utils/api'

export const login = (payload) => apiService.login(payload)
export const register = (payload) => apiService.request('/auth/register', {
  method: 'POST',
  body: JSON.stringify(payload),
  returnErrorObject: true,
})
export const getCurrentUser = () => apiService.getCurrentUser()
export const logout = () => apiService.logout()

export const getDashboardPath = (role) => {
  const normalizedRole = String(role || '').trim().toLowerCase().replace(/_/g, '-')
  if (normalizedRole === 'recruiter' || normalizedRole === 'sub-recruiter') return '/recruiter/dashboard'
  if (normalizedRole === 'admin' || normalizedRole === 'super-admin') return '/admin/dashboard'
  return '/user/dashboard'
}
