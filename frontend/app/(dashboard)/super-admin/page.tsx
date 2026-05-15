'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// --- Types ---
type RoleData = { name: string; value: number; color: string };
type DeviceData = { name: string; users: number };
type GrowthData = { name: string; users: number; institutions: number };
type ActivityItem = { icon: string; title: string; desc: string; time: string; color: string; timestamp: number };

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, lessons: 0, institutions: 0, revenue: 0 });
  const [roleData, setRoleData] = useState<RoleData[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRealtimeData() {
      setLoading(true);

      // 1. Fetch exact counts for top stats
      const [
        { count: students },
        { count: teachers },
        { count: lessons },
        { count: institutions },
        { data: allInstitutions },
        { data: recentJobs },
        { data: recentInsts },
        { data: allEvents },
        { data: allProfiles }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        supabase.from('institutions').select('*', { count: 'exact', head: true }),
        supabase.from('institutions').select('plan, created_at'),
        supabase.from('ai_jobs').select('*').order('queued_at', { ascending: false }).limit(5),
        supabase.from('institutions').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('analytics_events').select('platform, created_at'),
        supabase.from('profiles').select('role, created_at')
      ]);

      // --- Calculate Real Estimated Revenue from Institution Plans ---
      // Assuming monthly pricing in INR: pro=₹5,000, institution=₹25,000, enterprise=₹1,00,000
      let calculatedRevenue = 0;
      if (allInstitutions) {
        allInstitutions.forEach(inst => {
          if (inst.plan === 'pro') calculatedRevenue += 5000;
          if (inst.plan === 'institution') calculatedRevenue += 25000;
          if (inst.plan === 'enterprise') calculatedRevenue += 100000;
        });
      }

      setStats({
        students: students ?? 0,
        teachers: teachers ?? 0,
        lessons: lessons ?? 0,
        institutions: institutions ?? 0,
        revenue: calculatedRevenue,
      });

      // --- Calculate Real Role Demographics ---
      const roleCounts = { student: 0, teacher: 0, admin: 0, ngo: 0 };
      if (allProfiles) {
        allProfiles.forEach(p => {
          if (p.role === 'student') roleCounts.student++;
          else if (p.role === 'teacher') roleCounts.teacher++;
          else if (p.role === 'ngo_admin') roleCounts.ngo++;
          else roleCounts.admin++; // institution_admin or super_admin
        });
      }
      setRoleData([
        { name: 'Students', value: roleCounts.student, color: '#00C9A7' },
        { name: 'Teachers', value: roleCounts.teacher, color: '#6C63FF' },
        { name: 'Admins', value: roleCounts.admin, color: '#FF9600' },
        { name: 'NGOs', value: roleCounts.ngo, color: '#FF4B4B' },
      ]);

      // --- Calculate Real Device Traffic ---
      const deviceCounts = { mobile: 0, web: 0, tablet: 0 };
      if (allEvents && allEvents.length > 0) {
        allEvents.forEach(e => {
          if (e.platform === 'mobile') deviceCounts.mobile++;
          else if (e.platform === 'tablet') deviceCounts.tablet++;
          else deviceCounts.web++;
        });
      } else {
        // Fallback if no analytics events exist yet so the chart isn't completely broken
        deviceCounts.web = 1;
      }
      setDeviceData([
        { name: 'Web', users: deviceCounts.web },
        { name: 'Mobile', users: deviceCounts.mobile },
        { name: 'Tablet', users: deviceCounts.tablet },
      ]);

      // --- Calculate Real Growth Trends (Group by Month) ---
      // We'll look at profiles created_at and institutions created_at
      const monthsMap: Record<string, { users: number, inst: number }> = {};
      
      // Initialize last 6 months to ensure chart has data points
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        monthsMap[monthName] = { users: 0, inst: 0 };
      }

      if (allProfiles) {
        allProfiles.forEach(p => {
          if (!p.created_at) return;
          const monthName = new Date(p.created_at).toLocaleString('default', { month: 'short' });
          if (monthsMap[monthName]) monthsMap[monthName].users++;
        });
      }
      if (allInstitutions) {
        allInstitutions.forEach(i => {
          if (!i.created_at) return;
          const monthName = new Date(i.created_at).toLocaleString('default', { month: 'short' });
          if (monthsMap[monthName]) monthsMap[monthName].inst++;
        });
      }

      const formattedGrowth = Object.entries(monthsMap).map(([name, data]) => ({
        name,
        users: data.users,
        institutions: data.inst
      }));
      setGrowthData(formattedGrowth);

      // --- Aggregate Realtime Live Activity Feed ---
      const feed: ActivityItem[] = [];
      
      if (recentInsts) {
        recentInsts.forEach(inst => {
          feed.push({
            icon: '🏫',
            title: `New Institution: ${inst.name}`,
            desc: `Onboarded on the ${inst.plan} plan in ${inst.state || 'India'}`,
            time: formatTimeAgo(new Date(inst.created_at)),
            timestamp: new Date(inst.created_at).getTime(),
            color: 'bg-purple-500'
          });
        });
      }

      if (recentJobs) {
        recentJobs.forEach(job => {
          const isError = job.status === 'failed';
          feed.push({
            icon: isError ? '⚠️' : '🎬',
            title: `AI Job ${isError ? 'Failed' : job.status}: ${job.job_type.replace(/_/g, ' ')}`,
            desc: isError ? (job.error_message || 'Processing error occurred') : 'Lesson asset processing update',
            time: formatTimeAgo(new Date(job.queued_at)),
            timestamp: new Date(job.queued_at).getTime(),
            color: isError ? 'bg-[#FF9600]' : 'bg-[#6C63FF]'
          });
        });
      }

      // Sort feed by most recent first
      feed.sort((a, b) => b.timestamp - a.timestamp);
      setActivities(feed);

      setLoading(false);
    }

    fetchRealtimeData();

    // Set up realtime subscription for immediate updates on profiles/institutions
    const profileSub = supabase.channel('realtime-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchRealtimeData)
      .subscribe();
      
    const instSub = supabase.channel('realtime-institutions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'institutions' }, fetchRealtimeData)
      .subscribe();

    return () => {
      supabase.removeChannel(profileSub);
      supabase.removeChannel(instSub);
    };
  }, []);

  const formatTimeAgo = (date: Date) => {
    const minDiff = Math.floor((new Date().getTime() - date.getTime()) / 60000);
    if (minDiff < 1) return 'Just now';
    if (minDiff < 60) return `${minDiff} mins ago`;
    const hourDiff = Math.floor(minDiff / 60);
    if (hourDiff < 24) return `${hourDiff} hours ago`;
    return `${Math.floor(hourDiff / 24)} days ago`;
  };

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;
  const formatNumber = (value: number) => value.toLocaleString('en-IN');

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Super Admin Dashboard 👑</h1>
          <p className="text-white/60 mt-1 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse"></span>
            Real-time Database Insights
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm hover:bg-white/10 transition">
            Export Report
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] rounded-xl text-white text-sm font-bold shadow-lg shadow-[#6C63FF]/20 hover:scale-105 transition">
            Manage Subscriptions
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-[#00C9A7] relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-6xl opacity-10">💰</div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Est. MRR (from Plans)</p>
          <h2 className="text-3xl font-black text-white">
            {loading ? '...' : formatCurrency(stats.revenue)}
          </h2>
          <p className="text-[#00C9A7] text-sm font-bold mt-2 flex items-center gap-1">
            <span className="text-lg">↗</span> Live Calculated
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-[#6C63FF] relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-6xl opacity-10">👥</div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Active Users (Live)</p>
          <h2 className="text-3xl font-black text-white">
            {loading ? '...' : formatNumber(stats.students + stats.teachers)}
          </h2>
          <p className="text-[#6C63FF] text-sm font-bold mt-2 flex items-center gap-1">
            <span className="text-lg">↗</span> Verified Accounts
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-[#FF9600] relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-6xl opacity-10">🏫</div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Active Institutions</p>
          <h2 className="text-3xl font-black text-white">
            {loading ? '...' : formatNumber(stats.institutions)}
          </h2>
          <p className="text-[#FF9600] text-sm font-bold mt-2 flex items-center gap-1">
            <span className="text-lg">↗</span> Enrolled Schools/NGOs
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-[#ce82ff] relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-6xl opacity-10">📚</div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Total Lessons Processed</p>
          <h2 className="text-3xl font-black text-white">
             {loading ? '...' : formatNumber(stats.lessons)}
          </h2>
          <p className="text-[#ce82ff] text-sm font-bold mt-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#ce82ff] animate-pulse"></span> DB Synced
          </p>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Trend Chart */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-bold text-lg">Platform Growth (Actual)</h3>
            <span className="text-xs text-white/50 font-mono">Real-time Profiles & Institutions</span>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInst" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C9A7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00C9A7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={(v) => `₹${v}`} />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15,12,41,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="users" name="New Users" stroke="#6C63FF" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                <Area yAxisId="right" type="monotone" dataKey="institutions" name="New Institutions" stroke="#00C9A7" strokeWidth={3} fillOpacity={1} fill="url(#colorInst)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Distribution */}
        <div className="glass-card p-6 rounded-2xl flex flex-col">
          <h3 className="text-white font-bold text-lg mb-6">Real User Demographics</h3>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15,12,41,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-white">{loading ? '...' : formatNumber(roleData.reduce((a, b) => a + b.value, 0))}</span>
              <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Total Rows</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {roleData.map((role) => (
              <div key={role.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }}></span>
                <div>
                  <p className="text-white/60 text-[10px] uppercase font-bold">{role.name}</p>
                  <p className="text-white font-bold text-sm">{loading ? '-' : formatNumber(role.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Traffic */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
            Traffic by Platform
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/60 font-mono">analytics_events table</span>
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.6)" fontSize={12} tickLine={false} axisLine={false} width={70} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(15,12,41,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="users" name="Logged Events" fill="#6C63FF" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Platform Activity */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-bold text-lg">Live DB Activity Log</h3>
            <span className="flex items-center gap-2 text-xs font-bold text-[#00C9A7] bg-[#00C9A7]/10 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C9A7] animate-ping"></span> Live
            </span>
          </div>
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
            {loading ? (
              <div className="text-center py-10"><span className="w-6 h-6 border-2 border-[#00C9A7] border-t-transparent rounded-full animate-spin inline-block"></span></div>
            ) : activities.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-6">No recent database activity found.</p>
            ) : (
              activities.map((activity, i) => (
                <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition cursor-pointer border border-transparent hover:border-white/5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.color}/20 text-xl border border-${activity.color}/30`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white text-sm font-bold truncate">{activity.title}</h4>
                    <p className="text-white/50 text-xs truncate mt-0.5">{activity.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-white/30 text-[10px] font-medium">{activity.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
