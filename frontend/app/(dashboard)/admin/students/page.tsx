'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('institution_id')
        .eq('id', user.id)
        .single();

      if (adminProfile?.institution_id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, grade, disability_type, last_active, created_at, role, plan')
          .eq('role', 'student')
          .eq('institution_id', adminProfile.institution_id);
          
        if (!error && data) setStudents(data);
      }
      setLoading(false);
    }
    fetchStudents();
  }, []);

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Student Management</h1>
          <p className="text-white/60 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse"></span>
            Manage live students in your institution
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white/10 border border-white/10 text-white rounded-xl hover:bg-white/20 transition text-sm">📤 Import CSV</button>
          <button className="px-5 py-2.5 bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] text-white font-semibold rounded-xl hover:opacity-90 transition text-sm">+ Add Student</button>
        </div>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name..."
        className="glass-input w-full"
      />

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
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Last Active</th>
                <th className="p-4 font-medium">Joined</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-white/5">
                  <td className="p-4">
                    <p className="text-white font-medium">{s.full_name}</p>
                  </td>
                  <td className="p-4 text-white/70">{s.grade ?? '-'}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-[#6C63FF]/20 text-[#6C63FF] capitalize">
                      {s.disability_type ?? 'N/A'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${s.plan === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                      {s.plan === 'pending' ? 'Pending' : 'Active'}
                    </span>
                  </td>
                  <td className="p-4 text-white/50">
                    {s.last_active ? new Date(s.last_active).toLocaleDateString('en-IN') : 'Never'}
                  </td>
                  <td className="p-4 text-white/50">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '-'}
                  </td>
                  <td className="p-4 flex gap-2">
                    <button className="px-3 py-1 bg-white/10 text-white/80 rounded-lg text-xs hover:bg-white/20 transition">Edit</button>
                    <button className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition">Remove</button>
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
