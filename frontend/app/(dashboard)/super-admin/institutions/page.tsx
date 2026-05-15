'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-white/10 text-white/60', 
  pro: 'bg-[#6C63FF]/20 text-[#6C63FF]',
  institution: 'bg-[#00C9A7]/20 text-[#00C9A7]', 
  enterprise: 'bg-yellow-500/20 text-yellow-400',
};

export default function SuperAdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchInstitutions() {
      setLoading(true);
      const { data } = await supabase
        .from('institutions')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setInstitutions(data);
      }
      setLoading(false);
    }
    fetchInstitutions();

    const sub = supabase.channel('realtime-institutions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'institutions' }, fetchInstitutions)
      .subscribe();
      
    return () => { supabase.removeChannel(sub); };
  }, []);

  const filtered = institutions.filter(i => 
    (i.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
    (i.state?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const minDiff = Math.floor((new Date().getTime() - date.getTime()) / 60000);
    if (minDiff < 1) return 'Just now';
    if (minDiff < 60) return `${minDiff} mins ago`;
    const hourDiff = Math.floor(minDiff / 60);
    if (hourDiff < 24) return `${hourDiff} hours ago`;
    return `${Math.floor(hourDiff / 24)} days ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">All Institutions</h1>
          <p className="text-white/60 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse"></span>
            Manage live platform tenants
          </p>
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] text-white font-semibold rounded-xl hover:opacity-90 transition text-sm">
          + Add Institution
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-[#6C63FF]">{loading ? '...' : institutions.length}</p>
          <p className="text-white/50 text-xs">Total</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-[#00C9A7]">{loading ? '...' : institutions.reduce((a, i) => a + (i.student_limit || 0), 0).toLocaleString('en-IN')}</p>
          <p className="text-white/50 text-xs">Total Seat Capacity</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{loading ? '...' : institutions.filter(i => i.plan === 'enterprise').length}</p>
          <p className="text-white/50 text-xs">Enterprise</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{loading ? '...' : institutions.length}</p>
          <p className="text-white/50 text-xs">Active</p>
        </div>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search institutions by name or state..." className="glass-input w-full" />

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 font-medium">Institution</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Location</th>
              <th className="p-4 font-medium">Seat Limit</th>
              <th className="p-4 font-medium">Plan</th>
              <th className="p-4 font-medium">Created</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {loading ? (
               <tr><td colSpan={7} className="p-8 text-center text-white/50">Loading institutions...</td></tr>
            ) : filtered.length === 0 ? (
               <tr><td colSpan={7} className="p-8 text-center text-white/50">No institutions found.</td></tr>
            ) : filtered.map((inst, i) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="p-4 text-white font-medium">{inst.name}</td>
                <td className="p-4 text-white/70 capitalize">{inst.type}</td>
                <td className="p-4 text-white/70">{inst.state || 'India'}{inst.district ? `, ${inst.district}` : ''}</td>
                <td className="p-4 text-white/70">{inst.student_limit || 50}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-[10px] font-medium capitalize ${PLAN_COLORS[inst.plan] || 'bg-white/10 text-white'}`}>{inst.plan}</span></td>
                <td className="p-4 text-white/50">{formatTimeAgo(inst.created_at)}</td>
                <td className="p-4">
                  <button className="px-3 py-1 bg-white/10 text-white/80 rounded-lg text-xs hover:bg-white/20 transition">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
