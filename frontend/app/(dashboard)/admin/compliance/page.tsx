'use client';

export default function AdminCompliancePage() {
  const rpwdItems = [
    { requirement: 'Screen reader compatible content', status: 'compliant', details: 'All lessons include alt-text and ARIA labels' },
    { requirement: 'Indian Sign Language interpretation', status: 'compliant', details: 'ISL avatar available for 92% of lessons' },
    { requirement: 'Captioned video content', status: 'compliant', details: 'Auto-captions on 100% of video lessons' },
    { requirement: 'Text-to-speech for visually impaired', status: 'compliant', details: 'TTS available in Hindi and English' },
    { requirement: 'Braille display support', status: 'partial', details: 'Braille output supported via HID protocol — 4 connected devices' },
    { requirement: 'Offline accessibility', status: 'compliant', details: 'PWA offline mode with cached lessons' },
    { requirement: 'Reasonable accommodation documentation', status: 'compliant', details: 'Per-student accessibility preferences recorded' },
  ];

  const nepItems = [
    { requirement: 'Multi-language content delivery', status: 'compliant', details: 'Hindi + English via Bhashini API' },
    { requirement: 'Inclusive curriculum design', status: 'compliant', details: 'NCERT-aligned content for Grades 6–12' },
    { requirement: 'Technology-enabled learning', status: 'compliant', details: 'AI-powered ISL, captions, and adaptive content' },
    { requirement: 'Assessment adaptations', status: 'partial', details: 'Sign-language quiz responses in development' },
    { requirement: 'Teacher training resources', status: 'partial', details: 'Teacher portal with accessibility guides available' },
  ];

  const complianceScore = Math.round(
    ((rpwdItems.filter(i => i.status === 'compliant').length + nepItems.filter(i => i.status === 'compliant').length) /
    (rpwdItems.length + nepItems.length)) * 100
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Compliance Report</h1>
          <p className="text-white/60 mt-1">RPwD Act 2016 and NEP 2020 compliance status</p>
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-[#6C63FF] to-[#00C9A7] text-white font-semibold rounded-xl hover:opacity-90 transition text-sm">
          📄 Download Compliance PDF
        </button>
      </div>

      {/* Score Card */}
      <div className="glass-card p-8 text-center border-l-4 border-l-[#00C9A7]">
        <p className="text-white/50 text-sm uppercase tracking-wider">Overall Compliance Score</p>
        <p className={`text-6xl font-bold mt-2 ${complianceScore >= 80 ? 'text-[#00C9A7]' : complianceScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{complianceScore}%</p>
        <p className="text-white/40 text-sm mt-2">Last updated: April 17, 2026</p>
      </div>

      {/* RPwD Act 2016 */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          🏛️ Rights of Persons with Disabilities Act, 2016
          <span className="px-2 py-0.5 bg-[#00C9A7]/20 text-[#00C9A7] text-xs rounded-full">{rpwdItems.filter(i => i.status === 'compliant').length}/{rpwdItems.length} compliant</span>
        </h3>
        <div className="space-y-3">
          {rpwdItems.map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${item.status === 'compliant' ? 'bg-[#00C9A7]/20 text-[#00C9A7]' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {item.status === 'compliant' ? '✓' : '⚠'}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{item.requirement}</p>
                <p className="text-white/50 text-xs mt-1">{item.details}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-medium shrink-0 ${item.status === 'compliant' ? 'bg-[#00C9A7]/20 text-[#00C9A7]' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* NEP 2020 */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          📚 National Education Policy 2020
          <span className="px-2 py-0.5 bg-[#6C63FF]/20 text-[#6C63FF] text-xs rounded-full">{nepItems.filter(i => i.status === 'compliant').length}/{nepItems.length} compliant</span>
        </h3>
        <div className="space-y-3">
          {nepItems.map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${item.status === 'compliant' ? 'bg-[#00C9A7]/20 text-[#00C9A7]' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {item.status === 'compliant' ? '✓' : '⚠'}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{item.requirement}</p>
                <p className="text-white/50 text-xs mt-1">{item.details}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-medium shrink-0 ${item.status === 'compliant' ? 'bg-[#00C9A7]/20 text-[#00C9A7]' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
