'use client';
import { useEffect, useState } from 'react';

export default function Bars({ rows, label, value, fmt = (v) => v, amber }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 60); return () => clearTimeout(t); }, []);
  const max = Math.max(...rows.map((r) => r[value]), 1);
  return rows.map((r) => (
    <div className={'bar' + (amber ? ' amber' : '')} key={r[label]}>
      <span>{r[label]}</span>
      <span className="t"><span className="f" style={{ width: on ? `${(r[value] / max) * 100}%` : 0 }} /></span>
      <span>{fmt(r[value])}</span>
    </div>
  ));
}
