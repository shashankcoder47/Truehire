import { findMatchingJobsForUser } from '../../src/services/jobAlertService.js';

describe('weekly job alert matching', () => {
  test('matches jobs when at least one user skill appears in required skills', () => {
    const user = {
      core_skills: 'React.js, Node.js, MySQL',
      secondary_skills: '',
      soft_skills: '',
    };

    const jobs = [
      { id: 1, title: 'React Developer', skills_required: 'React, TypeScript' },
      { id: 2, title: 'Node.js Backend Developer', skills_required: 'Express, Node.js' },
      { id: 3, title: 'Graphic Designer', skills_required: 'Figma, Photoshop' },
    ];

    const matches = findMatchingJobsForUser(user, jobs);

    expect(matches.map((job) => job.title)).toEqual([
      'React Developer',
      'Node.js Backend Developer',
    ]);
  });
});
