import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pick, clean, fail } from '@/lib/sql';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { q } = pick(params.entity);
    const options = new URL(req.url).searchParams.has('options');
    const [rows] = await db().query(options ? q.opt : q.list);
    return NextResponse.json(rows);
  } catch (err) { return fail(err); }
}

export async function POST(req, { params }) {
  try {
    const { e, q } = pick(params.entity);
    const data = await clean(e, q, await req.json());
    await db().query('INSERT INTO ?? (??) VALUES (?)', [q.table, Object.keys(data), Object.values(data)]);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) { return fail(err); }
}
