import Head from 'next/head'
import { useEffect, useState } from 'react'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

const CONTACT_STORAGE_KEY = 'truehire_contact_details'
const defaultContactDetails = {
  email: 'support@truehire.com',
  phone: '+91 XXXXX XXXXX',
  location: 'Bangalore, India'
}

export default function Contact() {
  const [contactDetails, setContactDetails] = useState(defaultContactDetails)
  const [draftContactDetails, setDraftContactDetails] = useState(defaultContactDetails)
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const storedContactDetails = localStorage.getItem(CONTACT_STORAGE_KEY)
      if (storedContactDetails) {
        const parsed = JSON.parse(storedContactDetails)
        const merged = {
          ...defaultContactDetails,
          ...parsed
        }
        setContactDetails(merged)
        setDraftContactDetails(merged)
      }
    } catch (error) {
      console.error('Failed to load contact details:', error)
    }
  }, [])

  const handleDetailsChange = (field, value) => {
    setDraftContactDetails((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveDetails = () => {
    if (typeof window === 'undefined') return

    localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(draftContactDetails))
    setContactDetails(draftContactDetails)
    setIsEditingDetails(false)
    setSaveMessage('Contact details saved successfully.')
  }

  const handleCancelEdit = () => {
    setDraftContactDetails(contactDetails)
    setIsEditingDetails(false)
    setSaveMessage('')
  }

  const supportSections = [
    {
      title: 'For Job Seekers',
      items: ['Issues with applying jobs', 'Resume upload problems', 'Login issues']
    },
    {
      title: 'For Recruiters',
      items: ['Job posting issues', 'Subscription / plans', 'Candidate management']
    }
  ]

  const faqs = [
    {
      question: 'How to apply for jobs?',
      answer: 'Open any job listing, review the details, and use the apply flow to submit your application.'
    },
    {
      question: 'How to post a job?',
      answer: 'Recruiters can sign in, open the recruiter dashboard, and use the job posting option to publish a role.'
    },
    {
      question: 'How to contact recruiter?',
      answer: 'Once a recruiter enables communication through the platform, you can connect from the relevant job or application flow.'
    }
  ]

  return (
    <>
      <Head>
        <title>Contact Us - TrueHire</title>
        <meta
          name="description"
          content="Need help with job applications, recruiter services, or your account? Contact the TrueHire support team."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50">
        <section className="gradient-bg py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Contact <span className="text-gradient">TRUEHIRE</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Need help with job applications, recruiter services, or your account? Our support team is here to help.
            </p>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Contact Details</h2>
                {!isEditingDetails ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftContactDetails(contactDetails)
                      setIsEditingDetails(true)
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
                      onClick={handleCancelEdit}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDetails}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              {saveMessage && (
                <div className="mb-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {saveMessage}
                </div>
              )}

              <div className="space-y-6">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-gray-500 mb-2">Email</p>
                  {isEditingDetails ? (
                    <input
                      type="email"
                      value={draftContactDetails.email}
                      onChange={(e) => handleDetailsChange('email', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{contactDetails.email}</p>
                  )}
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-gray-500 mb-2">Phone</p>
                  {isEditingDetails ? (
                    <input
                      type="text"
                      value={draftContactDetails.phone}
                      onChange={(e) => handleDetailsChange('phone', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{contactDetails.phone}</p>
                  )}
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-gray-500 mb-2">Location</p>
                  {isEditingDetails ? (
                    <input
                      type="text"
                      value={draftContactDetails.location}
                      onChange={(e) => handleDetailsChange('location', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{contactDetails.location}</p>
                  )}
                </div>

                <div className="rounded-2xl bg-blue-50 p-5">
                  <p className="text-sm font-semibold text-blue-700 mb-2">Response Time</p>
                  <p className="text-gray-700">We usually respond within 24-48 hours.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Support <span className="text-gradient">Sections</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {supportSections.map((section) => (
                <div key={section.title} className="rounded-3xl bg-white p-8 shadow-sm">
                  <h3 className="text-2xl font-bold text-gray-900 mb-5">{section.title}</h3>
                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <div key={item} className="rounded-2xl bg-gray-50 px-4 py-3 text-gray-700">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked <span className="text-gradient">Questions</span>
              </h2>
            </div>

            <div className="space-y-5">
              {faqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
