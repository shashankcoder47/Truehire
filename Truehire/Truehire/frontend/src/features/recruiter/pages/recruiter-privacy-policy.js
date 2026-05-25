import Head from 'next/head'
import Header from '../Header'
import Footer from '../Footer'

export default function RecruiterPrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Recruiter Privacy Policy — TrueHire</title>
        <meta name="description" content="Privacy Policy for recruiters using TrueHire platform. Learn how we protect your data and candidate information." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="gradient-bg py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Recruiter <span className="text-gradient">Privacy Policy</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your privacy and data protection are our top priorities
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="prose prose-lg max-w-none">
              <p className="text-sm text-gray-600 mb-8">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">We collect information you provide directly to us, such as:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-6">
                <li>Account information (name, email, company details)</li>
                <li>Job posting data and requirements</li>
                <li>Payment information for billing purposes</li>
                <li>Communication preferences</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-6">
                <li>To provide and maintain our recruitment services</li>
                <li>To process payments and manage your account</li>
                <li>To communicate with you about your account and services</li>
                <li>To improve our platform and develop new features</li>
                <li>To comply with legal obligations</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Candidate Data Protection</h2>
              <p className="text-gray-700 mb-6">
                We are committed to protecting candidate privacy. Recruiters using our platform must comply with all applicable data protection laws, including GDPR and Indian data protection regulations. We implement strict security measures to protect all personal data.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">We may share your information only in the following circumstances:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-6">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With trusted service providers who assist our operations</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-6">
                We implement industry-standard security measures to protect your data, including encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-6">
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your data at any time, subject to legal requirements.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-6">
                <li>Access to your personal data</li>
                <li>Correction of inaccurate data</li>
                <li>Deletion of your data</li>
                <li>Data portability</li>
                <li>Opt-out of marketing communications</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-6">
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide personalized services. You can control cookie preferences through your browser settings.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
              <p className="text-gray-700 mb-6">
                Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-700 mb-6">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by email or through our platform.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 mb-6">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@truehire.com<br />
                  <strong>Phone:</strong> +91-XXXXXXXXXX<br />
                  <strong>Address:</strong> [Company Address], India<br />
                  <strong>Data Protection Officer:</strong> dpo@truehire.com
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


