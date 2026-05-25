import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

export default function Salary() {
  const [selectedRole, setSelectedRole] = useState('Software Engineer')
  const [experienceYears, setExperienceYears] = useState(3)

  const roles = [
    { name: 'Software Engineer', salary: '₹5L – ₹12L' },
    { name: 'Data Analyst', salary: '₹4L – ₹10L' },
    { name: 'UI/UX Designer', salary: '₹4.5L – ₹11L' },
    { name: 'Digital Marketing Manager', salary: '₹5L – ₹15L' },
    { name: 'HR Executive', salary: '₹3.5L – ₹8L' }
  ]

  const experienceLevels = [
    { level: 'Entry-Level (0–2 yrs)', salary: '₹3.5L – ₹6.5L' },
    { level: 'Mid-Level (3–5 yrs)', salary: '₹5.5L – ₹12L' },
    { level: 'Senior-Level (6–10 yrs)', salary: '₹10L – ₹20L' },
    { level: 'Leadership (10+ yrs)', salary: '₹18L – ₹35L' }
  ]

  const skills = [
    { name: 'AI / ML / Data Analytics', salary: '₹12L – ₹25L' },
    { name: 'Full Stack / Cloud Development', salary: '₹8L – ₹20L' },
    { name: 'Digital Marketing & SEO', salary: '₹6L – ₹15L' },
    { name: 'UI/UX & Product Design', salary: '₹5L – ₹14L' }
  ]

  const getExperienceSalary = (years) => {
    if (years <= 2) return '₹3.5L – ₹6.5L'
    if (years <= 5) return '₹5.5L – ₹12L'
    if (years <= 10) return '₹10L – ₹20L'
    return '₹18L – ₹35L'
  }

  const selectedRoleData = roles.find(role => role.name === selectedRole)

  return (
    <>
      <Head>
        <title>Salary Guide — Bengaluru | TrueHire</title>
        <meta name="description" content="Explore comprehensive salary insights for Bengaluru's job market. Compare salaries by role, experience, and skills with our interactive salary guide." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="gradient-bg py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Salary Guide
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-8">
              Know Your Worth | Make Informed Career Decisions in Bengaluru
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Welcome to TrueHire's Bengaluru Salary Guide! We provide transparent salary insights to help job seekers understand their market value and assist employers in benchmarking competitive pay packages. This guide is updated regularly to reflect the latest trends in Bengaluru's job market.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Explore Salaries by Role */}
          <section className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
              Explore Salaries by Role (Bengaluru)
            </h2>

            {/* Dropdown Filter */}
            <div className="mb-8 flex justify-center">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roles.map((role) => (
                  <option key={role.name} value={role.name}>{role.name}</option>
                ))}
              </select>
            </div>

            {/* Salary Display */}
            <div className="bg-blue-50 rounded-xl p-8 text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{selectedRole}</h3>
              <p className="text-3xl font-bold text-blue-600">{selectedRoleData?.salary}</p>
              <p className="text-gray-600 mt-2">Average Salary (INR / Year)</p>
            </div>

            {/* Full Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 border-b text-left text-gray-900 font-semibold">Job Role</th>
                    <th className="px-6 py-4 border-b text-left text-gray-900 font-semibold">Average Salary (INR / Year)</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role, index) => (
                    <tr key={role.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 border-b text-gray-700 font-medium">{role.name}</td>
                      <td className="px-6 py-4 border-b text-gray-700">{role.salary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Compare Salaries by Experience */}
          <section className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
              Compare Salaries by Experience
            </h2>

            {/* Interactive Slider */}
            <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
              <div className="mb-6">
                <label className="block text-lg font-medium text-gray-700 mb-4">
                  Years of Experience: {experienceYears} years
                </label>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>0 yrs</span>
                  <span>5 yrs</span>
                  <span>10 yrs</span>
                  <span>15+ yrs</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 mb-2">{getExperienceSalary(experienceYears)}</p>
                <p className="text-gray-600">Estimated Salary Range</p>
              </div>
            </div>

            {/* Experience Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 border-b text-left text-gray-900 font-semibold">Experience Level</th>
                    <th className="px-6 py-4 border-b text-left text-gray-900 font-semibold">Average Salary (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {experienceLevels.map((exp, index) => (
                    <tr key={exp.level} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 border-b text-gray-700 font-medium">{exp.level}</td>
                      <td className="px-6 py-4 border-b text-gray-700">{exp.salary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-yellow-800 text-sm italic">
                Tip: Add interactive sliders so users can see salary based on their years of experience.
              </p>
            </div>
          </section>

          {/* Skills & In-Demand Roles */}
          <section className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
              Skills & In-Demand Roles in Bengaluru
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {skills.map((skill, index) => (
                <div key={skill.name} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{skill.name}</h3>
                  <p className="text-2xl font-bold text-blue-600">{skill.salary}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 text-sm">
                Highlight high-demand skills to help candidates plan upskilling.
              </p>
            </div>
          </section>

          {/* Salary Trends */}
          <section className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
              Salary Trends in Bengaluru
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Market Insights</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Tech and IT jobs dominate Bengaluru with salaries above the national average
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Startups often offer perks and equity along with base pay
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Specialized skills in AI, Cloud, and Data Analytics command premium salaries
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Average salary growth: 10–15% year-over-year for tech and digital roles
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Visual Trend Chart</h3>
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-gray-600">Interactive chart showing salary growth trends</p>
                    <p className="text-sm text-gray-500 mt-2">Visual idea: Include a bar chart or line chart showing trend growth</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Tools & Features */}
          <section className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
              Interactive Tools & Features
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <div className="text-4xl mb-4">🧮</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Bengaluru Salary Calculator</h3>
                <p className="text-gray-600 text-sm">Enter role, experience, and skills to get personalized salary range</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <div className="text-4xl mb-4">⚖️</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Compare Roles</h3>
                <p className="text-gray-600 text-sm">Side-by-side salary comparison for different roles</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <div className="text-4xl mb-4">📄</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Download Salary Report</h3>
                <p className="text-gray-600 text-sm">PDF with Bengaluru-specific insights</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">Job Suggestions: Explore jobs matching expected salary in Bengaluru</p>
            </div>
          </section>

          {/* Call-to-Actions */}
          <section className="mb-16">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                Ready to Check Your Bengaluru Salary?
              </h2>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button className="btn btn-primary px-8 py-4 text-lg">
                  Check Your Bengaluru Salary →
                </button>
                <button className="btn btn-secondary px-8 py-4 text-lg">
                  Compare Roles →
                </button>
                <button className="btn btn-secondary px-8 py-4 text-lg">
                  Download Salary Report →
                </button>
              </div>
            </div>
          </section>

          {/* Footer Note */}
          <section className="text-center">
            <div className="bg-gray-100 rounded-xl p-8">
              <p className="text-gray-600 italic">
                "All data is based on verified Bengaluru job postings, market research, and employer submissions. Updated regularly to reflect the latest trends in Bengaluru."
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}



