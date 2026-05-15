'use client';

const WEEKLY_DATA = [
  { day: 'Mon', mins: 45, lessons: 2, signs: 8 },
  { day: 'Tue', mins: 30, lessons: 1, signs: 5 },
  { day: 'Wed', mins: 60, mins2: 60, lessons: 3, signs: 12 },
  { day: 'Thu', mins: 50, lessons: 2, signs: 10 },
  { day: 'Fri', mins: 40, lessons: 2, signs: 6 },
  { day: 'Sat', mins: 20, lessons: 1, signs: 3 },
  { day: 'Sun', mins: 55, lessons: 3, signs: 9 },
];

const SUBJECT_PROGRESS = [
  { subject: 'Science', lessons: 12, completed: 9, avgScore: 85, color: '#6C63FF' },
  { subject: 'Mathematics', lessons: 10, completed: 8, avgScore: 78, color: '#00C9A7' },
  { subject: 'History', lessons: 8, completed: 4, avgScore: 72, color: '#e17055' },
  { subject: 'Hindi', lessons: 6, completed: 3, avgScore: 90, color: '#fdcb6e' },
  { subject: 'Biology', lessons: 7, completed: 6, avgScore: 88, color: '#a29bfe' },
  { subject: 'Physics', lessons: 5, completed: 2, avgScore: 65, color: '#fab1a0' },
];

const QUIZ_HISTORY = [
  { title: 'Cell Biology Quiz', date: 'Apr 16', score: 92, passed: true },
  { title: 'Linear Equations Test', date: 'Apr 15', score: 87, passed: true },
  { title: 'French Revolution', date: 'Apr 12', score: 45, passed: false },
  { title: 'Hindi Grammar', date: 'Apr 10', score: 78, passed: true },
  { title: 'Fractions Quiz', date: 'Apr 8', score: 95, passed: true },
];

const maxMins = Math.max(...WEEKLY_DATA.map(d => d.mins));

export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">My Progress</h1>
        <p className="text-white/60 mt-1">Track your learning journey across all subjects</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Lessons', value: '48', sub: '32 completed', color: 'text-[#6C63FF]' },
          { label: 'Learning Hours', value: '36h', sub: 'this month', color: 'text-[#00C9A7]' },
          { label: 'ISL Signs', value: '142', sub: '53 mastered', color: 'text-purple-400' },
          { label: 'Quiz Average', value: '81%', sub: '12 taken', color: 'text-yellow-400' },
          { label: 'Day Streak', value: '7', sub: 'current', color: 'text-orange-400' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-white/80 text-xs font-medium mt-1">{s.label}</p>
            <p className="text-white/40 text-[10px] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Weekly Learning Activity</h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {WEEKLY_DATA.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <p className="text-white/60 text-xs">{d.mins}m</p>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-[#6C63FF] to-[#00C9A7] transition-all hover:opacity-80"
                  style={{ height: `${(d.mins / maxMins) * 100}%`, minHeight: '8px' }} />
                <p className="text-white/40 text-xs">{d.day}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-white/40 border-t border-white/5 pt-3">
            <span>Total: {WEEKLY_DATA.reduce((a, d) => a + d.mins, 0)} mins</span>
            <span>Avg: {Math.round(WEEKLY_DATA.reduce((a, d) => a + d.mins, 0) / 7)} mins/day</span>
          </div>
        </div>

        {/* Subject Performance */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Subject-wise Progress</h3>
          <div className="space-y-4">
            {SUBJECT_PROGRESS.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/80 text-sm">{s.subject}</span>
                  <span className="text-white/50 text-xs">{s.completed}/{s.lessons} lessons • Avg: {s.avgScore}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${(s.completed / s.lessons) * 100}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quiz History */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Recent Quiz Scores</h3>
          <div className="space-y-3">
            {QUIZ_HISTORY.map((q, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${q.passed ? 'bg-[#00C9A7]/20 text-[#00C9A7]' : 'bg-red-500/20 text-red-400'}`}>
                    {q.passed ? '✓' : '✗'}
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">{q.title}</p>
                    <p className="text-white/40 text-xs">{q.date}</p>
                  </div>
                </div>
                <span className={`text-lg font-bold ${q.passed ? 'text-[#00C9A7]' : 'text-red-400'}`}>{q.score}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* ISL Milestones */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">ISL Milestones</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'First Sign', icon: '🤟', unlocked: true },
              { label: '10 Signs', icon: '✋', unlocked: true },
              { label: '50 Signs', icon: '🏅', unlocked: true },
              { label: '100 Signs', icon: '🥇', unlocked: true },
              { label: '200 Signs', icon: '🏆', unlocked: false },
              { label: 'Alphabet Master', icon: '🔤', unlocked: true },
              { label: 'Number Master', icon: '🔢', unlocked: true },
              { label: 'Science Vocab', icon: '🔬', unlocked: false },
              { label: 'Full Dictionary', icon: '📖', unlocked: false },
            ].map((m, i) => (
              <div key={i} className={`p-3 rounded-xl text-center transition ${m.unlocked ? 'bg-[#6C63FF]/10 border border-[#6C63FF]/20' : 'bg-white/5 opacity-40'}`}>
                <span className="text-2xl block">{m.icon}</span>
                <p className="text-white/80 text-[10px] mt-1 font-medium">{m.label}</p>
                {m.unlocked && <p className="text-[#00C9A7] text-[9px] mt-0.5">Unlocked ✓</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
