'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [recentLessons, setRecentLessons] = useState<any[]>([]);
  const [liveSession, setLiveSession] = useState<any>(null);
  const [stats, setStats] = useState({ lessonsTotal: 0, streak: 0, signHours: 0, lessonsDone: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channels: any[] = [];
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (prof) {
          setProfile(prof);
          setStats({
            lessonsTotal: prof.total_lessons_done ?? 0,
            streak: prof.streak_days ?? 0,
            signHours: Math.round(prof.total_sign_hours ?? 0),
            lessonsDone: prof.total_lessons_done ?? 0,
          });
        }
        
        const profileCh = supabase.channel('realtime_student_profile')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload: any) => {
             const updatedProf = payload.new;
             setProfile(updatedProf);
             setStats({
               lessonsTotal: updatedProf.total_lessons_done ?? 0,
               streak: updatedProf.streak_days ?? 0,
               signHours: Math.round(updatedProf.total_sign_hours ?? 0),
               lessonsDone: updatedProf.total_lessons_done ?? 0,
             });
          }).subscribe();
        channels.push(profileCh);
      }

      // Fetch recent lessons from DB
      const fetchLessons = async () => {
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, title, subject, chapter, grade, board, thumbnail_url, tags, duration_seconds')
          .order('created_at', { ascending: false })
          .limit(3);
        if (lessons) setRecentLessons(lessons);
      };
      await fetchLessons();

      const lessonsCh = supabase.channel('realtime_student_lessons')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => {
          fetchLessons();
        }).subscribe();
      channels.push(lessonsCh);

      // Check for any live session
      const { data: session } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('status', 'live')
        .limit(1)
        .maybeSingle();
      if (session) setLiveSession(session);

      const liveCh = supabase.channel('realtime_student_live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, (payload: any) => {
           if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new.status === 'live') {
             setLiveSession(payload.new);
           } else if (payload.new?.status !== 'live') {
             setLiveSession(null);
           }
        }).subscribe();
      channels.push(liveCh);

      setLoading(false);
    }
    load();
    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const vibrate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50); // slight tap haptic
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {greeting()}, {profile?.full_name || 'Student'} 👋
          </h1>
          <p className="text-white/60">Ready to learn something new today?</p>
        </div>
        <div className="flex gap-2 bg-[#1e1e32]/50 p-2 rounded-xl backdrop-blur-md border border-white/10">
          <button className="px-3 py-1.5 rounded-lg bg-[#6C63FF]/20 text-[#6C63FF] text-sm font-medium">ISL</button>
          <button className="px-3 py-1.5 rounded-lg hover:bg-white/5 text-white/70 text-sm font-medium transition">Captions</button>
          <button className="px-3 py-1.5 rounded-lg hover:bg-white/5 text-white/70 text-sm font-medium transition">TTS</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Lessons Completed', value: stats.lessonsTotal, color: 'text-[#1cb0f6]', bg: 'bg-[#1cb0f6]/10', border: 'border-[#1cb0f6]/20' },
          { label: 'Weekly Streak', value: `${stats.streak} days`, color: 'text-[#ff9600]', bg: 'bg-[#ff9600]/10', border: 'border-[#ff9600]/20', icon: '🔥' },
          { label: 'ISL Hours', value: `${stats.signHours}h`, color: 'text-[#58cc02]', bg: 'bg-[#58cc02]/10', border: 'border-[#58cc02]/20', icon: '🤟' },
          { label: 'Lessons In DB', value: recentLessons.length > 0 ? '6+' : '0', color: 'text-[#ce82ff]', bg: 'bg-[#ce82ff]/10', border: 'border-[#ce82ff]/20' },
        ].map((stat, i) => (
          <div key={i} className={`glass-card p-5 rounded-2xl border-b-4 ${stat.border} ${stat.bg} hover:translate-y-[-2px] transition-transform cursor-pointer`} onClick={vibrate}>
            <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              {stat.icon && <span>{stat.icon}</span>}
              {stat.label}
            </p>
            <p className={`text-3xl font-black ${stat.color}`}>{loading ? '…' : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Live Session Alert */}
      {liveSession && (
        <div className="glass-card p-5 border border-red-500/30 bg-red-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <div>
                <p className="text-white font-bold text-lg">🔴 Live Class: {liveSession.title}</p>
                <p className="text-white/70 font-medium">{liveSession.subject} • Grade {liveSession.grade}</p>
              </div>
            </div>
            <Link href="/student/live-class" onClick={vibrate}>
              <button className="px-6 py-3 bg-[#ff4b4b] text-white font-bold rounded-2xl border-b-4 border-[#ea2b2b] active:border-b-0 active:translate-y-1 transition-all">
                Join Now
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Recent Lessons */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Continue Learning</h3>
          <Link href="/student/lessons" className="text-[#6C63FF] text-sm hover:underline">View all →</Link>
        </div>
        {loading ? (
          <div className="text-center py-6">
            <span className="w-6 h-6 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin inline-block" />
          </div>
        ) : recentLessons.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-white/40 text-sm">No lessons yet. Your teacher will add lessons soon.</p>
            <Link href="/student/lessons">
              <button className="mt-3 px-4 py-2 bg-[#6C63FF]/20 text-[#6C63FF] rounded-xl text-sm hover:bg-[#6C63FF]/30 transition">Browse Lessons</button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentLessons.map(lesson => (
              <Link key={lesson.id} href={`/student/lessons/${lesson.id}`}>
                <div className="bg-[#1e1e32]/60 border border-white/5 rounded-xl overflow-hidden group cursor-pointer hover:border-[#6C63FF]/50 transition-all hover:scale-[1.02]">
                  <div className="aspect-video bg-gradient-to-br from-[#1e1e32] to-[#0f0c29] flex items-center justify-center">
                    <span className="text-4xl">{lesson.thumbnail_url || '📚'}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-[#00C9A7] text-[10px] font-semibold tracking-wider uppercase">{lesson.subject} • {lesson.chapter}</p>
                    <h4 className="text-white font-semibold mt-1 group-hover:text-[#6C63FF] transition text-sm">{lesson.title}</h4>
                    <p className="text-white/40 text-xs mt-1">Grade {lesson.grade} • {lesson.board} • {Math.floor((lesson.duration_seconds || 0) / 60)} min</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {lesson.tags?.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] text-[9px]">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/student/lessons" onClick={vibrate}>
          <button className="w-full py-4 bg-[#58cc02] text-white font-bold rounded-2xl border-b-4 border-[#58a700] active:border-b-0 active:translate-y-1 transition-all text-base shadow-sm">
            📚 Browse Lessons
          </button>
        </Link>
        <Link href="/student/sign-lab" onClick={vibrate}>
          <button className="w-full py-4 bg-[#1cb0f6] text-white font-bold rounded-2xl border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all text-base shadow-sm">
            🤟 Sign Lab
          </button>
        </Link>
        <Link href="/student/assessments" onClick={vibrate}>
          <button className="w-full py-4 bg-[#ce82ff] text-white font-bold rounded-2xl border-b-4 border-[#a568cc] active:border-b-0 active:translate-y-1 transition-all text-base shadow-sm">
            📝 Assessments
          </button>
        </Link>
        <Link href="/student/live-class" onClick={vibrate}>
          <button className="w-full py-4 bg-[#ff4b4b] text-white font-bold rounded-2xl border-b-4 border-[#ea2b2b] active:border-b-0 active:translate-y-1 transition-all text-base shadow-sm">
            🔴 Live Class
          </button>
        </Link>
      </div>
    </div>
  );
}
