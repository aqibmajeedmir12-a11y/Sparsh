import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { StudentReportPDF } from '@/components/reports/StudentReportPDF';
import React from 'react';

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { period, report_type } = await req.json();

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch all data needed for report
  const [profile, progress, dailyActivity, quizSubmissions] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('student_progress').select('*, lessons(title, subject, grade)')
      .eq('student_id', user.id)
      .gte('last_accessed', period.start)
      .lte('last_accessed', period.end),
    supabase.from('daily_activity').select('*')
      .eq('student_id', user.id)
      .gte('activity_date', period.start)
      .lte('activity_date', period.end)
      .order('activity_date', { ascending: true }),
    supabase.from('assessment_submissions').select('*, assessments(title)')
      .eq('student_id', user.id)
      .gte('submitted_at', period.start)
      .lte('submitted_at', period.end),
  ]);

  // Compute summary stats
  const stats = {
    lessonsCompleted: (progress.data as any[])?.filter((p: any) => p.completion_percent === 100).length ?? 0,
    totalTimeMinutes: (dailyActivity.data as any[])?.reduce((sum, d: any) => sum + d.time_spent_min, 0) ?? 0,
    signsPracticed: (dailyActivity.data as any[])?.reduce((sum, d: any) => sum + d.signs_practiced, 0) ?? 0,
    avgQuizScore: quizSubmissions.data?.length
      ? (quizSubmissions.data as any[]).reduce((sum, q: any) => sum + (q.score ?? 0), 0) / quizSubmissions.data.length
      : 0,
    attendanceRate: dailyActivity.data?.length ?? 0,
    streakDays: (profile.data as any)?.streak_days ?? 0,
  };

  const subjectBreakdown: any[] = []; // Add complex logic here if needed.

  const accessibilityUsage = {
      isl_sessions: 0,
      caption_sessions: 0,
      tts_sessions: 0,
      offline_sessions: 0
  }

  // Generate PDF buffer
  const pdfBuffer = await renderToBuffer(
    React.createElement(StudentReportPDF, {
      student: profile.data,
      period: period,
      stats: stats,
      dailyActivity: dailyActivity.data ?? [],
      quizSubmissions: quizSubmissions.data ?? [],
      subjectBreakdown: subjectBreakdown,
      accessibilityUsage: accessibilityUsage
    })
  );

  return new NextResponse(pdfBuffer as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="sparsh-report-${period.label?.replace(/\s/g,'-')}.pdf"`,
    },
  });
}
