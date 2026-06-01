import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Play, BarChart3, Code2, Award, ArrowRight,
  TrendingUp, Clock, CheckCircle2, Plus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ icon: Icon, label, value, color = 'brand' }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl bg-${color}-500/15 border border-${color}-500/20 flex items-center justify-center`}>
      <Icon className={`w-5 h-5 text-${color}-400`} />
    </div>
    <div>
      <p className="text-2xl font-display font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 font-body">{label}</p>
    </div>
  </div>
);

const statusBadge = (status) => {
  const map = {
    ACTIVE: 'badge badge-active',
    PENDING: 'badge badge-pending',
    COMPLETED: 'badge badge-completed',
  };
  return map[status] || 'badge bg-gray-500/15 text-gray-400';
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard').then((r) => {
      setData(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const startNew = async () => {
    const r = await api.post('/sessions', { title: 'Technical Interview' });
    navigate(`/sessions/${r.data.session.id}`);
  };

  const stats = data?.stats || {};
  const scoreHistory = (data?.scoreHistory || []).slice(-10).map((s, i) => ({
    name: `#${i + 1}`,
    score: s.score,
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-body">Ready for your next interview?</p>
        </div>
        <button onClick={startNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Interview
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Play} label="Total Interviews" value={stats.totalSessions ?? '—'} />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completedSessions ?? '—'} color="emerald" />
        <StatCard icon={Code2} label="Submissions" value={stats.totalSubmissions ?? '—'} color="purple" />
        <StatCard icon={Award} label="Avg Score" value={stats.averageScore ? `${stats.averageScore}%` : '—'} color="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Score chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-white">Score History</h2>
            <TrendingUp className="w-4 h-4 text-brand-500" />
          </div>
          {scoreHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={scoreHistory}>
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#181d2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line type="monotone" dataKey="score" stroke="#3b6bff" strokeWidth={2} dot={{ fill: '#3b6bff', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-600 text-sm font-body">
              Complete interviews to see your score trend
            </div>
          )}
        </div>

        {/* Recent sessions */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white">Recent</h2>
            <button onClick={() => navigate('/sessions')} className="text-xs text-brand-500 hover:text-brand-400 font-body flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5">
            {(data?.recentSessions || []).slice(0, 5).map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/sessions/${s.id}`)}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-700 hover:bg-surface-600 cursor-pointer transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-body font-medium text-white truncate">{s.title}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {s.evaluation ? `Score: ${s.evaluation.aiScore}%` : 'Not evaluated'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={statusBadge(s.status)}>{s.status}</span>
                  <ArrowRight className="w-3 h-3 text-gray-600 group-hover:text-brand-500 transition-colors" />
                </div>
              </div>
            ))}
            {!loading && (data?.recentSessions || []).length === 0 && (
              <div className="text-center text-gray-600 text-sm py-6 font-body">
                No interviews yet.<br />
                <button onClick={startNew} className="text-brand-500 hover:underline mt-1">Start one now →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
