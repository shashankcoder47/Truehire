import { createShortlistedEmailTemplate } from '../../src/utils/sendEmail.js';

describe('shortlisted email template', () => {
  test('uses the job company name in the footer signature', () => {
    const html = createShortlistedEmailTemplate({
      candidateName: 'SHAIK MUDASSIR',
      jobTitle: 'BRO',
      companyName: 'WIPRO',
    });

    expect(html).toContain('Best Regards,<br />');
    expect(html).toContain('<strong>WIPRO</strong>');
    expect(html).not.toContain('TrueHire Recruitment Team');
  });

  test('escapes the company name before rendering it', () => {
    const html = createShortlistedEmailTemplate({
      candidateName: 'Candidate',
      jobTitle: 'Engineer',
      companyName: '<Acme & Co>',
    });

    expect(html).toContain('<strong>&lt;Acme &amp; Co&gt;</strong>');
  });
});
