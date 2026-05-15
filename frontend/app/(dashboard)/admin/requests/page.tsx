'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('institution_id')
      .eq('id', user.id)
      .single();

    if (adminProfile?.institution_id) {
      setInstitutionId(adminProfile.institution_id);
      
      // Fetch profiles that have this institution_id and plan = 'pending'
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at, plan')
        .eq('institution_id', adminProfile.institution_id)
        .eq('plan', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) setRequests(data);
    }
    setLoading(false);
  }

  const handleAccept = async (userId: string) => {
    setProcessing(userId);
    // Setting plan to 'free' or 'active' approves them into the institution
    const { error } = await supabase
      .from('profiles')
      .update({ plan: 'free' }) // 'free' is the default active state
      .eq('id', userId);
      
    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== userId));
      alert('User access granted successfully!');
    } else {
      alert('Error granting access');
    }
    setProcessing(null);
  };

  const handleReject = async (userId: string) => {
    setProcessing(userId);
    // Rejecting means removing them from the institution
    const { error } = await supabase
      .from('profiles')
      .update({ plan: 'rejected', institution_id: null }) 
      .eq('id', userId);
      
    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== userId));
      alert('User request rejected.');
    } else {
      alert('Error rejecting access');
    }
    setProcessing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Access Requests</h1>
          <p className="text-white/60 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
            Manage pending student and teacher approvals
          </p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">
            <span className="w-8 h-8 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin inline-block mb-2" />
            <p className="text-white/40 text-sm">Checking pending requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-6xl mb-4 opacity-50">✅</div>
            <h3 className="text-white font-bold text-xl">All caught up!</h3>
            <p className="text-white/40 text-sm mt-2">There are no pending access requests for your institution right now.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Requested Role</th>
                <th className="p-4 font-medium">Date Requested</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#00C9A7] flex items-center justify-center text-white text-xs font-bold">
                        {r.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{r.full_name || 'Unnamed'}</p>
                        <p className="text-white/40 text-xs">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium capitalize ${r.role === 'teacher' ? 'bg-[#00C9A7]/20 text-[#00C9A7]' : 'bg-blue-500/20 text-blue-400'}`}>
                      {r.role}
                    </span>
                  </td>
                  <td className="p-4 text-white/50">
                    {new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-yellow-500/20 text-yellow-400">
                      Pending Approval
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {processing === r.id ? (
                      <span className="text-white/50 text-xs inline-block px-4">Processing...</span>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => handleReject(r.id)}
                          className="px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-500/20 hover:text-red-300 transition"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleAccept(r.id)}
                          className="px-4 py-1.5 bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/20 rounded-lg text-xs font-medium hover:bg-[#00C9A7]/20 hover:text-[#00C9A7] transition"
                        >
                          Accept Access
                        </button>
                      </div>
                    )}
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
