const { sendEmail } = require('../utils/email');

const recipient = 'parveskhan1603@gmail.com';
const userName = 'Parves Khan';
const userLocation = 'Trichy';
const jobType = 'Cloud Job';

const subject = `TrueHire Alert: ${jobType} peak hiring in ${userLocation}`;

const html = `
  <div style="background:#f4f6f8;padding:40px 0;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.08)">
      <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;">TrueHire</h1>
        <p style="color:#e0e7ff;margin-top:8px;">Job Recommendation</p>
      </div>

      <div style="padding:30px;color:#333;">
        <h2 style="margin-top:0;">${jobType} · Peak Hiring</h2>

        <p>Hi ${userName},</p>
        <p>
          A <strong>${jobType}</strong> is currently in <strong>peak hiring</strong> and is especially relevant for your
          location in <strong>${userLocation}</strong>.
        </p>

        <p style="margin:20px 0;color:#555;">
          You can apply now to stand out, or share this opportunity with a friend who may be interested.
        </p>

        <div style="text-align:center;margin:30px 0;">
          <a href="${process.env.FRONTEND_URL || ''}/jobs"
             style="background:#4f46e5;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-size:16px;">
            View Jobs
          </a>
        </div>

        <p style="font-size:13px;color:#777;text-align:center;">
          You received this email because you are registered on TrueHire.
        </p>
      </div>

      <div style="background:#f9fafb;padding:15px;text-align:center;font-size:12px;color:#888;">
        &copy; ${new Date().getFullYear()} TrueHire
      </div>
    </div>
  </div>
`;

sendEmail(recipient, subject, html)
  .then((result) => {
    if (result?.success) {
      console.log('Job recommendation email sent:', result.messageId);
      return;
    }
    console.error('Job recommendation email failed:', result?.error || result);
  })
  .catch((error) => {
    console.error('Job recommendation email failed:', error);
  });
