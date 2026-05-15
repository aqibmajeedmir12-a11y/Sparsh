'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function StudioPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    subject: 'Science',
    grade: '8',
    board: 'CBSE',
    chapter: '',
    description: '',
    demoText: '',
  });

  useEffect(() => {
    fetchLessons();
  }, []);

  async function fetchLessons() {
    setLoading(true);
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setLessons(data);
    setLoading(false);
  }

  const handleUpload = async () => {
    if (!uploadForm.title.trim()) return alert('Please enter a lesson title.');
    setIsUploading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: uploadForm.demoText || uploadForm.description })
      });
      const aiData = await res.json();

      const { data, error } = await supabase.from('lessons').insert([{
        title: uploadForm.title,
        subject: uploadForm.subject,
        grade: uploadForm.grade,
        board: uploadForm.board,
        chapter: uploadForm.chapter,
        description: uploadForm.description,
        transcript_text: uploadForm.demoText,
        accessible_summary: aiData.summary ?? null,
        processing_status: 'completed',
        is_ncert_aligned: true,
        tags: ['ISL Ready', 'Captions'],
        language: 'en',
      }]).select();

      if (error) throw error;
      alert(`✅ Lesson "${uploadForm.title}" uploaded successfully!`);
      setShowUpload(false);
      setUploadForm({ title: '', subject: 'Science', grade: '8', board: 'CBSE', chapter: '', description: '', demoText: '' });
      fetchLessons();
    } catch (error: any) {
      console.error('Upload error', error);
      alert('Failed to upload lesson: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const processingLessons = lessons.filter(l => l.processing_status === 'processing');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Lesson Studio</h1>
          <p className="text-white/60 mt-1">Upload, process, and manage your lessons</p>
        </div>
        <button onClick={() => setShowUpload(!showUpload)} className="px-6 py-3 bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] text-white font-semibold rounded-xl hover:opacity-90 transition shadow-[0_0_15px_rgba(108,99,255,0.4)]">
          + Upload New Lesson
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="glass-card p-6 border border-[#6C63FF]/30 relative overflow-hidden">
          {isUploading && (
            <div className="absolute inset-0 bg-[#0f0c29]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <span className="w-12 h-12 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-white font-medium flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#6C63FF] text-xs font-bold rounded">AI Processing</span>
                Generating summary & uploading to database...
              </p>
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">Upload New Lesson</h3>
            <span className="px-3 py-1 bg-[#00C9A7]/20 text-[#00C9A7] text-xs font-bold rounded-full border border-[#00C9A7]/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#00C9A7] rounded-full animate-ping" />
              AI Powered Processing
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white/80 text-sm mb-1 block">Lesson Title *</label>
              <input className="glass-input w-full" placeholder="e.g. Structure of Atom" value={uploadForm.title} onChange={e => setUploadForm(f => ({...f, title: e.target.value}))} />
            </div>
            <div>
              <label className="text-white/80 text-sm mb-1 block">Subject</label>
              <select className="glass-input w-full bg-transparent appearance-none" value={uploadForm.subject} onChange={e => setUploadForm(f => ({...f, subject: e.target.value}))}>
                {['Science','Mathematics','History','Physics','Biology','Chemistry','Hindi','English','Geography','Social Science','Economics'].map(s => (
                  <option key={s} className="bg-[#24243e]">{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/80 text-sm mb-1 block">Grade</label>
              <select className="glass-input w-full bg-transparent appearance-none" value={uploadForm.grade} onChange={e => setUploadForm(f => ({...f, grade: e.target.value}))}>
                {['6','7','8','9','10','11','12'].map(g => <option key={g} className="bg-[#24243e]">Grade {g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/80 text-sm mb-1 block">Board</label>
              <select className="glass-input w-full bg-transparent appearance-none" value={uploadForm.board} onChange={e => setUploadForm(f => ({...f, board: e.target.value}))}>
                {['CBSE','ICSE','state','IB'].map(b => <option key={b} className="bg-[#24243e]">{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/80 text-sm mb-1 block">Chapter</label>
              <input className="glass-input w-full" placeholder="e.g. Chapter 4" value={uploadForm.chapter} onChange={e => setUploadForm(f => ({...f, chapter: e.target.value}))} />
            </div>
            <div>
              <label className="text-white/80 text-sm mb-1 block">Short Description</label>
              <input className="glass-input w-full" placeholder="Brief description of the lesson" value={uploadForm.description} onChange={e => setUploadForm(f => ({...f, description: e.target.value}))} />
            </div>
            <div className="md:col-span-2">
              <label className="text-white/80 text-sm mb-1 block flex items-center gap-2">
                Lesson Text Content (for AI processing)
                <span className="text-[#6C63FF] text-xs font-bold border border-[#6C63FF]/30 px-1 rounded">AI will generate summary</span>
              </label>
              <textarea className="glass-input w-full h-24 resize-none" value={uploadForm.demoText} onChange={e => setUploadForm(f => ({...f, demoText: e.target.value}))} placeholder="Paste lesson text or transcript here..." />
            </div>
            <div className="md:col-span-2">
              <label className="text-white/80 text-sm mb-1 block">Video File (optional)</label>
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-[#6C63FF]/50 transition cursor-pointer">
                <span className="text-3xl block mb-2">📁</span>
                <p className="text-white/60 text-sm">Drag & drop your video file here or click to browse</p>
                <p className="text-white/30 text-xs mt-1">MP4, MKV, MOV up to 2GB</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleUpload} disabled={isUploading} className="px-6 py-2.5 bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2">
              <span>✨</span> Upload & Process with AI
            </button>
            <button onClick={() => setShowUpload(false)} disabled={isUploading} className="px-6 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition disabled:opacity-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* AI Processing Queue */}
      {processingLessons.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            AI Processing Queue
          </h3>
          <div className="space-y-3">
            {processingLessons.map(l => (
              <div key={l.id} className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-lg shrink-0">⚙️</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{l.title}</p>
                  <p className="text-yellow-400 text-xs">Processing…</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lessons Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-white font-semibold">All Lessons ({lessons.length})</h3>
          <button onClick={fetchLessons} className="text-white/40 hover:text-white/80 text-sm transition">↻ Refresh</button>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <span className="w-8 h-8 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin inline-block mb-2" />
            <p className="text-white/40 text-sm">Loading lessons...</p>
          </div>
        ) : lessons.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-white/40 text-sm">No lessons yet. Upload your first lesson to get started!</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Subject</th>
                <th className="p-4 font-medium">Grade</th>
                <th className="p-4 font-medium">Board</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Views</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {lessons.map(l => (
                <tr key={l.id} className="hover:bg-white/5">
                  <td className="p-4 text-white font-medium">{l.title}</td>
                  <td className="p-4 text-white/70">{l.subject}</td>
                  <td className="p-4 text-white/70">{l.grade}</td>
                  <td className="p-4 text-white/70">{l.board}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${l.processing_status === 'completed' ? 'bg-[#00C9A7]/20 text-[#00C9A7]' : l.processing_status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50'}`}>
                      {l.processing_status}
                    </span>
                  </td>
                  <td className="p-4 text-white/70">{l.view_count ?? 0}</td>
                  <td className="p-4">
                    <Link href={`/student/lessons/${l.id}`}>
                      <button className="px-3 py-1.5 bg-white/10 text-white/80 rounded-lg text-xs hover:bg-white/20 transition">View</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
