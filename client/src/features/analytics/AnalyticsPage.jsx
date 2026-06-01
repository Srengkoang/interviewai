import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Award, TrendingUp, Code2, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/analytics/dashboard').then((r) => setData(r.data));
  }, []);

  const stats = data?.stats || {};
  const scoreHistory = (data?.scoreHistory || []).slice(-8).map((s, i) => ({
    name: `#${i + 1}`,
    score: s.score,
  }));

  const avgScore = stats.averageScore || 0;
  const radialData = [{ name: 'Score', value: avgScore }];

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1 font-body">Your interview performance overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Clock, label: 'Total Sessions', value: stats.totalSessions ?? 0 },
          { icon: TrendingUp, label: 'Completed', value: stats.completedSessions ?? 0 },
          { icon: Code2, label: 'Submissions', value: stats.totalSubmissions ?? 0 },
          { icon: Award, label: 'Avg Score', value: `${avgScore}%` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="card p-5">
            <Icon className="w-5 h-5 text-brand-500 mb-3" />
            <p className="text-2xl font-display font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500 font-body mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="card p-5">
          <h2 className="font-display font-semibold text-white mb-5">Score Per Interview</h2>
          {scoreHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreHistory} barSize={20}>
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#181d2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff' }}
                />
                <Bar dataKey="score" fill="#3b6bff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm font-body">
              No data yet — complete interviews to see scores
            </div>
          )}
        </div>

        {/* Radial avg */}
        <div className="card p-5 flex flex-col items-center justify-center">
          <h2 className="font-display font-semibold text-white mb-2 self-start">Overall Score</h2>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              data={radialData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background={{ fill: '#1f253d' }} dataKey="value" angleAxisId={0} fill="#3b6bff" cornerRadius={8} />
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="font-display font-bold text-4xl text-white -mt-8">{avgScore}%</p>
          <p className="text-gray-500 text-sm font-body mt-1">Average AI Score</p>
        </div>

        {/* Recent sessions table */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-display font-semibold text-white mb-4">Session History</h2>
          {(data?.recentSessions || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-white/5">
                    <th className="text-left py-2 pr-4 font-medium">Title</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-left py-2 pr-4 font-medium">Date</th>
                    <th className="text-right py-2 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.recentSessions.map((s) => (
                    <tr key={s.id} className="text-gray-300 hover:text-white transition-colors">
                      <td className="py-3 pr-4 truncate max-w-xs">{s.title}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs ${s.status === 'COMPLETED' ? 'text-emerald-400' : s.status === 'ACTIVE' ? 'text-amber-400' : 'text-gray-500'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right font-display font-bold">
                        {s.evaluation ? (
                          <span className="text-brand-500">{s.evaluation.aiScore}%</span>
                        ) : (
                          <span className="text-gray-600 font-normal">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-600 text-sm py-8 font-body">
              Complete interviews to see history here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
