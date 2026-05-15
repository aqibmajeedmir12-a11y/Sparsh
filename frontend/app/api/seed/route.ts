import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NCERT_CBSE_LESSONS } from '@/lib/ncert-syllabus';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const reset = url.searchParams.get('reset') === 'true';

    if (reset) {
      const { error: deleteError } = await supabase.from('lessons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteError) throw deleteError;
    }

    const { data: existing } = await supabase.from('lessons').select('id').limit(1);
    if (!reset && existing && existing.length > 0) {
      const { count } = await supabase.from('lessons').select('*', { count: 'exact', head: true });
      return NextResponse.json({ message: `Database already has ${count} lessons. Add ?reset=true to re-seed.` });
    }

    const { data, error } = await supabase.from('lessons').insert(NCERT_CBSE_LESSONS).select('id, title, grade, subject');
    if (error) throw error;

    return NextResponse.json({ success: true, inserted: data?.length, message: `Seeded ${data?.length} NCERT/CBSE lessons (Grades 6-12)`, lessons: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
