'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'passed' | 'failed'>('all');

  useEffect(() => {
    async function fetchAssessments() {
      setLoading(true);
      const { data, error } = await supabase
        .from('assessments')
        .select('*, lessons(title, subject, grade)');
      if (!error && data) setAssessments(data);
      setLoading(false);
    }
    fetchAssessments();
  }, []);

  // Since we don't have submission data yet, show as "pending"
  const enriched = assessments.map(a => ({
    ...a,
    status: 'pending',
    score: null,
  }));

  const filtered = enriched.filter(a => filter === 'all' || a.status === filter);
  const pending = enriched.filter(a => a.status === 'pending').length;
  const passed  = enriched.filter(a => a.status === 'passed').length;
  const failed  = enriched.filter(a => a.status === 'failed').length;

  const vibrate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Assessments</h1>
        <p className="text-white/60 mt-1">Track your quizzes, tests, and evaluations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center rounded-2xl border-b-4 border-[#e5a900] bg-[#ffc800]/10 hover:-translate-y-1 transition-transform cursor-pointer" onClick={vibrate}>
          <p className="text-[#ffc800] text-3xl font-black">{pending}</p>
          <p className="text-white/60 text-xs mt-1 font-bold uppercase tracking-wider">Pending</p>
        </div>
        <div className="glass-card p-4 text-center rounded-2xl border-b-4 border-[#58a700] bg-[#58cc02]/10 hover:-translate-y-1 transition-transform cursor-pointer" onClick={vibrate}>
          <p className="text-[#58cc02] text-3xl font-black">{passed}</p>
          <p className="text-white/60 text-xs mt-1 font-bold uppercase tracking-wider">Passed</p>
        </div>
        <div className="glass-card p-4 text-center rounded-2xl border-b-4 border-[#ea2b2b] bg-[#ff4b4b]/10 hover:-translate-y-1 transition-transform cursor-pointer" onClick={vibrate}>
          <p className="text-[#ff4b4b] text-3xl font-black">{failed}</p>
          <p className="text-white/60 text-xs mt-1 font-bold uppercase tracking-wider">Failed</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white/5 p-1 rounded-2xl w-fit">
        {(['all', 'pending', 'passed', 'failed'] as const).map(f => (
          <button key={f} onClick={() => { setFilter(f); vibrate(); }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${filter === f ? 'bg-[#1cb0f6] text-white border-b-4 border-[#1899d6] translate-y-[-2px]' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10">
          <span className="w-8 h-8 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin inline-block" />
          <p className="text-white/40 text-sm mt-2">Loading assessments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-white/40 text-sm">No assessments available yet. Teachers will assign them soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(assessment => (
            <div key={assessment.id} className="glass-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border-b-4 border-[#e5a900] bg-[#ffc800]/5 hover:-translate-y-1 transition-transform shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 bg-[#ffc800]/20 bounce">
                  📝
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{assessment.title ?? assessment.lessons?.title + ' Quiz'}</h3>
                  <p className="text-[#ffc800] text-[11px] font-black tracking-wider uppercase mt-1">
                    {assessment.lessons?.subject} • Grade {assessment.lessons?.grade} • {assessment.questions?.length ?? 0} questions
                  </p>
                  <div className="flex gap-3 mt-2 text-xs font-semibold text-white/60">
                    <span className="bg-white/10 px-2 py-1 rounded-md">⏱ {assessment.time_limit_minutes} min</span>
                    <span className="bg-white/10 px-2 py-1 rounded-md">📊 Pass: {assessment.passing_score}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Link href={`/student/assessments/${assessment.id}`} onClick={vibrate} className="w-full md:w-auto">
                  <button className="w-full md:w-auto px-8 py-3 bg-[#58cc02] text-white font-bold rounded-2xl border-b-4 border-[#58a700] active:border-b-0 active:translate-y-1 transition-all">
                    START QUIZ
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
