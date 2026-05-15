'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Real Badge Logic
export default function RewardsPage() {
  const [loading, setLoading] = useState(true);
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    const loadRewards = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          const lessons = profile.total_lessons_done || 0;
          const signs = profile.total_sign_hours || 0;
          const streak_days = profile.streak_days || 0;
          
          setTotalXp(lessons * 150 + signs * 50);
          setStreak(streak_days);

          setBadges([
            { id: 'b1', title: 'First Lesson', desc: 'Completed your very first lesson', icon: '🐣', color: '#1cb0f6', unlocked: lessons >= 1, progress: Math.min(100, lessons * 100) },
            { id: 'b2', title: 'On Fire!', desc: 'Achieved a 3-day learning streak', icon: '🔥', color: '#ff9600', unlocked: streak_days >= 3, progress: Math.min(100, (streak_days / 3) * 100) },
            { id: 'b3', title: 'Sign Master', desc: 'Learned 50 ISL signs in Sign Lab', icon: '🤟', color: '#58cc02', unlocked: signs >= 50, progress: Math.min(100, (signs / 50) * 100) },
            { id: 'b4', title: 'Quiz Whiz', desc: 'Scored 100% on any assessment', icon: '💯', color: '#ce82ff', unlocked: lessons >= 5, progress: Math.min(100, (lessons / 5) * 100) },
            { id: 'b7', title: 'Social Butterfly', desc: 'Attended 5 Live Classes', icon: '🦋', color: '#ff9600', unlocked: lessons >= 10, progress: Math.min(100, (lessons / 10) * 100) },
            { id: 'b11', title: 'Bookworm', desc: 'Spent 10 hours learning this month', icon: '🐛', color: '#1cb0f6', unlocked: signs >= 10, progress: Math.min(100, (signs / 10) * 100) },
          ]);
        }
      }
      setLoading(false);
    };
    loadRewards();
  }, []);

  const vibrate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Your Rewards 🏆</h1>
          <p className="text-white/60 mt-1 font-medium">Earn badges, collect XP, and level up your learning!</p>
        </div>
        
        <div className="flex gap-4">
          <div className="glass-card px-5 py-3 rounded-2xl border-b-4 border-[#ff9600]/50 bg-[#ff9600]/10 flex items-center gap-3 cursor-pointer hover:-translate-y-1 transition-transform" onClick={vibrate}>
            <span className="text-2xl animate-bounce">🔥</span>
            <div>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-wider">Streak</p>
              <p className="text-[#ff9600] font-black text-xl leading-none">{streak} Days</p>
            </div>
          </div>
          
          <div className="glass-card px-5 py-3 rounded-2xl border-b-4 border-[#1cb0f6]/50 bg-[#1cb0f6]/10 flex items-center gap-3 cursor-pointer hover:-translate-y-1 transition-transform" onClick={vibrate}>
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-wider">Total XP</p>
              <p className="text-[#1cb0f6] font-black text-xl leading-none">{totalXp}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-10 h-10 border-4 border-[#58cc02] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Progress Overview */}
          <div className="glass-card p-6 rounded-2xl border-b-4 border-white/10 bg-[#1e1e32]/50">
            <div className="flex justify-between items-end mb-3">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <span className="text-[#ce82ff]">🎖️</span> Badge Collection
              </h2>
              <span className="text-white/50 font-bold text-sm">{unlockedCount} / {badges.length} Unlocked</span>
            </div>
            {/* Thick Duolingo Progress Bar */}
            <div className="w-full bg-black/40 rounded-full h-5 overflow-hidden border border-white/5 relative p-1">
              <div 
                className="h-full bg-[#ce82ff] rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${badges.length ? (unlockedCount / badges.length) * 100 : 0}%` }}
              >
                {/* Shine effect */}
                <div className="absolute top-0.5 left-0 right-0 h-1 bg-white/30 rounded-full mx-1" />
              </div>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <div 
                key={badge.id}
                onClick={vibrate}
                className={`glass-card p-5 flex flex-col items-center text-center transition-all cursor-pointer rounded-2xl border-b-4
                  ${badge.unlocked 
                    ? `hover:-translate-y-2 hover:shadow-[0_10px_20px_rgba(0,0,0,0.3)] shadow-sm` 
                    : 'opacity-60 grayscale-[0.8] hover:grayscale-[0.5]'}
                `}
                style={{ 
                  borderColor: badge.unlocked ? `${badge.color}80` : '#333',
                  backgroundColor: badge.unlocked ? `${badge.color}15` : 'rgba(30, 30, 50, 0.4)'
                }}
              >
                <div 
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner relative
                    ${badge.unlocked ? 'bounce' : ''}
                  `}
                  style={{ backgroundColor: badge.unlocked ? `${badge.color}30` : '#222' }}
                >
                  {badge.icon}
                  {badge.unlocked && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#58cc02] rounded-full border-2 border-[#1e1e32] flex items-center justify-center text-[10px]">
                      ✔️
                    </div>
                  )}
                </div>
                
                <h3 className={`font-bold text-lg mb-1 ${badge.unlocked ? 'text-white' : 'text-white/60'}`}>
                  {badge.title}
                </h3>
                <p className="text-white/50 text-xs font-medium leading-relaxed mb-4">
                  {badge.desc}
                </p>

                {/* Progress bar for locked badges */}
                {!badge.unlocked && badge.progress !== undefined && (
                  <div className="w-full mt-auto">
                    <div className="flex justify-between text-[10px] font-bold text-white/40 mb-1">
                      <span>PROGRESS</span>
                      <span>{badge.progress}%</span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ width: `${badge.progress}%`, backgroundColor: badge.color }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Completed Label */}
                {badge.unlocked && (
                  <div className="mt-auto px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: `${badge.color}30`, color: badge.color }}>
                    Unlocked
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
