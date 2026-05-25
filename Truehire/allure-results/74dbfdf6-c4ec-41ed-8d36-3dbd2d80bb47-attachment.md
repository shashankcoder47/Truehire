# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\candidate.spec.js >> Candidate Module UI >> apply job with resume upload
- Location: qa\tests\ui\candidate.spec.js:12:3

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: /apply|view|details/i }).or(getByRole('button', { name: /apply/i })).first()
    - waiting for" http://localhost:3000/jobs" navigation to finish...

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - button "Go to Home Page" [ref=e7]:
        - img "TrueHire Logo" [ref=e8]
        - text: TrueHire
    - main [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e12]:
          - paragraph [ref=e13]: Careers
          - heading "All Job Opportunities" [level=1] [ref=e14]
          - paragraph [ref=e15]: Discover your next career move from thousands of opportunities sourced from leading companies.
        - generic [ref=e16]:
          - generic [ref=e17]:
            - heading "Find Your Perfect Job" [level=2] [ref=e18]
            - paragraph [ref=e19]: Search through our comprehensive job database
          - generic [ref=e20]:
            - generic [ref=e21]:
              - text: Job Title, Company, or Keywords
              - generic [ref=e22]:
                - img [ref=e24]
                - textbox "Job Title, Company, or Keywords" [ref=e26]:
                  - /placeholder: e.g. Software Engineer, Google
            - generic [ref=e27]:
              - text: Location
              - generic [ref=e28]:
                - img [ref=e30]
                - textbox "Location" [ref=e32]:
                  - /placeholder: City, state, or remote
            - generic [ref=e33]:
              - text: Employment Type
              - generic [ref=e34]:
                - combobox "Employment Type" [ref=e35]:
                  - option "All Types" [selected]
                  - option "Full-time"
                  - option "Part-time"
                  - option "Contract"
                  - option "Internship"
                  - option "Freelance"
                - img [ref=e37]
            - generic [ref=e39]:
              - text: Experience Level
              - generic [ref=e40]:
                - combobox "Experience Level" [ref=e41]:
                  - option "All Levels" [selected]
                  - option "Entry Level"
                  - option "Internship Level"
                  - option "Mid Level"
                  - option "Senior Level"
                  - option "Executive"
                - img [ref=e43]
          - generic [ref=e45]:
            - button "Clear Filters" [ref=e46]:
              - img [ref=e47]
              - text: Clear Filters
            - generic [ref=e49]:
              - img [ref=e50]
              - text: 0 jobs found
        - generic [ref=e53]:
          - paragraph [ref=e54]: Finding your perfect job...
          - paragraph [ref=e55]: Please wait while we load the latest opportunities
    - contentinfo [ref=e56]:
      - generic [ref=e57]:
        - generic [ref=e58]:
          - generic [ref=e59]:
            - generic [ref=e60]:
              - img "TrueHire Logo" [ref=e61]
              - text: TrueHire
            - paragraph [ref=e62]: Connecting exceptional talent with amazing opportunities. Your career journey starts here.
            - generic [ref=e63]:
              - link "LinkedIn" [ref=e64] [cursor=pointer]:
                - /url: https://www.linkedin.com/company/truerizeiq-strategic-solutions-pvt-ltd/
                - img [ref=e65]
              - link "Instagram" [ref=e67] [cursor=pointer]:
                - /url: https://www.instagram.com/truerizeiq?igsh=MXc0MHdpajljN2Rldg==
                - img [ref=e68]
              - link "Facebook" [ref=e70] [cursor=pointer]:
                - /url: https://www.facebook.com/share/1A4sYccHf1/?mibextid=wwXIfr
                - img [ref=e71]
              - link "Website" [ref=e73] [cursor=pointer]:
                - /url: http://www.truerize.com/
                - img [ref=e74]
              - link "X" [ref=e76] [cursor=pointer]:
                - /url: https://x.com/truerize2025?s=21
                - img [ref=e77]
          - generic [ref=e79]:
            - heading "Company" [level=3] [ref=e80]
            - list [ref=e81]:
              - listitem [ref=e82]:
                - link "About Us" [ref=e83] [cursor=pointer]:
                  - /url: /about
              - listitem [ref=e84]:
                - link "Careers" [ref=e85] [cursor=pointer]:
                  - /url: /career
              - listitem [ref=e86]:
                - link "Contact" [ref=e87] [cursor=pointer]:
                  - /url: /contact
          - generic [ref=e88]:
            - heading "For Candidates" [level=3] [ref=e89]
            - list [ref=e90]:
              - listitem [ref=e91]:
                - link "Browse Jobs" [ref=e92] [cursor=pointer]:
                  - /url: /jobs
              - listitem [ref=e93]:
                - link "Career Advice" [ref=e94] [cursor=pointer]:
                  - /url: /career-resources
              - listitem [ref=e95]:
                - link "Salary Guide" [ref=e96] [cursor=pointer]:
                  - /url: /salary
          - generic [ref=e97]:
            - heading "For Employers" [level=3] [ref=e98]
            - list [ref=e99]:
              - listitem [ref=e100]:
                - link "Post a Job" [ref=e101] [cursor=pointer]:
                  - /url: /post-job
              - listitem [ref=e102]:
                - link "Recruiting Solutions" [ref=e103] [cursor=pointer]:
                  - /url: /recruiting
              - listitem [ref=e104]:
                - link "Support" [ref=e105] [cursor=pointer]:
                  - /url: /support
          - generic [ref=e106]:
            - heading "Legal" [level=3] [ref=e107]
            - list [ref=e108]:
              - listitem [ref=e109]:
                - link "Privacy Policy" [ref=e110] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e111]:
                - link "Terms of Service" [ref=e112] [cursor=pointer]:
                  - /url: /terms
              - listitem [ref=e113]:
                - link "Cookie Policy" [ref=e114] [cursor=pointer]:
                  - /url: /cookies
        - generic [ref=e116]:
          - generic [ref=e117]:
            - paragraph [ref=e118]: © 2026 TrueHire. All rights reserved.
            - paragraph [ref=e119]: "Plot No 40, 6th Sector, 14th Cross Road, HSR Layout, Bangalore, Karnataka | Phone: +91 63812 50037"
          - generic [ref=e120]:
            - link "Privacy" [ref=e121] [cursor=pointer]:
              - /url: /privacy
            - text: •
            - link "Terms" [ref=e122] [cursor=pointer]:
              - /url: /terms
            - text: •
            - link "Cookies" [ref=e123] [cursor=pointer]:
              - /url: /cookies
  - generic [active]:
    - generic [ref=e126]:
      - generic [ref=e127]:
        - generic [ref=e128]:
          - navigation [ref=e129]:
            - button "previous" [disabled] [ref=e130]:
              - img "previous" [ref=e131]
            - generic [ref=e133]:
              - generic [ref=e134]: 1/
              - text: "1"
            - button "next" [disabled] [ref=e135]:
              - img "next" [ref=e136]
          - img
        - generic [ref=e138]:
          - link "Next.js 16.1.6 (stale) Webpack" [ref=e139] [cursor=pointer]:
            - /url: https://nextjs.org/docs/messages/version-staleness
            - img [ref=e140]
            - generic "There is a newer version (16.2.4) available, upgrade recommended!" [ref=e142]: Next.js 16.1.6 (stale)
            - generic [ref=e143]: Webpack
          - img
      - dialog "Runtime TypeError" [ref=e145]:
        - generic [ref=e149]:
          - generic [ref=e150]:
            - generic [ref=e152]: Runtime TypeError
            - generic [ref=e153]:
              - button "Copy Error Info" [ref=e154] [cursor=pointer]:
                - img [ref=e155]
              - button "No related documentation found" [disabled] [ref=e157]:
                - img [ref=e158]
              - button "Attach Node.js inspector" [ref=e160] [cursor=pointer]:
                - img [ref=e161]
          - generic [ref=e170]: Cannot read properties of null (reading 'parentNode')
        - generic [ref=e171]: "1"
        - generic [ref=e172]: "2"
    - generic [ref=e177] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e178]:
        - img [ref=e179]
      - generic [ref=e182]:
        - button "Open issues overlay" [ref=e183]:
          - generic [ref=e184]:
            - generic [ref=e185]: "0"
            - generic [ref=e186]: "1"
          - generic [ref=e187]: Issue
        - button "Collapse issues badge" [ref=e188]:
          - img [ref=e189]
  - alert [ref=e191]
```

# Test source

```ts
  1  | import { expect } from '@playwright/test';
  2  | import { BasePage } from './base.page.js';
  3  | import { fixturePath } from '../helpers/file.helper.js';
  4  | 
  5  | export class CandidatePage extends BasePage {
  6  |   async openJobs() {
  7  |     await this.goto('/jobs');
  8  |   }
  9  | 
  10 |   async searchJobs(keyword) {
  11 |     await this.openJobs();
  12 |     const search = this.page.getByPlaceholder(/search|job title|keyword/i).or(this.page.getByLabel(/search|keyword/i)).first();
  13 |     await search.fill(keyword);
  14 |     await this.page.keyboard.press('Enter');
  15 |     await this.page.waitForLoadState('networkidle').catch(() => {});
  16 |     await expect(this.page.getByText(new RegExp(keyword, 'i')).first()).toBeVisible({ timeout: 15_000 });
  17 |   }
  18 | 
  19 |   async applyToFirstJob() {
  20 |     await this.openJobs();
> 21 |     await this.page.getByRole('link', { name: /apply|view|details/i }).or(this.page.getByRole('button', { name: /apply/i })).first().click();
     |                                                                                                                                      ^ TimeoutError: locator.click: Timeout 15000ms exceeded.
  22 |     const upload = this.page.locator('input[type="file"]').first();
  23 |     if (await upload.count()) {
  24 |       await upload.setInputFiles(fixturePath('resume.pdf'));
  25 |     }
  26 |     await this.page.getByRole('button', { name: /apply|submit/i }).first().click();
  27 |     await expect(this.page.getByText(/applied|success|submitted/i).first()).toBeVisible({ timeout: 20_000 });
  28 |   }
  29 | 
  30 |   async openApplications() {
  31 |     await this.goto('/applications');
  32 |   }
  33 | 
  34 |   async updateProfile(profile) {
  35 |     await this.goto('/profile');
  36 |     await this.fillByLabelOrPlaceholder(/name/i, profile.name);
  37 |     await this.fillByLabelOrPlaceholder(/location/i, profile.location);
  38 |     await this.page.getByRole('button', { name: /save|update/i }).click();
  39 |     await expect(this.page.getByText(/saved|updated|success/i).first()).toBeVisible({ timeout: 15_000 });
  40 |   }
  41 | }
  42 | 
```