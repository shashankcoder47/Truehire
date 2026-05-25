import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function LearningHub() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const router = useRouter()

  // Mock learning resources
  const learningResources = [
    {
      id: 1,
      title: 'Mastering Technical Interviews',
      category: 'interview',
      type: 'course',
      duration: '2 hours',
      level: 'Intermediate',
      description: 'Learn proven strategies to ace technical interviews with hands-on practice.',
      skills: ['Problem Solving', 'Communication', 'Technical Knowledge'],
      rating: 4.8,
      students: 1250,
      instructor: 'Sarah Johnson',
      thumbnail: '🎯'
    },
    {
      id: 2,
      title: 'Resume Writing Masterclass',
      category: 'resume',
      type: 'workshop',
      duration: '1.5 hours',
      level: 'Beginner',
      description: 'Create compelling resumes that get noticed by recruiters and ATS systems.',
      skills: ['Resume Writing', 'ATS Optimization', 'Personal Branding'],
      rating: 4.9,
      students: 2100,
      instructor: 'Mike Chen',
      thumbnail: '📄'
    },
    {
      id: 3,
      title: 'Negotiation Skills for Job Offers',
      category: 'negotiation',
      type: 'course',
      duration: '1 hour',
      level: 'All Levels',
      description: 'Learn how to negotiate salary, benefits, and job terms confidently.',
      skills: ['Negotiation', 'Communication', 'Business Acumen'],
      rating: 4.7,
      students: 890,
      instructor: 'Lisa Rodriguez',
      thumbnail: '💰'
    },
    {
      id: 4,
      title: 'LinkedIn Profile Optimization',
      category: 'networking',
      type: 'guide',
      duration: '45 minutes',
      level: 'Beginner',
      description: 'Transform your LinkedIn profile into a powerful networking tool.',
      skills: ['Personal Branding', 'Networking', 'Social Media'],
      rating: 4.6,
      students: 1800,
      instructor: 'David Park',
      thumbnail: '💼'
    },
    {
      id: 5,
      title: 'Behavioral Interview Questions',
      category: 'interview',
      type: 'practice',
      duration: '3 hours',
      level: 'Intermediate',
      description: 'Practice answering common behavioral interview questions with expert feedback.',
      skills: ['Communication', 'Storytelling', 'Self-Reflection'],
      rating: 4.8,
      students: 950,
      instructor: 'Emma Wilson',
      thumbnail: '🗣️'
    },
    {
      id: 6,
      title: 'Career Transition Guide',
      category: 'career',
      type: 'guide',
      duration: '2.5 hours',
      level: 'All Levels',
      description: 'Navigate career changes successfully with this comprehensive guide.',
      skills: ['Career Planning', 'Skill Assessment', 'Job Search'],
      rating: 4.5,
      students: 750,
      instructor: 'James Thompson',
      thumbnail: '🚀'
    }
  ]

  const categories = [
    { id: 'all', name: 'All Resources', icon: '📚' },
    { id: 'interview', name: 'Interview Prep', icon: '🎯' },
    { id: 'resume', name: 'Resume & CV', icon: '📄' },
    { id: 'negotiation', name: 'Negotiation', icon: '💰' },
    { id: 'networking', name: 'Networking', icon: '🤝' },
    { id: 'career', name: 'Career Development', icon: '🚀' }
  ]

  useEffect(() => {
    // Check authentication
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const storedUserData = localStorage.getItem('userData')
        if (storedUserData) {
          const userData = JSON.parse(storedUserData)
          setUser(userData)
        } else {
          setUser({
            name: 'Professional User',
            email: 'user@example.com',
            role: 'Job Seeker'
          })
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const filteredResources = learningResources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="text-yellow-400">★</span>
        ))}
        {hasHalfStar && <span className="text-yellow-400">☆</span>}
        {[...Array(5 - Math.ceil(rating))].map((_, i) => (
          <span key={i} className="text-gray-300">☆</span>
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Learning Hub...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Learning Hub - TrueHire</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/welcome" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              ← Back to Welcome
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎓 Learning Hub
            </h1>
            <p className="text-xl text-gray-600">
              Access career development resources and improve your job search skills
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search resources, skills, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Learning Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{resource.thumbnail}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      resource.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                      resource.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {resource.level}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{resource.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{resource.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">⏱️</span>
                      {resource.duration}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">👨‍🏫</span>
                      {resource.instructor}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">👥</span>
                      {resource.students.toLocaleString()} students
                    </div>
                  </div>

                  {renderStars(resource.rating)}

                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Skills you'll learn:</h4>
                    <div className="flex flex-wrap gap-1">
                      {resource.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                          {skill}
                        </span>
                      ))}
                      {resource.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs">
                          +{resource.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <button className="w-full btn btn-primary">
                    Start Learning
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600">Try adjusting your search terms or category filters.</p>
            </div>
          )}

          {/* Learning Paths */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended Learning Paths</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Interview Success Path</h3>
                <p className="text-gray-600 mb-4">Complete roadmap for acing technical and behavioral interviews.</p>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div>✅ Resume Optimization</div>
                  <div>✅ Technical Interview Prep</div>
                  <div>✅ Behavioral Questions</div>
                  <div>✅ Negotiation Skills</div>
                </div>
                <button className="btn btn-primary">Start Path</button>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🚀 Career Advancement Path</h3>
                <p className="text-gray-600 mb-4">Skills and strategies for professional growth and higher positions.</p>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div>✅ Leadership Skills</div>
                  <div>✅ Networking Strategies</div>
                  <div>✅ Personal Branding</div>
                  <div>✅ Career Planning</div>
                </div>
                <button className="btn btn-primary">Start Path</button>
              </div>
            </div>
          </div>

          {/* Progress Tracking */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Learning Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-2">📚</div>
                <div className="text-2xl font-bold text-blue-600">3</div>
                <div className="text-gray-600">Courses Started</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-2xl font-bold text-green-600">12</div>
                <div className="text-gray-600">Lessons Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🏆</div>
                <div className="text-2xl font-bold text-purple-600">2</div>
                <div className="text-gray-600">Certificates Earned</div>
              </div>
            </div>
          </div>

          {/* Featured Instructors */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Instructors</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { name: 'Sarah Johnson', specialty: 'Interview Coach', rating: 4.9, courses: 15 },
                { name: 'Mike Chen', specialty: 'Resume Expert', rating: 4.8, courses: 12 },
                { name: 'Lisa Rodriguez', specialty: 'Negotiation Specialist', rating: 4.9, courses: 8 },
                { name: 'David Park', specialty: 'Career Advisor', rating: 4.7, courses: 20 }
              ].map((instructor, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-xl font-bold">
                      {instructor.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{instructor.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{instructor.specialty}</p>
                  <div className="flex items-center justify-center mb-1">
                    {renderStars(instructor.rating)}
                  </div>
                  <p className="text-xs text-gray-500">{instructor.courses} courses</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}



