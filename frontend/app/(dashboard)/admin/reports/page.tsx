'use client';

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Institution Reports</h1>
        <p className="text-white/60 mt-1">Generate and download comprehensive institution reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Student Progress Report', desc: 'Comprehensive progress of all students including lessons, quizzes, and ISL practice', icon: '📊', formats: ['PDF', 'CSV'] },
          { title: 'Teacher Performance Report', desc: 'Lesson engagement, completion rates, and student feedback per teacher', icon: '👨‍🏫', formats: ['PDF'] },
          { title: 'Accessibility Usage Report', desc: 'ISL avatar, caption, TTS, and braille usage across the institution', icon: '♿', formats: ['PDF', 'CSV'] },
          { title: 'Compliance Report', desc: 'RPwD Act 2016 and NEP 2020 compliance status with action items', icon: '🏛️', formats: ['PDF'] },
          { title: 'Financial Summary', desc: 'Plan usage, billing, and subscription analytics', icon: '💰', formats: ['PDF', 'CSV'] },
          { title: 'AI Processing Report', desc: 'AI job statistics, accuracy metrics, and processing times', icon: '🤖', formats: ['PDF'] },
        ].map((report, i) => (
          <div key={i} className="glass-card p-6 flex flex-col">
            <span className="text-3xl mb-3">{report.icon}</span>
            <h3 className="text-white font-semibold mb-2">{report.title}</h3>
            <p className="text-white/50 text-sm flex-1 mb-4">{report.desc}</p>
            <div className="flex gap-2">
              {report.formats.map(fmt => (
                <button key={fmt} className="flex-1 py-2.5 bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition">
                  📄 {fmt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Downloads */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4">Recent Downloads</h3>
        <div className="space-y-3">
          {[
            { name: 'Student Progress Report - April 2026.pdf', date: 'Apr 16, 2026', size: '2.4 MB' },
            { name: 'Compliance Report - Q1 2026.pdf', date: 'Apr 10, 2026', size: '1.8 MB' },
            { name: 'All Students Data Export.csv', date: 'Apr 8, 2026', size: '456 KB' },
          ].map((d, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-lg">{d.name.endsWith('.pdf') ? '📄' : '📊'}</span>
                <div>
                  <p className="text-white/80 text-sm">{d.name}</p>
                  <p className="text-white/40 text-xs">{d.date} • {d.size}</p>
                </div>
              </div>
              <button className="px-3 py-1.5 bg-[#6C63FF]/20 text-[#6C63FF] rounded-lg text-xs hover:bg-[#6C63FF]/30 transition">Download</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
