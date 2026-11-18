import React, { useState, useEffect } from 'react';

interface SiteSettings {
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  ownerName: string;
  ownerTitle: string;
  contactEmail: string;
  location: string;
  bio?: string | null;
  resumeUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  telegramUsername?: string | null;
  isMaintenanceMode: boolean;
}

export default function SettingsManager() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setSettings(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ text: 'Site settings updated successfully!', type: 'success' });
      } else {
        setMessage({ text: json.error?.message || 'Failed to update settings', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error updating settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 font-mono">
        Loading configuration...
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 text-center text-xs text-red-400">Failed to load site settings.</div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Configuration</h1>
        <p className="text-xs text-slate-400 mt-1">
          Global branding, SEO fallbacks, professional bio, and social connectivity
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl border text-xs ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* General Information Card */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm space-y-4">
          <h3 className="text-sm font-semibold text-white border-b border-slate-800 pb-2">
            General & SEO
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">Site Brand Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Default SEO Title</label>
            <input
              type="text"
              value={settings.siteTitle}
              onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">SEO Description</label>
            <textarea
              rows={2}
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Identity & Bio Card */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm space-y-4">
          <h3 className="text-sm font-semibold text-white border-b border-slate-800 pb-2">
            Identity & Bio
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">Owner Name</label>
              <input
                type="text"
                value={settings.ownerName}
                onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Professional Title</label>
              <input
                type="text"
                value={settings.ownerTitle}
                onChange={(e) => setSettings({ ...settings, ownerTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Location / Base</label>
            <input
              type="text"
              value={settings.location}
              onChange={(e) => setSettings({ ...settings, location: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Bio / Architectural Philosophy</label>
            <textarea
              rows={3}
              value={settings.bio || ''}
              onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Social Channels & Resume */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm space-y-4">
          <h3 className="text-sm font-semibold text-white border-b border-slate-800 pb-2">
            Social Signals & Resume
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">GitHub Profile</label>
              <input
                type="url"
                value={settings.githubUrl || ''}
                onChange={(e) => setSettings({ ...settings, githubUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">LinkedIn Profile</label>
              <input
                type="url"
                value={settings.linkedinUrl || ''}
                onChange={(e) => setSettings({ ...settings, linkedinUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Twitter / X Profile</label>
              <input
                type="url"
                value={settings.twitterUrl || ''}
                onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Active Resume Asset URL</label>
              <input
                type="text"
                value={settings.resumeUrl || ''}
                onChange={(e) => setSettings({ ...settings, resumeUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {saving ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
