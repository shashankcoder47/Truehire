import Head from 'next/head'
import Header from '../Portal/Header'
import Footer from '../Portal/Footer'

export default function RecruitingSolutionsPage() {
  const solutions = [
    {
      title: 'Post Jobs Easily',
      description: 'Create and publish job openings quickly to reach active candidates on the platform.'
    },
    {
      title: 'Manage Applications',
      description: 'Review applicants, track status, and organize your hiring workflow in one place.'
    },
    {
      title: 'Find Better Matches',
      description: 'Use platform tools to identify candidates that fit your role requirements faster.'
    },
    {
      title: 'Recruiter Dashboard',
      description: 'Access your jobs, candidate activity, and hiring progress from a single dashboard.'
    }
  ]

  const steps = ['Create Recruiter Account', 'Post a Job', 'Review Applications', 'Hire Faster']

  return (
    <>
      <Head>
        <title>Recruiting Solutions - TrueHire</title>
        <meta
          name="description"
          content="Simple recruiting solutions for employers on TrueHire. Post jobs, manage candidates, and streamline hiring."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50">
        <section className="gradient-bg py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Recruiting <span className="text-gradient">Solutions</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Basic recruiter tools to post jobs, manage candidates, and make hiring easier with TrueHire.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => window.location.href = '/recruiter-register'}
                className="rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700"
              >
                Get Started
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="rounded-lg border border-blue-200 bg-white px-8 py-3 text-base font-semibold text-blue-700 hover:bg-blue-50"
              >
                Recruiter Login
              </button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What Recruiters Can <span className="text-gradient">Do</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {solutions.map((item) => (
                <div key={item.title} className="rounded-2xl border border-gray-200 bg-gray-50 p-7 shadow-sm">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-7">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Simple Hiring <span className="text-gradient">Process</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <div key={step} className="rounded-2xl bg-white p-6 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{step}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Hiring with TrueHire</h2>
            <p className="text-lg text-blue-100 mb-8">
              Create your recruiter account and begin posting jobs for your company.
            </p>
            <button
              onClick={() => window.location.href = '/recruiter-register'}
              className="rounded-lg bg-white px-8 py-3 text-base font-semibold text-blue-700 hover:bg-blue-50"
            >
              Create Recruiter Account
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
