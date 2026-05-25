export function buildJob(overrides = {}) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return {
    title: `QA Automation Engineer ${suffix}`,
    company: 'TrueHire QA Labs',
    location: 'Bengaluru',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID_LEVEL',
    salaryMin: 900000,
    salaryMax: 1200000,
    salaryCurrency: 'INR',
    description: 'Own automated regression, API quality gates, and performance validation.',
    requirements: ['Playwright', 'API testing', 'SQL basics', 'CI/CD'],
    skillsRequired: 'Playwright, JavaScript, API Testing, SQL',
    status: 'OPEN',
    ...overrides
  };
}

export function buildCandidateProfile(overrides = {}) {
  return {
    name: `QA Candidate ${Math.random().toString(36).slice(2, 7)}`,
    phone: `90000${Math.floor(10000 + Math.random() * 89999)}`,
    headline: 'Automation-focused QA Engineer',
    location: 'Bengaluru',
    skills: 'Playwright, JavaScript, API Testing, SQL',
    ...overrides
  };
}

export const maliciousPayloads = {
  sqlInjection: "' OR '1'='1",
  xss: '<script>alert("xss")</script>',
  invalidJwt: 'Bearer invalid.jwt.token'
};
