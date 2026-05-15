'use client';
import { useEffect, useRef, useState } from 'react';

interface DailyCallProps {
  roomUrl: string;
  onLeave?: () => void;
  captionsEnabled?: boolean;
  islEnabled?: boolean;
  userName?: string;
}

export default function DailyCall({ roomUrl, onLeave, captionsEnabled, islEnabled, userName }: DailyCallProps) {
  const callFrameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [callState, setCallState] = useState<'idle' | 'joining' | 'joined' | 'error'>('idle');
  const [participantCount, setParticipantCount] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState === 'joined') {
      timer = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  useEffect(() => {
    if (!containerRef.current || !roomUrl) return;

    let callFrame: any;
    let destroyed = false;

    const initCall = async () => {
      const DailyIframe = (await import('@daily-co/daily-js')).default;

      if (destroyed) return;

      // Destroy any existing instance to prevent the "Duplicate" error
      try {
        const existing = DailyIframe.getCallInstance();
        if (existing) await existing.destroy();
      } catch (_) {
        // no existing instance — that's fine
      }

      if (destroyed) return;

      setCallState('joining');

      callFrame = DailyIframe.createFrame(containerRef.current!, {
        showLeaveButton: false,
        showFullscreenButton: true,
        iframeStyle: {
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '0',
        },
      });

      callFrameRef.current = callFrame;

      callFrame
        .on('joined-meeting', () => { if (!destroyed) setCallState('joined'); })
        .on('left-meeting', () => { if (!destroyed) { setCallState('idle'); onLeave?.(); } })
        .on('error', () => { if (!destroyed) setCallState('error'); })
        .on('participant-joined', () => { if (!destroyed) setParticipantCount(c => c + 1); })
        .on('participant-left', () => { if (!destroyed) setParticipantCount(c => Math.max(0, c - 1)); });

      try {
        await callFrame.join({
          url: roomUrl,
          userName: userName || 'Sparsh User',
          startVideoOff: false,
          startAudioOff: false,
        });
      } catch (err: any) {
        console.error('Daily join error:', err);
        if (!destroyed) setCallState('error');
      }
    };

    initCall();

    return () => {
      destroyed = true;
      callFrame?.destroy().catch(() => {});
    };
  }, [roomUrl]);

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleLeave = async () => {
    await callFrameRef.current?.leave();
    onLeave?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0f0c29]/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          {callState === 'joined' && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-xs font-bold">LIVE</span>
              </span>
              <span className="text-white/40 text-xs font-mono">{formatDuration(duration)}</span>
              <span className="text-white/40 text-xs">👥 {participantCount + 1}</span>
            </>
          )}
          {callState === 'joining' && (
            <span className="text-yellow-400 text-xs animate-pulse">Connecting to live class...</span>
          )}
          {callState === 'error' && (
            <span className="text-red-400 text-xs">⚠ Payment method required on Daily.co</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {captionsEnabled && (
            <span className="px-2 py-0.5 bg-[#00C9A7]/20 text-[#00C9A7] text-[10px] rounded-full">CC ON</span>
          )}
          {islEnabled && (
            <span className="px-2 py-0.5 bg-[#6C63FF]/20 text-[#6C63FF] text-[10px] rounded-full">ISL ON</span>
          )}
          <button onClick={handleLeave} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition">
            Leave
          </button>
        </div>
      </div>

      {/* Video Frame Container */}
      <div className="flex-1 relative bg-black min-h-0" ref={containerRef}>
        {callState === 'joining' && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0a0a1a]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#00C9A7] mx-auto flex items-center justify-center mb-4 animate-pulse">
                <span className="text-white text-2xl">🎥</span>
              </div>
              <p className="text-white font-medium">Joining live class...</p>
              <p className="text-white/40 text-sm mt-1">Powered by Daily.co</p>
            </div>
          </div>
        )}
        {callState === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0a0a1a] p-6">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-full bg-red-500/20 mx-auto flex items-center justify-center mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Daily.co Setup Required</h3>
              <p className="text-white/60 text-sm mb-4 leading-relaxed">
                Your Daily.co account needs a <strong className="text-white">payment method on file</strong> before rooms can be used — even on the free plan. You will not be charged.
              </p>
              <a
                href="https://dashboard.daily.co/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] text-white font-semibold rounded-xl hover:opacity-90 transition mb-3 text-sm"
              >
                Add Payment Method →
              </a>
              <p className="text-white/30 text-xs">
                After adding card, come back and click &quot;Go Live&quot; again
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
