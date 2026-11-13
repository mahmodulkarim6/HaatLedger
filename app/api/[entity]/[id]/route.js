import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pick, clean, fail } from '@/lib/sql';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    const { e, q } = pick(params.entity);
    const data = await clean(e, q, await req.json(), params.id);
    await db().query('UPDATE ?? SET ? WHERE ?? = ?', [q.table, data, e.pk, params.id]);
    if (q.after) await q.after(data, params.id);
    return NextResponse.json({ ok: true });
  } catch (err) { return fail(err); }
}

export async function DELETE(_req, { params }) {
  try {
    const { e, q } = pick(params.entity);
    await db().query('DELETE FROM ?? WHERE ?? = ?', [q.table, e.pk, params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) { return fail(err); }
}
