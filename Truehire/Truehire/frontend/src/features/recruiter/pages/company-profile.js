import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

export default function CompanyProfile() {
  const [recruiterData, setRecruiterData] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [activeTab, setActiveTab] = useState('overview')
  const [logoPreview, setLogoPreview] = useState(null)
  const [backgroundImagePreview, setBackgroundImagePreview] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Check if recruiter is logged in
    const isLoggedIn = localStorage.getItem('recruiterLoggedIn')
    const data = localStorage.getItem('recruiterData')

    if (!isLoggedIn || !data) {
      router.push('/login')
      return
    }

    const parsedData = JSON.parse(data)
    setRecruiterData(parsedData)
    setFormData(parsedData)
  }, [router])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('recruiterData', JSON.stringify(formData))
    setRecruiterData(formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData(recruiterData)
    setIsEditing(false)
    setLogoPreview(null)
    setBackgroundImagePreview(null)
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target.result)
        setFormData(prev => ({
          ...prev,
          logo: e.target.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBackgroundImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setBackgroundImagePreview(e.target.result)
        setFormData(prev => ({
          ...prev,
          backgroundImage: e.target.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const calculateProfileCompletion = () => {
    const fields = ['company', 'name', 'email', 'industry', 'description', 'website', 'companySize']
    const filledFields = fields.filter(field => recruiterData[field] && recruiterData[field].trim() !== '')
    return Math.round((filledFields.length / fields.length) * 100)
  }

  if (!recruiterData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Company Profile - TrueHire</title>
      </Head>

      <Header />
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Profile Completion */}
          <div className="relative bg-white rounded-lg shadow-sm p-6 mb-8 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-10"
              style={{ backgroundImage: 'url(/images/truerizelogon.png), url(/images/truerizelogon.png.jpg)' }}
            ></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
                  <p className="text-gray-600 mt-1">Manage your company information and settings</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Profile Complete</div>
                    <div className="text-2xl font-bold text-green-600">{calculateProfileCompletion()}%</div>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn btn-primary px-6 py-2"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        className="btn btn-primary px-4 py-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="btn btn-secondary px-4 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProfileCompletion()}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'details'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Company Details
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'team'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Team
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'settings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Settings
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Company Logo and Basic Info */}
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {isEditing ? (
                          <div className="text-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoChange}
                              className="hidden"
                              id="logo-upload"
                            />
                            <label htmlFor="logo-upload" className="cursor-pointer">
                              {(logoPreview || formData.logo) ? (
                                <img
                                  src={logoPreview || formData.logo}
                                  alt="Company Logo"
                                  className="w-24 h-24 object-cover"
                                />
                              ) : (
                                <div className="text-gray-400">
                                  <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <div className="text-xs">Upload Logo</div>
                                </div>
                              )}
                            </label>
                          </div>
                        ) : (
                          formData.logo ? (
                            <img
                              src={formData.logo}
                              alt="Company Logo"
                              className="w-24 h-24 object-cover"
                            />
                          ) : (
                            <div className="text-gray-400">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900">{recruiterData.company}</h2>
                      <p className="text-gray-600 mt-1">{recruiterData.industry || 'Industry not specified'}</p>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Company Size</div>
                          <div className="font-medium">{recruiterData.companySize || 'Not specified'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Founded</div>
                          <div className="font-medium">{recruiterData.foundedYear || 'Not specified'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white mr-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{recruiterData.activeJobs || 0}</p>
                          <p className="text-sm text-gray-600">Active Jobs</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white mr-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{recruiterData.applicationsReceived || 0}</p>
                          <p className="text-sm text-gray-600">Applications</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white mr-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{recruiterData.jobsPosted || 0}</p>
                          <p className="text-sm text-gray-600">Jobs Posted</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white mr-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{calculateProfileCompletion()}%</p>
                          <p className="text-sm text-gray-600">Profile Complete</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About {recruiterData.company}</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {recruiterData.description || 'No company description provided yet. Add a description to help candidates learn more about your organization.'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-8">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Company Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Name *
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="company"
                            value={formData.company || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        ) : (
                          <p className="text-gray-900 py-2">{recruiterData.company}</p>
                        )}
                      </div>

                      {/* Founded Year */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Founded Year
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            name="foundedYear"
                            value={formData.foundedYear || ''}
                            onChange={handleInputChange}
                            min="1800"
                            max={new Date().getFullYear()}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900 py-2">{recruiterData.foundedYear || 'Not specified'}</p>
                        )}
                      </div>

                      {/* Industry */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Industry *
                        </label>
                        {isEditing ? (
                          <select
                            name="industry"
                            value={formData.industry || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Industry</option>
                            <option value="Technology">Technology</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Finance">Finance</option>
                            <option value="Education">Education</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Retail">Retail</option>
                            <option value="Consulting">Consulting</option>
                            <option value="Other">Other</option>
                          </select>
                        ) : (
                          <p className="text-gray-900 py-2">{recruiterData.industry || 'Not specified'}</p>
                        )}
                      </div>

                      {/* Company Size */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Size *
                        </label>
                        {isEditing ? (
                          <select
                            name="companySize"
                            value={formData.companySize || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Company Size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="501-1000">501-1000 employees</option>
                            <option value="1000+">1000+ employees</option>
                          </select>
                        ) : (
                          <p className="text-gray-900 py-2">{recruiterData.companySize || 'Not specified'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        {isEditing ? (
                          <input
                            type="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        ) : (
                          <p className="text-gray-900 py-2">{recruiterData.email}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900 py-2">{recruiterData.phone || 'Not provided'}</p>
                        )}
                      </div>

                      {/* Website */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Website
                        </label>
                        {isEditing ? (
                          <input
                            type="url"
                            name="website"
                            value={formData.website || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://www.example.com"
                          />
                        ) : (
                          <p className="text-gray-900 py-2">
                            {recruiterData.website ? (
                              <a href={recruiterData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {recruiterData.website}
                              </a>
                            ) : (
                              'Not provided'
                            )}
                          </p>
                        )}
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="address"
                            value={formData.address || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Street address, city, state, zip"
                          />
                        ) : (
                          <p className="text-gray-900 py-2">{recruiterData.address || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Social Media */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Social Media</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* LinkedIn */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          LinkedIn
                        </label>
                        {isEditing ? (
                          <input
                            type="url"
                            name="linkedin"
                            value={formData.linkedin || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://linkedin.com/company/yourcompany"
                          />
                        ) : (
                          <p className="text-gray-900 py-2">
                            {recruiterData.linkedin ? (
                              <a href={recruiterData.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                LinkedIn Profile
                              </a>
                            ) : (
                              'Not provided'
                            )}
                          </p>
                        )}
                      </div>

                      {/* Twitter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Twitter
                        </label>
                        {isEditing ? (
                          <input
                            type="url"
                            name="twitter"
                            value={formData.twitter || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://twitter.com/yourcompany"
                          />
                        ) : (
                          <p className="text-gray-900 py-2">
                            {recruiterData.twitter ? (
                              <a href={recruiterData.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Twitter Profile
                              </a>
                            ) : (
                              'Not provided'
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Company Branding */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Company Branding</h3>
                    <div className="space-y-6">
                      {/* Background Image */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Background Image
                        </label>
                        {isEditing ? (
                          <div className="flex items-center space-x-4">
                            <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                              {(backgroundImagePreview || formData.backgroundImage) ? (
                                <img
                                  src={backgroundImagePreview || formData.backgroundImage}
                                  alt="Background Image"
                                  className="w-32 h-20 object-cover"
                                />
                              ) : (
                                <div className="text-gray-400">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleBackgroundImageChange}
                                className="hidden"
                                id="background-upload"
                              />
                              <label htmlFor="background-upload" className="cursor-pointer btn btn-secondary px-4 py-2">
                                Upload Background
                              </label>
                              <p className="text-xs text-gray-500 mt-1">Recommended: 1200x400px, max 2MB</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-4">
                            <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                              {formData.backgroundImage ? (
                                <img
                                  src={formData.backgroundImage}
                                  alt="Background Image"
                                  className="w-32 h-20 object-cover"
                                />
                              ) : (
                                <div className="text-gray-400">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-gray-900">
                                {formData.backgroundImage ? 'Background image uploaded' : 'No background image set'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Company Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Company Description</h3>
                    {isEditing ? (
                      <textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleInputChange}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tell candidates about your company culture, values, mission, and what makes your organization unique..."
                      />
                    ) : (
                      <p className="text-gray-700 leading-relaxed">
                        {recruiterData.description || 'No company description provided yet.'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div className="space-y-8">
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Team Information Coming Soon</h4>
                    <p className="text-gray-600 mb-4">This feature will allow you to showcase your team members and their roles.</p>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-8">


                  {/* Billing & Plans */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing & Plans</h3>
                    <p className="text-gray-600 mb-4">View your current plan, billing history, and manage subscriptions.</p>
                    <button
                      onClick={() => router.push('/billing-plans')}
                      className="btn btn-primary px-6 py-2"
                    >
                      View Billing & Plans
                    </button>
                  </div>

                  {/* Recruiter Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Recruiter Information</h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Name *
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="name"
                              value={formData.name || ''}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          ) : (
                            <p className="text-gray-900 py-2">{recruiterData.name}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Role *
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="role"
                              value={formData.role || ''}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          ) : (
                            <p className="text-gray-900 py-2">{recruiterData.role}</p>
                          )}
                        </div>
                      </div>

                      {/* Business Hours */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Hours
                        </label>
                        {isEditing ? (
                          <textarea
                            name="businessHours"
                            value={formData.businessHours || ''}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Monday-Friday: 9:00 AM - 6:00 PM"
                          />
                        ) : (
                          <p className="text-gray-900 py-2">{recruiterData.businessHours || 'Not specified'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}


