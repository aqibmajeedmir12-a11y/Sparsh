'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<any>({});
  const [avatarFaceUrl, setAvatarFaceUrl] = useState<string | null>(null);

  const [prefs, setPrefs] = useState<any>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single()
          .then(({ data }) => {
            setProfile(data);
            setForm(data || {});
            setPrefs(data?.accessibility_prefs || {
              isl_avatar_on: true,
              captions_on: true,
              tts_on: false,
              high_contrast: false,
              haptic_on: true,
              deafblind_mode: false,
              braille_paired: false,
              switch_access: false,
              font_size: 'medium',
              tts_speed: 1.0
            });
          });
      }
    });
    setAvatarFaceUrl(localStorage.getItem('avatar_face_url'));
  }, []);

  const handleFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        localStorage.setItem('avatar_face_url', url);
        setAvatarFaceUrl(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const updatePref = async (key: string, value: any) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    
    // Save to backend
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        accessibility_prefs: newPrefs
      }).eq('id', user.id);
    }
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({
      full_name: form.full_name,
      language_preference: form.language_preference,
      grade: form.grade,
      board: form.board,
    }).eq('id', user.id);
    setProfile({ ...profile, ...form });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="text-white/60 mt-1">Manage your account and accessibility preferences</p>
        </div>
        {saved && (
          <div className="px-4 py-2 bg-[#00C9A7]/20 text-[#00C9A7] rounded-xl text-sm font-medium">
            ✓ Profile saved!
          </div>
        )}
      </div>

      {/* Avatar & Basic Info */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#00C9A7] flex items-center justify-center text-white text-3xl font-bold overflow-hidden relative group shadow-xl">
              {avatarFaceUrl ? (
                <img src={avatarFaceUrl} alt="Custom Face" className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0) || 'U'
              )}
              {editing && (
                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                  <span className="text-2xl mb-1">📷</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFaceUpload} />
                </label>
              )}
            </div>
            {editing && avatarFaceUrl && (
              <button onClick={() => { localStorage.removeItem('avatar_face_url'); setAvatarFaceUrl(null); }} className="text-red-400 text-[10px] uppercase font-bold hover:underline transition">
                Remove Face
              </button>
            )}
            {!editing && avatarFaceUrl && (
               <span className="text-[10px] uppercase font-bold text-[#00C9A7]">3D Avatar Linked</span>
            )}
            {!editing && !avatarFaceUrl && (
               <span className="text-[10px] uppercase font-bold text-white/30">Default Avatar</span>
            )}
          </div>
          <div className="flex-1 mt-2">
            {editing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-xs block mb-1">Full Name</label>
                  <input className="glass-input w-full" value={form.full_name || ''} onChange={e => setForm({...form, full_name: e.target.value})} />
                </div>
                <div>
                  <label className="text-white/60 text-xs block mb-1">Grade</label>
                  <select className="glass-input w-full bg-transparent appearance-none" value={form.grade || ''} onChange={e => setForm({...form, grade: e.target.value})}>
                    {['6','7','8','9','10','11','12'].map(g => <option key={g} value={g} className="bg-[#24243e]">Grade {g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-xs block mb-1">Board</label>
                  <select className="glass-input w-full bg-transparent appearance-none" value={form.board || ''} onChange={e => setForm({...form, board: e.target.value})}>
                    {['CBSE','ICSE','State','IB'].map(b => <option key={b} value={b} className="bg-[#24243e]">{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-xs block mb-1">Language</label>
                  <select className="glass-input w-full bg-transparent appearance-none" value={form.language_preference || 'hi'} onChange={e => setForm({...form, language_preference: e.target.value})}>
                    <option value="hi" className="bg-[#24243e]">Hindi</option>
                    <option value="en" className="bg-[#24243e]">English</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-white text-xl font-bold">{profile?.full_name || 'Loading...'}</h2>
                <p className="text-white/60 text-sm mt-1">Grade {profile?.grade || '—'} • {profile?.board || '—'} • {profile?.language_preference === 'hi' ? 'Hindi' : 'English'}</p>
                <div className="flex gap-2 mt-3">
                  <span className="px-3 py-1 rounded-full bg-[#6C63FF]/20 text-[#6C63FF] text-xs font-medium capitalize">{profile?.role?.replace('_', ' ') || 'Student'}</span>
                  <span className="px-3 py-1 rounded-full bg-[#00C9A7]/20 text-[#00C9A7] text-xs font-medium capitalize">{profile?.disability_type || 'none'}</span>
                </div>
              </div>
            )}
          </div>
          <div className="shrink-0">
            {editing ? (
              <div className="flex gap-2">
                <button onClick={handleSave} className="px-4 py-2 bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition">Save</button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="px-4 py-2 bg-white/10 border border-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition">Edit Profile</button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Day Streak', value: profile?.streak_days || 0, icon: '🔥', color: 'text-orange-400' },
          { label: 'Sign Hours', value: `${profile?.total_sign_hours || 0}h`, icon: '🤟', color: 'text-[#6C63FF]' },
          { label: 'Lessons Done', value: profile?.total_lessons_done || 0, icon: '📚', color: 'text-[#00C9A7]' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-4 text-center">
            <span className="text-2xl block mb-1">{s.icon}</span>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-white/50 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Accessibility Preferences */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-5">Accessibility Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'isl_avatar_on', label: 'ISL Avatar', desc: 'Show sign language avatar during lessons', icon: '🤟' },
            { key: 'captions_on', label: 'Live Captions', desc: 'Auto-captions on all video content', icon: '💬' },
            { key: 'tts_on', label: 'Text-to-Speech', desc: 'Read content aloud using TTS', icon: '🔊' },
            { key: 'high_contrast', label: 'High Contrast', desc: 'Increase contrast for better visibility', icon: '🎨' },
            { key: 'haptic_on', label: 'Haptic Feedback', desc: 'Vibrations on interaction (mobile)', icon: '📳' },
            { key: 'deafblind_mode', label: 'DeafBlind Mode', desc: 'Optimized for Braille display + switch access', icon: '⠿' },
            { key: 'braille_paired', label: 'Braille Display', desc: 'Paired Braille HID device connected', icon: '⌨️' },
            { key: 'switch_access', label: 'Switch Access', desc: 'Navigate using switch controls', icon: '🎮' },
          ].map((pref, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition cursor-pointer" onClick={() => updatePref(pref.key, !prefs[pref.key])}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{pref.icon}</span>
                <div>
                  <p className="text-white font-medium text-sm">{pref.label}</p>
                  <p className="text-white/40 text-xs">{pref.desc}</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full relative transition ${prefs[pref.key] ? 'bg-[#00C9A7]' : 'bg-white/20'}`}>
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${prefs[pref.key] ? 'left-6' : 'left-0.5'}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Font Size */}
        <div className="mt-4 p-4 bg-white/5 rounded-xl">
          <p className="text-white font-medium text-sm mb-3">Font Size</p>
          <div className="flex gap-2">
            {['small', 'medium', 'large', 'xl'].map(size => (
              <button key={size} onClick={() => updatePref('font_size', size)} className={`flex-1 py-2 rounded-lg text-sm capitalize transition ${prefs.font_size === size ? 'bg-[#6C63FF] text-white shadow-lg scale-105' : 'bg-white/10 text-white/60 hover:text-white/80'}`}>
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* TTS Speed */}
        <div className="mt-4 p-4 bg-white/5 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-medium text-sm">TTS Speed</p>
            <span className="text-[#6C63FF] font-medium">{prefs.tts_speed || 1.0}x</span>
          </div>
          <input 
            type="range" 
            min="0.5" 
            max="2.0" 
            step="0.25" 
            value={prefs.tts_speed || 1.0} 
            onChange={(e) => updatePref('tts_speed', parseFloat(e.target.value))}
            className="w-full accent-[#6C63FF]" 
          />
          <div className="flex justify-between text-xs text-white/30 mt-1">
            <span>0.5x Slow</span>
            <span>1.0x Normal</span>
            <span>2.0x Fast</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 border border-red-500/20">
        <h3 className="text-white font-semibold mb-4">Account</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <button className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm hover:bg-white/10 transition">
            🔒 Change Password
          </button>
          <button className="flex-1 py-3 bg-white/5 border border-white/10 text-white/60 rounded-xl text-sm hover:bg-white/10 transition">
            📧 Change Email
          </button>
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
            className="flex-1 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm hover:bg-red-500/20 transition">
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
