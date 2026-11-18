import React, { useState, useEffect } from 'react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  repliedAt?: string | null;
  createdAt: string;
}

export default function MessagesManager() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMessage, setActiveMessage] = useState<ContactMessage | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contact?limit=100');
      const json = await res.json();
      if (json.success && json.data?.messages) {
        setMessages(json.data.messages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const toggleRead = async (msg: ContactMessage) => {
    const newStatus = !msg.isRead;
    try {
      const res = await fetch(`/api/contact/${msg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isRead: newStatus } : m)));
        if (activeMessage?.id === msg.id) {
          setActiveMessage((prev) => (prev ? { ...prev, isRead: newStatus } : null));
        }
      }
    } catch {
      alert('Failed to update read status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this inquiry message?')) return;
    try {
      const res = await fetch(`/api/contact/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (activeMessage?.id === id) setActiveMessage(null);
      }
    } catch {
      alert('Failed to delete message');
    }
  };

  const openMessage = (msg: ContactMessage) => {
    setActiveMessage(msg);
    if (!msg.isRead) {
      toggleRead(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#101014] tracking-tight">Contact Inquiries</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Direct inquiries submitted through the portfolio contact form with Cloudflare Turnstile
            & rate limiting
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-800 bg-[#101014] text-white overflow-hidden shadow-xl">
        {loading ? (
          <p className="text-center text-xs text-neutral-500 font-mono py-12">Loading inquiries...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-neutral-500 py-12">No messages in your inbox yet.</p>
        ) : (
          <div className="divide-y divide-neutral-800 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => openMessage(msg)}
                className={`p-5 flex items-center justify-between cursor-pointer hover:bg-neutral-900/50 transition ${
                  !msg.isRead ? 'bg-neutral-900/30 font-semibold' : 'text-neutral-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      !msg.isRead ? 'bg-white animate-pulse' : 'bg-neutral-700'
                    }`}
                  />
                  <div>
                    <span className="text-white font-bold">{msg.name}</span>
                    <span className="text-neutral-400 text-[11px] ml-2 font-mono">&lt;{msg.email}&gt;</span>
                    <p className="text-neutral-300 text-xs mt-0.5">{msg.subject}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(msg.id);
                    }}
                    className="text-neutral-400 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-neutral-900 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Modal (Black Modal) */}
      {activeMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#101014] text-white border border-neutral-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{activeMessage.subject}</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  From: <strong className="text-white">{activeMessage.name}</strong> (
                  {activeMessage.email})
                </p>
              </div>
              <button
                onClick={() => setActiveMessage(null)}
                className="text-neutral-400 hover:text-white text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed">
              {activeMessage.message}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-neutral-400 font-mono">
                Received: {new Date(activeMessage.createdAt).toLocaleString()}
              </span>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${activeMessage.email}?subject=Re: ${encodeURIComponent(activeMessage.subject)}`}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-[#101014] font-bold text-xs transition shadow"
                >
                  Reply via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
