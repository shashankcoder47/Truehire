import { calculateRecommendationScore } from '../../src/services/jobRecommendationService.js';

describe('job recommendation skill matching', () => {
  test('matches job required skills against secondary profile skills', () => {
    const match = calculateRecommendationScore({
      job: {
        skills_required: 'React, Node.js',
      },
      user: {
        core_skills: '',
        secondary_skills: 'React',
        soft_skills: '',
      },
    });

    expect(match.score).toBeGreaterThan(0);
    expect(match.matchedCoreSkills).toContain('react');
  });
});
