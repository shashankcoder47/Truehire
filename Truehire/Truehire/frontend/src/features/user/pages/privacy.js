import Head from 'next/head'
import { useEffect, useState } from 'react'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

const PRIVACY_CONTACT_STORAGE_KEY = 'truehire_privacy_contact'

const defaultContactInfo = {
  email: 'support@truehire.com'
}

export default function Privacy() {
  const [contactInfo, setContactInfo] = useState(defaultContactInfo)
  const [draftContactInfo, setDraftContactInfo] = useState(defaultContactInfo)
  const [isEditing, setIsEditing] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(PRIVACY_CONTACT_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const merged = { ...defaultContactInfo, ...parsed }
        setContactInfo(merged)
        setDraftContactInfo(merged)
      }
    } catch (error) {
      console.error('Failed to load privacy contact info:', error)
    }
  }, [])

  const handleSave = () => {
    if (typeof window === 'undefined') return

    localStorage.setItem(PRIVACY_CONTACT_STORAGE_KEY, JSON.stringify(draftContactInfo))
    setContactInfo(draftContactInfo)
    setIsEditing(false)
    setSaveMessage('Contact information saved successfully.')
  }

  const handleCancel = () => {
    setDraftContactInfo(contactInfo)
    setIsEditing(false)
    setSaveMessage('')
  }

  const sections = [
    {
      title: '1. Introduction',
      content:
        'At TRUEHIRE, we value your privacy and are committed to protecting your personal information.'
    },
    {
      title: '2. Information We Collect',
      items: [
        'Name',
        'Email address',
        'Phone number',
        'Resume / CV',
        'Profile details such as skills and experience',
        'Login data'
      ]
    },
    {
      title: '3. How We Use Information',
      items: [
        'To create and manage user accounts',
        'To allow job applications',
        'To connect job seekers with recruiters',
        'To improve our platform',
        'To send notifications such as job alerts and updates'
      ]
    },
    {
      title: '4. Information Sharing',
      content:
        'Information may be shared with recruiters when a user applies for a job and only when necessary for platform services or legal requirements. We do not sell your personal information to third parties.'
    },
    {
      title: '5. Data Security',
      content:
        'We use appropriate security measures to protect user data.'
    },
    {
      title: '6. User Rights',
      items: ['Update profile', 'Delete account', 'Change password']
    },
    {
      title: '7. Cookies',
      content:
        'We use cookies to improve user experience.'
    },
    {
      title: '8. Third-Party Services',
      items: ['Analytics tools', 'Payment gateways']
    },
    {
      title: '9. Updates to Policy',
      content:
        'We may update this Privacy Policy from time to time.'
    }
  ]

  return (
    <>
      <Head>
        <title>Privacy Policy - TrueHire</title>
        <meta
          name="description"
          content="Read the TrueHire privacy policy to understand what information we collect, how we use it, and how we protect user data."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50">
        <section className="gradient-bg py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Privacy <span className="text-gradient">Policy</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Understand how TRUEHIRE collects, uses, shares, and protects user information.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-white p-8 md:p-10 shadow-sm">
              <p className="text-sm font-medium text-gray-500 mb-8">Last updated: April 16, 2026</p>

              <div className="space-y-8">
                {sections.map((section) => (
                  <section key={section.title}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
                    {section.content && <p className="text-gray-700 leading-8">{section.content}</p>}
                    {section.items && (
                      <div className="space-y-3">
                        {section.items.map((item) => (
                          <div key={item} className="rounded-2xl bg-gray-50 px-4 py-3 text-gray-700">
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                ))}

                <section>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">10. Contact Information</h2>
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDraftContactInfo(contactInfo)
                          setIsEditing(true)
                          setSaveMessage('')
                        }}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSave}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>

                  {saveMessage && (
                    <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                      {saveMessage}
                    </div>
                  )}

                  <div className="rounded-2xl bg-gray-50 p-6">
                    <p className="text-sm font-semibold text-gray-500 mb-2">Support Email</p>
                    {isEditing ? (
                      <input
                        type="email"
                        value={draftContactInfo.email}
                        onChange={(e) => setDraftContactInfo({ ...draftContactInfo, email: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">{contactInfo.email}</p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
