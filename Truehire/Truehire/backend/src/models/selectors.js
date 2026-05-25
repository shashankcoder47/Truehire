export const baseUserSelect = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  phone: true,
  headline: true,
  location: true,
  bio: true,
  createdAt: true,
  updatedAt: true,
};

export const recruiterSelect = {
  id: true,
  userId: true,
  companyName: true,
  companyWebsite: true,
  companySize: true,
  industry: true,
  companyDescription: true,
  headquarters: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
};

export const safeUserSelect = {
  ...baseUserSelect,
  recruiter: {
    select: recruiterSelect,
  },
};

export const userWithoutRecruiterSelect = {
  ...baseUserSelect,
};

export const jobListSelect = {
  id: true,
  title: true,
  description: true,
  location: true,
  employmentType: true,
  salaryMin: true,
  salaryMax: true,
  requirements: true,
  status: true,
  applicationDue: true,
  createdAt: true,
  updatedAt: true,
  recruiter: {
    select: {
      ...recruiterSelect,
      user: {
        select: {
          ...userWithoutRecruiterSelect,
        },
      },
    },
  },
};
