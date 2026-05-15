'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/layout/Sidebar';
import dynamic from 'next/dynamic';

const LiveClassNotification = dynamic(() => import('@/components/live/LiveClassNotification'), { ssr: false });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0c29]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#00C9A7] mx-auto flex items-center justify-center mb-3 animate-pulse">
            <span className="text-white font-bold">S</span>
          </div>
          <p className="text-white/60 text-sm">Loading Sparsh...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <Sidebar role={profile?.role} userName={profile?.full_name || 'User'} />
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Mobile top padding to avoid hamburger overlap */}
        <div className="p-4 pt-16 lg:pt-6 lg:p-8">
          {children}
        </div>
      </main>
      {/* Live class notification — only visible to students */}
      {profile?.role === 'student' && <LiveClassNotification />}
    </div>
  );
}
