// const nodemailer = require('nodemailer');
// require('dotenv').config();

// // Create transporter
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST || 'smtp.gmail.com',
// port: Number(process.env.EMAIL_PORT) || 587,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });
// transporter.verify((error, success) => {
//   if (error) {
//     console.error('SMTP ERROR:', error);
//   } else {
//     console.log('SMTP READY: Email server connected');
//   }
// });

// // Send email function
// const sendEmail = async (to, subject, html) => {
//   try {
//     const mailOptions = {
//       from: `"TrueHire" <${process.env.EMAIL_USER}>`,
//       to, // ✅ USE THE FUNCTION PARAMETER
//       subject,
//       html
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log('Email sent:', info.messageId);
//     return { success: true, messageId: info.messageId };
//   } catch (error) {
//     console.error('Email sending failed:', error);
//     return { success: false, error: error.message };
//   }
// };


// // Send welcome email
// const sendWelcomeEmail = async (email, name) => {
//   const subject = 'Welcome to TrueHire!';
//   const html = `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//       <h2 style="color: #333;">Welcome to TrueHire, ${name}!</h2>
//       <p>Thank you for joining TrueHire. We're excited to help you find your dream job or the perfect candidate.</p>
//       <p>Please verify your email address to get started.</p>
//       <p>Best regards,<br>The TrueHire Team</p>
//     </div>
//   `;

//   return await sendEmail(email, subject, html);
// };

// // Send password reset email
// const sendPasswordResetEmail = async (email, name, resetUrl) => {
//   const subject = 'Password Reset Request';

//   const html = `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//       <h2>Password Reset Request</h2>
//       <p>Hi ${name || 'User'},</p>
//       <p>You requested a password reset for your TrueHire account.</p>
//       <p>Click the button below to reset your password:</p>
//       <a href="${resetUrl}" style="background-color:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">
//         Reset Password
//       </a>
//       <p>This link will expire soon.</p>
//       <p>If you didn’t request this, please ignore this email.</p>
//       <p>– TrueHire Team</p>
//     </div>
//   `;

//   return await sendEmail(email, subject, html);
// };


// // Send OTP email
// const sendOTPEmail = async (email, otp) => {
//   const subject = 'Your TrueHire Login Verification Code';
//   const html = `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//       <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
//         <h1 style="color: white; margin: 0; font-size: 28px;">TrueHire</h1>
//         <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Recruiter Portal</p>
//       </div>
//       <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
//         <h2 style="color: #333; margin: 0 0 20px 0; text-align: center;">Verify Your Login</h2>
//         <p style="color: #666; margin: 0 0 30px 0; text-align: center; line-height: 1.6;">
//           To complete your login to the TrueHire Recruiter Portal, please use the verification code below:
//         </p>
//         <div style="background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
//           <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
//             ${otp}
//           </div>
//         </div>
//         <p style="color: #666; margin: 20px 0; text-align: center; font-size: 14px;">
//           This code will expire in <strong>10 minutes</strong> for security reasons.
//         </p>
//         <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
//           <p style="color: #856404; margin: 0; font-size: 14px; text-align: center;">
//             <strong>Security Notice:</strong> If you didn't request this code, please ignore this email. Your account remains secure.
//           </p>
//         </div>
//         <p style="color: #666; margin: 20px 0 0 0; text-align: center; font-size: 14px;">
//           Best regards,<br>
//           <strong>The TrueHire Team</strong>
//         </p>
//       </div>
//     </div>
//   `;

//   return await sendEmail(email, subject, html);
// };

// // Send job alert email
// const sendJobAlertEmail = async (email, jobs) => {
//   const subject = 'New Job Matches for You!';
//   const html = `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//       <h2 style="color: #333;">New Job Opportunities</h2>
//       <p>We found some jobs that match your preferences:</p>
//       <ul>
//         ${jobs.map(job => `<li><strong>${job.title}</strong> at ${job.company}</li>`).join('')}
//       </ul>
//       <a href="${process.env.FRONTEND_URL}/jobs" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View All Jobs</a>
//       <p>Best regards,<br>The TrueHire Team</p>
//     </div>
//   `;

//   return await sendEmail(email, subject, html);
// };

// module.exports = {
//   sendEmail,
//   sendWelcomeEmail,
//   sendPasswordResetEmail,
//   sendOTPEmail,
//   sendJobAlertEmail
// };
const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP ERROR:', error);
  } else {
    console.log('SMTP READY: Email server connected');
  }
});

// ---------------- SEND EMAIL (BASE) ----------------
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"TrueHire" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// ---------------- WELCOME EMAIL ----------------
const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to TrueHire!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to TrueHire, ${name}!</h2>
      <p>Thank you for joining TrueHire. We're excited to help you find your dream job or the perfect candidate.</p>
      <p>Please verify your email address to get started.</p>
      <p>Best regards,<br>The TrueHire Team</p>
    </div>
  `;

  return await sendEmail(email, subject, html);
};

// ---------------- PASSWORD RESET EMAIL ----------------
const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const subject = 'Password Reset Request';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>Hi ${name || 'User'},</p>
      <p>You requested a password reset for your TrueHire account.</p>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" style="background-color:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">
        Reset Password
      </a>
      <p>This link will expire soon.</p>
      <p>If you didn’t request this, please ignore this email.</p>
      <p>– TrueHire Team</p>
    </div>
  `;

  return await sendEmail(email, subject, html);
};

// ---------------- OTP EMAIL ----------------
// ✅ UPDATED OTP EMAIL UI (POLISHED + BEST REGARDS)
const sendOTPEmail = async (email, otp) => {
  const subject = 'Your TrueHire Login Verification Code';

  const html = `
  <div style="background:#f4f6f8;padding:40px 0;font-family:Arial,sans-serif;">
    <div style="max-width:520px;margin:auto;background:#ffffff;
                border-radius:12px;overflow:hidden;
                box-shadow:0 6px 14px rgba(0,0,0,0.1)">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);
                  padding:28px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:26px;">
          TrueHire
        </h1>
        <p style="margin-top:8px;color:#e0e7ff;font-size:14px;">
          Secure Login Confirmation
        </p>
      </div>

      <!-- Body -->
      <div style="padding:32px;text-align:center;color:#333;">
        <h2 style="margin-top:0;font-size:22px;">
          Verify Your Login
        </h2>

        <p style="color:#555;font-size:15px;line-height:1.6;">
          We noticed a login attempt to your <strong>TrueHire account</strong>.
          Please use the verification code below to continue securely.
        </p>

        <!-- OTP BOX -->
        <div style="margin:28px 0;">
          <span style="
            display:inline-block;
            background:#f1f5f9;
            padding:16px 34px;
            font-size:28px;
            letter-spacing:8px;
            font-weight:bold;
            border-radius:10px;
            color:#4f46e5;
            border:1px dashed #c7d2fe;">
            ${otp}
          </span>
        </div>

        <p style="font-size:14px;color:#666;">
          This code is valid for <strong>10 minutes</strong>.
        </p>

        <p style="font-size:14px;color:#666;">
          For your security, please do not share this code with anyone.
        </p>

        <!-- Best Regards -->
        <p style="margin-top:26px;font-size:14px;color:#555;">
          Best regards,<br>
          <strong>TrueHire Team</strong>
        </p>

        <p style="font-size:13px;color:#888;margin-top:12px;">
          If you did not try to sign in, you can safely ignore this email.
          Your account remains protected.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:16px;
                  text-align:center;font-size:12px;color:#888;">
        © ${new Date().getFullYear()} TrueHire · Building Careers Securely
      </div>

    </div>
  </div>
  `;

  return await sendEmail(email, subject, html);
};

// ---------------- JOB ALERT (EXISTING) ----------------
const sendJobAlertEmail = async (email, jobs) => {
  const subject = 'New Job Matches for You!';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Job Opportunities</h2>
      <ul>
        ${jobs.map(job => `<li><strong>${job.title}</strong> at ${job.company}</li>`).join('')}
      </ul>
      <a href="${process.env.FRONTEND_URL}/jobs">View All Jobs</a>
    </div>
  `;

  return await sendEmail(email, subject, html);
};


// ---------------- DEADLINE REMINDER EMAIL ----------------
const sendDeadlineReminderEmail = async (email, jobs) => {
  if (!jobs || jobs.length === 0) {
    return { success: false, message: 'No deadline jobs to share' };
  }

  const subject = 'TrueHire reminder: application deadline tomorrow';
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const jobItems = jobs.map(job => {
    const deadline = job.application_deadline ? formatter.format(new Date(job.application_deadline)) : 'N/A';
    return `
      <li style="margin-bottom: 12px; line-height: 1.4;">
        <strong>${job.title || 'Untitled role'}</strong> at <strong>${job.company || 'Unknown company'}</strong><br />
        Deadline: <span style="font-weight: 600; color: #dc2626;">${deadline}</span>
      </li>
    `;
  }).join('');

  const html = `
    <div style="font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; background: #e4e9ff; padding: 32px 12px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 36px; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);">
        <div style="text-align: center; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; letter-spacing: 1.5px; color: #6366f1;">TRUEHIRE ALERT</p>
          <h1 style="margin: 10px 0 0; font-size: 32px; color: #111827;">Deadline Tomorrow</h1>
          <p style="margin: 6px 0 0; color: #475569; font-size: 15px;">These opportunities close in 24 hours—submit before they expire.</p>
        </div>
        <div style="display: grid; gap: 14px;">
          ${jobItems}
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || ''}/jobs" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 32px;background:linear-gradient(135deg,#4f46e5,#2563eb);color:#fff;border-radius:999px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 12px 24px rgba(37,99,235,0.35);">
            Browse jobs
          </a>
        </div>
        <div style="margin-top: 1px; border-top: 1px solid #eef2ff; padding-top: 18px;">
          <p style="margin: 0; font-size: 13px; color: #94a3b8; text-align: center;">
            You're receiving this because you're registered on TrueHire. Remove alerts in settings anytime.
          </p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail(email, subject, html);
};


// ✅ NEW JOB POSTED EMAIL — UI ONLY
const sendNewJobPostedEmail = async (emails, job) => {
  const subject = `🚀 New Job Posted: ${job.title} at ${job.company}`;
  const jobId = String(job.id || job.jobId || job.job_id || '').trim();
  const jobUrl = jobId
    ? `${process.env.FRONTEND_URL || ''}/jobs/${encodeURIComponent(jobId)}`
    : `${process.env.FRONTEND_URL || ''}/jobs`;

  const html = `
  <div style="background:#f4f6f8;padding:40px 0;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.08)">
      
        <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;">TrueHire</h1>
          <p style="color:#e0e7ff;margin-top:8px;">New Job Opportunity</p>
          ${
            job.is_urgent
              ? `<div style="margin-top:10px;display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:999px;background:#fff5ef;color:#c0391c;font-weight:600;font-size:12px;border:1px solid #f76e2f;">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c0391c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                     <path d="M13 2L3 14h9l-2 8 10-12h-9z"/>
                   </svg>
                   Urgent Hiring
                 </div>`
              : ''
          }
        </div>

        <div style="padding:30px;color:#333;">
          <h2 style="margin-top:0;">${job.title}</h2>

        <p><strong>Company:</strong> ${job.company || 'TrueHire'}</p>
        <p><strong>Location:</strong> ${job.location || 'Remote'}</p>
        <p><strong>Experience:</strong> ${job.experience_level || 'Any'}</p>
        ${
          job.is_urgent
            ? '<p style="margin-top:12px;font-size:14px;color:#b9391c;font-weight:600;">This position is marked as <strong>Urgent Hiring</strong> to help you stand out.</p>'
            : ''
        }

        <p style="margin:20px 0;color:#555;">
          A new job matching your profile has been posted on TrueHire.
          Apply early to stand out!
        </p>

        <div style="text-align:center;margin:30px 0;">
          <a href="${jobUrl}"
             style="background:#4f46e5;color:#fff;padding:14px 28px;
             text-decoration:none;border-radius:6px;font-size:16px;">
            View job
          </a>
        </div>

          <p style="font-size:13px;color:#777;text-align:center;">
            You received this email because you are registered on TrueHire.
          </p>
      </div>

      <div style="background:#f9fafb;padding:15px;text-align:center;font-size:12px;color:#888;">
        © ${new Date().getFullYear()} TrueHire
      </div>
    </div>
  </div>
  `;

  return Promise.all(
    emails.map(email => sendEmail(email, subject, html))
  );
};

// ---------------- EXPORTS ----------------
module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOTPEmail,
  sendJobAlertEmail,
  sendDeadlineReminderEmail,
  sendNewJobPostedEmail // ✅ ONLY NEW EXPORT
};
