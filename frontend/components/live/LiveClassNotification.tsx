'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface LiveSession {
  id: string;
  channel_name: string;
  title: string;
  subject: string;
  grade: string;
  institution: string;
  teacher_name: string;
  started_at: string;
}

export default function LiveClassNotification() {
  const router = useRouter();
  const [notification, setNotification] = useState<LiveSession | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Load student profile to filter by institution + grade
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (!profile) return;

    // Subscribe to new live sessions matching this student's institution + grade
    const channel = supabase
      .channel('live-sessions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_sessions',
          filter: `is_active=eq.true`,
        },
        (payload) => {
          const session = payload.new as LiveSession;
          // Only notify if institution matches AND grade matches
          const instMatch = session.institution?.toLowerCase() === profile.institution_name?.toLowerCase();
          const gradeMatch = session.grade === String(profile.grade);
          if (instMatch && gradeMatch) {
            setNotification(session);
            setDismissed(false);
            // Auto-dismiss after 30s if not acted on
            setTimeout(() => setDismissed(true), 30000);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  if (!notification || dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="glass-card p-5 border border-red-500/40 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
            <span className="text-xl">🔴</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-red-400 text-xs font-bold">CLASS STARTED</span>
            </div>
            <p className="text-white font-semibold text-sm truncate">{notification.title}</p>
            <p className="text-white/60 text-xs mt-0.5">
              {notification.teacher_name} • Grade {notification.grade}
            </p>
            <p className="text-white/40 text-[10px] mt-0.5">{notification.institution}</p>
          </div>
          <button onClick={() => setDismissed(true)} className="text-white/30 hover:text-white text-lg shrink-0 leading-none">×</button>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => router.push(`/student/live-class?channel=${encodeURIComponent(notification.channel_name)}`)}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition">
            Join Now 🎥
          </button>
          <button onClick={() => setDismissed(true)} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm transition">
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
