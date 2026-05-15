'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeachers() {
      setLoading(true);
      // Get current admin's institution
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('institution_id')
        .eq('id', user.id)
        .single();

      if (adminProfile?.institution_id) {
        setInstitutionId(adminProfile.institution_id);
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'teacher')
          .eq('institution_id', adminProfile.institution_id);
        
        if (data) setTeachers(data);
      }
      setLoading(false);
    }
    loadTeachers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Teacher Management</h1>
          <p className="text-white/60 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse"></span>
            Manage live teachers in your institution
          </p>
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] text-white font-semibold rounded-xl hover:opacity-90 transition text-sm">
          + Invite Teacher
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-[#6C63FF]">{loading ? '...' : teachers.length}</p>
          <p className="text-white/50 text-xs">Total Teachers</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-[#00C9A7]">{loading ? '...' : teachers.filter(t => t.plan !== 'pending').length}</p>
          <p className="text-white/50 text-xs">Active</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{loading ? '...' : teachers.reduce((a, t) => a + (Number(t.total_lessons_done) || 0), 0)}</p>
          <p className="text-white/50 text-xs">Total Lessons Assigned</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="text-center py-10"><span className="w-6 h-6 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin inline-block"></span></div>
        ) : teachers.length === 0 ? (
          <p className="text-center py-10 text-white/50">No teachers found in your institution.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-medium">Teacher</th>
                <th className="p-4 font-medium">Subject Focus</th>
                <th className="p-4 font-medium">Hours Taught</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {teachers.map((t, i) => (
                <tr key={i} className="hover:bg-white/5">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#00C9A7] flex items-center justify-center text-white text-xs font-bold">
                        {t.full_name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{t.full_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-white/70">{t.board || 'General'}</td>
                  <td className="p-4 text-white/70">{t.total_sign_hours || 0} hrs</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${t.plan === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                      {t.plan === 'pending' ? 'Pending' : 'Active'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button className="px-3 py-1 bg-white/10 text-white/80 rounded-lg text-xs hover:bg-white/20 transition">Edit</button>
                    <button className="px-3 py-1 bg-[#6C63FF]/20 text-[#6C63FF] rounded-lg text-xs hover:bg-[#6C63FF]/30 transition">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
