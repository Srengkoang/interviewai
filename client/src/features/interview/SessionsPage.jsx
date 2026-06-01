import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Play, Clock, CheckCircle2, XCircle, ArrowRight, Code2 } from 'lucide-react';

const statusIcon = { ACTIVE: Play, COMPLETED: CheckCircle2, CANCELLED: XCircle, PENDING: Clock };
const statusColor = { ACTIVE: 'text-emerald-400', COMPLETED: 'text-brand-500', CANCELLED: 'text-red-400', PENDING: 'text-amber-400' };

const LANGUAGES = ['javascript', 'python', 'java', 'cpp', 'typescript', 'go'];

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', language: 'javascript' });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/sessions').then((r) => { setSessions(r.data.sessions); setLoading(false); });
  }, []);

  const create = async () => {
    setCreating(true);
    try {
      const r = await api.post('/sessions', form);
      navigate(`/sessions/${r.data.session.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Interviews</h1>
          <p className="text-gray-500 text-sm mt-1 font-body">{sessions.length} session{sessions.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Interview
        </button>
      </div>

      {/* New session modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="card p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-display font-bold text-lg text-white mb-5">Start New Interview</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-body">Session Title</label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures Interview"
                  className="input-field"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-body">Primary Language</label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setForm({ ...form, language: lang })}
                      className={`py-2 px-3 rounded-lg text-xs font-mono font-medium transition-all border ${
                        form.language === lang
                          ? 'bg-brand-500/20 border-brand-500/50 text-brand-400'
                          : 'bg-surface-700 border-white/5 text-gray-400 hover:border-white/10'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowNew(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={create} disabled={creating} className="btn-primary flex-1">
                  {creating ? 'Starting...' : 'Start Interview'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-600 font-body">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="card p-12 text-center">
          <Code2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 font-body">No interviews yet. Start your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const Icon = statusIcon[s.status] || Clock;
            return (
              <div
                key={s.id}
                onClick={() => navigate(`/sessions/${s.id}`)}
                className="card p-4 hover:bg-surface-700 cursor-pointer transition-colors group flex items-center gap-4"
              >
                <div className="w-9 h-9 rounded-lg bg-surface-700 group-hover:bg-surface-600 flex items-center justify-center shrink-0">
                  <Icon className={`w-4 h-4 ${statusColor[s.status]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-white text-sm">{s.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-mono text-xs text-gray-500">{s.language}</span>
                    <span className="text-gray-700">·</span>
                    <span className="font-body text-xs text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                    {s._count && (
                      <>
                        <span className="text-gray-700">·</span>
                        <span className="font-body text-xs text-gray-500">
                          {s._count.messages} messages
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {s.evaluation && (
                  <div className="text-right shrink-0">
                    <p className="font-display font-bold text-brand-500 text-lg">{s.evaluation.aiScore}%</p>
                    <p className="text-xs text-gray-500 font-body">AI Score</p>
                  </div>
                )}
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-brand-500 transition-colors shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
