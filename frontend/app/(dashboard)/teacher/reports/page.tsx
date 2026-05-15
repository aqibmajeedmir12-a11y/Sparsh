'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TeacherReportsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: studs }, { data: lesns }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, grade, disability_type, last_active, total_lessons_done, total_sign_hours, streak_days').eq('role', 'student'),
        supabase.from('lessons').select('id, title, subject, view_count, processing_status'),
      ]);
      if (studs) setStudents(studs);
      if (lesns) setLessons(lesns);
      setLoading(false);
    }
    load();
  }, []);

  const totalStudents = students.length;
  const avgLessons = totalStudents > 0 ? Math.round(students.reduce((a, s) => a + (s.total_lessons_done || 0), 0) / totalStudents) : 0;
  const totalSignHours = students.reduce((a, s) => a + (Number(s.total_sign_hours) || 0), 0);
  const avgStreak = totalStudents > 0 ? Math.round(students.reduce((a, s) => a + (s.streak_days || 0), 0) / totalStudents) : 0;
  const publishedLessons = lessons.filter(l => l.processing_status === 'completed').length;

  const handleDownload = async (student: any) => {
    setGeneratingPdf(student.id);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { default: ReportCardPDF } = await import('@/components/reports/ReportCardPDF');
      const React = (await import('react')).default;
      const blob = await pdf(
        React.createElement(ReportCardPDF, {
          studentName: student.full_name,
          className: `Grade ${student.grade || 'N/A'}`,
          attendance: '85%',
          avgScore: `${student.total_lessons_done || 0} lessons`,
          islLevel: student.disability_type === 'hearing' ? 'Advanced' : 'Intermediate',
          teacherRemarks: `${student.full_name} has completed ${student.total_lessons_done || 0} lessons and practiced ISL for ${Math.round(student.total_sign_hours || 0)} hours.`,
          date: new Date().toLocaleDateString(),
        }) as any
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${student.full_name.replace(/\s+/g, '_')}_Report.pdf`;
      a.click();
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF');
    }
    setGeneratingPdf(null);
  };

  const handleEmailParent = async (student: any) => {
    setGeneratingPdf(student.id + '_email');
    try {
      const parentEmail = prompt('Enter Parent Email Address:', 'parent@example.com');
      if (!parentEmail) { setGeneratingPdf(null); return; }

      const { pdf } = await import('@react-pdf/renderer');
      const { default: ReportCardPDF } = await import('@/components/reports/ReportCardPDF');
      const React = (await import('react')).default;
      const blob = await pdf(
        React.createElement(ReportCardPDF, {
          studentName: student.full_name,
          className: `Grade ${student.grade || 'N/A'}`,
          attendance: '85%',
          avgScore: `${student.total_lessons_done || 0} lessons`,
          islLevel: 'Intermediate',
          teacherRemarks: `${student.full_name} has completed ${student.total_lessons_done || 0} lessons.`,
          date: new Date().toLocaleDateString(),
        }) as any
      ).toBlob();

      const buffer = await blob.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: parentEmail, studentName: student.full_name, pdfBase64: base64 })
      });
      const json = await res.json();
      if (json.success) alert(`Email sent to ${parentEmail} successfully!`);
      else alert(`Error: ${json.error || 'Unknown error'}`);
    } catch (e) {
      console.error(e);
      alert('Failed to send email');
    }
    setGeneratingPdf(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Class Reports</h1>
        <p className="text-white/60 mt-1">Performance analysis — live from Supabase</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Students', value: loading ? '…' : totalStudents, color: 'text-[#6C63FF]' },
          { label: 'Avg Lessons Done', value: loading ? '…' : avgLessons, color: 'text-[#00C9A7]' },
          { label: 'Avg Streak', value: loading ? '…' : `${avgStreak}d`, color: 'text-yellow-400' },
          { label: 'Total ISL Hours', value: loading ? '…' : `${Math.round(totalSignHours)}h`, color: 'text-purple-400' },
          { label: 'Lessons Published', value: loading ? '…' : publishedLessons, color: 'text-blue-400' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-white/50 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Student Reports */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4">Student Report Cards</h3>
        {loading ? (
          <div className="text-center py-8">
            <span className="w-8 h-8 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin inline-block mb-2" />
            <p className="text-white/40 text-sm">Loading student data...</p>
          </div>
        ) : students.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-8">No students yet. Students will appear after signup.</p>
        ) : (
          <div className="space-y-3">
            {students.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#00C9A7] flex items-center justify-center text-white text-sm font-bold">
                    {s.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{s.full_name}</p>
                    <p className="text-white/40 text-xs">Grade {s.grade || 'N/A'} • {s.total_lessons_done || 0} lessons • {Math.round(s.total_sign_hours || 0)}h ISL</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDownload(s)}
                    disabled={generatingPdf === s.id}
                    className="px-3 py-1.5 text-xs bg-white/10 text-white rounded-lg hover:bg-white/20 transition disabled:opacity-50"
                  >
                    {generatingPdf === s.id ? 'Generating…' : '📄 PDF Report'}
                  </button>
                  <button
                    onClick={() => handleEmailParent(s)}
                    disabled={generatingPdf === s.id + '_email'}
                    className="px-3 py-1.5 text-xs bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
                  >
                    {generatingPdf === s.id + '_email' ? 'Sending…' : '📧 Email Parent'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Lessons */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4">Lesson Engagement</h3>
        {lessons.length === 0 ? (
          <p className="text-white/40 text-sm">No lessons data yet.</p>
        ) : (
          <div className="space-y-2">
            {lessons.slice(0, 8).map((l, i) => (
              <div key={l.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                <span className="text-white/30 text-sm w-5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{l.title}</p>
                  <p className="text-white/40 text-xs">{l.subject}</p>
                </div>
                <span className="text-[#00C9A7] text-sm font-medium">{l.view_count ?? 0} views</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
