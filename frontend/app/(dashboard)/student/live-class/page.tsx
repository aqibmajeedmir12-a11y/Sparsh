'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

import { supabase } from '@/lib/supabase';

const AgoraCall = dynamic(() => import('@/components/live/AgoraCall'), { ssr: false });

export default function StudentLiveClassPage() {
  const searchParams = useSearchParams();
  const [activeChannel, setActiveChannel] = useState('');
  const [activeTitle, setActiveTitle] = useState('');
  const [captionsOn, setCaptionsOn] = useState(true);
  const [islOn, setIslOn] = useState(true);
  const [manualChannel, setManualChannel] = useState('');
  
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<{ user: string; message: string }[]>([
    { user: 'System', message: 'You joined the session.' },
  ]);

  // Fetch real sessions from Supabase
  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await supabase.from('live_sessions').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(10);
      if (data && !error) {
        setLiveSessions(data);
      }
    };
    fetchSessions();

    // Setup realtime subscription
    const channel = supabase.channel('live_sessions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, payload => {
        fetchSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-join if ?channel= is in URL
  useEffect(() => {
    const ch = searchParams?.get('channel');
    if (ch) {
      setActiveChannel(ch);
      setActiveTitle('Live Class');
    }
  }, [searchParams]);

  const joinSession = (session: any) => {
    setActiveChannel(session.rtc_channel_id || session.channelName || '');
    setActiveTitle(session.title);
    setCaptionsOn(true);
    setIslOn(true);
  };

  const joinManual = () => {
    if (!manualChannel.trim()) return;
    setActiveChannel(manualChannel.trim());
    setActiveTitle('Live Class');
  };

  if (activeChannel) {
    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-white">{activeTitle}</h1>
            <p className="text-white/40 text-xs font-mono">Channel: {activeChannel}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setCaptionsOn(v => !v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${captionsOn ? 'bg-[#00C9A7]/20 text-[#00C9A7]' : 'bg-white/5 text-white/40'}`}>CC Captions</button>
            <button onClick={() => setIslOn(v => !v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${islOn ? 'bg-[#6C63FF]/20 text-[#6C63FF]' : 'bg-white/5 text-white/40'}`}>🤟 ISL</button>
            <button onClick={() => setActiveChannel('')} className="px-4 py-1.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/30 transition">Leave</button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 gap-4 min-h-0">
          <div className="glass-card overflow-hidden flex-1 min-h-[450px] lg:min-h-0">
            <AgoraCall
              channelName={activeChannel}
              captionsEnabled={captionsOn}
              islEnabled={islOn}
              userName="Student"
              onLeave={() => setActiveChannel('')}
            />
          </div>

          {/* Live Chat for Student */}
          <div className="glass-card p-4 flex flex-col w-full lg:w-72 shrink-0 max-h-[320px] lg:max-h-none">
            <h3 className="text-white font-semibold text-sm mb-3 shrink-0">Live Chat</h3>
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
              {chatMessages.map((msg, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-2.5">
                  <span className="text-[#6C63FF] text-xs font-medium">{msg.user}</span>
                  <p className="text-white/80 text-xs mt-1">{msg.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 shrink-0">
              <input placeholder="Message..." className="glass-input flex-1 text-xs py-2"
                onKeyDown={e => {
                  const input = e.target as HTMLInputElement;
                  if (e.key === 'Enter' && input.value.trim()) {
                    setChatMessages(m => [...m, { user: 'You', message: input.value }]);
                    input.value = '';
                  }
                }} />
              <button className="px-3 py-2 bg-[#6C63FF] text-white rounded-xl text-xs">→</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Live Classes</h1>
        <p className="text-white/60 mt-1">Join real-time video sessions with ISL & captions — powered by Sparsh Live Engine</p>
      </div>

      {/* Manual Join with Channel ID */}
      <div className="glass-card p-5 border border-[#6C63FF]/20">
        <p className="text-white font-semibold text-sm mb-3">🔗 Join with Channel ID</p>
        <p className="text-white/50 text-xs mb-3">Have a channel ID or join link from your teacher? Paste it here.</p>
        <div className="flex gap-3">
          <input
            value={manualChannel}
            onChange={e => setManualChannel(e.target.value)}
            placeholder="Paste channel ID e.g. sparsh-mathematics-g8-37708"
            className="glass-input flex-1 text-sm"
            onKeyDown={e => e.key === 'Enter' && joinManual()}
          />
          <button onClick={joinManual} className="px-5 py-2.5 bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] text-white font-semibold rounded-xl text-sm hover:opacity-90 transition whitespace-nowrap">
            Join Now 🎥
          </button>
        </div>
      </div>

      {/* Scheduled Sessions */}
      <div className="space-y-4">
        {liveSessions.length === 0 && (
           <div className="glass-card p-8 text-center text-white/50">
             No live sessions currently available. Waiting for teacher to start a class.
           </div>
        )}
        {liveSessions.map(session => (
          <div key={session.id} className={`glass-card p-5 ${session.status === 'live' ? 'border-l-4 border-l-red-500' : ''}`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${session.status === 'live' ? 'bg-red-500/20' : 'bg-white/5'}`}>
                  {session.status === 'live' ? '🔴' : '📅'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-white font-semibold">{session.title}</h3>
                    {session.status === 'live' && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-white/50 text-sm mt-0.5">{session.profiles?.full_name || 'Teacher'} • Grade {session.grade}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-[#00C9A7]/10 text-[#00C9A7] text-[10px] rounded-full">CC Captions</span>
                    <span className="px-2 py-0.5 bg-[#6C63FF]/10 text-[#6C63FF] text-[10px] rounded-full">ISL Available</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                {session.status === 'live' ? (
                  <>
                    <p className="text-white/40 text-xs mb-2">Subject: {session.subject}</p>
                    <button onClick={() => joinSession(session)} className="px-6 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition">
                      Join Now 🎥
                    </button>
                  </>
                ) : (
                  <p className="text-white/40 text-sm">Ended</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
