import React, { useState, useEffect } from 'react';

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  liveDemoUrl?: string | null;
  githubUrl?: string | null;
  techStack: string[];
  status: 'DRAFT' | 'PUBLISHED';
  isFeatured: boolean;
  createdAt: string;
}

export default function ProjectsManager() {
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [techStackStr, setTechStackStr] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
  const [isFeatured, setIsFeatured] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects?includeDrafts=true&limit=100');
      const json = await res.json();
      if (json.success && json.data?.projects) {
        setProjects(json.data.projects);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setLiveDemoUrl('');
    setGithubUrl('');
    setTechStackStr('');
    setStatus('PUBLISHED');
    setIsFeatured(false);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    setTitle(proj.title);
    setSlug(proj.slug);
    setDescription(proj.description);
    setLiveDemoUrl(proj.liveDemoUrl || '');
    setGithubUrl(proj.githubUrl || '');
    setTechStackStr(proj.techStack ? proj.techStack.join(', ') : '');
    setStatus(proj.status);
    setIsFeatured(proj.isFeatured);
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (title.trim().length < 2) {
      setFormError('Title must be at least 2 characters');
      return;
    }
    if (description.trim().length < 5) {
      setFormError('Description must be at least 5 characters');
      return;
    }

    const techStack = techStackStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      description: description.trim(),
      liveDemoUrl: liveDemoUrl.trim() || undefined,
      githubUrl: githubUrl.trim() || undefined,
      techStack,
      status,
      isFeatured,
    };

    setSaving(true);
    try {
      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = editingProject ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        await fetchProjects();
      } else {
        setFormError(json.error?.message || 'Failed to save project');
      }
    } catch {
      setFormError('Network error while saving project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, projTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${projTitle}"?`)) return;

    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(json.error?.message || 'Failed to delete project');
      }
    } catch {
      alert('Network error while deleting project');
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.techStack.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" data-hydrated={mounted ? 'true' : undefined}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Project Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Showcase systems, technical architecture demos, and open-source repositories
          </p>
        </div>

        <button
          onClick={openCreateModal}
          id="btn-create-project"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-lg shadow-blue-500/20 shrink-0 self-start sm:self-auto flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search projects by name, description, or tech stack..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === s
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No projects found. Click "New Project" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/40 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Title & Slug</th>
                  <th className="py-3 px-4">Tech Stack</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/20 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200 project-row-title">{p.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono">/{p.slug}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                        {p.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-[10px] text-slate-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {p.isFeatured ? '★ Yes' : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.title)}
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition text-[11px]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white">
                {editingProject ? 'Edit Showcase Project' : 'Create Showcase Project'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  id="project-title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Event-Driven Message Broker"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Custom Slug (optional)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="leave empty for auto-generated slug"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief architectural overview and business value..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Live Demo URL</label>
                  <input
                    type="url"
                    value={liveDemoUrl}
                    onChange={(e) => setLiveDemoUrl(e.target.value)}
                    placeholder="https://demo.example.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">GitHub Repo URL</label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Tech Stack (comma-separated)
                </label>
                <input
                  type="text"
                  value={techStackStr}
                  onChange={(e) => setTechStackStr(e.target.value)}
                  placeholder="Node.js, PostgreSQL, Docker, Redis"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={status === 'PUBLISHED'}
                      onChange={(e) => setStatus(e.target.checked ? 'PUBLISHED' : 'DRAFT')}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300 font-medium">Publish Live</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300 font-medium">Star as Featured</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="btn-save-project"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
