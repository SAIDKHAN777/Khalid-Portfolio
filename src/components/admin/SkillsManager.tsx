import React, { useState, useEffect } from 'react';

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  isFeatured: boolean;
  order: number;
}

export default function SkillsManager() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Backend Architecture');
  const [proficiency, setProficiency] = useState(85);
  const [isFeatured, setIsFeatured] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/skills');
      const json = await res.json();
      if (json.success && json.data) {
        setSkills(json.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim(),
          proficiency: Number(proficiency),
          isFeatured,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setName('');
        await fetchSkills();
      } else {
        setError(json.error?.message || 'Failed to add skill');
      }
    } catch {
      setError('Network error adding skill');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, skillName: string) => {
    if (!window.confirm(`Delete skill "${skillName}"?`)) return;
    try {
      const res = await fetch(`/api/skills?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setSkills((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      alert('Failed to delete skill');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#101014] tracking-tight">Core Proficiencies</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage technical expertise, proficiency ratings, and featured display items
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setShowModal(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-[#101014] hover:bg-black text-white font-bold text-xs transition shadow cursor-pointer"
        >
          + Add Proficiency
        </button>
      </div>

      <div className="rounded-3xl border border-neutral-800 bg-[#101014] text-white p-6 md:p-8 shadow-xl">
        {loading ? (
          <p className="text-center text-xs text-neutral-500 font-mono py-12">
            Loading proficiencies...
          </p>
        ) : skills.length === 0 ? (
          <p className="text-center text-xs text-neutral-500 py-12">
            No skills listed yet. Add your core competencies.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between shadow-sm"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{skill.name}</h4>
                  <span className="text-[10px] text-neutral-400 font-mono">{skill.category}</span>
                  <div className="w-28 bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full"
                      style={{ width: `${skill.proficiency}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-300 font-mono">
                    {skill.proficiency}%
                  </span>
                  <button
                    onClick={() => handleDelete(skill.id, skill.name)}
                    className="text-neutral-500 hover:text-red-400 text-xs ml-2 cursor-pointer transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#101014] text-white border border-neutral-800 w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 space-y-4">
            <h3 className="text-base font-bold text-white">Add Technical Proficiency</h3>
            {error && <p className="text-xs text-red-200 bg-red-950/60 border border-red-800/80 p-2.5 rounded-xl">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Skill Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. PostgreSQL Partitioning & Query Tuning"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Distributed Databases"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Proficiency Level: {proficiency}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={proficiency}
                  onChange={(e) => setProficiency(Number(e.target.value))}
                  className="w-full accent-white cursor-pointer"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-[#101014] font-bold shadow cursor-pointer transition disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Save Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
