import Head from 'next/head'
import { useEffect, useState } from 'react'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

const COOKIE_CONTACT_STORAGE_KEY = 'truehire_cookie_contact'

const whyTrueHireUsesCookies = [
  'Secure user authentication and session management',
  'Saving job searches and user preferences',
  'Delivering personalized job recommendations',
  'Monitoring platform performance and usage patterns',
  'Enhancing security and preventing fraudulent activity',
]

const essentialCookies = [
  'Login and account access',
  'Session management',
  'Security features',
]

const functionalCookies = [
  'Location',
  'Language',
  'Recently viewed jobs',
]

const analyticsCookies = [
  'Pages visited',
  'Time spent on the platform',
  'Error reports',
]

const personalizationCookies = [
  'Recommend relevant jobs',
  'Show tailored content based on user activity',
]

const securityCookies = [
  'Detect suspicious login attempts',
  'Prevent unauthorized access',
  'Protect user data',
]

const thirdPartyCookies = [
  'Analytics (e.g., website traffic analysis)',
  'Cloud hosting and infrastructure',
  'Performance monitoring',
]

const cookieConsent = [
  'Accept all cookies',
  'Reject non-essential cookies',
  'Customize your preferences',
]

const dataProtection = [
  'Applicable Indian laws, including the Digital Personal Data Protection Act, 2023',
  'Industry-standard data protection practices',
]

const defaultContactDetails = {
  email: 'support@truehire.com',
  phone: '+91 63812 50037',
  address: '204, 2nd Floor, Duttisland, Siripuram Junction, Visakhapatnam, Andhra Pradesh, India',
}

export default function Cookies() {
  const [contactDetails, setContactDetails] = useState(defaultContactDetails)
  const [draftContactDetails, setDraftContactDetails] = useState(defaultContactDetails)
  const [isEditing, setIsEditing] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(COOKIE_CONTACT_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const merged = { ...defaultContactDetails, ...parsed }
        setContactDetails(merged)
        setDraftContactDetails(merged)
      }
    } catch (error) {
      console.error('Failed to load cookie contact details:', error)
    }
  }, [])

  const handleSave = () => {
    if (typeof window === 'undefined') return

    localStorage.setItem(COOKIE_CONTACT_STORAGE_KEY, JSON.stringify(draftContactDetails))
    setContactDetails(draftContactDetails)
    setIsEditing(false)
    setSaveMessage('Contact information saved successfully.')
  }

  const handleCancel = () => {
    setDraftContactDetails(contactDetails)
    setIsEditing(false)
    setSaveMessage('')
  }

  return (
    <>
      <Head>
        <title>Cookie Policy - TrueHire</title>
        <meta
          name="description"
          content="Learn about how TrueHire uses cookies and similar technologies to support the platform and improve user experience."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Cookie Policy</h1>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-700 mb-4">
                  This Cookie Policy explains how TrueHire uses cookies and similar technologies when you
                  access or use our platform. By continuing to use our services, you agree to the use of
                  cookies as described in this policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. What Are Cookies</h2>
                <p className="text-gray-700 mb-4">
                  Cookies are small text files stored on your device (computer, mobile, tablet) when you
                  visit a website. They help websites function efficiently and improve user experience.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Why TrueHire Uses Cookies</h2>
                <p className="text-gray-700 mb-4">
                  We use cookies to support core platform operations and improve services, including:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  {whyTrueHireUsesCookies.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Types of Cookies We Use</h2>

                <h3 className="text-xl font-medium text-gray-900 mb-2">Essential Cookies</h3>
                <p className="text-gray-700 mb-4">
                  These cookies are necessary for the platform to function properly. They enable:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  {essentialCookies.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="text-gray-700 mb-4">Without these, the site will not work correctly.</p>

                <h3 className="text-xl font-medium text-gray-900 mb-2">Functional Cookies</h3>
                <p className="text-gray-700 mb-4">These cookies remember user preferences such as:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  {functionalCookies.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-2">Performance and Analytics Cookies</h3>
                <p className="text-gray-700 mb-4">
                  These cookies help us understand how users interact with TrueHire by collecting
                  information such as:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  {analyticsCookies.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="text-gray-700 mb-4">
                  This helps us improve usability and performance.
                </p>

                <h3 className="text-xl font-medium text-gray-900 mb-2">Personalization Cookies</h3>
                <p className="text-gray-700 mb-4">Used to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  {personalizationCookies.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-2">Security Cookies</h3>
                <p className="text-gray-700 mb-4">These cookies help:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  {securityCookies.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Third-Party Cookies</h2>
                <p className="text-gray-700 mb-4">
                  TrueHire may use trusted third-party services for:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  {thirdPartyCookies.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="text-gray-700 mb-4">
                  These third parties may place cookies on your device in accordance with their own
                  privacy policies.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookie Consent</h2>
                <p className="text-gray-700 mb-4">
                  When you first visit TrueHire, you will be presented with a cookie consent banner. You
                  can:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  {cookieConsent.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="text-gray-700 mb-4">Your consent can be updated at any time.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Managing Cookies</h2>
                <p className="text-gray-700 mb-4">
                  Users can control or disable cookies through their browser settings.
                </p>
                <p className="text-gray-700 mb-4">However:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Disabling essential cookies may affect platform functionality</li>
                  <li>Some features like login or job recommendations may not work properly</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Protection and Compliance</h2>
                <p className="text-gray-700 mb-4">
                  TrueHire processes cookie-related data in accordance with:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  {dataProtection.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Updates to This Policy</h2>
                <p className="text-gray-700 mb-4">
                  We may update this Cookie Policy periodically. Changes will be posted on this page with
                  an updated effective date.
                </p>
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold text-gray-900">10. Contact Us</h2>
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftContactDetails(contactDetails)
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
                <p className="text-gray-700 mb-4">
                  For any questions regarding this Cookie Policy, users can contact:
                </p>

                {saveMessage && (
                  <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    {saveMessage}
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="mb-2 text-sm font-semibold text-gray-500">Support Email</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={draftContactDetails.email}
                      onChange={(e) => setDraftContactDetails({ ...draftContactDetails, email: e.target.value })}
                      className="mb-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <p className="mb-4 text-gray-700">Email: {contactDetails.email}</p>
                  )}

                  <p className="mb-2 text-sm font-semibold text-gray-500">Phone</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={draftContactDetails.phone}
                      onChange={(e) => setDraftContactDetails({ ...draftContactDetails, phone: e.target.value })}
                      className="mb-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <p className="mb-4 text-gray-700">Phone: {contactDetails.phone}</p>
                  )}

                  <p className="mb-2 text-sm font-semibold text-gray-500">Address</p>
                  {isEditing ? (
                    <textarea
                      value={draftContactDetails.address}
                      onChange={(e) => setDraftContactDetails({ ...draftContactDetails, address: e.target.value })}
                      rows={3}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <p className="text-gray-700">Address: {contactDetails.address}</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
