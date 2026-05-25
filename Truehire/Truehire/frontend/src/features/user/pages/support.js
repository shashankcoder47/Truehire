import Head from 'next/head'
import Link from  'next/link'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

export default function Support() {
  const supportCategories = [
    {
      icon: '🔧',
      title: 'Technical Support',
      description: 'We assist users with any technical issues, including:',
      items: [
        'Login or sign-up problems',
        'Password reset issues',
        'Page errors or bugs',
        'Uploading résumé or documents',
        'Job posting errors',
        'Application not submitting'
      ]
    },
    {
      icon: '👤',
      title: 'Candidate Support',
      description: 'Support for job seekers, including:',
      items: [
        'How to apply for jobs',
        'How to create or update a profile',
        'Using the Resume Builder',
        'Searching or filtering jobs',
        'Improving profile visibility',
        'Managing job alerts'
      ]
    },
    {
      icon: '🏢',
      title: 'Employer / Recruiter Support',
      description: 'Dedicated assistance for employers and recruiters:',
      items: [
        'Posting new jobs',
        'Editing or updating job listings',
        'Managing applications',
        'Accessing candidate database',
        'Understanding pricing plans',
        'Using recruiter dashboard and ATS tools'
      ]
    },
    {
      icon: '💳',
      title: 'Billing & Payment Support',
      description: 'For recruiters using paid plans:',
      items: [
        'Payment or transaction issues',
        'Invoice download',
        'Subscription upgrades',
        'Refund-related queries',
        'Plan details & pricing clarification'
      ]
    },
    {
      icon: '📚',
      title: 'Documentation & Help Center',
      description: 'Our Help Center provides:',
      items: [
        'FAQs',
        'Step-by-step guides',
        'Tutorials',
        'Video walkthroughs',
        'Troubleshooting tips',
        'Get help quickly with easy-to-follow documentation.'
      ]
    }
  ]

  const supportMethods = [
    {
      icon: '📝',
      title: 'Contact Support Form',
      description: 'Submit your issue → Our support team responds promptly.'
    },
    {
      icon: '💬',
      title: 'Live Chat / Chatbot',
      description: 'Instant answers for common questions.'
    },
    {
      icon: '📖',
      title: 'Help Center Articles',
      description: 'Guides available for: Creating an account, Uploading a resume, Posting jobs, Tracking applications, Using dashboards'
    },
    {
      icon: '📧',
      title: 'Email Support',
      description: 'support@truehire.com'
    },
    {
      icon: '📞',
      title: 'Phone Support',
      description: '+91 XXXXX XXXXX (Replace with your company number)'
    },
    {
      icon: '🎫',
      title: 'Ticket System',
      description: 'Raise a ticket → Track status → Quick resolution.'
    }
  ]

  return (
    <>
      <Head>
        <title>Support Center — TrueHire</title>
        <meta name="description" content="Get help with TrueHire. Technical support, candidate assistance, employer support, billing help, and comprehensive documentation." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="gradient-bg py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Support <span className="text-gradient">Center</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
              We're here to help you succeed on TrueHire. Get assistance with technical issues, account management, job posting, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              
            </div>
          </div>
        </section>

        {/* Support Categories */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                How Can We <span className="text-gradient">Help You?</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose the type of support you need, and we'll guide you to the right resources.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {supportCategories.map((category, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{category.title}</h3>
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  <ul className="space-y-2">
                    {category.items.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="text-green-500 mr-2 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How Support Works */}
        <section className="py-20 bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                🧰 How Support Works at <span className="text-gradient">TrueHire</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Multiple ways to get the help you need, when you need it.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {supportMethods.map((method, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-4xl mb-4">{method.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{method.title}</h3>
                  <p className="text-gray-600">{method.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Need <span className="text-yellow-300">Immediate Help?</span>
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Our support team is ready to assist you. Choose the best way to reach us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300">
                Submit Support Ticket
              </button>
              <button className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-300">
                Call Support
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}



