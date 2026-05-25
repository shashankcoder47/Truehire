import Head from 'next/head'
import Header from '../Header'
import Footer from '../Footer'

export default function RecruiterTermsOfService() {
  return (
    <>
      <Head>
        <title>Recruiter Terms of Service — TrueHire</title>
        <meta name="description" content="Terms of Service for recruiters using TrueHire platform. Read our terms and conditions for job posting and recruitment services." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="gradient-bg py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Recruiter <span className="text-gradient">Terms of Service</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Please read these terms carefully before using our recruitment platform
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="prose prose-lg max-w-none">
              <p className="text-sm text-gray-600 mb-8">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-6">
                By accessing and using TrueHire's recruitment platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-6">
                TrueHire provides a comprehensive recruitment platform that connects employers with qualified candidates through AI-powered matching technology. Our services include job posting, candidate screening, and recruitment analytics.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-6">
                <li>Provide accurate and complete information about job openings</li>
                <li>Comply with all applicable employment laws and regulations</li>
                <li>Respect candidate privacy and data protection requirements</li>
                <li>Use the platform solely for legitimate recruitment purposes</li>
                <li>Not discriminate against candidates based on protected characteristics</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Job Posting Guidelines</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-6">
                <li>All job postings must be for legitimate positions</li>
                <li>Salary information should be accurate and competitive</li>
                <li>Job descriptions must be clear and comprehensive</li>
                <li>Application deadlines must be reasonable</li>
                <li>No posting of positions that violate employment laws</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Payment Terms</h2>
              <p className="text-gray-700 mb-6">
                Payment for job posting services is due at the time of posting. All fees are non-refundable once a job has been posted and candidates have begun applying. We accept major credit cards and bank transfers.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700 mb-6">
                All content, features, and functionality of the TrueHire platform are owned by TrueHire and are protected by copyright, trademark, and other intellectual property laws.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-700 mb-6">
                TrueHire shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of our services.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Termination</h2>
              <p className="text-gray-700 mb-6">
                We reserve the right to terminate or suspend your account at our discretion if you violate these terms or engage in prohibited activities.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Governing Law</h2>
              <p className="text-gray-700 mb-6">
                These terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Information</h2>
              <p className="text-gray-700 mb-6">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@truehire.com<br />
                  <strong>Phone:</strong> +91-XXXXXXXXXX<br />
                  <strong>Address:</strong> [Company Address], India
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}


