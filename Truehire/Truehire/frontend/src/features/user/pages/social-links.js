import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function SocialLinks() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [socialLinks, setSocialLinks] = useState({
    linkedin: '',
    github: '',
    twitter: '',
    portfolio: '',
    behance: '',
    dribbble: '',
    medium: '',
    youtube: '',
    instagram: '',
    facebook: '',
    stackoverflow: '',
    personal: ''
  })
  const [isEditing, setIsEditing] = useState(false)

  const router = useRouter()

  const socialPlatforms = [
    { key: 'linkedin', name: 'LinkedIn', icon: '💼', placeholder: 'https://linkedin.com/in/yourprofile' },
    { key: 'github', name: 'GitHub', icon: '💻', placeholder: 'https://github.com/yourusername' },
    { key: 'twitter', name: 'Twitter', icon: '🐦', placeholder: 'https://twitter.com/yourusername' },
    { key: 'portfolio', name: 'Portfolio', icon: '🌐', placeholder: 'https://yourportfolio.com' },
    { key: 'behance', name: 'Behance', icon: '🎨', placeholder: 'https://behance.net/yourusername' },
    { key: 'dribbble', name: 'Dribbble', icon: '🏀', placeholder: 'https://dribbble.com/yourusername' },
    { key: 'medium', name: 'Medium', icon: '✍️', placeholder: 'https://medium.com/@yourusername' },
    { key: 'youtube', name: 'YouTube', icon: '📺', placeholder: 'https://youtube.com/@yourchannel' },
    { key: 'instagram', name: 'Instagram', icon: '📷', placeholder: 'https://instagram.com/yourusername' },
    { key: 'facebook', name: 'Facebook', icon: '📘', placeholder: 'https://facebook.com/yourusername' },
    { key: 'stackoverflow', name: 'Stack Overflow', icon: '❓', placeholder: 'https://stackoverflow.com/users/yourid/yourusername' },
    { key: 'personal', name: 'Personal Website', icon: '🏠', placeholder: 'https://yourwebsite.com' }
  ]

  useEffect(() => {
    // Check authentication
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    // Fetch user data and social links
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

        // Load social links from localStorage
        const storedSocialLinks = localStorage.getItem('socialLinks')
        if (storedSocialLinks) {
          setSocialLinks(JSON.parse(storedSocialLinks))
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const handleInputChange = (platform, value) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }))
  }

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('socialLinks', JSON.stringify(socialLinks))
    setIsEditing(false)
    // Show success message
    alert('Social links updated successfully!')
  }

  const handleCancel = () => {
    // Reset to saved values
    const storedSocialLinks = localStorage.getItem('socialLinks')
    if (storedSocialLinks) {
      setSocialLinks(JSON.parse(storedSocialLinks))
    }
    setIsEditing(false)
  }

  const validateUrl = (url) => {
    if (!url) return true // Empty is valid
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const getProfileCompletion = () => {
    const filledLinks = Object.values(socialLinks).filter(link => link.trim() !== '').length
    return Math.round((filledLinks / socialPlatforms.length) * 100)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Social Links...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Social Links - TrueHire</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/welcome" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              ← Back to Welcome
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🔗 Social Links
            </h1>
            <p className="text-xl text-gray-600">
              Connect your social media profiles and professional networks
            </p>
          </div>

          {/* Profile Completion */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Profile Completion</h2>
              <span className="text-2xl font-bold text-blue-600">{getProfileCompletion()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProfileCompletion()}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Adding social links helps recruiters learn more about you and can improve your profile visibility.
            </p>
          </div>

          {/* Social Links Form */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Your Social Profiles</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-primary"
                  >
                    Edit Links
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancel}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="btn btn-primary"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {socialPlatforms.map((platform) => (
                  <div key={platform.key} className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <span className="text-lg mr-2">{platform.icon}</span>
                      {platform.name}
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={socialLinks[platform.key]}
                        onChange={(e) => handleInputChange(platform.key, e.target.value)}
                        placeholder={platform.placeholder}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          socialLinks[platform.key] && !validateUrl(socialLinks[platform.key])
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300'
                        }`}
                      />
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className={`flex-1 ${socialLinks[platform.key] ? 'text-gray-900' : 'text-gray-400'}`}>
                          {socialLinks[platform.key] || 'Not connected'}
                        </span>
                        {socialLinks[platform.key] && (
                          <a
                            href={socialLinks[platform.key]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 ml-2"
                          >
                            🔗
                          </a>
                        )}
                      </div>
                    )}
                    {isEditing && socialLinks[platform.key] && !validateUrl(socialLinks[platform.key]) && (
                      <p className="text-sm text-red-600">Please enter a valid URL</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Add Social Links?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-4">👁️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Increase Visibility</h3>
                <p className="text-gray-600">Showcase your work and personality beyond your resume</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Connections</h3>
                <p className="text-gray-600">Connect with recruiters and industry professionals</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Stand Out</h3>
                <p className="text-gray-600">Differentiate yourself from other candidates</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Targeted Opportunities</h3>
                <p className="text-gray-600">Get noticed by recruiters in your field</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">💼</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Branding</h3>
                <p className="text-gray-600">Build a strong online professional presence</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics & Insights</h3>
                <p className="text-gray-600">Track profile views and engagement</p>
              </div>
            </div>
          </div>

          {/* Popular Platforms */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Platforms for Your Industry</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">💻 Tech & Development</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>GitHub:</strong> Showcase your code and projects</li>
                  <li>• <strong>LinkedIn:</strong> Professional networking</li>
                  <li>• <strong>Stack Overflow:</strong> Technical Q&A and reputation</li>
                  <li>• <strong>Medium:</strong> Share technical articles and insights</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🎨 Design & Creative</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Behance:</strong> Portfolio showcase</li>
                  <li>• <strong>Dribbble:</strong> Design inspiration and work</li>
                  <li>• <strong>LinkedIn:</strong> Professional networking</li>
                  <li>• <strong>Instagram:</strong> Visual storytelling</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📈 Business & Marketing</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>LinkedIn:</strong> Professional networking</li>
                  <li>• <strong>Twitter:</strong> Industry insights and trends</li>
                  <li>• <strong>Medium:</strong> Thought leadership content</li>
                  <li>• <strong>YouTube:</strong> Educational content and tutorials</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🔬 Research & Academia</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>LinkedIn:</strong> Professional networking</li>
                  <li>• <strong>Google Scholar:</strong> Academic publications</li>
                  <li>• <strong>ResearchGate:</strong> Research collaboration</li>
                  <li>• <strong>Medium:</strong> Share research insights</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white mt-8">
            <h2 className="text-2xl font-bold mb-4">💡 Pro Tips for Social Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Optimize Your Profiles</h3>
                <ul className="space-y-1 text-blue-100">
                  <li>• Use professional profile pictures</li>
                  <li>• Write compelling bios and summaries</li>
                  <li>• Keep content updated and relevant</li>
                  <li>• Engage with your network regularly</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Privacy & Security</h3>
                <ul className="space-y-1 text-blue-100">
                  <li>• Review privacy settings regularly</li>
                  <li>• Be mindful of what you share publicly</li>
                  <li>• Use professional email addresses</li>
                  <li>• Connect with relevant industry contacts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}



