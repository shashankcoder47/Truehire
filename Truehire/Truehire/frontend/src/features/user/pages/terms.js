import Head from 'next/head'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

const userResponsibilities = [
  'Post false or misleading information',
  'Engage in fraudulent or scam activities',
  'Use bots, scraping tools, or unauthorized automation',
  'Upload harmful, illegal, or offensive content',
]

const employerResponsibilities = [
  'Post genuine job opportunities',
  'Provide accurate job descriptions',
  'Not request payment from candidates',
  'Follow applicable employment laws',
]

const candidateResponsibilities = [
  'Provide truthful personal and professional details',
  'Apply only to relevant job postings',
  'Avoid impersonation or misuse of accounts',
]

const fraudDisclaimer = [
  'Fake job postings or fraudulent employers',
  'Any financial loss or damages caused by third-party interactions',
]

const automatedMatching = [
  'Recommend jobs',
  'Rank candidate profiles',
  'Improve hiring efficiency',
]

const suspensionReasons = [
  'Violate these terms',
  'Engage in suspicious or fraudulent activity',
]

const liabilityExclusions = [
  'Hiring decisions made by employers',
  'Job offer authenticity',
  'Any disputes between users',
]

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service - TrueHire</title>
        <meta
          name="description"
          content="Read our terms of service and understand the rules for using TrueHire platform."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
                <p className="text-gray-700 mb-4">
                  Welcome to TrueHire. By accessing or using our platform, you agree to these Terms of
                  Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Platform Role</h2>
                <p className="text-gray-700 mb-4">
                  TrueHire is an online job portal that connects job seekers with employers. We act only
                  as an intermediary and do not guarantee job placement or hiring outcomes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Eligibility</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Users must be legally authorized to use this platform and provide valid information during registration</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>
                <p className="text-gray-700 mb-4">You agree not to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  {userResponsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Employer Responsibilities</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  {employerResponsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Candidate Responsibilities</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  {candidateResponsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Fraud and Scam Disclaimer</h2>
                <p className="text-gray-700 mb-4">TrueHire is not responsible for:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  {fraudDisclaimer.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="text-gray-700 mb-4">
                  Users are encouraged to report suspicious activity immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Resume Visibility</h2>
                <p className="text-gray-700 mb-4">By creating a profile on TrueHire:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Your profile may be visible to registered recruiters</li>
                  <li>You can manage visibility settings within your account</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Automated Matching</h2>
                <p className="text-gray-700 mb-4">
                  TrueHire may use automated systems and AI-based tools to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  {automatedMatching.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Suspension</h2>
                <p className="text-gray-700 mb-4">
                  We reserve the right to suspend or terminate accounts that:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  {suspensionReasons.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
                <p className="text-gray-700 mb-4">TrueHire is not liable for:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  {liabilityExclusions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
                <p className="text-gray-700 mb-4">
                  We may retain user data for a limited period to improve services and comply with legal
                  obligations.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
