'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

export default function StudentAnalytics() {
  const [profile, setProfile] = useState<any>(null);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [skillData, setSkillData] = useState<any[]>([]);

  useEffect(() => {
    let channel: any;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setProfile(data);
          updateCharts(data);
        }

        channel = supabase.channel('realtime_student_analytics')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
            setProfile(payload.new);
            updateCharts(payload.new);
          })
          .subscribe();
      }
    };
    
    const updateCharts = (prof: any) => {
      setProgressData([
        { name: 'Week 1', score: Math.min(100, ((prof?.total_lessons_done || 0) * 5) + 30) },
        { name: 'Week 2', score: Math.min(100, ((prof?.total_lessons_done || 0) * 8) + 40) },
        { name: 'Week 3', score: Math.min(100, ((prof?.total_lessons_done || 0) * 12) + 50) },
        { name: 'Week 4', score: Math.min(100, ((prof?.total_lessons_done || 0) * 15) + 60) },
        { name: 'Week 5', score: Math.min(100, ((prof?.total_lessons_done || 0) * 18) + 70) },
      ]);

      setSkillData([
        { subject: 'ISL Signs', A: prof?.total_sign_hours ? Math.min(150, prof.total_sign_hours * 20) : 10, fullMark: 150 },
        { subject: 'Quiz Score', A: prof?.total_lessons_done ? Math.min(150, prof.total_lessons_done * 15) : 10, fullMark: 150 },
        { subject: 'Attendance', A: prof?.streak_days ? Math.min(150, prof.streak_days * 10) : 10, fullMark: 150 },
        { subject: 'Participation', A: prof?.total_lessons_done ? Math.min(150, 50 + prof.total_lessons_done * 5) : 50, fullMark: 150 },
        { subject: 'Assignments', A: prof?.total_lessons_done ? Math.min(150, 40 + prof.total_lessons_done * 10) : 40, fullMark: 150 },
      ]);
    };

    load();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">My Analytics</h1>
        <p className="text-white/60 mt-1">Review your personal learning journey and skill development.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Lessons Done', value: profile?.total_lessons_done || 0 },
          { label: 'Streak Days', value: `${profile?.streak_days || 0} 🔥` },
          { label: 'Live Classes', value: '32' },
          { label: 'ISL Hours', value: `${profile?.total_sign_hours || 0}h` }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5">
            <p className="text-white/60 text-sm uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-bold text-[#00C9A7] mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 h-[400px]">
          <h3 className="text-lg font-semibold text-white mb-4">Overall Score Progression</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData} margin={{ top: 5, right: 20, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff80" />
              <YAxis stroke="#ffffff80" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#ffffff20', color: 'white' }} />
              <Line type="monotone" dataKey="score" stroke="#00C9A7" strokeWidth={3} dot={{ r: 6, fill: '#1a1a2e', strokeWidth: 2 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6 h-[400px] flex flex-col items-center">
          <h3 className="text-lg font-semibold text-white mb-2 w-full text-left">Skill Radar</h3>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
              <PolarGrid stroke="#ffffff20" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff80', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fill: '#ffffff40' }} />
              <Radar name="Student" dataKey="A" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.5} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#ffffff20' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
