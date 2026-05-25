const Job = require('../models/Job');
const User = require('../models/User');
const { sendDeadlineReminderEmail } = require('./email');

const REMINDER_HOUR = parseInt(process.env.DEADLINE_REMINDER_HOUR || '9', 10);
const REMINDER_MINUTE = parseInt(process.env.DEADLINE_REMINDER_MINUTE || '0', 10);

const buildDelayToNextRun = () => {
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  return nextRun.getTime() - now.getTime();
};

const runDeadlineReminders = async () => {
  try {
    const jobs = await Job.findDeadlineReminders();
    if (!jobs.length) {
      console.info('No deadline reminders needed for today');
      return;
    }

    const emails = await User.getAllUserEmails();
    if (!emails.length) {
      console.warn('Deadline reminder skipped: no eligible job seeker emails found');
      return;
    }

    let sentAny = false;

    for (const email of emails) {
      try {
        const result = await sendDeadlineReminderEmail(email, jobs);
        if (result && result.success) {
          sentAny = true;
        } else if (result && result.error) {
          console.warn('Deadline reminder email not sent to', email, result.error);
        }
      } catch (error) {
        console.error('Deadline reminder email failed for', email, error);
      }
    }

    if (sentAny) {
      await Promise.all(jobs.map(job => Job.markDeadlineReminderSent(job.id)));
    } else {
      console.warn('No deadline reminders were successfully delivered; jobs will be retried tomorrow');
    }
  } catch (error) {
    console.error('Deadline reminder runner failed:', error);
  }
};

const scheduleDeadlineReminders = () => {
  const scheduleNextRun = () => {
    const delay = buildDelayToNextRun();
    setTimeout(async () => {
      await runDeadlineReminders();
      scheduleNextRun();
    }, delay);
  };

  runDeadlineReminders();
  scheduleNextRun();
};

module.exports = {
  runDeadlineReminders,
  scheduleDeadlineReminders
};
