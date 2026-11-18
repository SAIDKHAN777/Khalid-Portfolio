import React, { useState, useEffect } from 'react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt?: string | null;
  createdAt: string;
}

export default function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Simple 3-field form state
  const [title, setTitle] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [content, setContent] = useState('');

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/blog?includeDrafts=true&limit=100');
      const json = await res.json();
      if (json.success && json.data?.posts) {
        setPosts(json.data.posts);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Handle Thumbnail File Upload
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'image');

    setUploading(true);
    try {
      (window as any).showToast?.('Uploading press thumbnail...', 'success');
      const res = await fetch('/api/admin/portfolio/upload', {
        method: 'POST',
        body: fd,
      });
      const result = await res.json();
      if (result.success) {
        setCoverImageUrl(result.data.url);
        (window as any).showToast?.('Thumbnail uploaded successfully', 'success');
      } else {
        (window as any).showToast?.(result.error?.message || 'Upload failed', 'error');
      }
    } catch {
      (window as any).showToast?.('Network error during upload', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Populate Form for Editing
  const handleEdit = (p: BlogPost) => {
    setEditingId(p.id);
    setTitle(p.title);
    setCoverImageUrl(p.coverImageUrl || '');
    setContent(p.content);
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setCoverImageUrl('');
    setContent('');
    setFormError(null);
  };

  // Submit / Publish Article
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (title.trim().length < 2) {
      setFormError('Please enter a press title (at least 2 characters)');
      return;
    }
    if (content.trim().length < 5) {
      setFormError('Please write article content in the text box');
      return;
    }

    const payload = {
      title: title.trim(),
      coverImageUrl: coverImageUrl.trim() || null,
      content: content.trim(),
      excerpt: content.trim().substring(0, 160) + '...',
      status: 'PUBLISHED' as const,
    };

    setSaving(true);
    try {
      const url = editingId ? `/api/blog/${editingId}` : '/api/blog';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        (window as any).showToast?.(
          editingId ? 'Article updated successfully!' : 'Article published successfully!',
          'success'
        );
        handleCancelEdit();
        await fetchPosts();
      } else {
        setFormError(json.error?.message || 'Failed to save article');
      }
    } catch {
      setFormError('Network error while saving article');
    } finally {
      setSaving(false);
    }
  };

  // Delete Article
  const handleDelete = async (id: string, postTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete article "${postTitle}"?`)) return;

    try {
      const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        (window as any).showToast?.('Article deleted successfully', 'success');
        setPosts((prev) => prev.filter((p) => p.id !== id));
        if (editingId === id) handleCancelEdit();
      } else {
        (window as any).showToast?.(json.error?.message || 'Failed to delete', 'error');
      }
    } catch {
      (window as any).showToast?.('Network error during deletion', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6">
        <h1 className="text-2xl font-extrabold text-[#101014] tracking-tight">Press & Articles Studio</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Compose and publish press releases and technical articles directly to your public /press showcase.
        </p>
      </div>

      {/* 1. Fast Clean Writing Card (3 Simple Options) */}
      <div className="bg-[#101014] text-white border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white">
              {editingId ? 'Edit Press Article' : 'Publish New Press Article'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Enter Press Title, add a Thumbnail image, write the content, and click Publish.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 transition cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {formError && (
          <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-800 text-red-200 text-xs font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: 1. Press Title & 2. Press Thumbnail */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Press Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                1. Press Title (আর্টিকেল শিরোনাম) *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Khalid Unveils Next-Gen AI Automation Studio"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-none focus:border-white"
              />
            </div>

            {/* 2. Press Thumbnail (9:16 Portrait) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                2. Press Thumbnail (9:16 পোর্ট্রেট থাম্বনেইল)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-20 rounded-xl bg-neutral-950 border border-neutral-700 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {coverImageUrl ? (
                    <img src={coverImageUrl} alt="9:16 Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-mono text-neutral-500 text-center px-1">9:16</span>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleThumbnailUpload}
                    disabled={uploading}
                    className="block w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white file:text-[#101014] hover:file:bg-neutral-200 cursor-pointer"
                  />
                  <p className="text-[11px] text-neutral-400 font-mono">
                    রিল বা স্টোরি সাইজ (9:16 portrait) ছবি আপলোড করুন
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: 3. Long Writing Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-300">
              3. Article Content / Write (লেখার লম্বা বক্স) *
            </label>
            <textarea
              required
              rows={11}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="এখানে আপনার আর্টিকেলের বিস্তারিত পুরো লেখা লিখুন বা পেস্ট করুন..."
              className="w-full px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-none focus:border-white leading-relaxed font-sans"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-[#101014] text-xs font-bold shadow-md cursor-pointer transition flex items-center gap-2"
            >
              <span>{saving ? 'Publishing...' : editingId ? 'Update Article' : 'Publish Article'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Published Articles List */}
      <div className="bg-[#101014] text-white border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Published Press Articles ({posts.length})</h2>
          <span className="text-xs text-neutral-400 font-mono">Live on /press</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-500 font-mono">Loading articles...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            No press articles published yet. Use the form above to publish your first article!
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {posts.map((p) => (
              <div
                key={p.id}
                className="p-6 hover:bg-neutral-900/40 transition flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-14 h-24 rounded-xl border border-neutral-700 shrink-0 flex items-center justify-center overflow-hidden bg-neutral-950">
                    {p.coverImageUrl ? (
                      <img src={p.coverImageUrl} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-mono text-neutral-500">9:16</span>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate">{p.title}</h3>
                    <p className="text-xs text-neutral-400 line-clamp-1">
                      {p.content ? p.content.substring(0, 120) : ''}
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-neutral-400 font-mono">
                      <span>{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : 'Published'}</span>
                      <a
                        href={`/press/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:underline"
                      >
                        View Public Article ↗
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleEdit(p)}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-[#101014] text-xs font-bold transition cursor-pointer shadow-sm"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id, p.title)}
                    className="p-2 rounded-xl bg-neutral-900 hover:bg-red-950/80 border border-neutral-700 hover:border-red-800 text-neutral-400 hover:text-red-300 text-xs transition cursor-pointer"
                    title="Delete article"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
