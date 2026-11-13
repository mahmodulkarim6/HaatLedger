'use client';
import { useEffect, useState } from 'react';

const tables = [
  ['farmers', 'Farmers', 'Contact details, supplies, kg supplied and sales value of every farmer.'],
  ['buyers', 'Buyers', 'Every buyer with purchases, amount spent and payment due.'],
  ['crops', 'Crops', 'Every crop with supply, average price and sales value.'],
  ['markets', 'Markets', 'Every market with its buyers and supply totals.'],
  ['supplies', 'Supplies', 'All supplies with sold and remaining kg.'],
  ['purchases', 'Purchases', 'All purchases with buyer, farmer and payment status.'],
];
const people = [
  ['farmer', 'Farmer', 'farmers', 'Supplies and sales of one farmer.'],
  ['buyer', 'Buyer', 'buyers', 'Purchases and payments of one buyer.'],
  ['crop', 'Crop', 'crops', 'Supplies and sales of one crop.'],
];

export default function Report() {
  const [busy, setBusy] = useState('');
  const [sel, setSel] = useState({ farmer: '', buyer: '', crop: '' });
  const [opts, setOpts] = useState({});
  const [toast, setToast] = useState(null);

  const say = (msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    people.forEach(async ([type, , entity]) => {
      try {
        const r = await fetch(`/api/${entity}?options=1`);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        setOpts((o) => ({ ...o, [type]: j }));
      } catch (e) { say(e.message, true); }
    });
  }, []);

  const download = async (key, url) => {
    setBusy(key);
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Could not create the report.');
      const name = /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') || '')?.[1] || 'report.xlsx';
      const href = URL.createObjectURL(await r.blob());
      const a = document.createElement('a');
      a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(href);
      say(`Downloaded ${name}`);
    } catch (e) { say(e.message, true); }
    setBusy('');
  };

  return (
    <>
      <div className="head">
        <div><h1>Reports</h1><p>Download your data as Excel (.xlsx) files to your computer.</p></div>
      </div>

      <section className="reportsec">
        <h2>Everything in one file</h2>
        <div className="card rcard full">
          <h3>Full report</h3>
          <p>One Excel workbook with a summary sheet plus Farmers, Buyers, Crops, Markets, Supplies and Purchases sheets.</p>
          <div><button className="btn" disabled={!!busy} onClick={() => download('all', '/api/export?type=all')}>{busy === 'all' ? 'Preparing' : 'Download full report'}</button></div>
        </div>
      </section>

      <section className="reportsec">
        <h2>One table at a time</h2>
        <div className="rgrid">
          {tables.map(([type, label, text]) => (
            <div className="card rcard" key={type}>
              <h3>{label}</h3>
              <p>{text}</p>
              <div><button className="btn ghost sm" disabled={!!busy} onClick={() => download(type, `/api/export?type=${type}`)}>{busy === type ? 'Preparing' : 'Download Excel'}</button></div>
            </div>
          ))}
        </div>
      </section>

      <section className="reportsec">
        <h2>Individual report</h2>
        <div className="rgrid">
          {people.map(([type, label, , text]) => (
            <div className="card rcard" key={type}>
              <h3>{label} report</h3>
              <p>{text}</p>
              <select aria-label={`Choose a ${type}`} value={sel[type]} onChange={(e) => setSel({ ...sel, [type]: e.target.value })}>
                <option value="">Choose {type}</option>
                {(opts[type] || []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <div><button className="btn ghost sm" disabled={!!busy || !sel[type]} onClick={() => download(`one-${type}`, `/api/export?type=${type}&id=${sel[type]}`)}>{busy === `one-${type}` ? 'Preparing' : 'Download Excel'}</button></div>
            </div>
          ))}
        </div>
      </section>

      {toast && <div className={`toast${toast.err ? ' err' : ''}`} role="status">{toast.msg}</div>}
    </>
  );
}
