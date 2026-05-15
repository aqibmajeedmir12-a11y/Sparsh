'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Helper to determine status color
const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-[#00C9A7]/20 text-[#00C9A7]', 
  processing: 'bg-blue-500/20 text-blue-400',
  failed: 'bg-red-500/20 text-red-400', 
  queued: 'bg-yellow-500/20 text-yellow-400',
  retrying: 'bg-orange-500/20 text-orange-400'
};

const BASE_MODELS = [
  { id: 'whisper_transcription', name: 'Whisper (Speech-to-Text)', accuracy: 97.1 },
  { id: 'isl_generation', name: 'ISL Avatar Generator', accuracy: 94.2 },
  { id: 'tts_generation', name: 'TTS Engine', accuracy: 98.5 },
  { id: 'vision_alttext', name: 'Vision Alt-Text', accuracy: 91.8 },
  { id: 'claude_summary', name: 'LLM Summarization', accuracy: 96.3 },
  { id: 'braille_export', name: 'Braille Converter', accuracy: 99.1 },
];

export default function AIMonitorPage() {
  const [timeRange, setTimeRange] = useState('24h');
  const [models, setModels] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();

    const sub = supabase.channel('realtime-ai-jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_jobs' }, fetchJobs)
      .subscribe();
      
    return () => { supabase.removeChannel(sub); };
  }, [timeRange]);

  const fetchJobs = async () => {
    setLoading(true);

    // Filter by time range
    const now = new Date();
    let hoursToSubtract = 24;
    if (timeRange === '1h') hoursToSubtract = 1;
    if (timeRange === '7d') hoursToSubtract = 24 * 7;
    if (timeRange === '30d') hoursToSubtract = 24 * 30;
    
    const cutoffDate = new Date(now.getTime() - (hoursToSubtract * 60 * 60 * 1000)).toISOString();

    const { data: allJobs } = await supabase
      .from('ai_jobs')
      .select('*, lessons(title)')
      .gte('queued_at', cutoffDate)
      .order('queued_at', { ascending: false });

    if (allJobs) {
      setRecentJobs(allJobs.slice(0, 15)); // top 15 for table

      // Aggregate metrics per model
      const modelStats = BASE_MODELS.map(base => {
        const jobsForModel = allJobs.filter(j => j.job_type === base.id);
        const total = jobsForModel.length;
        const failed = jobsForModel.filter(j => j.status === 'failed').length;
        const queued = jobsForModel.filter(j => j.status === 'queued').length;
        const completed = jobsForModel.filter(j => j.status === 'completed');

        const failRate = total > 0 ? ((failed / total) * 100).toFixed(1) : 0;
        
        // Calculate average duration (fake P50 for now based on average)
        let avgDurationMs = 0;
        if (completed.length > 0) {
          const totalMs = completed.reduce((acc, curr) => acc + (curr.duration_ms || 0), 0);
          avgDurationMs = totalMs / completed.length;
        }

        const formatDuration = (ms: number) => {
          if (ms === 0) return '—';
          if (ms < 1000) return `${ms.toFixed(0)}ms`;
          const sec = ms / 1000;
          if (sec < 60) return `${sec.toFixed(1)}s`;
          return `${Math.floor(sec / 60)}m ${Math.floor(sec % 60)}s`;
        };

        return {
          ...base,
          status: Number(failRate) > 10 ? 'degraded' : 'operational',
          jobsToday: total,
          failRate: Number(failRate),
          queueDepth: queued,
          latencyP50: formatDuration(avgDurationMs),
        };
      });

      setModels(modelStats);
    }
    setLoading(false);
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Monitor</h1>
          <p className="text-white/60 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse"></span>
            Real-time AI model pipeline & job tracking
          </p>
        </div>
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
          {['1h', '24h', '7d', '30d'].map(r => (
            <button 
              key={r} 
              onClick={() => setTimeRange(r)} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${timeRange === r ? 'bg-[#6C63FF] text-white shadow-lg' : 'text-white/50 hover:bg-white/5'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && models.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <span className="w-8 h-8 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin inline-block"></span>
            <p className="text-white/50 mt-4">Analyzing AI metrics...</p>
          </div>
        ) : models.map((m, i) => (
          <div key={i} className={`glass-card p-5 ${m.status === 'degraded' ? 'border border-yellow-500/30' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">{m.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${m.status === 'operational' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{m.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-white/40 text-[10px]">Model Base Accuracy</p>
                <p className={`font-bold ${m.accuracy >= 95 ? 'text-[#00C9A7]' : m.accuracy >= 90 ? 'text-yellow-400' : 'text-red-400'}`}>{m.accuracy}%</p>
              </div>
              <div>
                <p className="text-white/40 text-[10px]">Jobs ({timeRange})</p>
                <p className="text-white font-bold">{m.jobsToday.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-white/40 text-[10px]">Avg Latency</p>
                <p className="text-white/80">{m.latencyP50}</p>
              </div>
              <div>
                <p className="text-white/40 text-[10px]">Fail Rate</p>
                <p className={`font-medium ${m.failRate <= 2 ? 'text-[#00C9A7]' : m.failRate <= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{m.failRate}%</p>
              </div>
            </div>
            {m.queueDepth > 0 && (
              <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
                <p className="text-yellow-400 text-xs">⚠ {m.queueDepth} jobs in queue waiting</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Processing Jobs Table */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold">Latest Processing Queue</h3>
          <p className="text-white/40 text-xs font-mono">table: ai_jobs</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3 font-medium">Job ID</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Target Lesson</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Duration</th>
                <th className="p-3 font-medium">Time Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading && recentJobs.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-6 text-white/50">Loading pipeline...</td></tr>
              ) : recentJobs.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-6 text-white/50">No AI jobs found for {timeRange}.</td></tr>
              ) : recentJobs.map((j, i) => (
                <tr key={i} className="hover:bg-white/5">
                  <td className="p-3 text-white/60 font-mono text-xs">{j.id.split('-')[0]}...</td>
                  <td className="p-3 text-white/80">{j.job_type?.replace(/_/g, ' ')}</td>
                  <td className="p-3 text-white/80 truncate max-w-[200px]" title={j.lessons?.title}>
                    {j.lessons?.title || 'Unknown Lesson'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${STATUS_COLORS[j.status] || 'bg-white/10 text-white'}`}>
                      {j.status}
                    </span>
                  </td>
                  <td className="p-3 text-white/60 font-mono text-xs">
                    {j.duration_ms ? `${(j.duration_ms / 1000).toFixed(1)}s` : '—'}
                  </td>
                  <td className="p-3 text-white/50 text-xs">
                    {formatTime(j.queued_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
