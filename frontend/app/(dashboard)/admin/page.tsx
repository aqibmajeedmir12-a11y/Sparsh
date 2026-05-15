'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, lessons: 0, signHours: 0 });
  const [disabilityBreakdown, setDisabilityBreakdown] = useState<any[]>([]);
  const [topLessons, setTopLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutionName, setInstitutionName] = useState('Institution');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('institution_id, institutions(name)')
        .eq('id', user.id)
        .single();

      if (adminProfile?.institution_id) {
        const inst = adminProfile.institutions as any;
        if (inst?.name) {
          setInstitutionName(inst.name);
        } else if (Array.isArray(inst) && inst[0]?.name) {
          setInstitutionName(inst[0].name);
        }

        const [{ count: students }, { count: teachers }, { data: profiles }] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('institution_id', adminProfile.institution_id),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher').eq('institution_id', adminProfile.institution_id),
          supabase.from('profiles').select('disability_type, total_sign_hours').eq('role', 'student').eq('institution_id', adminProfile.institution_id),
        ]);

        const totalSignHours = profiles?.reduce((a, p) => a + (Number(p.total_sign_hours) || 0), 0) ?? 0;
        
        // For lessons we can fetch those created_by this institution or general ones. 
        // We'll just fetch general count for demo or those linked to this institution if available.
        const { count: lessons } = await supabase.from('lessons').select('*', { count: 'exact', head: true });

        setStats({ students: students ?? 0, teachers: teachers ?? 0, lessons: lessons ?? 0, signHours: Math.round(totalSignHours) });

        // Disability breakdown from real data
        const types = ['hearing', 'visual', 'both', 'deafblind', 'none'];
        const labels: Record<string, string> = { hearing: 'Hearing Impaired', visual: 'Visually Impaired', both: 'Multi-Sensory', deafblind: 'DeafBlind', none: 'No Disability' };
        const colors: Record<string, string> = { hearing: '#6C63FF', visual: '#00C9A7', both: '#a29bfe', deafblind: '#e17055', none: '#636e72' };
        const total = profiles?.length || 1;
        const breakdown = types.map(t => {
          const count = profiles?.filter(p => p.disability_type === t).length ?? 0;
          return { label: labels[t], count, pct: Math.round((count / total) * 100), color: colors[t] };
        });
        setDisabilityBreakdown(breakdown);

        // Top lessons
        const { data: top } = await supabase.from('lessons').select('id, title, subject, view_count').order('view_count', { ascending: false }).limit(5);
        if (top) setTopLessons(top);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white">{institutionName} Dashboard</h1>
        <p className="text-white/60 mt-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse"></span>
          Live analytics from your Supabase database
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: loading ? '…' : stats.students, color: 'text-[#6C63FF]', sub: 'registered' },
          { label: 'Total Teachers', value: loading ? '…' : stats.teachers, color: 'text-[#00C9A7]', sub: 'accounts' },
          { label: 'Platform Lessons', value: loading ? '…' : stats.lessons, color: 'text-purple-400', sub: 'NCERT + custom' },
          { label: 'Total ISL Hours', value: loading ? '…' : `${stats.signHours}h`, color: 'text-yellow-400', sub: 'combined' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-5">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-white/30 text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disability Breakdown */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Student Disability Breakdown</h3>
          {loading ? (
            <div className="text-center py-6"><span className="w-6 h-6 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin inline-block" /></div>
          ) : (
            <div className="space-y-4">
              {disabilityBreakdown.map((d, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/80">{d.label}</span>
                    <span className="text-white/50">{d.count} ({d.pct}%)</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5">
                    <div className="h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                  </div>
                </div>
              ))}
              {disabilityBreakdown.every(d => d.count === 0) && (
                <p className="text-white/30 text-sm text-center py-4">No student disability data yet. Students will appear after signup.</p>
              )}
            </div>
          )}
        </div>

        {/* Top Lessons */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Top Lessons by Views</h3>
          {loading ? (
            <div className="text-center py-6"><span className="w-6 h-6 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin inline-block" /></div>
          ) : topLessons.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-6">No lessons yet.</p>
          ) : (
            <div className="space-y-3">
              {topLessons.map((l, i) => (
                <div key={l.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                  <span className="text-white/30 text-sm font-bold w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{l.title}</p>
                    <p className="text-white/40 text-xs">{l.subject}</p>
                  </div>
                  <span className="text-[#00C9A7] text-sm font-medium">{l.view_count ?? 0} views</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <button className="flex-1 py-4 bg-gradient-to-br from-[#6C63FF] to-[#6C63FF]/80 rounded-xl font-medium text-white hover:opacity-90 transition text-sm">
          📄 Download Compliance Report
        </button>
        <button className="flex-1 py-4 bg-white/10 border border-white/10 rounded-xl font-medium text-white hover:bg-white/20 transition text-sm">
          📊 Export Analytics CSV
        </button>
      </div>
    </div>
  );
}
