import React, { useState, useEffect } from 'react';

interface MediaAsset {
  id: string;
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  bytes: number;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  createdAt: string;
}

export default function MediaManager() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/media?limit=50');
      const json = await res.json();
      if (json.success && json.data?.media) {
        setMedia(json.data.media);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    if (altText) formData.append('altText', altText);

    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setAltText('');
        await fetchMedia();
      } else {
        setError(json.error?.message || 'Upload failed');
      }
    } catch {
      setError('Network error during file upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this media asset?')) return;
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setMedia((prev) => prev.filter((m) => m.id !== id));
      } else {
        alert(json.error?.message || 'Failed to delete media');
      }
    } catch {
      alert('Network error deleting media');
    }
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Media & Asset Library</h1>
          <p className="text-xs text-slate-400 mt-1">
            Cloudinary CDN integration with auto-format webp/avif, lossless compression, and PDF
            delivery
          </p>
        </div>

        {/* Upload Button */}
        <label className="cursor-pointer px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition shadow-lg shadow-amber-500/20 shrink-0 self-start sm:self-auto flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          <span>{uploading ? 'Uploading...' : 'Upload Asset'}</span>
          <input
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Asset Grid */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Loading assets from Cloudinary CDN...
          </div>
        ) : media.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No media assets uploaded yet. Upload hero banners, project architecture diagrams, or
            resume PDFs.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((asset) => {
              const isPdf = asset.format === 'pdf' || asset.url.endsWith('.pdf');
              return (
                <div
                  key={asset.id}
                  className="group relative rounded-xl border border-slate-800 bg-slate-800/30 overflow-hidden flex flex-col justify-between"
                >
                  <div className="aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                    {isPdf ? (
                      <div className="text-center p-4">
                        <span className="text-2xl">📄</span>
                        <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase">
                          PDF Document
                        </p>
                      </div>
                    ) : (
                      <img
                        src={asset.secureUrl || asset.url}
                        alt={asset.altText || 'Media Asset'}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    )}
                  </div>

                  <div className="p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{asset.format.toUpperCase()}</span>
                      <span>{(asset.bytes / 1024).toFixed(1)} KB</span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => copyUrl(asset.id, asset.secureUrl || asset.url)}
                        className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium transition text-center"
                      >
                        {copiedId === asset.id ? '✓ Copied' : 'Copy URL'}
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="p-1 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] transition"
                        title="Delete asset"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
