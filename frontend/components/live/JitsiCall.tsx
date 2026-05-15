'use client';
import { useEffect, useRef, useState } from 'react';

interface JitsiCallProps {
  roomName: string;
  onLeave?: () => void;
  captionsEnabled?: boolean;
  islEnabled?: boolean;
  userName?: string;
  isModerator?: boolean;
}

export default function JitsiCall({ roomName, onLeave, captionsEnabled, islEnabled, userName, isModerator }: JitsiCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [callState, setCallState] = useState<'loading' | 'joined' | 'left' | 'error'>('loading');
  const [participantCount, setParticipantCount] = useState(1);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState === 'joined') {
      timer = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  useEffect(() => {
    if (!containerRef.current || !roomName) return;

    // Load Jitsi external_api.js from their CDN
    const existingScript = document.getElementById('jitsi-api');
    const init = () => {
      if (!(window as any).JitsiMeetExternalAPI) {
        setCallState('error');
        return;
      }

      // Clean up any existing instance
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }

      const options = {
        roomName: `sparsh-${roomName.replace(/\s+/g, '-').toLowerCase()}`,
        parentNode: containerRef.current!,
        width: '100%',
        height: '100%',
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          disableInviteFunctions: !isModerator,
          toolbarButtons: [
            'microphone', 'camera', 'closedcaptions', 'desktop',
            'fullscreen', 'fodeviceselection', 'hangup', 'chat',
            'raisehand', 'tileview', 'download', 'help',
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          HIDE_INVITE_MORE_HEADER: true,
          DISPLAY_WELCOME_FOOTER: false,
          APP_NAME: 'Sparsh Live Class',
          NATIVE_APP_NAME: 'Sparsh',
          DEFAULT_BACKGROUND: '#0f0c29',
        },
        userInfo: {
          displayName: userName || 'Sparsh User',
        },
      };

      const api = new (window as any).JitsiMeetExternalAPI('meet.jit.si', options);
      apiRef.current = api;

      api.addListener('videoConferenceJoined', () => setCallState('joined'));
      api.addListener('videoConferenceLeft', () => { setCallState('left'); onLeave?.(); });
      api.addListener('participantJoined', () => setParticipantCount(c => c + 1));
      api.addListener('participantLeft', () => setParticipantCount(c => Math.max(1, c - 1)));
      api.addListener('readyToClose', () => { setCallState('left'); onLeave?.(); });
    };

    if (existingScript) {
      init();
    } else {
      const script = document.createElement('script');
      script.id = 'jitsi-api';
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = init;
      script.onerror = () => setCallState('error');
      document.head.appendChild(script);
    }

    return () => {
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [roomName]);

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleLeave = () => {
    apiRef.current?.executeCommand('hangup');
    onLeave?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0f0c29]/90 backdrop-blur-md border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          {callState === 'loading' && <span className="text-yellow-400 text-xs animate-pulse">Connecting to Jitsi Meet...</span>}
          {callState === 'joined' && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-xs font-bold">LIVE</span>
              </span>
              <span className="text-white/40 text-xs font-mono">{formatDuration(duration)}</span>
              <span className="text-white/40 text-xs">👥 {participantCount}</span>
            </>
          )}
          {callState === 'error' && <span className="text-red-400 text-xs">⚠ Failed to load Jitsi</span>}
        </div>
        <div className="flex items-center gap-2">
          {captionsEnabled && <span className="px-2 py-0.5 bg-[#00C9A7]/20 text-[#00C9A7] text-[10px] rounded-full">CC ON</span>}
          {islEnabled && <span className="px-2 py-0.5 bg-[#6C63FF]/20 text-[#6C63FF] text-[10px] rounded-full">ISL ON</span>}
          <span className="px-2 py-0.5 bg-white/5 text-white/40 text-[10px] rounded-full">Jitsi Meet</span>
          <button onClick={handleLeave} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition">
            Leave
          </button>
        </div>
      </div>

      {/* Jitsi Container */}
      <div className="flex-1 relative min-h-0">
        {callState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a1a] z-10">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#00C9A7] mx-auto flex items-center justify-center mb-4 animate-pulse">
                <span className="text-white text-2xl">🎥</span>
              </div>
              <p className="text-white font-medium">Starting live class...</p>
              <p className="text-white/40 text-sm mt-1">Free • No account needed • Powered by Jitsi</p>
            </div>
          </div>
        )}
        {callState === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a1a] z-10 p-6">
            <div className="text-center max-w-sm">
              <span className="text-5xl block mb-4">❌</span>
              <h3 className="text-white font-bold mb-2">Could not load Jitsi Meet</h3>
              <p className="text-white/50 text-sm mb-4">Check your internet connection and try again.</p>
              <button onClick={() => window.location.reload()} className="px-6 py-3 bg-[#6C63FF] text-white rounded-xl font-semibold hover:bg-[#5b54e6] transition text-sm">
                Retry
              </button>
            </div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
