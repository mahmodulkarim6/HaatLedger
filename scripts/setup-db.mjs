import fs from 'node:fs';
import mysql from 'mysql2/promise';
import { dbConfig } from '../lib/dbconfig.mjs';

const conn = await mysql.createConnection({ ...dbConfig(), multipleStatements: true });
const read = (f) => fs.readFileSync(new URL(`../database/${f}`, import.meta.url), 'utf8');
if (process.argv.includes('--reset')) {
  await conn.query('SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS Purchase, Supply, Buyer, Market, Crop, Farmer; SET FOREIGN_KEY_CHECKS=1;');
  console.log('Old tables dropped.');
}
await conn.query(read('schema.sql'));
const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM Farmer');
if (n === 0) { await conn.query(read('seed.sql')); console.log('Tables created and sample data inserted.'); }
else console.log('Tables already contain data. Use "npm run db:reset" to start over.');
await conn.end();
