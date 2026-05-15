'use client';
import { useState } from 'react';

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Deep Analytics</h1>
          <p className="text-white/60 mt-1">Comprehensive usage and performance data</p>
        </div>
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
          {['7d', '30d', '90d', '1y'].map(r => (
            <button key={r} onClick={() => setDateRange(r)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${dateRange === r ? 'bg-[#6C63FF] text-white' : 'text-white/50 hover:text-white/80'}`}>{r}</button>
          ))}
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: '3,847', trend: '+18%', up: true },
          { label: 'Avg Session Duration', value: '24m', trend: '+3m', up: true },
          { label: 'Sign Practice Sessions', value: '1,204', trend: '+22%', up: true },
          { label: 'Drop-off Rate', value: '12%', trend: '-4%', up: false },
        ].map((m, i) => (
          <div key={i} className="glass-card p-5">
            <p className="text-white/50 text-xs uppercase tracking-wider">{m.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{m.value}</p>
            <p className={`text-xs mt-1 ${m.up ? 'text-green-400' : 'text-red-400'}`}>{m.trend} vs last period</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Heatmap */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Activity Heatmap (Last 7 Days)</h3>
          <div className="space-y-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, di) => (
              <div key={day} className="flex items-center gap-2">
                <span className="text-white/40 text-xs w-8">{day}</span>
                <div className="flex gap-1 flex-1">
                  {Array.from({ length: 24 }, (_, hi) => {
                    const intensity = Math.random();
                    return (
                      <div key={hi} className="flex-1 h-5 rounded-sm transition"
                        style={{ backgroundColor: intensity > 0.7 ? '#6C63FF' : intensity > 0.4 ? 'rgba(108,99,255,0.4)' : intensity > 0.15 ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.03)' }}
                        title={`${day} ${hi}:00 — ${Math.floor(intensity * 40)} sessions`} />
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-white/30 text-[10px]">Less</span>
              {[0.05, 0.2, 0.5, 0.8].map((v, i) => (
                <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `rgba(108,99,255,${v})` }} />
              ))}
              <span className="text-white/30 text-[10px]">More</span>
            </div>
          </div>
        </div>

        {/* Accessibility Feature Usage */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Accessibility Feature Adoption</h3>
          <div className="space-y-5">
            {[
              { feature: 'Live Captions', adoption: 78, sessions: 2985, color: '#00C9A7' },
              { feature: 'ISL Avatar', adoption: 52, sessions: 1992, color: '#6C63FF' },
              { feature: 'Text-to-Speech', adoption: 34, sessions: 1302, color: '#e17055' },
              { feature: 'Offline Mode', adoption: 28, sessions: 1073, color: '#fdcb6e' },
              { feature: 'High Contrast', adoption: 15, sessions: 575, color: '#a29bfe' },
              { feature: 'Braille Display', adoption: 4, sessions: 153, color: '#fab1a0' },
            ].map((f, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/80">{f.feature}</span>
                  <span className="text-white/50">{f.adoption}% adoption • {f.sessions.toLocaleString()} sessions</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div className="h-full rounded-full transition-all" style={{ width: `${f.adoption}%`, backgroundColor: f.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Usage */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Platform Distribution</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { platform: 'Mobile', pct: 62, icon: '📱' },
              { platform: 'Web', pct: 28, icon: '💻' },
              { platform: 'Tablet', pct: 10, icon: '📋' },
            ].map((p, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 text-center">
                <span className="text-3xl block mb-2">{p.icon}</span>
                <p className="text-white font-bold text-xl">{p.pct}%</p>
                <p className="text-white/50 text-xs">{p.platform}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Over Time */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Daily Active Users (30 days)</h3>
          <div className="flex items-end justify-between gap-[2px] h-40">
            {Array.from({ length: 30 }, (_, i) => {
              const value = 40 + Math.floor(Math.random() * 55);
              return (
                <div key={i} className="flex-1 bg-gradient-to-t from-[#6C63FF] to-[#00C9A7] rounded-t-sm hover:opacity-80 transition"
                  style={{ height: `${value}%` }} />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-white/30 mt-2">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
