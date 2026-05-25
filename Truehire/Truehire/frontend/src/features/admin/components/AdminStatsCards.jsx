import React from 'react';

const AdminStatsCards = ({ totalUsers = 0, totalRecruiters = 0, totalJobs = 0, totalApplications = 0 }) => {
  const totals = [totalUsers, totalRecruiters, totalJobs, totalApplications];
  const maxValue = Math.max(...totals, 1);

  const stats = [
    {
      title: 'Registered Users',
      value: totalUsers,
      eyebrow: 'Audience',
      icon: (
        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'from-amber-400 to-orange-500',
      badge: 'Live',
      summary: 'Accounts active',
      trend: 'Platform-wide user reach',
    },
    {
      title: 'Recruiter Accounts',
      value: totalRecruiters,
      eyebrow: 'Hiring',
      icon: (
        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 2a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
        </svg>
      ),
      accent: 'from-rose-500 to-pink-500',
      badge: 'Live',
      summary: 'Teams posting',
      trend: 'Recruiters reviewing talent',
    },
    {
      title: 'Live Job Records',
      value: totalJobs,
      eyebrow: 'Marketplace',
      icon: (
        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
      accent: 'from-slate-400 to-slate-600',
      badge: 'Live',
      summary: 'Openings listed',
      trend: 'Inventory currently live',
    },
    {
      title: 'Applications Logged',
      value: totalApplications,
      eyebrow: 'Momentum',
      icon: (
        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'from-yellow-400 to-amber-500',
      badge: 'Live',
      summary: 'Candidate flow',
      trend: 'Applications tracked end to end',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {stats.map((stat) => {
        const width = Math.max(18, Math.round((stat.value / maxValue) * 100));

        return (
          <article
            key={stat.title}
            className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(10,14,26,0.98))] p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.95)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">{stat.eyebrow}</p>
                <h3 className="mt-3 text-2xl font-bold leading-9 tracking-[-0.04em] text-white">
                  {stat.title}
                </h3>
              </div>

              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.accent}`}>
                {stat.icon}
              </div>
            </div>

            <div className="mt-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-6xl font-black tracking-[-0.07em] text-white">{stat.value}</p>
                <p className="mt-2 text-sm font-medium text-slate-300">{stat.summary}</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                {stat.badge}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Volume share</span>
                <span>{width}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/8">
                <div className={`h-full rounded-full bg-gradient-to-r ${stat.accent}`} style={{ width: `${width}%` }} />
              </div>
              <p className="text-sm leading-6 text-slate-400">{stat.trend}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default AdminStatsCards;
