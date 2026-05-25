import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function Notifications() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [settings, setSettings] = useState({
    jobAlerts: true,
    applicationUpdates: true,
    recruiterMessages: true,
    profileViews: false,
    weeklyDigest: true,
    marketingEmails: false,
    securityAlerts: true,
    systemUpdates: false
  })

  const router = useRouter()

  // Mock notifications data
  const mockNotifications = [
    {
      id: 1,
      type: 'job_alert',
      title: 'New Job Match Found',
      message: 'A new Senior Developer position at TechCorp matches your profile',
      timestamp: '2024-01-15T10:30:00Z',
      read: false,
      actionUrl: '/jobs/123'
    },
    {
      id: 2,
      type: 'application_update',
      title: 'Application Status Update',
      message: 'Your application for Product Manager at InnovateLabs has been viewed',
      timestamp: '2024-01-14T14:20:00Z',
      read: false,
      actionUrl: '/application-tracker'
    },
    {
      id: 3,
      type: 'recruiter_message',
      title: 'New Message from Recruiter',
      message: 'Sarah Johnson from DataFlow sent you a message',
      timestamp: '2024-01-13T09:15:00Z',
      read: true,
      actionUrl: '/recruiter-chats'
    },
    {
      id: 4,
      type: 'profile_view',
      title: 'Profile Viewed',
      message: 'Your profile was viewed by 3 recruiters this week',
      timestamp: '2024-01-12T16:45:00Z',
      read: true,
      actionUrl: '/profile'
    },
    {
      id: 5,
      type: 'system',
      title: 'Weekly Job Search Digest',
      message: '12 new jobs matching your criteria, 3 applications updated',
      timestamp: '2024-01-10T08:00:00Z',
      read: true,
      actionUrl: '/jobs'
    }
  ]

  useEffect(() => {
    // Check authentication
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const storedUserData = localStorage.getItem('userData')
        if (storedUserData) {
          const userData = JSON.parse(storedUserData)
          setUser(userData)
        } else {
          setUser({
            name: 'Professional User',
            email: 'user@example.com',
            role: 'Job Seeker'
          })
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()

    // Load notifications
    setNotifications(mockNotifications)
  }, [router])

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }))
  }

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job_alert': return '🔔'
      case 'application_update': return '📋'
      case 'recruiter_message': return '💬'
      case 'profile_view': return '👁️'
      case 'system': return 'ℹ️'
      default: return '📢'
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Notifications - TrueHire</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/welcome" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              ← Back to Welcome
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🔔 Notifications
            </h1>
            <p className="text-xl text-gray-600">
              Manage your notification preferences and stay updated
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Notifications List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">
                      Recent Notifications
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-sm px-2 py-1 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </h2>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-6 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {notification.title}
                              </h3>
                              <p className="text-gray-700 mb-2">{notification.message}</p>
                              <p className="text-sm text-gray-500">{formatTimestamp(notification.timestamp)}</p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  Mark read
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          {notification.actionUrl && (
                            <div className="mt-3">
                              <Link
                                href={notification.actionUrl}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                View Details →
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {notifications.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications</h3>
                    <p className="text-gray-600">You're all caught up! Check back later for updates.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Settings Panel */}
            <div className="space-y-6">
              {/* Notification Preferences */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Search & Applications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.jobAlerts}
                          onChange={(e) => handleSettingChange('jobAlerts', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">Job alerts and matches</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.applicationUpdates}
                          onChange={(e) => handleSettingChange('applicationUpdates', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">Application status updates</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.recruiterMessages}
                          onChange={(e) => handleSettingChange('recruiterMessages', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">Recruiter messages</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Profile & Activity</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.profileViews}
                          onChange={(e) => handleSettingChange('profileViews', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">Profile view notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.weeklyDigest}
                          onChange={(e) => handleSettingChange('weeklyDigest', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">Weekly activity digest</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">System & Marketing</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.securityAlerts}
                          onChange={(e) => handleSettingChange('securityAlerts', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">Security alerts</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.systemUpdates}
                          onChange={(e) => handleSettingChange('systemUpdates', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">System updates and maintenance</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.marketingEmails}
                          onChange={(e) => handleSettingChange('marketingEmails', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">Marketing emails and newsletters</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button className="w-full btn btn-primary">
                    Save Preferences
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">This Week</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Job alerts received</span>
                    <span className="font-semibold text-gray-900">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Applications updated</span>
                    <span className="font-semibold text-gray-900">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Recruiter messages</span>
                    <span className="font-semibold text-gray-900">5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Profile views</span>
                    <span className="font-semibold text-gray-900">28</span>
                  </div>
                </div>
              </div>

              {/* Notification Types Guide */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Types</h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🔔</span>
                    <div>
                      <div className="font-medium text-gray-900">Job Alerts</div>
                      <div className="text-sm text-gray-600">New job matches and opportunities</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">📋</span>
                    <div>
                      <div className="font-medium text-gray-900">Application Updates</div>
                      <div className="text-sm text-gray-600">Status changes on your applications</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">💬</span>
                    <div>
                      <div className="font-medium text-gray-900">Recruiter Messages</div>
                      <div className="text-sm text-gray-600">Direct communication from recruiters</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">ℹ️</span>
                    <div>
                      <div className="font-medium text-gray-900">System Updates</div>
                      <div className="text-sm text-gray-600">Platform news and maintenance</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}



