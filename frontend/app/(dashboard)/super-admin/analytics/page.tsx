'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function SuperAdminAnalytics() {
  const [events, setEvents] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    
    // Realtime subscription
    const channel = supabase.channel('analytics_events_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'analytics_events' }, fetchAnalytics)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    const { data: eventData } = await supabase
      .from('analytics_events')
      .select('*, profiles(role)')
      .order('created_at', { ascending: false })
      .limit(500);

    if (eventData) {
      setEvents(eventData);

      // Aggregate for last 7 days of platform usage
      const daysMap: Record<string, { Student: number, Teacher: number, Admin: number }> = {};
      
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        daysMap[dayStr] = { Student: 0, Teacher: 0, Admin: 0 };
      }

      eventData.forEach(e => {
        if (!e.created_at) return;
        const d = new Date(e.created_at);
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (daysMap[dayStr]) {
          const role = (e.profiles as any)?.role || 'student';
          if (role === 'student') daysMap[dayStr].Student++;
          else if (role === 'teacher') daysMap[dayStr].Teacher++;
          else daysMap[dayStr].Admin++;
        }
      });

      const formattedChart = Object.entries(daysMap).map(([name, data]) => ({
        name,
        Student: data.Student,
        Teacher: data.Teacher,
        Admin: data.Admin
      }));
      setChartData(formattedChart);
    }
    setLoading(false);
  };

  const systemErrors = events.filter(e => e.event_type === 'system_error').length;
  const recentEvents = events.slice(0, 10);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white">Global Analytics</h1>
        <p className="text-white/60 mt-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse"></span>
          Real-time performance metrics across all roles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 border-l-4 border-[#6C63FF]">
          <p className="text-white/60 text-sm uppercase tracking-wider">Total Realtime Events</p>
          <p className="text-3xl font-bold text-white mt-2">{loading ? '...' : events.length}</p>
        </div>
        <div className="glass-card p-5 border-l-4 border-red-400">
          <p className="text-white/60 text-sm uppercase tracking-wider">System Errors Logged</p>
          <p className="text-3xl font-bold text-white mt-2">{loading ? '...' : systemErrors}</p>
        </div>
        <div className="glass-card p-5 border-l-4 border-[#00C9A7]">
          <p className="text-white/60 text-sm uppercase tracking-wider">Active Stream Clients</p>
          {/* We calculate rough active clients by unique users in last hour */}
          <p className="text-3xl font-bold text-white mt-2">
            {loading ? '...' : new Set(events.filter(e => (new Date().getTime() - new Date(e.created_at).getTime()) < 3600000).map(e => e.user_id)).size}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 h-[400px]">
          <h3 className="text-lg font-semibold text-white mb-4">Platform Usage by Role (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="name" stroke="#ffffff80" />
              <YAxis stroke="#ffffff80" allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#ffffff20', color: 'white' }} />
              <Legend />
              <Bar dataKey="Student" fill="#6C63FF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Teacher" fill="#00C9A7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Admin" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6 h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Event Stream</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <span className="w-8 h-8 border-4 border-[#00C9A7] border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : recentEvents.length === 0 ? (
              <p className="text-white/50 text-center mt-10">No events found in database. Trigger some actions!</p>
            ) : (
              recentEvents.map((evt, idx) => (
                <div key={evt.id || idx} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center hover:bg-white/10 transition">
                  <div>
                    <p className="text-white font-medium capitalize">{evt.event_type.replace(/_/g, ' ')}</p>
                    <p className="text-white/40 text-xs">Role: {(evt.profiles as any)?.role?.replace('_', ' ') || 'Unknown'} | Platform: {evt.platform || 'web'}</p>
                  </div>
                  <span className="text-white/30 text-xs font-mono">{new Date(evt.created_at).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
