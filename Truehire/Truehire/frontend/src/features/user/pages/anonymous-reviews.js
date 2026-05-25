import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function AnonymousReviews() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [newReview, setNewReview] = useState({
    company: '',
    rating: 5,
    title: '',
    review: '',
    pros: '',
    cons: '',
    advice: ''
  })
  const [filter, setFilter] = useState('all')

  const router = useRouter()

  // Mock reviews data
  const mockReviews = [
    {
      id: 1,
      company: 'TechCorp',
      rating: 4,
      title: 'Great work-life balance but slow growth',
      review: 'TechCorp offers excellent work-life balance with flexible hours and remote work options. The company culture is collaborative and supportive.',
      pros: 'Flexible work hours, good benefits, collaborative culture',
      cons: 'Limited career advancement opportunities, slow decision-making process',
      advice: 'Great for mid-level professionals looking for stability',
      date: '2024-01-15',
      helpful: 23
    },
    {
      id: 2,
      company: 'InnovateLabs',
      rating: 3,
      title: 'Innovative but high pressure environment',
      review: 'InnovateLabs is at the forefront of technology innovation. However, the work environment can be quite demanding with tight deadlines.',
      pros: 'Cutting-edge technology, learning opportunities, competitive salary',
      cons: 'High stress levels, long working hours, frequent overtime',
      advice: 'Perfect for those who thrive under pressure and want to work on innovative projects',
      date: '2024-01-10',
      helpful: 18
    },
    {
      id: 3,
      company: 'DataFlow',
      rating: 5,
      title: 'Excellent company with great benefits',
      review: 'DataFlow provides outstanding benefits including comprehensive health coverage, retirement plans, and professional development opportunities.',
      pros: 'Excellent benefits, professional development, supportive management',
      cons: 'Work can be repetitive at times',
      advice: 'Ideal for career growth and long-term stability',
      date: '2024-01-08',
      helpful: 31
    }
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

    // Load reviews
    setReviews(mockReviews)
  }, [router])

  const handleSubmitReview = (e) => {
    e.preventDefault()
    const review = {
      id: reviews.length + 1,
      ...newReview,
      date: new Date().toISOString().split('T')[0],
      helpful: 0
    }
    setReviews([review, ...reviews])
    setNewReview({
      company: '',
      rating: 5,
      title: '',
      review: '',
      pros: '',
      cons: '',
      advice: ''
    })
    setShowWriteReview(false)
  }

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true
    if (filter === '5') return review.rating === 5
    if (filter === '4') return review.rating >= 4
    if (filter === '3') return review.rating >= 3
    if (filter === '1-2') return review.rating <= 2
    return true
  })

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Anonymous Reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Anonymous Reviews - TrueHire</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/welcome" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              ← Back to Welcome
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ⭐ Anonymous Reviews
            </h1>
            <p className="text-xl text-gray-600">
              Read and write anonymous company reviews to help others make informed decisions
            </p>
          </div>

          {/* Write Review Button */}
          <div className="text-center mb-8">
            <button
              onClick={() => setShowWriteReview(!showWriteReview)}
              className="btn btn-primary"
            >
              {showWriteReview ? 'Cancel Review' : 'Write a Review'}
            </button>
          </div>

          {/* Write Review Form */}
          {showWriteReview && (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Write Your Review</h2>
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newReview.company}
                      onChange={(e) => setNewReview({...newReview, company: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overall Rating *
                    </label>
                    <select
                      value={newReview.rating}
                      onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
                      <option value={4}>⭐⭐⭐⭐ Very Good</option>
                      <option value={3}>⭐⭐⭐ Good</option>
                      <option value={2}>⭐⭐ Fair</option>
                      <option value={1}>⭐ Poor</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newReview.title}
                    onChange={(e) => setNewReview({...newReview, title: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Summarize your experience"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={newReview.review}
                    onChange={(e) => setNewReview({...newReview, review: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Share your detailed experience working at this company"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pros
                    </label>
                    <textarea
                      rows={3}
                      value={newReview.pros}
                      onChange={(e) => setNewReview({...newReview, pros: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="What did you like?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cons
                    </label>
                    <textarea
                      rows={3}
                      value={newReview.cons}
                      onChange={(e) => setNewReview({...newReview, cons: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="What could be improved?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Advice to Management
                    </label>
                    <textarea
                      rows={3}
                      value={newReview.advice}
                      onChange={(e) => setNewReview({...newReview, advice: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Suggestions for improvement"
                    />
                  </div>
                </div>

                <div className="text-center">
                  <button type="submit" className="btn btn-primary">
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
            <div className="flex flex-wrap items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 mb-4 md:mb-0">Company Reviews</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  All Reviews
                </button>
                <button
                  onClick={() => setFilter('5')}
                  className={`px-4 py-2 rounded-lg ${filter === '5' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  5 Stars
                </button>
                <button
                  onClick={() => setFilter('4')}
                  className={`px-4 py-2 rounded-lg ${filter === '4' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  4+ Stars
                </button>
                <button
                  onClick={() => setFilter('3')}
                  className={`px-4 py-2 rounded-lg ${filter === '3' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  3+ Stars
                </button>
                <button
                  onClick={() => setFilter('1-2')}
                  className={`px-4 py-2 rounded-lg ${filter === '1-2' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  1-2 Stars
                </button>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            {filteredReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{review.company}</h3>
                    <div className="flex items-center mt-1">
                      {renderStars(review.rating)}
                      <span className="ml-2 text-gray-600">{review.rating}/5</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{review.date}</span>
                </div>

                <h4 className="text-lg font-semibold text-gray-900 mb-3">{review.title}</h4>
                <p className="text-gray-700 mb-4">{review.review}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {review.pros && (
                    <div>
                      <h5 className="font-semibold text-green-700 mb-1">✅ Pros</h5>
                      <p className="text-sm text-gray-700">{review.pros}</p>
                    </div>
                  )}
                  {review.cons && (
                    <div>
                      <h5 className="font-semibold text-red-700 mb-1">❌ Cons</h5>
                      <p className="text-sm text-gray-700">{review.cons}</p>
                    </div>
                  )}
                  {review.advice && (
                    <div>
                      <h5 className="font-semibold text-blue-700 mb-1">💡 Advice</h5>
                      <p className="text-sm text-gray-700">{review.advice}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Was this review helpful?</span>
                  <div className="flex items-center space-x-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      👍 Helpful ({review.helpful})
                    </button>
                    <button className="text-gray-600 hover:text-gray-800 text-sm">
                      Report
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredReviews.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews found</h3>
              <p className="text-gray-600">Try adjusting your filters or be the first to write a review!</p>
            </div>
          )}

          {/* Guidelines */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Guidelines</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">✅ Do's</h3>
                <ul className="text-gray-700 space-y-2">
                  <li>• Be honest and constructive</li>
                  <li>• Focus on your actual experience</li>
                  <li>• Include specific examples</li>
                  <li>• Consider both pros and cons</li>
                  <li>• Keep it professional</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">❌ Don'ts</h3>
                <ul className="text-gray-700 space-y-2">
                  <li>• Include personal identifiable information</li>
                  <li>• Use offensive or discriminatory language</li>
                  <li>• Make unsubstantiated claims</li>
                  <li>• Spam or post duplicate reviews</li>
                  <li>• Violate company policies or laws</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}



