import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useAuth } from '../../../context/AuthContext'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

export default function ProfileComplete() {
  const { user, loading, updateProfile } = useAuth()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState(1)
  const [profileData, setProfileData] = useState({
    basicInfo: {},
    professionalSummary: '',
    workExperience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    careerPreferences: {},
    socialPresence: {},
    personality: {}
  })
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [sections, setSections] = useState([
    { id: 1, title: 'Basic Information', percentage: 10, completed: false, icon: '👤' },
    { id: 2, title: 'Professional Summary', percentage: 10, completed: false, icon: '📝' },
    { id: 3, title: 'Work Experience', percentage: 15, completed: false, icon: '💼' },
    { id: 4, title: 'Education Details', percentage: 10, completed: false, icon: '🎓' },
    { id: 5, title: 'Skills & Expertise', percentage: 15, completed: false, icon: '🛠️' },
    { id: 6, title: 'Projects & Achievements', percentage: 10, completed: false, icon: '🚀' },
    { id: 7, title: 'Certifications & Training', percentage: 5, completed: false, icon: '🏆' },
    { id: 8, title: 'Preferred Career Details', percentage: 10, completed: false, icon: '🎯' },
    { id: 9, title: 'Social & Professional Presence', percentage: 5, completed: false, icon: '🌐' },
    { id: 10, title: 'Personality, Languages & Interests', percentage: 5, completed: false, icon: '🎭' },
    { id: 11, title: 'Profile Completion & Analytics', percentage: 5, completed: false, icon: '📊' }
  ])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    if (!loading && user && user.profile_complete) {
      router.push(`/dashboard/${user.id}`)
      return
    }
  }, [user, loading, router])

  useEffect(() => {
    const completed = calculateCompletion()
    setCompletionPercentage(completed)
    setSections(prev => prev.map(section => {
      switch(section.id) {
        case 1: return { ...section, completed: !!profileData.basicInfo.firstName }
        case 2: return { ...section, completed: !!profileData.professionalSummary }
        case 3: return { ...section, completed: profileData.workExperience.length > 0 }
        case 4: return { ...section, completed: profileData.education.length > 0 }
        case 5: return { ...section, completed: profileData.skills.length > 0 }
        case 6: return { ...section, completed: profileData.projects.length > 0 }
        default: return { ...section, completed: false }
      }
    }))
  }, [profileData])

  const calculateCompletion = () => {
    let completed = 0
    if (profileData.basicInfo.firstName) completed += 10
    if (profileData.professionalSummary) completed += 10
    if (profileData.workExperience.length > 0) completed += 15
    if (profileData.education.length > 0) completed += 10
    if (profileData.skills.length > 0) completed += 15
    if (profileData.projects.length > 0) completed += 10
    return completed
  }

  const handleSubmitProfile = async () => {
    setSubmitting(true)
    try {
      // Transform profile data to match backend expectations
      const transformedData = {
        name: `${profileData.basicInfo.firstName || ''} ${profileData.basicInfo.lastName || ''}`.trim(),
        contact_number: profileData.basicInfo.phone || '',
        current_location: profileData.basicInfo.location || '',
        date_of_birth: profileData.basicInfo.dateOfBirth || null,
        professional_summary: profileData.professionalSummary || '',
        resume_headline: profileData.professionalSummary || '',
        core_skills: profileData.skills.filter(s => s.category === 'technical').map(s => s.name).join(', '),
        secondary_skills: profileData.skills.filter(s => s.category === 'soft').map(s => s.name).join(', '),
        skill_proficiency: JSON.stringify(profileData.skills.reduce((acc, skill) => {
          acc[skill.name] = skill.proficiency || 'beginner';
          return acc;
        }, {})),
        projects: JSON.stringify(profileData.projects),
        profile_complete: true
      };

      await updateProfile(transformedData)
      router.push(`/dashboard/${user.id}`)
    } catch (error) {
      console.error('Error updating profile:', error)
      setSaveMessage('Error saving profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile completion...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Head>
        <title>Complete Your Profile - TrueHire</title>
        <meta name="description" content="Complete your professional profile to unlock better job opportunities" />
      </Head>

      <Header />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Complete Your Professional Profile</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Build a comprehensive profile to showcase your skills and experience to potential employers
            </p>
            <div className="mt-6">
              <div className="bg-white rounded-full shadow-lg p-4 max-w-md mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                  <span className="text-sm font-bold text-blue-600">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Sidebar */}
              <div className="lg:w-1/4 bg-gray-50 p-6 border-r border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Sections</h2>
                <div className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                        activeSection === section.id
                          ? 'bg-blue-100 border-l-4 border-blue-500 text-blue-700'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-lg mr-3">{section.icon}</span>
                          <span className="text-sm font-medium">{section.title}</span>
                        </div>
                        <span className="text-xs text-gray-500">{section.percentage}%</span>
                      </div>
                      {section.completed && (
                        <div className="mt-1 ml-7">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              <div className="lg:w-3/4 p-8">
                {activeSection === 1 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h3>
                    <p className="text-gray-600 mb-8">Let's start with your basic personal and contact information.</p>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                          <input
                            type="text"
                            value={profileData.basicInfo.firstName || ''}
                            onChange={(e) => setProfileData(prev => ({
                              ...prev,
                              basicInfo: { ...prev.basicInfo, firstName: e.target.value }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your first name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                          <input
                            type="text"
                            value={profileData.basicInfo.lastName || ''}
                            onChange={(e) => setProfileData(prev => ({
                              ...prev,
                              basicInfo: { ...prev.basicInfo, lastName: e.target.value }
                            }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your last name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={profileData.basicInfo.phone || ''}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            basicInfo: { ...prev.basicInfo, phone: e.target.value }
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your phone number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input
                          type="text"
                          value={profileData.basicInfo.location || ''}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            basicInfo: { ...prev.basicInfo, location: e.target.value }
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="City, State/Country"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                        <input
                          type="date"
                          value={profileData.basicInfo.dateOfBirth || ''}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            basicInfo: { ...prev.basicInfo, dateOfBirth: e.target.value }
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setActiveSection(2)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Next: Professional Summary
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === 2 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Professional Summary</h3>
                    <p className="text-gray-600 mb-8">Write a compelling summary that highlights your key strengths and career goals.</p>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Professional Summary</label>
                      <textarea
                        rows={6}
                        value={profileData.professionalSummary}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          professionalSummary: e.target.value
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe your professional background, key skills, and career objectives in 3-5 sentences..."
                      />
                      <p className="text-sm text-gray-500 mt-2">Tip: Focus on your most relevant experience and what makes you unique.</p>
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setActiveSection(1)}
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setActiveSection(3)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Next: Work Experience
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === 3 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Work Experience</h3>
                    <p className="text-gray-600 mb-8">Add your professional work experience to showcase your career journey.</p>

                    <div className="space-y-6">
                      {profileData.workExperience.map((exp, index) => (
                        <div key={index} className="bg-gray-50 p-6 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                              <input
                                type="text"
                                value={exp.jobTitle || ''}
                                onChange={(e) => {
                                  const newExp = [...profileData.workExperience]
                                  newExp[index].jobTitle = e.target.value
                                  setProfileData(prev => ({ ...prev, workExperience: newExp }))
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. Software Engineer"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                              <input
                                type="text"
                                value={exp.company || ''}
                                onChange={(e) => {
                                  const newExp = [...profileData.workExperience]
                                  newExp[index].company = e.target.value
                                  setProfileData(prev => ({ ...prev, workExperience: newExp }))
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. Tech Corp"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                              <input
                                type="month"
                                value={exp.startDate || ''}
                                onChange={(e) => {
                                  const newExp = [...profileData.workExperience]
                                  newExp[index].startDate = e.target.value
                                  setProfileData(prev => ({ ...prev, workExperience: newExp }))
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                              <input
                                type="month"
                                value={exp.endDate || ''}
                                onChange={(e) => {
                                  const newExp = [...profileData.workExperience]
                                  newExp[index].endDate = e.target.value
                                  setProfileData(prev => ({ ...prev, workExperience: newExp }))
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <div className="mt-2">
                                <label className="inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={exp.currentlyWorking || false}
                                    onChange={(e) => {
                                      const newExp = [...profileData.workExperience]
                                      newExp[index].currentlyWorking = e.target.checked
                                      if (e.target.checked) newExp[index].endDate = ''
                                      setProfileData(prev => ({ ...prev, workExperience: newExp }))
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-600">I currently work here</span>
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                              rows={4}
                              value={exp.description || ''}
                              onChange={(e) => {
                                const newExp = [...profileData.workExperience]
                                newExp[index].description = e.target.value
                                setProfileData(prev => ({ ...prev, workExperience: newExp }))
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Describe your responsibilities and achievements..."
                            />
                          </div>

                          <button
                            onClick={() => {
                              const newExp = [...profileData.workExperience]
                              newExp.splice(index, 1)
                              setProfileData(prev => ({ ...prev, workExperience: newExp }))
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove Experience
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          setProfileData(prev => ({
                            ...prev,
                            workExperience: [...prev.workExperience, {
                              jobTitle: '',
                              company: '',
                              startDate: '',
                              endDate: '',
                              currentlyWorking: false,
                              description: ''
                            }]
                          }))
                        }}
                        className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                      >
                        + Add Work Experience
                      </button>
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setActiveSection(2)}
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setActiveSection(4)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Next: Education Details
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === 4 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Education Details</h3>
                    <p className="text-gray-600 mb-8">Add your educational background and qualifications.</p>

                    <div className="space-y-6">
                      {profileData.education.map((edu, index) => (
                        <div key={index} className="bg-gray-50 p-6 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Degree/Certificate</label>
                              <input
                                type="text"
                                value={edu.degree || ''}
                                onChange={(e) => {
                                  const newEdu = [...profileData.education]
                                  newEdu[index].degree = e.target.value
                                  setProfileData(prev => ({ ...prev, education: newEdu }))
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. Bachelor of Science"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
                              <input
                                type="text"
                                value={edu.field || ''}
                                onChange={(e) => {
                                  const newEdu = [...profileData.education]
                                  newEdu[index].field = e.target.value
                                  setProfileData(prev => ({ ...prev, education: newEdu }))
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. Computer Science"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                              <input
                                type="text"
                                value={edu.institution || ''}
                                onChange={(e) => {
                                  const newEdu = [...profileData.education]
                                  newEdu[index].institution = e.target.value
                                  setProfileData(prev => ({ ...prev, education: newEdu }))
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. University of Example"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
                              <input
                                type="number"
                                min="1950"
                                max={new Date().getFullYear() + 10}
                                value={edu.graduationYear || ''}
                                onChange={(e) => {
                                  const newEdu = [...profileData.education]
                                  newEdu[index].graduationYear = e.target.value
                                  setProfileData(prev => ({ ...prev, education: newEdu }))
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 2023"
                              />
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Grade/GPA (Optional)</label>
                            <input
                              type="text"
                              value={edu.grade || ''}
                              onChange={(e) => {
                                const newEdu = [...profileData.education]
                                newEdu[index].grade = e.target.value
                                setProfileData(prev => ({ ...prev, education: newEdu }))
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g. 3.8 GPA or First Class"
                            />
                          </div>

                          <button
                            onClick={() => {
                              const newEdu = [...profileData.education]
                              newEdu.splice(index, 1)
                              setProfileData(prev => ({ ...prev, education: newEdu }))
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove Education
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          setProfileData(prev => ({
                            ...prev,
                            education: [...prev.education, {
                              degree: '',
                              field: '',
                              institution: '',
                              graduationYear: '',
                              grade: ''
                            }]
                          }))
                        }}
                        className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                      >
                        + Add Education
                      </button>
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setActiveSection(3)}
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setActiveSection(5)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Next: Skills & Expertise
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === 5 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Skills & Expertise</h3>
                    <p className="text-gray-600 mb-8">List your technical skills, soft skills, and areas of expertise.</p>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Technical Skills</label>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {profileData.skills.filter(skill => skill.category === 'technical').map((skill, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                              {skill.name}
                              <button
                                onClick={() => {
                                  const newSkills = profileData.skills.filter((_, i) => !(i === index && _.category === 'technical'))
                                  setProfileData(prev => ({ ...prev, skills: newSkills }))
                                }}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a technical skill (e.g. JavaScript, Python)"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                setProfileData(prev => ({
                                  ...prev,
                                  skills: [...prev.skills, { name: e.target.value.trim(), category: 'technical' }]
                                }))
                                e.target.value = ''
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = e.target.previousElementSibling
                              if (input.value.trim()) {
                                setProfileData(prev => ({
                                  ...prev,
                                  skills: [...prev.skills, { name: input.value.trim(), category: 'technical' }]
                                }))
                                input.value = ''
                              }
                            }}
                            className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Soft Skills</label>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {profileData.skills.filter(skill => skill.category === 'soft').map((skill, index) => (
                            <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center">
                              {skill.name}
                              <button
                                onClick={() => {
                                  const newSkills = profileData.skills.filter((_, i) => !(i === index && _.category === 'soft'))
                                  setProfileData(prev => ({ ...prev, skills: newSkills }))
                                }}
                                className="ml-2 text-green-600 hover:text-green-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a soft skill (e.g. Communication, Leadership)"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                setProfileData(prev => ({
                                  ...prev,
                                  skills: [...prev.skills, { name: e.target.value.trim(), category: 'soft' }]
                                }))
                                e.target.value = ''
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = e.target.previousElementSibling
                              if (input.value.trim()) {
                                setProfileData(prev => ({
                                  ...prev,
                                  skills: [...prev.skills, { name: input.value.trim(), category: 'soft' }]
                                }))
                                input.value = ''
                              }
                            }}
                            className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Skill Proficiency Levels</label>
                        <p className="text-sm text-gray-500 mb-4">Rate your proficiency in the skills you've added above.</p>
                        <div className="space-y-3">
                          {profileData.skills.map((skill, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium text-gray-900">{skill.name}</span>
                              <select
                                value={skill.proficiency || 'beginner'}
                                onChange={(e) => {
                                  const newSkills = [...profileData.skills]
                                  newSkills[index].proficiency = e.target.value
                                  setProfileData(prev => ({ ...prev, skills: newSkills }))
                                }}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                                <option value="expert">Expert</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setActiveSection(4)}
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setActiveSection(6)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Next: Projects & Achievements
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === 6 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Projects & Achievements</h3>
                    <p className="text-gray-600 mb-8">Showcase your portfolio projects and key achievements to demonstrate your skills and experience.</p>

                    <div className="space-y-6">
                      {profileData.projects.map((project, index) => (
                        <div key={index} className="bg-gray-50 p-6 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                              <input
                                type="text"
                                value={project.title || ''}
                                onChange={(e) => {
                                  const newProjects = [...profileData.projects]
                                  newProjects[index].title = e.target.value
                                  setProfileData(prev => ({ ...prev, projects: newProjects }))
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. E-commerce Website"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
                              <select
                                value={project.type || ''}
                                onChange={(e) => {
                                  const newProjects = [...profileData.projects]
                                  newProjects[index].type = e.target.value
                                  setProfileData(prev => ({ ...prev, projects: newProjects }))
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select project type</option>
                                <option value="web-development">Web Development</option>
                                <option value="mobile-app">Mobile App</option>
                                <option value="data-analysis">Data Analysis</option>
                                <option value="machine-learning">Machine Learning</option>
                                <option value="desktop-application">Desktop Application</option>
                                <option value="api-development">API Development</option>
                                <option value="game-development">Game Development</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                              rows={4}
                              value={project.description || ''}
                              onChange={(e) => {
                                const newProjects = [...profileData.projects]
                                newProjects[index].description = e.target.value
                                setProfileData(prev => ({ ...prev, projects: newProjects }))
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Describe the project, your role, and key achievements..."
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Technologies Used</label>
                              <input
                                type="text"
                                value={project.technologies || ''}
                                onChange={(e) => {
                                  const newProjects = [...profileData.projects]
                                  newProjects[index].technologies = e.target.value
                                  setProfileData(prev => ({ ...prev, projects: newProjects }))
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. React, Node.js, MongoDB"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Project Link (Optional)</label>
                              <input
                                type="url"
                                value={project.link || ''}
                                onChange={(e) => {
                                  const newProjects = [...profileData.projects]
                                  newProjects[index].link = e.target.value
                                  setProfileData(prev => ({ ...prev, projects: newProjects }))
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://github.com/username/project"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              const newProjects = [...profileData.projects]
                              newProjects.splice(index, 1)
                              setProfileData(prev => ({ ...prev, projects: newProjects }))
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove Project
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          setProfileData(prev => ({
                            ...prev,
                            projects: [...prev.projects, {
                              title: '',
                              type: '',
                              description: '',
                              technologies: '',
                              link: ''
                            }]
                          }))
                        }}
                        className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                      >
                        + Add Project
                      </button>
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setActiveSection(5)}
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setActiveSection(7)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Next: Certifications & Training
                      </button>
                    </div>
                  </div>
                )}

                {/* Placeholder sections for remaining sections */}
                {activeSection === 7 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Certifications & Training</h3>
                    <p className="text-gray-600 mb-8">Add your certifications, courses, and training programs.</p>
                    <div className="text-center py-12">
                      <p className="text-gray-500">This section is under development.</p>
                    </div>
                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setActiveSection(6)}
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setActiveSection(8)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Next: Preferred Career Details
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === 8 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Preferred Career Details</h3>
                    <p className="text-gray-600 mb-8">Specify your career preferences and job search criteria.</p>
                    <div className="text-center py-12">
                      <p className="text-gray-500">This section is under development.</p>
                    </div>
                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setActiveSection(7)}
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setActiveSection(9)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Next: Social & Professional Presence
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === 9 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Social & Professional Presence</h3>
                    <p className="text-gray-600 mb-8">Connect your professional social media and online presence.</p>
                    <div className="text-center py-12">
                      <p className="text-gray-500">This section is under development.</p>
                    </div>
                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setActiveSection(8)}
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setActiveSection(10)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Next: Personality, Languages & Interests
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === 10 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Personality, Languages & Interests</h3>
                    <p className="text-gray-600 mb-8">Share your personality traits, language skills, and personal interests.</p>
                    <div className="text-center py-12">
                      <p className="text-gray-500">This section is under development.</p>
                    </div>
                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setActiveSection(9)}
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setActiveSection(11)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Next: Profile Completion & Analytics
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === 11 && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Profile Completion & Analytics</h3>
                    <p className="text-gray-600 mb-8">Review your profile completeness and submit to complete your profile setup.</p>

                    {/* Profile Summary */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
                          <div className="text-sm text-gray-600">Complete</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{profileData.workExperience.length}</div>
                          <div className="text-sm text-gray-600">Work Experiences</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{profileData.skills.length}</div>
                          <div className="text-sm text-gray-600">Skills Added</div>
                        </div>
                      </div>
                    </div>

                    {/* Completion Checklist */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Completion Checklist</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input type="checkbox" checked={!!profileData.basicInfo.firstName} readOnly className="mr-3" />
                          <span className="text-sm text-gray-700">Basic Information</span>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" checked={!!profileData.professionalSummary} readOnly className="mr-3" />
                          <span className="text-sm text-gray-700">Professional Summary</span>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" checked={profileData.workExperience.length > 0} readOnly className="mr-3" />
                          <span className="text-sm text-gray-700">Work Experience</span>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" checked={profileData.education.length > 0} readOnly className="mr-3" />
                          <span className="text-sm text-gray-700">Education Details</span>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" checked={profileData.skills.length > 0} readOnly className="mr-3" />
                          <span className="text-sm text-gray-700">Skills & Expertise</span>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" checked={profileData.projects.length > 0} readOnly className="mr-3" />
                          <span className="text-sm text-gray-700">Projects & Achievements</span>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="text-center">
                      <button
                        onClick={handleSubmitProfile}
                        disabled={submitting}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        {submitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Completing Profile...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Complete Profile & Continue
                          </>
                        )}
                      </button>
                      <p className="text-sm text-gray-500 mt-4">
                        By completing your profile, you'll unlock access to job opportunities and personalized recommendations.
                      </p>
                    </div>

                    <div className="mt-8 flex justify-center">
                      <button
                        onClick={() => setActiveSection(10)}
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        Previous
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}




