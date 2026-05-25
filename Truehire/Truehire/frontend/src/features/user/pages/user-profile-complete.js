import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useAuth } from '../../../context/AuthContext'

export default function UserProfileComplete() {
  const { user, loading, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState(0)
  const [profileData, setProfileData] = useState({})
  const [saving, setSaving] = useState(false)
  const [addingWork, setAddingWork] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [formData, setFormData] = useState({company: '', position: '', start_date: '', end_date: '', description: ''})
  const [addingEducation, setAddingEducation] = useState(false)
  const [editingEducationIndex, setEditingEducationIndex] = useState(null)
  const [educationFormData, setEducationFormData] = useState({institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', gpa: '', description: ''})
  const router = useRouter()

  const sections = [
    {
      id: 1,
      title: 'Basic Information',
      icon: '👤',
      weight: 10,
      fields: ['name', 'email', 'phone', 'location']
    },
    {
      id: 2,
      title: 'Professional Summary',
      icon: '📝',
      weight: 10,
      fields: ['professional_summary']
    },
    {
      id: 3,
      title: 'Work Experience',
      icon: '💼',
      weight: 15,
      fields: ['work_experience']
    },
    {
      id: 4,
      title: 'Education',
      icon: '🎓',
      weight: 10,
      fields: ['education']
    },
    {
      id: 5,
      title: 'Skills & Expertise',
      icon: '⚡',
      weight: 15,
      fields: ['skills']
    },
    {
      id: 6,
      title: 'Projects & Achievements',
      icon: '🚀',
      weight: 10,
      fields: ['projects']
    },
    {
      id: 7,
      title: 'Certifications & Training',
      icon: '🏆',
      weight: 5,
      fields: ['certifications']
    },
    {
      id: 8,
      title: 'Preferred Career Details',
      icon: '🎯',
      weight: 10,
      fields: ['career_preferences']
    },
    {
      id: 9,
      title: 'Social & Professional Presence',
      icon: '🌐',
      weight: 5,
      fields: ['social_links']
    },
    {
      id: 10,
      title: 'Personality, Languages & Interests',
      icon: '🎭',
      weight: 5,
      fields: ['personality']
    },
    {
      id: 11,
      title: 'Profile Completion & Analytics',
      icon: '📊',
      weight: 5,
      fields: ['analytics']
    }
  ]

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      setIsLoading(false)
      setProfileData(user)
    }
  }, [user, loading, router])

  const calculateCompletion = () => {
    let totalWeight = 0
    let completedWeight = 0

    sections.forEach(section => {
      totalWeight += section.weight
      const sectionFields = section.fields
      let sectionCompleted = true

      sectionFields.forEach(field => {
        if (!profileData[field] || (Array.isArray(profileData[field]) && profileData[field].length === 0)) {
          sectionCompleted = false
        }
      })

      if (sectionCompleted) {
        completedWeight += section.weight
      }
    })

    return Math.round((completedWeight / totalWeight) * 100)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile(profileData)
      // Move to next section or dashboard if complete
      if (calculateCompletion() >= 100) {
        router.push('/overview')
      } else if (activeSection < sections.length - 1) {
        setActiveSection(activeSection + 1)
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const renderSection = (section) => {
    switch (section.id) {
      case 1: // Basic Information
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={profileData.name || ''}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={profileData.email || ''}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={profileData.phone || ''}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={profileData.location || ''}
                  onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City, State/Country"
                />
              </div>
            </div>
          </div>
        )

      case 2: // Professional Summary
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Professional Summary *</label>
              <textarea
                value={profileData.professional_summary || ''}
                onChange={(e) => setProfileData({...profileData, professional_summary: e.target.value})}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Write a compelling summary of your professional background, skills, and career goals..."
              />
            </div>
          </div>
        )

      case 3: // Work Experience
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
              <button
                onClick={() => {
                  setAddingWork(true)
                  setEditingIndex(null)
                  setFormData({company: '', position: '', start_date: '', end_date: '', description: ''})
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>+</span>
                <span>Add Experience</span>
              </button>
            </div>

            {/* Existing Work Experience */}
            {profileData.work_experience && profileData.work_experience.length > 0 ? (
              <div className="space-y-4">
                {profileData.work_experience.map((exp, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                        <p className="text-gray-600">{exp.company}</p>
                        <p className="text-sm text-gray-500">
                          {exp.start_date} - {exp.end_date || 'Present'}
                        </p>
                        {exp.description && (
                          <p className="text-gray-700 mt-2">{exp.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingIndex(index)
                            setAddingWork(true)
                            setFormData(exp)
                          }}
                          className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            const updatedExperience = profileData.work_experience.filter((_, i) => i !== index)
                            setProfileData({...profileData, work_experience: updatedExperience})
                          }}
                          className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No work experience added yet. Click "Add Experience" to get started.
              </div>
            )}

            {/* Add/Edit Form */}
            {addingWork && (
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingIndex !== null ? 'Edit Experience' : 'Add New Experience'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Job title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                    <input
                      type="month"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="month"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Leave blank if current position"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your responsibilities and achievements..."
                  />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setAddingWork(false)
                      setEditingIndex(null)
                      setFormData({company: '', position: '', start_date: '', end_date: '', description: ''})
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!formData.company || !formData.position || !formData.start_date) {
                        alert('Please fill in all required fields')
                        return
                      }

                      const updatedExperience = [...(profileData.work_experience || [])]
                      if (editingIndex !== null) {
                        updatedExperience[editingIndex] = formData
                      } else {
                        updatedExperience.push(formData)
                      }

                      setProfileData({...profileData, work_experience: updatedExperience})
                      setAddingWork(false)
                      setEditingIndex(null)
                      setFormData({company: '', position: '', start_date: '', end_date: '', description: ''})
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingIndex !== null ? 'Update' : 'Add'} Experience
                  </button>
                </div>
              </div>
            )}
          </div>
        )

      case 4: // Education
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Education</h3>
              <button
                onClick={() => {
                  setAddingEducation(true)
                  setEditingEducationIndex(null)
                  setEducationFormData({institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', gpa: '', description: ''})
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>+</span>
                <span>Add Education</span>
              </button>
            </div>

            {/* Existing Education */}
            {profileData.education && profileData.education.length > 0 ? (
              <div className="space-y-4">
                {profileData.education.map((edu, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{edu.degree} in {edu.field_of_study}</h4>
                        <p className="text-gray-600">{edu.institution}</p>
                        <p className="text-sm text-gray-500">
                          {edu.start_date} - {edu.end_date || 'Present'}
                        </p>
                        {edu.gpa && (
                          <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>
                        )}
                        {edu.description && (
                          <p className="text-gray-700 mt-2">{edu.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingEducationIndex(index)
                            setAddingEducation(true)
                            setEducationFormData(edu)
                          }}
                          className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            const updatedEducation = profileData.education.filter((_, i) => i !== index)
                            setProfileData({...profileData, education: updatedEducation})
                          }}
                          className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No education added yet. Click "Add Education" to get started.
              </div>
            )}

            {/* Add/Edit Form */}
            {addingEducation && (
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingEducationIndex !== null ? 'Edit Education' : 'Add New Education'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Institution *</label>
                    <input
                      type="text"
                      value={educationFormData.institution}
                      onChange={(e) => setEducationFormData({...educationFormData, institution: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="University or School name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Degree *</label>
                    <input
                      type="text"
                      value={educationFormData.degree}
                      onChange={(e) => setEducationFormData({...educationFormData, degree: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. Bachelor's, Master's"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study *</label>
                    <input
                      type="text"
                      value={educationFormData.field_of_study}
                      onChange={(e) => setEducationFormData({...educationFormData, field_of_study: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. Computer Science, Business"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GPA</label>
                    <input
                      type="text"
                      value={educationFormData.gpa}
                      onChange={(e) => setEducationFormData({...educationFormData, gpa: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. 3.8"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                    <input
                      type="month"
                      value={educationFormData.start_date}
                      onChange={(e) => setEducationFormData({...educationFormData, start_date: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="month"
                      value={educationFormData.end_date}
                      onChange={(e) => setEducationFormData({...educationFormData, end_date: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Leave blank if current"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={educationFormData.description}
                    onChange={(e) => setEducationFormData({...educationFormData, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your academic achievements, relevant coursework, or extracurricular activities..."
                  />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setAddingEducation(false)
                      setEditingEducationIndex(null)
                      setEducationFormData({institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', gpa: '', description: ''})
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!educationFormData.institution || !educationFormData.degree || !educationFormData.field_of_study || !educationFormData.start_date) {
                        alert('Please fill in all required fields')
                        return
                      }

                      const updatedEducation = [...(profileData.education || [])]
                      if (editingEducationIndex !== null) {
                        updatedEducation[editingEducationIndex] = educationFormData
                      } else {
                        updatedEducation.push(educationFormData)
                      }

                      setProfileData({...profileData, education: updatedEducation})
                      setAddingEducation(false)
                      setEditingEducationIndex(null)
                      setEducationFormData({institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', gpa: '', description: ''})
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingEducationIndex !== null ? 'Update' : 'Add'} Education
                  </button>
                </div>
              </div>
            )}
          </div>
        )

      case 5: // Skills & Expertise
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills & Expertise *</label>
              <textarea
                value={profileData.skills || ''}
                onChange={(e) => setProfileData({...profileData, skills: e.target.value})}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="List your key skills, technologies, and areas of expertise..."
              />
            </div>
          </div>
        )

      case 6: // Projects & Achievements
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <p className="text-gray-600">Projects & Achievements section - Dynamic CRUD implementation needed</p>
            </div>
          </div>
        )

      case 7: // Certifications & Training
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <p className="text-gray-600">Certifications & Training section - Dynamic CRUD implementation needed</p>
            </div>
          </div>
        )

      case 8: // Preferred Career Details
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Desired Job Titles</label>
                <input
                  type="text"
                  value={profileData.desired_roles || ''}
                  onChange={(e) => setProfileData({...profileData, desired_roles: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Software Engineer, Product Manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Locations</label>
                <input
                  type="text"
                  value={profileData.preferred_locations || ''}
                  onChange={(e) => setProfileData({...profileData, preferred_locations: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. New York, Remote, San Francisco"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                <input
                  type="text"
                  value={profileData.salary_range || ''}
                  onChange={(e) => setProfileData({...profileData, salary_range: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. $80,000 - $120,000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                <select
                  value={profileData.employment_type || ''}
                  onChange={(e) => setProfileData({...profileData, employment_type: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select employment type</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Career Goals</label>
              <textarea
                value={profileData.career_goals || ''}
                onChange={(e) => setProfileData({...profileData, career_goals: e.target.value})}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your career goals and aspirations..."
              />
            </div>
          </div>
        )

      case 9: // Social & Professional Presence
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                <input
                  type="url"
                  value={profileData.linkedin || ''}
                  onChange={(e) => setProfileData({...profileData, linkedin: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Profile</label>
                <input
                  type="url"
                  value={profileData.github || ''}
                  onChange={(e) => setProfileData({...profileData, github: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://github.com/yourusername"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Personal Website</label>
                <input
                  type="url"
                  value={profileData.portfolio || ''}
                  onChange={(e) => setProfileData({...profileData, portfolio: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://yourwebsite.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Other Professional Links</label>
                <input
                  type="url"
                  value={profileData.other_links || ''}
                  onChange={(e) => setProfileData({...profileData, other_links: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Other professional profiles"
                />
              </div>
            </div>
          </div>
        )

      case 10: // Personality, Languages & Interests
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                <input
                  type="text"
                  value={profileData.languages || ''}
                  onChange={(e) => setProfileData({...profileData, languages: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. English (Native), Spanish (Intermediate)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hobbies & Interests</label>
                <input
                  type="text"
                  value={profileData.hobbies || ''}
                  onChange={(e) => setProfileData({...profileData, hobbies: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Reading, Hiking, Photography"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Style Preferences</label>
              <textarea
                value={profileData.work_style || ''}
                onChange={(e) => setProfileData({...profileData, work_style: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your preferred work environment and style..."
              />
            </div>
          </div>
        )

      case 11: // Profile Completion & Analytics
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Analytics</h3>
              <p className="text-gray-600">Your profile completion score: <strong>{calculateCompletion()}%</strong></p>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-1000"
                    style={{ width: `${calculateCompletion()}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return <div>Section not implemented</div>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <p className="text-gray-700 font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  const completionPercentage = calculateCompletion()

  return (
    <>
      <Head>
        <title>Complete Your Profile - TrueHire</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600 text-lg">Build a comprehensive profile to attract better job opportunities</p>
            <div className="mt-4 flex items-center justify-center space-x-4">
              <div className="text-2xl font-bold text-blue-600">{completionPercentage}% Complete</div>
              <div className="w-32 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Section Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Sections</h2>
                <div className="space-y-2">
                  {sections.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(index)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                        activeSection === index
                          ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{section.icon}</span>
                        <div>
                          <div className="font-medium">{section.title}</div>
                          <div className="text-xs text-gray-500">{section.weight}% weight</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {sections[activeSection].title}
                  </h2>
                  <p className="text-gray-600">
                    Complete this section to improve your profile completion score.
                  </p>
                </div>

                {renderSection(sections[activeSection])}

                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                    disabled={activeSection === 0}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {saving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                    <span>{saving ? 'Saving...' : 'Save & Continue'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}



