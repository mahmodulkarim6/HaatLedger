import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fail } from '@/lib/sql';
import { buildReport, ReportError } from '@/lib/reports';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req) {
  try {
    const sp = new URL(req.url).searchParams;
    const query = async (sql, params) => (await db().query(sql, params))[0];
    const { filename, buffer } = await buildReport(sp.get('type') || 'all', sp.get('id'), query);
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    if (err instanceof ReportError) return NextResponse.json({ error: err.message }, { status: err.status });
    return fail(err);
  }
}
