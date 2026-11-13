import { NextResponse } from 'next/server';
import { db } from './db';
import { entities } from './entities';

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const bad = (m) => new HttpError(400, m);

const J = {
  supply: 'FROM Supply s JOIN Farmer f ON f.farmer_id = s.farmer_id JOIN Crop c ON c.crop_id = s.crop_id JOIN Market m ON m.market_id = s.market_id',
};
export const sql = {
  farmers: { table: 'Farmer', list: 'SELECT * FROM Farmer ORDER BY farmer_id ASC',
    opt: "SELECT farmer_id id, CONCAT(name, ' (', district, ')') label FROM Farmer ORDER BY name" },
  crops: { table: 'Crop', list: 'SELECT * FROM Crop ORDER BY crop_id ASC',
    opt: 'SELECT crop_id id, crop_name label FROM Crop ORDER BY crop_name' },
  markets: { table: 'Market', list: 'SELECT * FROM Market ORDER BY market_id ASC',
    opt: "SELECT market_id id, CONCAT(market_name, ' (', district, ')') label FROM Market ORDER BY market_name" },
  buyers: { table: 'Buyer',
    list: 'SELECT b.*, m.market_name market FROM Buyer b JOIN Market m ON m.market_id = b.market_id ORDER BY b.buyer_id ASC',
    opt: 'SELECT buyer_id id, name label FROM Buyer ORDER BY name' },
  supplies: { table: 'Supply',
    list: `SELECT s.*, f.name farmer, c.crop_name crop, m.market_name market ${J.supply} ORDER BY s.supply_id ASC`,
    before: async (d, id) => {
      if (id) {
        const [[u]] = await db().query('SELECT COALESCE(SUM(quantity_kg), 0) sold FROM Purchase WHERE supply_id = ?', [id]);
        if (d.quantity_kg < u.sold) throw bad(`${u.sold} kg of this supply is already sold, so the quantity cannot be lower than that.`);
      }
      return d;
    },
    // Keep stored purchase totals correct when the supply price is edited.
    after: async (d, id) => {
      await db().query('UPDATE Purchase SET total_price = ROUND(quantity_kg * ?, 2) WHERE supply_id = ?', [d.price_per_kg, id]);
    },
    opt: `SELECT s.supply_id id,
    CONCAT('#', s.supply_id, ' ', c.crop_name, ' (', f.name, '): ',
      CASE WHEN s.quantity_kg - COALESCE(x.sold, 0) <= 0 THEN 'SOLD OUT' ELSE CONCAT(s.quantity_kg - COALESCE(x.sold, 0), ' kg left') END,
      ' at Tk ', s.price_per_kg) label
    FROM Supply s JOIN Crop c ON c.crop_id = s.crop_id JOIN Farmer f ON f.farmer_id = s.farmer_id
    LEFT JOIN (SELECT supply_id, SUM(quantity_kg) sold FROM Purchase GROUP BY supply_id) x ON x.supply_id = s.supply_id
    ORDER BY s.supply_id ASC` },
  purchases: { table: 'Purchase',
    list: 'SELECT p.*, c.crop_name crop, b.name buyer FROM Purchase p JOIN Supply s ON s.supply_id = p.supply_id JOIN Crop c ON c.crop_id = s.crop_id JOIN Buyer b ON b.buyer_id = p.buyer_id ORDER BY p.purchase_id ASC',
    before: async (d, id) => {
      const [[s]] = await db().query('SELECT quantity_kg, price_per_kg FROM Supply WHERE supply_id = ?', [d.supply_id]);
      if (!s) throw bad('The selected supply does not exist.');
      const [[u]] = await db().query('SELECT COALESCE(SUM(quantity_kg), 0) sold FROM Purchase WHERE supply_id = ? AND purchase_id <> ?', [d.supply_id, id || 0]);
      const left = Math.round((s.quantity_kg - u.sold) * 100) / 100;
      if (d.quantity_kg > left) throw bad(`Only ${left} kg of this supply is left to buy.`);
      return { ...d, total_price: Math.round(d.quantity_kg * s.price_per_kg * 100) / 100 };
    } },
};

export function pick(name) {
  if (!entities[name]) throw new HttpError(404, 'Unknown table.');
  return { e: entities[name], q: sql[name] };
}

export async function clean(e, q, body, id) {
  const out = {};
  for (const f of e.fields) {
    const v = body[f.k];
    if (v === undefined || v === null || String(v).trim() === '') throw bad(`${f.l} is required.`);
    if (f.t === 'number' || f.t === 'ref') {
      out[f.k] = Number(v);
      if (!(out[f.k] > 0)) throw bad(`${f.l} must be greater than zero.`);
    } else out[f.k] = String(v).trim();
  }
  return q.before ? q.before(out, id) : out;
}

export function fail(err) {
  if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
  const map = {
    ER_ROW_IS_REFERENCED_2: [409, 'This record is used by other records, so it cannot be deleted. Remove the records that use it first.'],
    ER_NO_REFERENCED_ROW_2: [400, 'A selected related record does not exist.'],
    ER_DUP_ENTRY: [409, 'A record with the same unique value already exists.'],
    ER_CHECK_CONSTRAINT_VIOLATED: [400, 'A value is outside the allowed range.'],
  };
  if (map[err.code]) return NextResponse.json({ error: map[err.code][1] }, { status: map[err.code][0] });
  console.error(err);
  const down = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ER_NO_SUCH_TABLE', 'PROTOCOL_CONNECTION_LOST'];
  const msg = down.includes(err.code)
    ? 'Cannot reach the database. Check the DATABASE_URL settings and that the tables exist (npm run db:setup).'
    : 'Something went wrong on the server. Please try again.';
  return NextResponse.json({ error: msg }, { status: 500 });
}