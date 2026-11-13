import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fail } from '@/lib/sql';

export const dynamic = 'force-dynamic';

// Queries that feed the dashboard charts (the full SQL demo is in database/queries.sql).
const QUERIES = [
  { id: 'q4', op: 'SUM, GROUP BY', title: 'Total quantity supplied per crop (kg)', run: true,
    sql: 'SELECT c.crop_name, SUM(s.quantity_kg) AS total_kg\nFROM Supply s\nJOIN Crop c ON c.crop_id = s.crop_id\nGROUP BY c.crop_name\nORDER BY total_kg DESC;' },
  { id: 'q5', op: 'AVG, GROUP BY', title: 'Average price per kg of each crop', run: true,
    sql: 'SELECT c.crop_name, ROUND(AVG(s.price_per_kg), 2) AS avg_price\nFROM Supply s\nJOIN Crop c ON c.crop_id = s.crop_id\nGROUP BY c.crop_name\nORDER BY avg_price DESC;' },
  { id: 'q6', op: 'COUNT, GROUP BY', title: 'Number of purchases made by each buyer', run: true,
    sql: 'SELECT b.name AS buyer, COUNT(p.purchase_id) AS purchases\nFROM Buyer b\nLEFT JOIN Purchase p ON p.buyer_id = b.buyer_id\nGROUP BY b.buyer_id, b.name\nORDER BY purchases DESC;' },
];

export async function GET() {
  try {
    const pool = db();
    const [[stats]] = await pool.query(`SELECT
      (SELECT COUNT(*) FROM Farmer) farmers, (SELECT COUNT(*) FROM Market) markets,
      (SELECT COUNT(*) FROM Buyer) buyers, (SELECT COUNT(*) FROM Crop) crops,
      (SELECT COALESCE(SUM(quantity_kg), 0) FROM Supply) supplied_kg,
      (SELECT COALESCE(SUM(total_price), 0) FROM Purchase) sales,
      (SELECT COALESCE(SUM(total_price), 0) FROM Purchase WHERE payment_status = 'Due') due`);
    const [split] = await pool.query('SELECT payment_status status, SUM(total_price) amount FROM Purchase GROUP BY payment_status');
    const queries = [];
    for (const q of QUERIES) queries.push({ ...q, rows: q.run ? (await pool.query(q.sql))[0] : null });
    return NextResponse.json({ stats, split, queries });
  } catch (err) { return fail(err); }
}
