'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Bars from '@/components/Bars';
import Clock from '@/components/Clock';

const n = (v) => new Intl.NumberFormat('en-BD').format(Math.round(v));

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    fetch('/api/reports').then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setD(j); }).catch((e) => setErr(e.message));
  }, []);
  if (err) return <div className="note bad">{err}</div>;
  if (!d) return <div className="note">Loading market data</div>;

  const rows = (id) => d.queries.find((q) => q.id === id).rows;
  const prices = rows('q5');
  const s = d.stats;
  const paid = d.split.find((x) => x.status === 'Paid')?.amount || 0;
  const due = d.split.find((x) => x.status === 'Due')?.amount || 0;
  const pct = paid + due ? (paid / (paid + due)) * 100 : 0;

  return (
    <>
      <section className="hero">
        <div className="herotop">
          <div>
            <h1>What every crop sold for this season</h1>
            <p>Farmers supply, buyers purchase and the ledger keeps both sides honest. Average price per kg, live from the database.</p>
          </div>
          <Clock />
        </div>
        <div className="ticker" aria-label="Average price per kg by crop">
          <div className="track">
            {[...prices, ...prices].map((p, i) => (
              <div className="tick" key={i}><span>{p.crop_name}</span><b>Tk {p.avg_price}</b><i>per kg</i></div>
            ))}
          </div>
        </div>
      </section>

      <div className="stats">
        <Link href="/farmers" className="stat"><small>Farmers</small><strong>{s.farmers}</strong></Link>
        <Link href="/markets" className="stat"><small>Markets</small><strong>{s.markets}</strong></Link>
        <Link href="/buyers" className="stat"><small>Buyers</small><strong>{s.buyers}</strong></Link>
        <Link href="/supplies" className="stat"><small>Crop supplied</small><strong>{n(s.supplied_kg)} kg</strong></Link>
        <Link href="/purchases" className="stat"><small>Total sales</small><strong>Tk {n(s.sales)}</strong></Link>
        <Link href="/purchases?status=Due" className="stat warn"><small>Payments due</small><strong>Tk {n(s.due)}</strong></Link>
      </div>

      <div className="grid2">
        <div className="card"><h3>Supply by crop</h3><p className="sub">Total kg brought to markets</p>
          <Bars rows={rows('q4')} label="crop_name" value="total_kg" fmt={(v) => `${n(v)} kg`} /></div>
        <div className="card"><h3>Average price per kg</h3><p className="sub">Taka, across all supplies</p>
          <Bars rows={prices} label="crop_name" value="avg_price" amber fmt={(v) => `Tk ${v}`} /></div>
        <div className="card"><h3>Purchases per buyer</h3><p className="sub">Number of purchases recorded</p>
          <Bars rows={rows('q6')} label="buyer" value="purchases" /></div>
        <div className="card"><h3>Payment status</h3><p className="sub">Share of sales value</p>
          <div className="donut">
            <div className="ring" style={{ background: `conic-gradient(var(--violet2) ${pct}%, var(--amber) 0)` }} role="img" aria-label={`${Math.round(pct)} percent paid`} />
            <div className="legend">
              <p><i style={{ background: 'var(--violet2)' }} />Paid: Tk {n(paid)}</p>
              <p><i style={{ background: 'var(--amber)' }} />Due: Tk {n(due)}</p>
            </div>
          </div></div>
      </div>
    </>
  );
}
