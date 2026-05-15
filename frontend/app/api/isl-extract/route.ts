import { NextResponse } from 'next/server';

/**
 * POST /api/isl-extract
 * Body: FormData with field "file" (PDF, TXT, or DOC)
 *
 * Returns: { text: string, tokens: string[], sentences: string[] }
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    let rawText = '';

    // ── Text extraction ──────────────────────────────────────────
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      rawText = await file.text();

    } else if (
      fileType === 'application/pdf' ||
      fileName.endsWith('.pdf')
    ) {
      // For PDF: read as ArrayBuffer, extract text via basic heuristic
      // (pdf-parse is not available without node_modules; use basic approach)
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      rawText = extractTextFromPDFBytes(uint8);

    } else if (
      fileType.includes('word') ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')
    ) {
      // For DOCX: basic XML text extraction  
      const arrayBuffer = await file.arrayBuffer();
      rawText = await extractTextFromDocx(arrayBuffer);

    } else {
      // Fallback: try reading as text
      rawText = await file.text();
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: 'Could not extract text from this file.' }, { status: 422 });
    }

    // ── Clean & sentence-split ──────────────────────────────────
    const cleanText = rawText
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim()
      .substring(0, 8000); // cap at 8k chars

    const sentences = cleanText
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 10)
      .slice(0, 30);  // max 30 sentences

    // ── ISL Tokenization (inline, no circular import) ──────────
    const STOP_WORDS = new Set([
      'a','an','the','is','am','are','was','were','be','been','being',
      'have','has','had','do','does','did','will','would','could','should',
      'may','might','shall','can','to','of','in','for','on','with','at',
      'by','from','it','its','this','that','and','or','but','if','so','as',
      'we','our','their','they','he','she','his','her','i','my','me',
    ]);

    const KNOWN_SIGNS = new Set([
      'hello','welcome','yes','no','thank','you','book','student',
      'teacher','please','question','answer','understand','attention',
      'class','open',
    ]);

    const tokens = sentences
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w) && KNOWN_SIGNS.has(w));

    // Deduplicate while preserving order
    const seen = new Set<string>();
    const uniqueTokens = tokens.filter(t => { if (seen.has(t)) return false; seen.add(t); return true; });

    return NextResponse.json({
      text: cleanText,
      sentences,
      tokens: uniqueTokens,
      wordCount: cleanText.split(/\s+/).length,
    });

  } catch (error: any) {
    console.error('[ISL Extract]', error);
    return NextResponse.json({ error: error.message || 'Extraction failed' }, { status: 500 });
  }
}

// ── Helpers ──────────────────────────────────────────────────────

/** Very basic PDF text extractor — reads raw byte stream for text objects */
function extractTextFromPDFBytes(bytes: Uint8Array): string {
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  const matches: string[] = [];

  // PDF text is inside BT...ET blocks, in (string) or <hex> format
  const btEtRegex = /BT([\s\S]*?)ET/g;
  let block: RegExpExecArray | null;
  while ((block = btEtRegex.exec(text)) !== null) {
    const content = block[1];
    // Extract parenthesized strings
    const strRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
    let m: RegExpExecArray | null;
    while ((m = strRegex.exec(content)) !== null) {
      const escapeMap: Record<string, string> = {
        n: '\n', r: '\r', t: '\t', b: '\b', f: '\f',
        '(': ' ', ')': ' ', '\\': '\\',
      };
      const s = m[1].replace(/\\([nrtbf()\\])/g, (_, c: string) => escapeMap[c] ?? c);
      if (s.trim().length > 0) matches.push(s.trim());
    }
  }

  return matches.join(' ').replace(/\s+/g, ' ').trim();
}

/** Basic DOCX text extractor — unzips the XML and reads w:t elements */
async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  // DOCX is a zip; we do a best-effort text decoder on the raw bytes
  // (Full unzip requires a library; this gets readable text from the XML)
  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  const matches: string[] = [];
  const regex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m[1].trim()) matches.push(m[1].trim());
  }
  return matches.join(' ').replace(/\s{2,}/g, ' ').trim();
}
