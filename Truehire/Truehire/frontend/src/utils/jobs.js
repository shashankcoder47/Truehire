const allJobs = [
  {
    id: 1,
    slug: 'software-engineer',
    title: 'Software Engineer',
    company: 'Mudassir Pvt. Ltd.',
    level: 'Mid',
    location: 'San Francisco, CA',
    salary: '₹120k - ₹160k',
    type: 'Full-time',
    posted: '2 days ago',
    application_deadline: '2023-01-01T23:59:59Z', // Expired
    description: 'We are looking for a passionate Software Engineer to join our dynamic team. You will be working on cutting-edge technologies and contributing to products that impact millions of users worldwide.',
    requirements: [
      '3+ years of experience in software development',
      'Proficiency in React, Node.js, and Python',
      'Experience with cloud platforms (AWS, GCP, or Azure)',
      'Strong problem-solving skills and attention to detail',
      'Excellent communication and teamwork abilities'
    ],
    responsibilities: [
      'Design and develop scalable web applications',
      'Collaborate with cross-functional teams',
      'Write clean, maintainable, and well-documented code',
      'Participate in code reviews and technical discussions',
      'Contribute to architectural decisions and system design'
    ],
    benefits: [
      'Competitive salary and equity package',
      'Comprehensive health, dental, and vision insurance',
      'Flexible work arrangements and remote options',
      'Professional development budget',
      'Catered meals and wellness programs'
    ],
    skills: ['React', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes']
  },
  {
    id: 2,
    slug: 'product-manager',
    title: 'Product Manager',
    company: 'InnoGroup',
    level: 'Senior',
    location: 'New York, NY',
    salary: '₹140k - ₹180k',
    type: 'Full-time',
    posted: '1 week ago',
    application_deadline: '2024-12-31T23:59:59Z', // Future
    description: 'Join our product team as a Senior Product Manager and drive the development of innovative products that solve real-world problems. You will work closely with engineering, design, and business teams to deliver exceptional user experiences.',
    requirements: [
      '5+ years of product management experience',
      'Strong analytical and data-driven decision-making skills',
      'Experience with agile development methodologies',
      'Excellent stakeholder management and communication skills',
      'Technical background or ability to understand complex systems'
    ],
    responsibilities: [
      'Define product vision and strategy',
      'Conduct market research and competitive analysis',
      'Work with engineering teams to prioritize features',
      'Analyze product metrics and user feedback',
      'Collaborate with marketing and sales teams'
    ],
    benefits: [
      'Competitive compensation with performance bonuses',
      'Health, dental, and vision coverage',
      'Unlimited PTO and flexible hours',
      'Learning and development opportunities',
      'Stock options and retirement plans'
    ],
    skills: ['Product Strategy', 'Data Analysis', 'Agile', 'User Research', 'SQL', 'Analytics']
  },
  {
    id: 3,
    slug: 'ui-ux-designer',
    title: 'UI/UX Designer',
    company: 'DesignCo',
    level: 'Junior',
    location: 'Austin, TX',
    salary: '₹70k - ₹90k',
    type: 'Full-time',
    posted: '3 days ago',
    description: 'We are seeking a talented Junior UI/UX Designer to join our creative team. You will have the opportunity to work on exciting projects and contribute to the design of user-centered digital experiences.',
    requirements: [
      '1-2 years of UI/UX design experience',
      'Proficiency in Figma, Sketch, or Adobe Creative Suite',
      'Understanding of design principles and user-centered design',
      'Basic knowledge of HTML, CSS, and JavaScript',
      'Portfolio showcasing design projects'
    ],
    responsibilities: [
      'Create wireframes, prototypes, and high-fidelity designs',
      'Conduct user research and usability testing',
      'Collaborate with product and engineering teams',
      'Maintain design systems and style guides',
      'Present design concepts to stakeholders'
    ],
    benefits: [
      'Competitive salary with growth potential',
      'Health insurance and wellness programs',
      'Flexible work environment',
      'Design conference attendance budget',
      'Creative and collaborative work culture'
    ],
    skills: ['Figma', 'Sketch', 'Adobe XD', 'Prototyping', 'User Research', 'Design Systems']
  },
  {
    id: 4,
    slug: 'data-scientist',
    title: 'Data Scientist',
    company: 'DataLab',
    level: 'Mid',
    location: 'Seattle, WA',
    salary: '₹130k - ₹170k',
    type: 'Full-time',
    posted: '5 days ago',
    application_deadline: '2024-12-31T23:59:59Z', // Future
    description: 'Join our data science team to work on challenging problems and extract valuable insights from complex datasets. You will develop machine learning models and contribute to data-driven decision making across the organization.',
    requirements: [
      '3+ years of experience in data science or machine learning',
      'Strong programming skills in Python and R',
      'Experience with SQL and big data technologies',
      'Knowledge of statistical analysis and modeling',
      'Familiarity with machine learning frameworks'
    ],
    responsibilities: [
      'Develop and deploy machine learning models',
      'Analyze large datasets to extract insights',
      'Create data visualizations and reports',
      'Collaborate with business teams on data projects',
      'Stay current with latest data science techniques'
    ],
    benefits: [
      'Competitive salary and benefits package',
      'Health, dental, and vision insurance',
      'Professional development opportunities',
      'Flexible work arrangements',
      'Collaborative and innovative environment'
    ],
    skills: ['Python', 'R', 'SQL', 'Machine Learning', 'TensorFlow', 'Pandas', 'Tableau']
  },
  {
    id: 5,
    slug: 'devops-engineer',
    title: 'DevOps Engineer',
    company: 'InfraWorks',
    level: 'Senior',
    location: 'Remote',
    salary: '₹140k - ₹180k',
    type: 'Full-time',
    posted: '1 day ago',
    application_deadline: '2024-12-31T23:59:59Z', // Future
    description: 'We are looking for an experienced DevOps Engineer to help us build and maintain robust, scalable infrastructure. You will work on automating deployment processes and ensuring high availability of our systems.',
    requirements: [
      '5+ years of DevOps or infrastructure experience',
      'Strong experience with AWS or GCP',
      'Proficiency in infrastructure as code tools',
      'Knowledge of containerization and orchestration',
      'Experience with CI/CD pipelines'
    ],
    responsibilities: [
      'Design and maintain cloud infrastructure',
      'Implement and improve CI/CD pipelines',
      'Monitor system performance and reliability',
      'Automate deployment and scaling processes',
      'Ensure security best practices'
    ],
    benefits: [
      'Competitive compensation package',
      'Comprehensive health benefits',
      'Remote work flexibility',
      'Technology stipend',
      'Professional certification support'
    ],
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Monitoring', 'Security']
  }
]

export const jobs = allJobs.filter(job => new Date(job.application_deadline) > new Date())
