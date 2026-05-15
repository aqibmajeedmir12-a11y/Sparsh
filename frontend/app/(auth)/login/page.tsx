'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
});

const ROLE_REDIRECTS = {
  student:           '/student',
  teacher:           '/teacher',
  institution_admin: '/admin',
  ngo_admin:         '/admin',
  super_admin:       '/super-admin',
};

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const startCooldown = (seconds = 60) => {
    setCooldown(seconds);
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    if (cooldown > 0) return;
    setLoading(true);
    setError('');
    
    // Auth login logic
    let { data: auth, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    // Handle Supabase rate limiting (429)
    if (authError && (authError.status === 429 || authError.message?.toLowerCase().includes('too many'))) {
      setError('Too many login attempts. Please wait 60 seconds before trying again.');
      startCooldown(60);
      setLoading(false);
      return;
    }

    // Auto-provision Demo Accounts if requested and not exists
    if (authError && ['admin@gmail.com', 'ngo@gmail.com', 'school@gmail.com'].includes(data.email) && data.password === 'admin123') {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (!signUpError && signUpData.user) {
        let assignedRole = 'super_admin';
        if (data.email === 'ngo@gmail.com') assignedRole = 'ngo_admin';
        if (data.email === 'school@gmail.com') assignedRole = 'institution_admin';
        
        await supabase.from('profiles').upsert({
          id: signUpData.user.id,
          email: data.email,
          full_name: data.email === 'admin@gmail.com' ? 'Super Administrator' : data.email === 'ngo@gmail.com' ? 'NGO Director' : 'School Principal',
          role: assignedRole
        });
        auth = signUpData as any;
        authError = null;
      }
    }
    
    if (authError) { 
      setError(authError.message); 
      setLoading(false); 
      return; 
    }

    if (auth.user) {
      // Force roles for demo accounts even if they registered normally before
      let forcedRole: string | null = null;
      if (data.email === 'admin@gmail.com') forcedRole = 'super_admin';
      else if (data.email === 'ngo@gmail.com') forcedRole = 'ngo_admin';
      else if (data.email === 'school@gmail.com') forcedRole = 'institution_admin';

      if (forcedRole) {
        await supabase.from('profiles').update({ role: forcedRole }).eq('id', auth.user.id);
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', auth.user.id)
        .single();

      const userRole = forcedRole || (profile as any)?.role;
      const redirect = ROLE_REDIRECTS[userRole as keyof typeof ROLE_REDIRECTS] || '/student';
      router.push(redirect);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#00C9A7] flex items-center justify-center mb-3">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Sparsh</h1>
          <p className="text-white/60 text-sm mt-1">Accessible Education for All</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-white/80 text-sm mb-1 block">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="glass-input w-full"
              aria-label="Email address"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message as string}</p>}
          </div>
          <div>
            <label className="text-white/80 text-sm mb-1 block">Password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="glass-input w-full"
              aria-label="Password"
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message as string}</p>}
          </div>
          {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg p-3">{error}</p>}
          <button
            type="submit"
            disabled={loading || cooldown > 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] text-white font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Sign in to Sparsh"
          >
            {cooldown > 0 ? `Try again in ${cooldown}s` : loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <a href="/register" className="text-[#00C9A7] text-sm hover:underline">
            New to Sparsh? Create account
          </a>
          <br />
          <a href="/login?magic=true" className="text-white/40 text-xs hover:text-white/60">
            Sign in with magic link
          </a>
        </div>
      </div>
    </div>
  );
}
