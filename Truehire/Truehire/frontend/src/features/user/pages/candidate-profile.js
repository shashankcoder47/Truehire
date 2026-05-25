import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

export default function CandidateProfile() {
  const [recruiterData, setRecruiterData] = useState(null)
  const [candidate, setCandidate] = useState(null)
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    // Check if recruiter is logged in
    const isLoggedIn = localStorage.getItem('recruiterLoggedIn')
    const data = localStorage.getItem('recruiterData')

    if (!isLoggedIn || !data) {
      router.push('/login')
      return
    }

    setRecruiterData(JSON.parse(data))

    // Mock candidate data - in real app, fetch from API
    const mockCandidates = {
      1: {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        job: 'Senior Software Engineer',
        experience: '5 years',
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
        education: 'Bachelor of Computer Science, Stanford University',
        applied: '1 day ago',
        status: 'Under Review',
        resume: '/resumes/john-smith.pdf',
        coverLetter: 'I am excited to apply for the Senior Software Engineer position...',
        portfolio: 'https://johnsmith.dev'
      },
      2: {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1 (555) 234-5678',
        location: 'New York, NY',
        job: 'Product Manager',
        experience: '7 years',
        skills: ['Product Strategy', 'Agile', 'Analytics', 'User Research', 'SQL'],
        education: 'MBA, Harvard Business School',
        applied: '3 days ago',
        status: 'Interview Scheduled',
        resume: '/resumes/sarah-johnson.pdf',
        coverLetter: 'With 7 years of product management experience...',
        portfolio: 'https://sarahjohnson.pm'
      },
      3: {
        id: 3,
        name: 'Mike Chen',
        email: 'mike.chen@email.com',
        phone: '+1 (555) 345-6789',
        location: 'Austin, TX',
        job: 'UX Designer',
        experience: '4 years',
        skills: ['Figma', 'Sketch', 'User Research', 'Prototyping', 'Design Systems'],
        education: 'Bachelor of Fine Arts, Rhode Island School of Design',
        applied: '1 week ago',
        status: 'Shortlisted',
        resume: '/resumes/mike-chen.pdf',
        coverLetter: 'I am passionate about creating intuitive user experiences...',
        portfolio: 'https://mikechen.design'
      }
    }

    if (id && mockCandidates[id]) {
      setCandidate(mockCandidates[id])
    }
  }, [router, id])

  if (!recruiterData || !candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{candidate.name} - Candidate Profile - TrueHire</title>
      </Head>

      <Header />
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Applications
          </button>

          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl text-gray-600 font-medium">
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{candidate.name}</h1>
                <p className="text-lg text-gray-600">{candidate.job}</p>
                <p className="text-sm text-gray-500">{candidate.location} • Applied {candidate.applied}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  candidate.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                  candidate.status === 'Interview Scheduled' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {candidate.status}
                </span>
                <button
                  onClick={() => router.push(`/contact-candidate?id=${candidate.id}`)}
                  className="btn btn-primary px-6 py-2"
                >
                  Contact Candidate
                </button>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Experience & Skills */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Summary</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Experience</h3>
                    <p className="text-gray-600">{candidate.experience}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Skills</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {candidate.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Education</h3>
                    <p className="text-gray-600">{candidate.education}</p>
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Cover Letter</h2>
                <p className="text-gray-700 leading-relaxed">{candidate.coverLetter}</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{candidate.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900">{candidate.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-gray-900">{candidate.location}</p>
                  </div>
                  {candidate.portfolio && (
                    <div>
                      <p className="text-sm text-gray-500">Portfolio</p>
                      <a href={candidate.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {candidate.portfolio}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Resume */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Resume</h2>
                <button className="w-full btn btn-outline py-3">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Resume
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}




