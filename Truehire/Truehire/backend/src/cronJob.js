import cron from 'node-cron';
import { sendWeeklyJobAlerts } from './services/jobAlertService.js';

let weeklyJobAlertTask;

export const startWeeklyJobAlertCron = () => {
  if (weeklyJobAlertTask) return weeklyJobAlertTask;

  weeklyJobAlertTask = cron.schedule(
    '0 9 * * 0',
    async () => {
      try {
        await sendWeeklyJobAlerts();
      } catch (error) {
        console.error('[job-alerts] Weekly cron failed:', error);
      }
    },
    {
      timezone: process.env.JOB_ALERT_CRON_TIMEZONE || 'Asia/Kolkata',
    },
  );

  console.log('[job-alerts] Weekly job alert cron scheduled for Sunday 09:00.');
  return weeklyJobAlertTask;
};
