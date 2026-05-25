import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

export default function BillingPlans() {
  const [recruiterData, setRecruiterData] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Check if recruiter is logged in
    const isLoggedIn = localStorage.getItem('recruiterLoggedIn')
    const data = localStorage.getItem('recruiterData')

    if (!isLoggedIn || !data) {
      router.push('/login')
      return
    }

    setRecruiterData(JSON.parse(data))
  }, [router])

  if (!recruiterData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const plans = [
    {
      name: 'Starter',
      price: '$29',
      period: 'month',
      features: [
        'Up to 5 active job postings',
        'Basic candidate matching',
        'Email support',
        'Standard analytics'
      ],
      current: false
    },
    {
      name: 'Professional',
      price: '$79',
      period: 'month',
      features: [
        'Up to 20 active job postings',
        'Advanced candidate matching',
        'Priority email support',
        'Advanced analytics',
        'Custom branding'
      ],
      current: true
    },
    {
      name: 'Enterprise',
      price: '$199',
      period: 'month',
      features: [
        'Unlimited job postings',
        'Premium candidate matching',
        'Dedicated account manager',
        'Custom integrations',
        'White-label solution'
      ],
      current: false
    }
  ]

  const billingHistory = [
    { date: '2024-01-15', amount: '$79.00', status: 'Paid', plan: 'Professional' },
    { date: '2023-12-15', amount: '$79.00', status: 'Paid', plan: 'Professional' },
    { date: '2023-11-15', amount: '$79.00', status: 'Paid', plan: 'Professional' }
  ]

  return (
    <>
      <Head>
        <title>Billing & Plans - TrueHire</title>
      </Head>

      <Header />
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Billing & Plans</h1>
                <p className="text-gray-600 mt-1">View your current plan, billing history, and manage subscriptions</p>
              </div>
              <button
                onClick={() => router.push('/company-profile?tab=settings')}
                className="btn btn-secondary px-6 py-2 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Profile</span>
              </button>
            </div>
          </div>

          {/* Current Plan */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Plan</h2>

            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Professional Plan</h3>
                  <p className="text-blue-100 mt-1">$79/month</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Next billing date</p>
                  <p className="font-semibold">February 15, 2024</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span>Jobs used this month</span>
                  <span>12 / 20</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div className="bg-white h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex space-x-4">
              <button className="btn btn-primary px-6 py-2">
                Upgrade Plan
              </button>
              <button className="btn btn-outline px-6 py-2">
                Change Payment Method
              </button>
              <button className="btn btn-outline px-6 py-2 text-red-600 hover:bg-red-50">
                Cancel Subscription
              </button>
            </div>
          </div>

          {/* Available Plans */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Plans</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <div key={index} className={`bg-white rounded-lg shadow-sm p-6 ${plan.current ? 'ring-2 ring-blue-500' : ''}`}>
                  {plan.current && (
                    <div className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full inline-block mb-4">
                      Current Plan
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">/{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {!plan.current && (
                    <button className="btn btn-primary w-full">
                      {plan.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Billing History */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing History</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Plan</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((bill, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-900">{bill.date}</td>
                      <td className="py-3 px-4 text-gray-900">{bill.plan}</td>
                      <td className="py-3 px-4 text-gray-900">{bill.amount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bill.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:underline text-sm">
                          Download Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}




