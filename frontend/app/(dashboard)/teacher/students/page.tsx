'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const DISABILITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  hearing:   { bg: 'bg-[#6C63FF]/20', text: 'text-[#6C63FF]',   label: 'Hearing' },
  visual:    { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Visual' },
  both:      { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Multi-Sensory' },
  deafblind: { bg: 'bg-red-500/20',    text: 'text-red-400',    label: 'DeafBlind' },
  none:      { bg: 'bg-white/10',      text: 'text-white/60',   label: 'None' },
};

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDisability, setFilterDisability] = useState('All');

  useEffect(() => {
    let channel: any;
    async function fetchStudents() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, grade, disability_type, last_active, total_lessons_done, total_sign_hours, streak_days')
        .eq('role', 'student');
      if (!error && data) setStudents(data);
      setLoading(false);

      channel = supabase.channel('realtime_students_list')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: "role=eq.student" }, (payload) => {
          if (payload.eventType === 'UPDATE') {
            setStudents(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
          } else if (payload.eventType === 'INSERT') {
            setStudents(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'DELETE') {
            setStudents(prev => prev.filter(s => s.id !== payload.old.id));
          }
        })
        .subscribe();
    }
    fetchStudents();

    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const filtered = students.filter(s => {
    const matchSearch = s.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchDisability = filterDisability === 'All' || s.disability_type === filterDisability;
    return matchSearch && matchDisability;
  });

  const avgProgress = students.length > 0
    ? Math.round(students.reduce((a, s) => a + (s.total_lessons_done ?? 0), 0) / students.length)
    : 0;

  const activeCount = students.filter(s => {
    if (!s.last_active) return false;
    const diff = Date.now() - new Date(s.last_active).getTime();
    return diff < 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Students</h1>
        <p className="text-white/60 mt-1">Manage and monitor your student roster</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-[#6C63FF]">{students.length}</p>
          <p className="text-white/50 text-xs">Total Students</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-[#00C9A7]">{activeCount}</p>
          <p className="text-white/50 text-xs">Active Today</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{avgProgress}</p>
          <p className="text-white/50 text-xs">Avg Lessons Done</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">
            {students.length > 0 ? Math.round(students.reduce((a, s) => a + (s.streak_days ?? 0), 0) / students.length) : 0}
          </p>
          <p className="text-white/50 text-xs">Avg Streak Days</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="glass-input flex-1" />
        <select value={filterDisability} onChange={e => setFilterDisability(e.target.value)} className="glass-input bg-transparent appearance-none">
          <option value="All" className="bg-[#24243e]">All Needs</option>
          <option value="hearing"   className="bg-[#24243e]">Hearing</option>
          <option value="visual"    className="bg-[#24243e]">Visual</option>
          <option value="both"      className="bg-[#24243e]">Multi-Sensory</option>
          <option value="deafblind" className="bg-[#24243e]">DeafBlind</option>
          <option value="none"      className="bg-[#24243e]">None</option>
        </select>
      </div>

      {/* Student Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <span className="w-8 h-8 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin inline-block mb-2" />
            <p className="text-white/40 text-sm">Loading students...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-white/40 text-sm">No students found. Students will appear here once they sign up.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Grade</th>
                <th className="p-4 font-medium">Accessibility</th>
                <th className="p-4 font-medium">Lessons Done</th>
                <th className="p-4 font-medium">ISL Hours</th>
                <th className="p-4 font-medium">Streak</th>
                <th className="p-4 font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filtered.map((s) => {
                const d = DISABILITY_COLORS[s.disability_type] || DISABILITY_COLORS.none;
                const lastActive = s.last_active
                  ? new Date(s.last_active).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Never';
                return (
                  <tr key={s.id} className="hover:bg-white/5 cursor-pointer">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#00C9A7] flex items-center justify-center text-white text-xs font-bold">
                          {s.full_name?.charAt(0) ?? '?'}
                        </div>
                        <span className="text-white font-medium">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-white/70">{s.grade ?? '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${d.bg} ${d.text}`}>{d.label}</span>
                    </td>
                    <td className="p-4 text-white/70">{s.total_lessons_done ?? 0}</td>
                    <td className="p-4 text-white/70">{s.total_sign_hours ?? 0}h</td>
                    <td className="p-4 text-white/70">{s.streak_days ?? 0} days</td>
                    <td className="p-4 text-white/50">{lastActive}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
