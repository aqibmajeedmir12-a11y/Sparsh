'use client';

export default function EditLessonPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Lesson: Structure of Atom</h1>
          <p className="text-white/60 text-sm">Science • Grade 8 • CBSE</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white/10 border border-white/10 text-white rounded-xl hover:bg-white/20 transition text-sm">
            Preview
          </button>
          <button className="px-5 py-2.5 bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] text-white font-semibold rounded-xl hover:opacity-90 transition text-sm">
            Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Video Preview */}
          <div className="glass-card overflow-hidden">
            <div className="aspect-video bg-[#0a0a1a] flex items-center justify-center relative">
              <span className="text-5xl">⚛️</span>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="text-white/40 text-xs">Video Preview</span>
                <button className="px-3 py-1 bg-[#6C63FF]/20 text-[#6C63FF] rounded text-xs">Replace Video</button>
              </div>
            </div>
          </div>

          {/* Captions Editor */}
          <div className="glass-card p-6">
            <h3 className="text-white font-semibold mb-4">Caption Editor</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {[
                { time: '0:00 - 0:12', text: 'Welcome to the lesson on Structure of Atom.' },
                { time: '0:12 - 0:28', text: 'In this lesson, we will explore the fundamental particles of matter.' },
                { time: '0:28 - 0:45', text: 'An atom is the smallest unit of an element.' },
                { time: '0:45 - 1:05', text: 'Atoms consist of protons, neutrons, and electrons.' },
                { time: '1:05 - 1:22', text: 'The nucleus contains protons and neutrons.' },
              ].map((cap, i) => (
                <div key={i} className="flex gap-3 items-start p-3 bg-white/5 rounded-xl hover:bg-white/10 transition">
                  <span className="text-[#6C63FF] text-xs font-mono w-24 shrink-0 mt-1">{cap.time}</span>
                  <input className="glass-input flex-1 text-sm py-2" defaultValue={cap.text} />
                </div>
              ))}
            </div>
            <button className="mt-3 px-4 py-2 bg-[#6C63FF]/20 text-[#6C63FF] rounded-xl text-sm hover:bg-[#6C63FF]/30 transition">
              + Add Caption Row
            </button>
          </div>
        </div>

        {/* Metadata & AI Status */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-4">AI Processing Status</h3>
            <div className="space-y-3">
              {[
                { label: 'Whisper Transcription', status: 'completed', icon: '✅' },
                { label: 'ISL Avatar Generation', status: 'completed', icon: '✅' },
                { label: 'TTS Audio', status: 'completed', icon: '✅' },
                { label: 'Alt-Text (Vision)', status: 'completed', icon: '✅' },
                { label: 'Claude Summary', status: 'completed', icon: '✅' },
                { label: 'Braille Export', status: 'pending', icon: '⏳' },
              ].map((job, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-white/80 text-sm">{job.label}</span>
                  <span className="text-xs">{job.icon} {job.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-4">Lesson Metadata</h3>
            <div className="space-y-3">
              <div>
                <label className="text-white/60 text-xs block mb-1">Title</label>
                <input className="glass-input w-full text-sm" defaultValue="Structure of Atom" />
              </div>
              <div>
                <label className="text-white/60 text-xs block mb-1">Description</label>
                <textarea className="glass-input w-full text-sm h-20 resize-none" defaultValue="Learn about atomic structure and subatomic particles." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-xs block mb-1">Subject</label>
                  <input className="glass-input w-full text-sm" defaultValue="Science" />
                </div>
                <div>
                  <label className="text-white/60 text-xs block mb-1">Chapter</label>
                  <input className="glass-input w-full text-sm" defaultValue="Chapter 4" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-white/80 text-sm cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#6C63FF]" /> Public
                </label>
                <label className="flex items-center gap-2 text-white/80 text-sm cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#6C63FF]" /> NCERT Aligned
                </label>
              </div>
            </div>
          </div>

          <button className="w-full py-3 bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] text-white font-semibold rounded-xl hover:opacity-90 transition">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
