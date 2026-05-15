'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function StudentReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('weekly');
  const [downloading, setDownloading] = useState(false);

  const [stats, setStats] = useState<any>({
    daily: { lessons: 0, time: '0m', signs: 0, quizAvg: 0, attendance: '0/1', streak: 0 },
    weekly: { lessons: 0, time: '0m', signs: 0, quizAvg: 0, attendance: '0/7', streak: 0 },
    monthly: { lessons: 0, time: '0m', signs: 0, quizAvg: 0, attendance: '0/30', streak: 0 },
    yearly: { lessons: 0, time: '0m', signs: 0, quizAvg: 0, attendance: '0/365', streak: 0 },
  });
  
  const [subjectBreakdown, setSubjectBreakdown] = useState<any[]>([]);

  useEffect(() => {
    const fetchReportData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: progress } = await supabase.from('student_progress').select('*, lessons(subject)').eq('student_id', user.id);
      
      if (profile) {
        const lessonsCount = profile.total_lessons_done || 0;
        const totalSigns = profile.total_sign_hours ? profile.total_sign_hours * 120 : 0;
        const streak = profile.streak_days || 0;
        
        setStats({
          daily: { lessons: Math.min(lessonsCount, 2), time: `${Math.min(lessonsCount, 2) * 30}m`, signs: Math.min(totalSigns, 20), quizAvg: 85, attendance: streak > 0 ? '1/1' : '0/1', streak },
          weekly: { lessons: Math.min(lessonsCount, 10), time: `${Math.floor(lessonsCount * 0.5)}h`, signs: Math.min(totalSigns, 150), quizAvg: 82, attendance: `${Math.min(streak, 7)}/7`, streak },
          monthly: { lessons: Math.min(lessonsCount, 40), time: `${Math.floor(lessonsCount * 2)}h`, signs: totalSigns, quizAvg: 80, attendance: `${Math.min(streak, 30)}/30`, streak },
          yearly: { lessons: lessonsCount, time: `${lessonsCount * 2}h`, signs: totalSigns * 4, quizAvg: 79, attendance: `${Math.min(streak, 365)}/365`, streak },
        });
      }
      
      if (progress && progress.length > 0) {
        const subjectMap: any = {};
        progress.forEach(p => {
          const sub = p.lessons?.subject || 'General';
          if (!subjectMap[sub]) subjectMap[sub] = { lessons: 0, time: 0, score: 0 };
          subjectMap[sub].lessons += 1;
          subjectMap[sub].time += p.time_spent_seconds || 1800;
          subjectMap[sub].score += p.completion_percent || 0;
        });
        
        const breakdown = Object.keys(subjectMap).map(sub => ({
          subject: sub,
          lessons: subjectMap[sub].lessons,
          time: `${Math.floor(subjectMap[sub].time / 3600)}h ${Math.floor((subjectMap[sub].time % 3600) / 60)}m`,
          avgScore: `${Math.floor(subjectMap[sub].score / subjectMap[sub].lessons)}%`,
          completion: `${Math.floor(subjectMap[sub].score / subjectMap[sub].lessons)}%`
        }));
        setSubjectBreakdown(breakdown);
      } else {
        // Fallback for new empty DB to avoid ugly empty tables during hackathon
        setSubjectBreakdown([
          { subject: 'Science', lessons: 0, time: '0h 0m', avgScore: '0%', completion: '0%' }
        ]);
      }
    };
    fetchReportData();
  }, []);

  const current = stats[period];

  const handleDownload = async () => {
    setDownloading(true);
    // Simulate download
    await new Promise(resolve => setTimeout(resolve, 1500));
    setDownloading(false);
    alert(`${period.charAt(0).toUpperCase() + period.slice(1)} report would be downloaded as PDF.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">My Reports</h1>
        <p className="text-white/60 mt-1">Download and share your learning progress reports</p>
      </div>

      {/* Period Selector */}
      <div className="glass-card p-2 flex w-fit">
        {(['daily', 'weekly', 'monthly', 'yearly'] as ReportPeriod[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition ${period === p ? 'bg-[#6C63FF] text-white' : 'text-white/50 hover:text-white/80'}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Report Preview */}
      <div className="glass-card p-8 border border-white/10">
        {/* Report Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#00C9A7] flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="gradient-text font-bold text-lg">SPARSH</span>
            </div>
            <h2 className="text-white text-xl font-bold">Student Learning Report</h2>
            <p className="text-white/50 text-sm">Period: {period.charAt(0).toUpperCase() + period.slice(1)} Report</p>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm font-medium">Student Name</p>
            <p className="text-white/40 text-xs">Grade 8 • CBSE</p>
            <span className="inline-block mt-2 px-3 py-1 bg-[#6C63FF]/10 text-[#6C63FF] text-xs rounded-full">ISL Learner</span>
          </div>
        </div>

        {/* Stats Summary */}
        <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Lessons Completed', value: current.lessons, color: 'text-[#6C63FF]' },
            { label: 'Time Spent', value: current.time, color: 'text-[#00C9A7]' },
            { label: 'ISL Signs Practiced', value: current.signs, color: 'text-purple-400' },
            { label: 'Avg Quiz Score', value: `${current.quizAvg}%`, color: 'text-yellow-400' },
            { label: 'Attendance', value: current.attendance, color: 'text-blue-400' },
            { label: 'Day Streak', value: current.streak, color: 'text-orange-400' },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-white/50 text-[10px] mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Subject Breakdown */}
        <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Subject-wise Performance</h3>
        <div className="rounded-xl overflow-hidden border border-white/10 mb-8">
          <table className="w-full text-left">
            <thead className="bg-[#6C63FF]/20">
              <tr>
                {['Subject', 'Lessons', 'Time', 'Avg Score', 'Completion'].map(h => (
                  <th key={h} className="p-3 text-[#6C63FF] text-xs font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {subjectBreakdown.map((s, i) => (
                <tr key={i} className="hover:bg-white/5">
                  <td className="p-3 text-white text-sm font-medium">{s.subject}</td>
                  <td className="p-3 text-white/80 text-sm">{s.lessons}</td>
                  <td className="p-3 text-white/80 text-sm">{s.time}</td>
                  <td className="p-3 text-white/80 text-sm">{s.avgScore}</td>
                  <td className="p-3">
                    <span className={`text-sm font-medium ${parseInt(s.completion) >= 70 ? 'text-[#00C9A7]' : 'text-orange-400'}`}>{s.completion}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Accessibility Usage */}
        <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Accessibility Features Used</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'ISL Avatar', value: 28, color: '#6C63FF' },
            { label: 'Captions', value: 34, color: '#00C9A7' },
            { label: 'Text-to-Speech', value: 12, color: '#e17055' },
            { label: 'Offline Sessions', value: 8, color: '#fdcb6e' },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 border-t-2" style={{ borderTopColor: item.color }}>
              <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
              <p className="text-white/50 text-xs mt-1">{item.label} sessions</p>
            </div>
          ))}
        </div>
      </div>

      {/* Download Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['daily', 'weekly', 'monthly', 'yearly'] as ReportPeriod[]).map(p => (
          <button key={p} onClick={() => { setPeriod(p); handleDownload(); }} disabled={downloading}
            className={`py-4 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${p === period ? 'bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] text-white hover:opacity-90' : 'bg-white/10 border border-white/10 text-white/80 hover:bg-white/20'} disabled:opacity-50`}>
            {downloading && p === period ? '⏳ Generating...' : `📄 ${p.charAt(0).toUpperCase() + p.slice(1)} Report PDF`}
          </button>
        ))}
      </div>

      {/* Share Section */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4">Share Report</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <button className="flex-1 py-3 bg-white/10 border border-white/10 rounded-xl text-white/80 font-medium hover:bg-white/20 transition text-sm">
            🔗 Generate Shareable Link
          </button>
          <div className="flex-1 flex gap-2">
            <input type="email" placeholder="parent@email.com" className="glass-input flex-1 text-sm" />
            <button className="px-5 py-3 bg-[#6C63FF] text-white rounded-xl font-medium text-sm hover:bg-[#5b54e6] transition">
              📧 Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
