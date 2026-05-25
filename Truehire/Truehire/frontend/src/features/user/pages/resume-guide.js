import Head from 'next/head'
import Link from 'next/link'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

export default function ResumeGuide() {
  const tips = [
    {
      title: 'Choose the Right Format',
      description: 'Select a format that highlights your strengths. Chronological for steady career progression, functional for career changers.',
      icon: '📋'
    },
    {
      title: 'Tailor Your Content',
      description: 'Customize your resume for each job application. Use keywords from the job description to pass ATS filters.',
      icon: '🎯'
    },
    {
      title: 'Quantify Achievements',
      description: 'Use numbers to show impact. Instead of "Managed team," say "Managed 5-person team, increasing productivity by 30%."',
      icon: '📊'
    },
    {
      title: 'Keep it Concise',
      description: 'Aim for 1 page for entry-level, 2 pages maximum for experienced professionals. Focus on relevance.',
      icon: '✂️'
    },
    {
      title: 'Professional Summary',
      description: 'Write a compelling 3-5 sentence summary highlighting your key qualifications and career goals.',
      icon: '📝'
    },
    {
      title: 'Action Verbs',
      description: 'Start bullet points with strong action verbs like "Led," "Developed," "Implemented," "Achieved."',
      icon: '⚡'
    }
  ]

  const sections = [
    {
      title: 'Contact Information',
      content: 'Include your full name, phone number, professional email, LinkedIn profile, and location. Use a professional email address.',
      example: 'John Smith\n(555) 123-4567\njohn.smith@email.com\nlinkedin.com/in/johnsmith\nNew York, NY'
    },
    {
      title: 'Professional Summary',
      content: 'A 3-5 sentence overview of your qualifications, experience, and career goals. Tailor this to the specific job.',
      example: 'Results-driven marketing professional with 5+ years of experience in digital campaigns. Proven track record of increasing engagement by 40% through innovative strategies. Seeking to leverage expertise in content marketing and analytics.'
    },
    {
      title: 'Work Experience',
      content: 'List your most recent positions first. Include job title, company name, dates, and 3-5 bullet points describing responsibilities and achievements.',
      example: 'Marketing Manager | TechCorp Inc. | Jan 2020 - Present\n• Led digital marketing campaigns resulting in 35% increase in website traffic\n• Managed $500K annual marketing budget with 15% cost reduction\n• Collaborated with cross-functional teams to launch 10+ successful product features'
    },
    {
      title: 'Education',
      content: 'Include degree, institution, graduation date, and GPA if above 3.5. List relevant coursework or honors.',
      example: 'Bachelor of Science in Marketing\nUniversity of Business | May 2018\nGPA: 3.7/4.0 | Dean\'s List (2016-2018)'
    },
    {
      title: 'Skills',
      content: 'List technical skills, software proficiency, and soft skills relevant to the job. Include proficiency levels if applicable.',
      example: 'Technical: Google Analytics, SEO/SEM, Adobe Creative Suite\nSoft Skills: Project Management, Team Leadership, Communication\nLanguages: English (Native), Spanish (Conversational)'
    }
  ]

  return (
    <>
      <Head>
        <title>Resume Writing Guide — TrueHire</title>
        <meta name="description" content="Master the art of resume writing with our comprehensive guide. Learn formatting tips, content strategies, and best practices to create a standout resume." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="gradient-bg py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Resume Writing <span className="text-gradient">Guide</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Create a compelling resume that showcases your skills and experience. Learn proven strategies to stand out to employers and land your dream job.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Essential Tips */}
          <section className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
              Essential <span className="text-gradient">Resume Tips</span>
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Follow these proven strategies to create a resume that gets noticed by recruiters and hiring managers
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tips.map((tip, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                  <div className="text-4xl mb-4">{tip.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{tip.title}</h3>
                  <p className="text-gray-600">{tip.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Resume Sections */}
          <section className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
              Key <span className="text-gradient">Resume Sections</span>
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Structure your resume with these essential sections to present your qualifications effectively
            </p>

            <div className="space-y-8">
              {sections.map((section, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-8">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">{section.title}</h3>
                  <p className="text-gray-600 mb-6">{section.content}</p>
                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <h4 className="font-semibold text-gray-900 mb-2">Example:</h4>
                    <pre className="text-sm text-gray-700 whitespace-pre-line font-mono">{section.example}</pre>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Common Mistakes */}
          <section className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
              Common <span className="text-gradient">Mistakes to Avoid</span>
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Steer clear of these resume pitfalls that can hurt your chances of getting an interview
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-red-900 mb-3">❌ Typos and Grammatical Errors</h3>
                <p className="text-red-800">Proofread multiple times and have someone else review your resume. Errors show lack of attention to detail.</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-red-900 mb-3">❌ Generic Objective Statements</h3>
                <p className="text-red-800">Avoid vague statements like "Seeking a challenging position." Use a professional summary instead.</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-red-900 mb-3">❌ Irrelevant Information</h3>
                <p className="text-red-800">Don't include hobbies, age, marital status, or other personal details unless directly relevant to the job.</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-red-900 mb-3">❌ Overly Long Resumes</h3>
                <p className="text-red-800">Keep it concise. Most recruiters spend less than 30 seconds reviewing a resume initially.</p>
              </div>
            </div>
          </section>

          
        </div>
      </main>
      <Footer />
    </>
  )
}




