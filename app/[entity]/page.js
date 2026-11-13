'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { entities } from '@/lib/entities';

const tk = (v) => `Tk ${new Intl.NumberFormat('en-BD').format(v)}`;
const cell = (c, v) => (c.f === 'kg' ? `${v} kg` : c.f === 'tk' ? tk(v) : c.f === 'badge' ? <span className={`badge ${String(v).toLowerCase()}`}>{v}</span> : v);
const today = () => new Date().toISOString().slice(0, 10);

export default function Entity({ params, searchParams }) {
  const e = entities[params.entity];
  if (!e) notFound();
  const dueOnly = params.entity === 'purchases' && String(searchParams?.status || '').toLowerCase() === 'due';
  const cols = e.show || e.fields.map((f) => ({ k: f.k, l: f.l }));
  const [rows, setRows] = useState(null);
  const [opts, setOpts] = useState({});
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [q, setQ] = useState('');
  const [toast, setToast] = useState(null);

  const say = (msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3200); };
  const load = useCallback(async () => {
    setRows(null);
    const r = await fetch(`/api/${params.entity}`);
    const j = await r.json();
    if (!r.ok) { say(j.error, true); setRows([]); } else setRows(j);
  }, [params.entity]);

  useEffect(() => {
    load();
    e.fields.filter((f) => f.t === 'ref').forEach(async (f) => {
      const r = await fetch(`/api/${f.ref}?options=1`);
      if (r.ok) { const j = await r.json(); setOpts((o) => ({ ...o, [f.k]: j })); }
    });
  }, [params.entity]); // eslint-disable-line

  const shown = useMemo(() => (rows || [])
    .filter((r) => !dueOnly || r.payment_status === 'Due')
    .filter((r) => JSON.stringify(Object.values(r)).toLowerCase().includes(q.toLowerCase())), [rows, q, dueOnly]);

  const openAdd = () => {
    const blank = {};
    e.fields.forEach((f) => { blank[f.k] = f.t === 'date' ? today() : f.t === 'select' ? f.o[0] : ''; });
    setEditId(null); setForm(blank);
  };
  const openEdit = (r) => { setEditId(r[e.pk]); setForm(Object.fromEntries(e.fields.map((f) => [f.k, r[f.k]]))); };

  const send = async (url, method, body, okMsg) => {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) return say(j.error, true);
    setForm(null); say(okMsg); load();
  };
  const save = (ev) => { ev.preventDefault(); editId ? send(`/api/${params.entity}/${editId}`, 'PUT', form, 'Changes saved') : send(`/api/${params.entity}`, 'POST', form, `${e.one[0].toUpperCase() + e.one.slice(1)} added`); };
  const remove = (r) => confirm(`Delete this ${e.one}?`) && send(`/api/${params.entity}/${r[e.pk]}`, 'DELETE', null, `${e.one[0].toUpperCase() + e.one.slice(1)} deleted`);
  const quick = (r) => send(`/api/${params.entity}/${r[e.pk]}`, 'PUT', { ...r, [e.quick.k]: e.quick.to }, 'Marked as paid');

  return (
    <>
      <div className="head">
        <div><h1>{e.title}</h1><p>{rows ? (dueOnly ? `${shown.length} purchases with payment due` : `${rows.length} records`) : 'Loading'}</p></div>
        <div className="tools">
          <input placeholder={`Search ${e.title.toLowerCase()}`} value={q} onChange={(x) => setQ(x.target.value)} aria-label="Search" />
          <button className="btn" onClick={openAdd}>Add {e.one}</button>
        </div>
      </div>

      {dueOnly && <div className="note dueinfo">Showing only purchases with payment due.<Link href="/purchases">Show all purchases</Link></div>}

      <div className="tablewrap">
        {rows && shown.length === 0 ? (
          <div className="empty">{q ? 'No record matches your search.' : dueOnly ? 'No payments are due. Every purchase is paid.' : `No ${e.title.toLowerCase()} yet. Add the first ${e.one} to get started.`}</div>
        ) : (
          <table>
            <thead><tr>{cols.map((c) => <th key={c.k}>{c.l}</th>)}<th /></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r[e.pk]}>
                  {cols.map((c) => <td key={c.k}>{cell(c, r[c.k])}</td>)}
                  <td className="act">
                    {e.quick && r[e.quick.k] === e.quick.from && <button className="btn sm" onClick={() => quick(r)}>{e.quick.label}</button>}
                    <button className="btn ghost sm" onClick={() => openEdit(r)}>Edit</button>
                    <button className="btn ghost sm del" onClick={() => remove(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <div className="overlay" onClick={() => setForm(null)}>
          <form className="modal" onClick={(x) => x.stopPropagation()} onSubmit={save}>
            <h2>{editId ? `Edit ${e.one}` : `Add ${e.one}`}</h2>
            {e.fields.map((f) => (
              <div key={f.k}>
                <label htmlFor={f.k}>{f.l}</label>
                {f.t === 'select' || f.t === 'ref' ? (
                  <select id={f.k} required value={form[f.k]} onChange={(x) => setForm({ ...form, [f.k]: x.target.value })}>
                    {f.t === 'ref' && <option value="">Choose {f.l.toLowerCase()}</option>}
                    {f.t === 'select' ? f.o.map((o) => <option key={o}>{o}</option>) : (opts[f.k] || []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                ) : (
                  <input id={f.k} required type={f.t === 'number' ? 'number' : f.t === 'date' ? 'date' : 'text'} step="0.01" min={f.t === 'number' ? '0.01' : undefined} value={form[f.k]} onChange={(x) => setForm({ ...form, [f.k]: x.target.value })} />
                )}
              </div>
            ))}
            <div className="row"><button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn">{editId ? 'Save changes' : `Add ${e.one}`}</button></div>
          </form>
        </div>
      )}
      {toast && <div className={'toast' + (toast.err ? ' err' : '')} role="status">{toast.msg}</div>}
    </>
  );
}