import React, { useState, useEffect } from 'react';

interface AnalyticsData {
  range: string;
  startDate: string;
  views: {
    totalInRange: number;
    today: number;
    viewsPerDay: Array<{ date: string; views: number }>;
  };
  topPages: Array<{ path: string; views: number }>;
  topProjects: Array<{
    projectId: string;
    title: string;
    slug: string;
    liveDemoClicks: number;
    githubClicks: number;
    totalClicks: number;
  }>;
  viewsByCountry: Array<{ country: string; views: number }>;
  viewsByDevice: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  totalStats: {
    views: number;
    clicks: number;
    downloads: number;
    messages: number;
  };
}

export default function DashboardOverview() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (selectedRange: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?range=${selectedRange}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error?.message || 'Failed to fetch analytics');
      }
    } catch {
      setError('Network error while loading analytics dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(range);
  }, [range]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time visitor signals, outbound project traction, and inquiry metrics
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          {(['7d', '30d', '90d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                range === r
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <a
          href="/admin/projects"
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 text-xs font-medium text-slate-300 transition"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Manage Projects
        </a>
        <a
          href="/admin/blog"
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 text-xs font-medium text-slate-300 transition"
        >
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          Write Article
        </a>
        <a
          href="/admin/media"
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 text-xs font-medium text-slate-300 transition"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Upload Media
        </a>
        <a
          href="/admin/messages"
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 text-xs font-medium text-slate-300 transition"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Inbox Messages
        </a>
      </div>

      {loading && (
        <div className="p-12 text-center text-slate-500 text-xs font-mono">
          Loading live metric aggregates...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {data && !loading && (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Page Views ({range.toUpperCase()})
              </span>
              <p className="text-3xl font-extrabold text-white mt-2">
                {data.views.totalInRange.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                <span className="text-emerald-400 font-medium">+{data.views.today}</span> today
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Project Clicks
              </span>
              <p className="text-3xl font-extrabold text-white mt-2">
                {data.totalStats.clicks.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-2">Live demo & repo explorations</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Resume Downloads
              </span>
              <p className="text-3xl font-extrabold text-white mt-2">
                {data.totalStats.downloads.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-2">Verified candidate impressions</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Inquiry Messages
              </span>
              <p className="text-3xl font-extrabold text-white mt-2">
                {data.totalStats.messages.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-2">Verified contact submissions</p>
            </div>
          </div>

          {/* Grid: Top Projects & Top Pages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Projects by Clicks */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Top Showcase Projects by Traction
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">Demo vs GitHub</span>
              </div>

              {data.topProjects.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No project clicks recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.topProjects.slice(0, 5).map((proj) => (
                    <div
                      key={proj.projectId}
                      className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/50 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{proj.title}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">/{proj.slug}</p>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <span className="block text-xs font-bold text-white">
                            {proj.totalClicks}
                          </span>
                          <span className="block text-[10px] text-slate-400">Total</span>
                        </div>
                        <div className="text-[10px] text-slate-500 border-l border-slate-800 pl-3">
                          <p>
                            <span className="text-blue-400">{proj.liveDemoClicks}</span> Demo
                          </p>
                          <p>
                            <span className="text-indigo-400">{proj.githubClicks}</span> GitHub
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Pages */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Top Visited Pages</h3>
                <span className="text-[11px] text-slate-500 font-mono">Views</span>
              </div>

              {data.topPages.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No page views recorded in this range.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.topPages.slice(0, 6).map((page) => (
                    <div
                      key={page.path}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/30 transition"
                    >
                      <span className="text-xs font-mono text-slate-300 truncate max-w-[280px]">
                        {page.path}
                      </span>
                      <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                        {page.views}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Device & Country Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-white mb-3">Device Breakdown</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/50">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Desktop
                  </span>
                  <p className="text-lg font-bold text-white mt-1">{data.viewsByDevice.desktop}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/50">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Mobile
                  </span>
                  <p className="text-lg font-bold text-white mt-1">{data.viewsByDevice.mobile}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/50">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Tablet
                  </span>
                  <p className="text-lg font-bold text-white mt-1">{data.viewsByDevice.tablet}</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-white mb-3">Audience Geography</h3>
              {data.viewsByCountry.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  No location signals captured yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.viewsByCountry.slice(0, 8).map((c) => (
                    <span
                      key={c.country}
                      className="px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs text-slate-300"
                    >
                      <strong>{c.country}</strong>: {c.views}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
