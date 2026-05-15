'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const ROLE_COLORS: Record<string, string> = {
  student: 'bg-blue-500/20 text-blue-400', 
  teacher: 'bg-[#00C9A7]/20 text-[#00C9A7]',
  institution_admin: 'bg-[#6C63FF]/20 text-[#6C63FF]', 
  ngo_admin: 'bg-purple-500/20 text-purple-400',
  super_admin: 'bg-yellow-500/20 text-yellow-400',
};

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          role,
          last_active,
          created_at,
          institutions (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
      }

      if (data) {
        setUsers(data);
      }
      setLoading(false);
    }
    fetchUsers();

    const sub = supabase.channel('realtime-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers)
      .subscribe();
      
    return () => { supabase.removeChannel(sub); };
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = (u.full_name?.toLowerCase() || '').includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

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
      <div>
        <h1 className="text-3xl font-bold text-white">All Users</h1>
        <p className="text-white/60 mt-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse"></span>
          Live from Database
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Students', count: users.filter(u => u.role === 'student').length, color: 'text-blue-400' },
          { label: 'Teachers', count: users.filter(u => u.role === 'teacher').length, color: 'text-[#00C9A7]' },
          { label: 'Inst. Admins', count: users.filter(u => u.role === 'institution_admin').length, color: 'text-[#6C63FF]' },
          { label: 'NGO Admins', count: users.filter(u => u.role === 'ngo_admin').length, color: 'text-purple-400' },
          { label: 'Super Admins', count: users.filter(u => u.role === 'super_admin').length, color: 'text-yellow-400' },
        ].map((r, i) => (
          <div key={i} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${r.color}`}>{loading ? '...' : r.count}</p>
            <p className="text-white/50 text-xs">{r.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="glass-input flex-1" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="glass-input bg-transparent appearance-none">
          <option value="All" className="bg-[#24243e]">All Roles</option>
          <option value="student" className="bg-[#24243e]">Student</option>
          <option value="teacher" className="bg-[#24243e]">Teacher</option>
          <option value="institution_admin" className="bg-[#24243e]">Inst. Admin</option>
          <option value="ngo_admin" className="bg-[#24243e]">NGO Admin</option>
          <option value="super_admin" className="bg-[#24243e]">Super Admin</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 font-medium">User</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Institution</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Last Active</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-white/50">Loading users...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-white/50">No users found.</td></tr>
            ) : filtered.map((u, i) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="p-4">
                  <p className="text-white font-medium">{u.full_name || 'Unnamed'}</p>
                </td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-[10px] font-medium ${ROLE_COLORS[u.role] || 'bg-white/10 text-white'}`}>{u.role?.replace('_', ' ')}</span></td>
                <td className="p-4 text-white/70">{u.institutions?.name || 'Platform'}</td>
                <td className="p-4"><span className="w-2 h-2 inline-block rounded-full bg-green-400 mr-2" /><span className="text-white/70">Active</span></td>
                <td className="p-4 text-white/50">{formatTimeAgo(u.last_active || u.created_at)}</td>
                <td className="p-4 flex gap-2">
                  <button className="px-3 py-1 bg-white/10 text-white/80 rounded-lg text-xs hover:bg-white/20 transition">Edit</button>
                  <button className="px-3 py-1 bg-[#6C63FF]/20 text-[#6C63FF] rounded-lg text-xs hover:bg-[#6C63FF]/30 transition">Impersonate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
