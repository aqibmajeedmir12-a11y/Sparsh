'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function TeacherDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ students: 0, lessons: 0, liveSessions: 0, processingJobs: 0 });
  const [topLessons, setTopLessons] = useState<any[]>([]);
  const [processingLessons, setProcessingLessons] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channels: any[] = [];
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (prof) setProfile(prof);
      }
      
      const fetchDashboardData = async () => {
        const [
          { count: studentCount },
          { count: lessonCount },
          { count: liveCount },
          { data: processing },
          { data: top },
          { data: studentsData }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('lessons').select('*', { count: 'exact', head: true }),
          supabase.from('live_sessions').select('*', { count: 'exact', head: true }),
          supabase.from('lessons').select('id, title, processing_status').eq('processing_status', 'processing'),
          supabase.from('lessons').select('id, title, subject, view_count, tags').order('view_count', { ascending: false }).limit(5),
          supabase.from('profiles').select('id, full_name, last_active').eq('role', 'student').order('last_active', { ascending: false }).limit(8)
        ]);

        if (processing) setProcessingLessons(processing);
        if (top) setTopLessons(top);
        if (studentsData) setStudentsList(studentsData);

        setStats({
          students: studentCount ?? 0,
          lessons: lessonCount ?? 0,
          liveSessions: liveCount ?? 0,
          processingJobs: processing?.length ?? 0,
        });
      };

      await fetchDashboardData();

      // Realtime listeners
      const profCh = supabase.channel('realtime_teacher_profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: "role=eq.student" }, fetchDashboardData)
        .subscribe();
      channels.push(profCh);

      const lesCh = supabase.channel('realtime_teacher_lessons')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, fetchDashboardData)
        .subscribe();
      channels.push(lesCh);

      const liveCh = supabase.channel('realtime_teacher_live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, fetchDashboardData)
        .subscribe();
      channels.push(liveCh);

      setLoading(false);
    }
    load();
    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Teacher Dashboard</h1>
        <p className="text-white/60 mt-1">Manage classrooms, lessons, and AI-powered content</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: loading ? '…' : stats.students, color: 'text-[#6C63FF]' },
          { label: 'Lessons in DB', value: loading ? '…' : stats.lessons, color: 'text-[#00C9A7]' },
          { label: 'Live Sessions', value: loading ? '…' : stats.liveSessions, color: 'text-purple-400' },
          { label: 'Processing Jobs', value: loading ? '…' : stats.processingJobs, color: 'text-yellow-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* AI Processing Queue */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4 text-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          AI Processing Queue
        </h3>
        {loading ? (
           <div className="text-center py-4"><span className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin inline-block" /></div>
        ) : processingLessons.length === 0 ? (
           <p className="text-white/40 text-sm">No lessons are currently processing.</p>
        ) : (
          <div className="bg-[#1e1e32]/60 rounded-xl overflow-hidden border border-white/5">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-medium">Lesson Title</th>
                  <th className="p-4 font-medium">Current Step</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-white/80">
                {processingLessons.map((l) => (
                  <tr key={l.id} className="hover:bg-white/5">
                    <td className="p-4 text-white font-medium">{l.title}</td>
                    <td className="p-4 text-blue-400">AI Generation</td>
                    <td className="p-4 text-yellow-400">Processing...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Engagement */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Student Engagement (Recent)</h3>
          {loading ? (
             <div className="text-center py-4"><span className="w-6 h-6 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin inline-block" /></div>
          ) : studentsList.length === 0 ? (
             <p className="text-white/40 text-sm">No students found.</p>
          ) : (
            <div className="space-y-1.5">
              {studentsList.map((student, si) => (
                <div key={student.id} className="flex items-center gap-2">
                  <span className="text-white/50 text-xs w-20 truncate">{student.full_name || 'Unknown'}</span>
                  <div className="flex gap-1 flex-1">
                    {Array.from({ length: 7 }, (_, di) => {
                      const val = Math.random(); // visual simulation
                      return (
                        <div key={di} className="flex-1 h-6 rounded-sm"
                          style={{ backgroundColor: val > 0.7 ? '#00C9A7' : val > 0.4 ? 'rgba(0,201,167,0.4)' : val > 0.15 ? 'rgba(0,201,167,0.15)' : 'rgba(255,255,255,0.03)' }} />
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-2 pl-[88px]">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <span key={d} className="flex-1 text-center text-white/30 text-[10px]">{d}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Performing Lessons */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Top Performing Lessons</h3>
          {loading ? (
             <div className="text-center py-4"><span className="w-6 h-6 border-2 border-[#00C9A7] border-t-transparent rounded-full animate-spin inline-block" /></div>
          ) : topLessons.length === 0 ? (
             <p className="text-white/40 text-sm">No lessons found.</p>
          ) : (
            <div className="space-y-3">
              {topLessons.map((l, i) => (
                <div key={l.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                  <span className="text-white/30 text-sm font-bold w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{l.title}</p>
                    <p className="text-white/40 text-xs">{l.subject} • {l.view_count || 0} views</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[#00C9A7] text-sm font-medium">{l.view_count || 0} views</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <h3 className="text-white font-semibold text-lg">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/teacher/studio">
          <button className="w-full py-4 bg-gradient-to-br from-[#6C63FF] to-[#6C63FF]/80 rounded-xl font-medium text-white hover:opacity-90 transition text-sm">
            + Upload New Lesson
          </button>
        </Link>
        <Link href="/teacher/live">
          <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium text-white transition text-sm">
            🔴 Start Live Class
          </button>
        </Link>
        <Link href="/teacher/assessments">
          <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium text-white transition text-sm">
            📝 Create Assessment
          </button>
        </Link>
        <Link href="/teacher/students">
          <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium text-white transition text-sm">
            👥 View All Students
          </button>
        </Link>
      </div>
    </div>
  );
}
